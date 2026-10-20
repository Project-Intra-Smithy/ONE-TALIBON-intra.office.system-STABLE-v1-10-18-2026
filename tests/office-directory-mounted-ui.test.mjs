// Real built Inertia entry; synthetic HTTP props, NOT Laravel authorization evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fixturePage } from './Browser/ux-fixtures.ts';

test('built directory preserves 40/14, keyboard filters, unavailable links and five widths', async () => {
    const buildRoot = 'artifacts/office-directory/build';
    await promisify(execFile)(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', buildRoot]);
    const manifest = JSON.parse(await readFile(`${buildRoot}/manifest.json`, 'utf8'));
    const labels = ['Planning','Executive','Legislative','Infrastructure','Finance','Administration','Social','Economic','Environment','Education','Transport','National Agency','Community','Community Partners'];
    const counts = [1,2,2,2,4,4,9,8,2,1,1,1,1,2];
    let index = 0;
    const entries = labels.flatMap((group, i) => Array.from({ length: counts[i] }, () => ({
        key: `fixture-${++index}`, group, shortName: `Office ${index}`,
        name: `${group} office ${index} with a long descriptive name`,
        responsibility: 'Reference service and records coordination',
        backingDepartmentCode: null, recordsHref: null, routable: false,
    })));
    const logos = [
        ['FOCAL-001', 'MPDO', 'MPDO', 'MPDO.png'],
        ['FOCAL-009', 'ACCOUNTING', 'Accounting', 'MAccO.png'],
        ['FOCAL-010', 'TREASURY', 'Treasury', 'MTO.png'],
        ['FOCAL-016', null, 'MSWDO', 'MSWDO.jpg'],
        ['FOCAL-018', 'AGRI', 'Agriculture', 'MAO.jpg'],
        ['FOCAL-022', 'PESO', 'PESO', 'MPESO.jpg'],
        ['FOCAL-024', 'LEDIPO', 'LEDIPO', 'MEDIPO.png'],
        ['FOCAL-035', 'MARKET', 'Market', 'MMAO.png'],
        ['FOCAL-036', null, 'Traffic Management', 'MO-TTMO (1).png'],
    ];
    logos.forEach(([key, code, name], i) => Object.assign(entries[i], {
        key, backingDepartmentCode: code, shortName: name, name,
    }));
    entries[0].responsibility = 'Planning and zoning';
    entries[39].recordsHref = '/records/../admin';
    const fixture = fixturePage('dashboard', 'employee');
    const body = { ...fixture, component: 'Departments/Index', url: '/departments?view=directory',
        props: { ...fixture.props, errors: {}, departments: [], summary: { offices: 0, executiveOffices: 0, legislativeOffices: 0, employees: 0, activeTransactions: 0 }, directoryEntries: entries, directoryGroups: labels },
        version: null, clearHistory: false, encryptHistory: false, rescuedProps: [], flash: {}, rememberedState: {} };
    const server = createServer(async (req, res) => {
        try {
            const path = new URL(req.url, 'http://localhost').pathname;
            const logoFile = logos.find(([, , , file]) => `/logos/${file}` === decodeURIComponent(path))?.[3];
            if (logoFile) {
                res.setHeader('Content-Type', logoFile.endsWith('.jpg') ? 'image/jpeg' : 'image/png');
                res.end(await readFile(`public/logos/${logoFile}`)); return;
            }
            if (path.startsWith('/build/assets/') && !path.includes('..')) {
                res.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'image/svg+xml');
                res.end(await readFile(`${buildRoot}/${path.slice('/build/'.length)}`)); return;
            }
            if (path.endsWith('/feed')) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ notifications: [], unreadMemoCount: 0, pendingMemo: null })); return; }
            if (path !== '/departments') { res.writeHead(404); res.end(); return; }
            const page = structuredClone(body);
            if (req.url.includes('empty=1')) page.props.directoryEntries = [];
            const entry = manifest['resources/js/app.tsx'];
            const css = new Set([manifest['resources/css/app.css'].file, ...(entry.css ?? [])]);
            res.setHeader('Content-Type', 'text/html');
            res.end(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1">${[...css].map(file => `<link rel="stylesheet" href="/build/${file}">`).join('')}</head><body><script data-page="app" type="application/json">${JSON.stringify(page).replaceAll('<', '\\u003c')}</script><div id="app"></div><script type="module" src="/build/${entry.file}"></script></body></html>`);
        } catch (e) { res.writeHead(500); res.end(String(e)); }
    });
    let browser;
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
        try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
        await mkdir('artifacts/office-directory', { recursive: true });
        for (const width of [320, 390, 768, 1024, 1440]) {
            const page = await browser.newPage({ viewport: { width, height: 900 } });
            const errors = [];
            page.on('pageerror', e => errors.push(e.message));
            await page.goto(`http://127.0.0.1:${server.address().port}/departments`);
            await page.getByRole('heading', { name: 'Office Directory', exact: true }).waitFor();
            assert.equal(await page.locator('article').count(), 40);
            assert.equal(await page.getByLabel('Office group', { exact: true }).locator('option').count(), 15);
            assert.equal(await page.getByRole('link', { name: 'Open authorized office records' }).count(), 0);
            assert.equal(await page.getByRole('img', { name: /logo unavailable/ }).count(), 31);
            for (const [, , name, file] of logos) {
                const logo = page.getByRole('img', { name: `${name} logo`, exact: true });
                await logo.evaluate(img => img.decode());
                assert.equal(await logo.getAttribute('src'), `/logos/${file}`);
                assert.equal(await logo.evaluate(img => img.naturalWidth > 0 && getComputedStyle(img).objectFit === 'contain'), true);
                assert.deepEqual(await logo.evaluate(img => {
                    const box = img.parentElement.getBoundingClientRect();
                    return [box.width, box.height];
                }), [48, 48]);
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `overflow ${width}`);
            const search = page.getByRole('searchbox', { name: 'Search offices' });
            await search.focus();
            await page.keyboard.press('Tab');
            assert.equal(await page.getByLabel('Office group', { exact: true }).evaluate(el => el === document.activeElement), true);
            await search.fill('  mpdo  ');
            assert.equal(await page.locator('article').count(), 1);
            await page.getByLabel('Office group', { exact: true }).selectOption('Finance');
            await page.getByRole('heading', { name: 'No matching offices' }).waitFor();
            await page.getByRole('button', { name: 'Clear filters' }).click();
            assert.equal(await page.locator('article').count(), 40);
            await page.screenshot({ path: `artifacts/office-directory/${width}.png`, fullPage: true });
            await page.screenshot({ path: `artifacts/office-directory/${width}-viewport.png` });
            assert.deepEqual(errors, []);
            await page.route('**/logos/MSWDO.jpg', route => route.fulfill({ status: 404 }));
            await page.reload();
            await page.getByRole('img', { name: 'MSWDO: logo unavailable', exact: true }).waitFor();
            assert.equal(await page.getByRole('img', { name: /logo unavailable/ }).count(), 32);
            await page.unroute('**/logos/MSWDO.jpg');
            await page.goto(`http://127.0.0.1:${server.address().port}/departments?empty=1`);
            await page.getByRole('heading', { name: 'No directory entries available' }).waitFor();
            await page.close();
        }
    } finally {
        await browser?.close();
        await new Promise(resolve => server.close(resolve));
    }
});
