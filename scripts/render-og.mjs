import { chromium } from 'playwright'
import { pathToFileURL } from 'node:url'

const [,, svgPath, outPath] = process.argv
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await page.goto(pathToFileURL(svgPath).href)
await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1200, height: 630 } })
await browser.close()
console.log('wrote', outPath)
