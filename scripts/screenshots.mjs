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

// The most-used screen resolutions (desktop / mobile / tablet, ~2024-2025 web stats).
// For each we capture the fold (what fits on screen at that resolution) and the full page.
const resolutions = [
  { label: 'desktop-1920x1080', width: 1920, height: 1080 }, // most common desktop
  { label: 'desktop-1536x864',  width: 1536, height: 864 },
  { label: 'desktop-1366x768',  width: 1366, height: 768 },
  { label: 'mobile-360x800',    width: 360,  height: 800 },  // most common mobile
  { label: 'mobile-390x844',    width: 390,  height: 844 },  // iPhone 12–15
  { label: 'tablet-768x1024',   width: 768,  height: 1024 }, // iPad portrait
]

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
try {
  for (const r of resolutions) {
    const page = await browser.newPage({
      viewport: { width: r.width, height: r.height },
      deviceScaleFactor: 1, // 1:1 so the image dimensions equal the real resolution
    })
    await page.goto(SITE, { waitUntil: 'networkidle' })
    await page.waitForSelector('.hero h1') // SSR content is present

    // Fold (visible viewport) + full page.
    await page.screenshot({ path: resolve(OUT, `${r.label}.png`) })
    await page.screenshot({ path: resolve(OUT, `${r.label}-full.png`), fullPage: true })
    console.log(`✓ ${r.label}  (${r.width}×${r.height} fold + full page)`)
    await page.close()
  }
} finally {
  await browser.close()
}
console.log(`\nSaved to ${OUT}`)
