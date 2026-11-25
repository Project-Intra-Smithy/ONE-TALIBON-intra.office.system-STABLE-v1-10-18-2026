import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const output = '.forge/evidence/ot-tcds-phase-a/interactions';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
    for (const width of [1440, 768, 390]) for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
        await context.addInitScript(() => localStorage.setItem('ot.synthetic.role', 'mpdc_designated_staff'));
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto('http://127.0.0.1:4174/development-plans');
        const add = page.getByRole('button', { name: 'Add Plan', exact: true });
        await add.click();
        const form = page.getByRole('dialog', { name: 'Add Development Plan', exact: true });
        await form.waitFor();
        await page.screenshot({ path: `${output}/plan-form-${width}-${theme}.png`, fullPage: true });
        await page.keyboard.press('Escape');
        await form.waitFor({ state: 'hidden' });
        assert.equal(await add.evaluate(element => element === document.activeElement), true);
        await page.getByRole('button', { name: /^View details for / }).first().click();
        await page.getByRole('dialog').waitFor();
        await page.screenshot({ path: `${output}/plan-dossier-${width}-${theme}.png`, fullPage: true });
        await page.keyboard.press('Escape');
        await page.goto('http://127.0.0.1:4174/security/mfa');
        await page.getByRole('button', { name: 'Regenerate recovery codes', exact: true }).click();
        const confirmation = page.getByRole('dialog', { name: 'Confirm security change', exact: true });
        await confirmation.waitFor();
        await page.screenshot({ path: `${output}/mfa-confirm-${width}-${theme}.png`, fullPage: true });
        await confirmation.getByRole('button', { name: 'Cancel', exact: true }).click();
        await confirmation.waitFor({ state: 'hidden' });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        results.push({ width, theme, errors, overflow, planFormEscapeAndFocus: true, dossier: true, mfaCancel: true });
        await context.close();
    }
} finally {
    await browser.close();
    await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
}
assert.ok(results.every(result => !result.errors.length && !result.overflow), JSON.stringify(results));
