// Capture screenshots of the getklassd.com site with Playwright.
//
// Usage (from this folder):
//   bun install
//   bunx playwright install chromium
//   node screenshots.mjs
//
// Requires the site running (see repo README): the CMS on :5080 and the Vue SSR
// site on :5173. Override the target with SITE=http://host:port and the output
// directory with OUT=../some/dir.
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const SITE = process.env.SITE ?? 'http://localhost:5173'
const OUT = resolve(process.env.OUT ?? '../screenshots')

/** Each shot: viewport size, whether to capture the whole scroll height, or one element. */
const shots = [
  { name: 'home-desktop',       width: 1440, height: 900, fullPage: true },
  { name: 'home-desktop-hero',  width: 1440, height: 900, fullPage: false },
  { name: 'home-code-showcase', width: 1440, height: 900, selector: '.showcase' },
  { name: 'home-mobile',        width: 390,  height: 844, fullPage: true },
]

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
try {
  for (const shot of shots) {
    const page = await browser.newPage({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 2, // retina-crisp output
    })
    await page.goto(SITE, { waitUntil: 'networkidle' })
    await page.waitForSelector('.hero h1') // SSR content is present

    const file = resolve(OUT, `${shot.name}.png`)
    if (shot.selector) {
      await page.locator(shot.selector).screenshot({ path: file })
    } else {
      await page.screenshot({ path: file, fullPage: shot.fullPage })
    }
    console.log(`✓ ${shot.name} (${shot.width}×${shot.height}${shot.selector ? `, ${shot.selector}` : shot.fullPage ? ', full page' : ''})`)
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(`\nSaved to ${OUT}`)
