import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

execFileSync('git', ['diff', '--quiet', 'HEAD', '--', 'resources', 'preview']);
const candidateSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

const output = '.forge/evidence/ot-tcds-phase-a/comparative';
await mkdir(output, { recursive: true });
const sources = [
    { name: 'donor', origin: 'http://127.0.0.1:4175', sha: '7afabade1fd651c2950f70006b8213ae8b7c61da' },
    { name: 'before', origin: 'http://127.0.0.1:4176', sha: '46f24d0f288e5584e3c45f5e8abf8466b6dc2a6a' },
    { name: 'candidate', origin: 'http://127.0.0.1:4174', sha: candidateSha },
];
const results = [];
const browser = await chromium.launch();
try {
    for (const source of sources) for (const width of [1440, 768, 390]) for (const theme of ['light', 'dark']) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
        await context.addInitScript(() => localStorage.setItem('ot.synthetic.role', 'department_head'));
        await context.route('**/*', route => {
            const request = route.request();
            if (!request.url().startsWith(source.origin + '/') || ['fetch', 'xhr'].includes(request.resourceType())) return route.abort();
            return route.continue();
        });
        const page = await context.newPage();
        for (const path of ['/login', '/dashboard', '/documents?mode=records', '/work-requests']) {
            const errors = [];
            const handler = error => errors.push(error.message);
            page.on('pageerror', handler);
            await page.goto(source.origin + path);
            await page.getByRole('region', { name: 'Isolated frontend controls' }).waitFor();
            await page.locator('.tcds-page-loading').waitFor({ state: 'hidden' });
            await page.getByRole('main').first().waitFor();
            await page.evaluate(() => document.fonts.ready);
            const filename = `${source.name}-${path.split('?')[0].slice(1)}-${width}-${theme}.png`;
            await page.screenshot({ path: `${output}/${filename}`, fullPage: true });
            results.push({ ...source, width, height: 900, theme, path, role: 'department_head', filename, errors,
                harness: source.name === 'before' ? 'pinned operational source with donor synthetic fixture harness; no Laravel runtime' : 'isolated synthetic preview',
                network: 'all browser fetch/xhr and external requests blocked; in-memory fixture adapters still active',
                overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
            });
            page.off('pageerror', handler);
            await writeFile(`${output}/manifest.json`, JSON.stringify(results, null, 2));
        }
        await context.close();
    }
} finally {
    await browser.close();
}
