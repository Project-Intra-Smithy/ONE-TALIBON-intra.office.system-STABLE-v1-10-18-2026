import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const origin = 'http://127.0.0.1:4174';
const output = '.forge/evidence/ot-tcds-phase-a/browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
    for (const width of [1440, 768, 390]) {
        for (const theme of ['light', 'dark']) {
            const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
            const page = await context.newPage();
            const errors = [];
            const requests = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('request', request => {
                if (!request.url().startsWith(origin + '/')) requests.push(request.url());
            });
            await page.goto(origin + '/dashboard');
            await page.getByRole('region', { name: 'Isolated frontend controls' }).waitFor();
            await page.locator('.tcds-page-loading').waitFor({ state: 'hidden' });
            await page.getByRole('main').first().waitFor();
            const denied = await page.evaluate(async () => {
                const response = await fetch('/transactions', { method: 'POST', body: '{}' });
                return response.status;
            });
            assert.equal(denied, 503, 'unmatched preview writes must fail closed');
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
            await page.screenshot({ path: `${output}/dashboard-${width}-${theme}.png`, fullPage: true });
            results.push({ width, theme, errors, requests, overflow, denied });
            await context.close();
        }
    }
} finally {
    await browser.close();
    await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
}
assert.ok(results.every(result => !result.errors.length && !result.requests.length && !result.overflow), JSON.stringify(results));
