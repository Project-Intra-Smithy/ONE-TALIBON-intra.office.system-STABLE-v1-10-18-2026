import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const output = '.forge/evidence/ot-tcds-phase-a/catalog';
await mkdir(output, { recursive: true });
const pages = JSON.parse(await readFile('.forge/evidence/ot-tcds-phase-a/page-coverage.json', 'utf8'));
const browser = await chromium.launch();
const results = [];
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const matrix = process.argv.includes('--matrix')
    ? [1440, 768, 390].flatMap(width => ['light', 'dark'].map(theme => ({ width, theme })))
    : [{ width: 1440, theme: 'light' }];
try {
    for (const { width, theme } of matrix) for (const item of pages) {
        const name = item.page.replace('resources/js/pages/', '').replace('.tsx', '');
        const role = name === 'MayorOffice' ? 'executive_oversight' : name.startsWith('Hris/') ? 'hr' : /^(Plans|PlanningMaps|PPAs)\//.test(name) ? 'mpdc_designated_staff' : /^(Admin|Audit|Property)\//.test(name) ? 'system_administration' : 'department_head';
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
        await context.addInitScript(role => localStorage.setItem('ot.synthetic.role', role), role);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const path = name === 'Transactions/Show' ? '/transactions/1' : `/?page=${encodeURIComponent(name)}`;
        try {
            await page.goto('http://127.0.0.1:4174' + path);
            await page.getByRole('region', { name: 'Isolated frontend controls' }).waitFor();
            await page.locator('.tcds-page-loading').waitFor({ state: 'hidden' });
            const renderedPage = await page.locator('[data-preview-page]').getAttribute('data-preview-page');
            assert.equal(renderedPage, name, 'catalog must render the requested component, not a permission fallback');
            const text = await page.locator('body').innerText();
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
            const screenshot = name.replaceAll('/', '-');
            await page.screenshot({ path: `${output}/${screenshot}-${width}-${theme}.png`, fullPage: true });
            results.push({ name, renderedPage, role, path, sourceSha, width, theme, errors, overflow, fixtureMismatch: text.includes('Fixture adaptation required'), headings: await page.getByRole('heading').allTextContents() });
        } catch (error) {
            results.push({ name, role, path, errors, failure: error.message });
        } finally {
            await context.close();
        }
        await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
    }
} finally {
    await browser.close();
}
console.log(JSON.stringify(results.filter(item => item.failure || item.errors.length || item.fixtureMismatch || item.overflow), null, 2));
assert.ok(results.every(item => !item.failure && !item.errors.length && !item.fixtureMismatch && !item.overflow), 'catalog smoke failures are recorded in results.json');
