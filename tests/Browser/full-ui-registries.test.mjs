/** Built app.tsx + real Inertia bootstrap/navigation. HTTP props are test-controlled,
 * NOT authenticated Laravel evidence. No alternate page, resolver or preview entry. */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { fixturePage } from './ux-fixtures.ts';

let browser, server, root, manifest;
let pages = new Map();
const requests = [];
const out = 'storage/app/qa/full-ui/screenshots';
const scriptJson = data => JSON.stringify(data).replaceAll('<', '\\u003c');
function install(screen, role = 'employee', change = () => {}) {
    const data = structuredClone(fixturePage('records', role));
    if (screen === 'travel') {
        data.component = 'TravelOrders/Index'; data.url = '/travel-orders';
        data.props = { ...data.props, canRecordApproved: false,
            travelOrders: { data: [{ publicId: 'synthetic-travel', referenceNumber: 'TEST-TO-001', issuanceDate: '2026-10-20', purpose: 'Coordination visit for municipal planning and records administration', destination: 'Sample regional coordination office', office: { id: 27, code: 'PLAN', name: 'Sample Municipal Planning Office' }, travelStartDate: '2026-10-27', travelEndDate: '2026-10-29', status: 'approved', issuedToCount: 12, detailUrl: '/travel-orders/synthetic-travel' }], current_page: 1, last_page: 1, total: 1, per_page: 15 },
            filters: { search: '', status: '', office_id: null, date_from: '', date_to: '' },
            filterOptions: { statuses: [{ value: 'approved', label: 'Approved' }], offices: [{ id: 27, code: 'PLAN', name: 'Sample Municipal Planning Office' }] }
        };
    }
    data.props.auth.user.name = 'Transport Actor';
    change(data.props);
    const page = { ...data, props: { ...data.props, errors: {} }, version: null,
        clearHistory: false, encryptHistory: false, rescuedProps: [], flash: {}, rememberedState: {} };
    pages.set(data.url, page);
    return data.url;
}

before(async () => {
    const { stdout, stderr } = await promisify(execFile)(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
    await mkdir(out, { recursive: true });
    await import('node:fs/promises').then(fs => fs.writeFile(`${out}/entry-build.log`, stdout + stderr));
    manifest = JSON.parse(await readFile('public/build/manifest.json', 'utf8'));
    try { browser = await chromium.launch({ channel: 'chrome' }); }
    catch { browser = await chromium.launch(); }
    server = createServer(async (req, res) => {
        try {
            const path = new URL(req.url, 'http://localhost').pathname;
            requests.push({ url: req.url, inertia: req.headers['x-inertia'] });
            if (/^\/(build\/assets|images|brand)\//.test(path) && !path.includes('..')) {
                const contentType = path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg';
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(await readFile(`public${path}`));
                return;
            }
            if (path === '/notifications/feed' || path === '/tasks') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(path === '/tasks' ? { data: [], meta: { page: 1, per_page: 10, last_page: 1, total: 0 } } : { notifications: [], unreadMemoCount: 0, pendingMemo: null }));
                return;
            }
            const data = pages.get(path);
            if (!data) { res.writeHead(404); res.end(); return; }
            const body = structuredClone({ ...data, url: req.url });
            if (path === '/calendar') {
                const params = new URL(req.url, 'http://localhost').searchParams;
                body.props.calendar.view = params.get('view') || body.props.calendar.view;
                body.props.calendar.anchor_date = params.get('date') || body.props.calendar.anchor_date;
            }
            if (req.headers['x-inertia']) {
                res.writeHead(200, { 'Content-Type': 'application/json', 'X-Inertia': 'true', Vary: 'X-Inertia' });
                res.end(JSON.stringify(body));
            } else {
                const entry = manifest['resources/js/app.tsx'];
                const css = new Set([manifest['resources/css/app.css'].file, ...(entry.css || [])]);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="csrf-token" content="synthetic-csrf">${[...css].map(file => `<link rel="stylesheet" href="/build/${file}">`).join('')}</head><body><script data-page="app" type="application/json">${scriptJson(body)}</script><div id="app"></div><script type="module" src="/build/${entry.file}"></script></body></html>`);
            }
        } catch (error) { res.writeHead(500); res.end(String(error)); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    root = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await browser?.close(); await new Promise(resolve => server ? server.close(resolve) : resolve()); });

async function mount(path, width = 1440) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(root + path);
    try { await page.locator('#portal-content h1').waitFor({ timeout: 10000 }); }
    catch (error) {
        const detail = JSON.stringify({ errors, text: await page.locator('body').innerText(), requests: requests.slice(-12) });
        await page.close();
        throw new Error(`${error.message}\n${detail}`);
    }
    return { page, errors };
}


// Real application entry with synthetic HTTP props; not authenticated Laravel QA.



for (const width of [390, 768, 1024, 1280, 1440]) {
    for (const theme of ['light', 'dark']) {
        test(`Registries ${width} ${theme}`, async () => {
            for (const screen of ['records', 'travel']) {
                const { page, errors } = await mount(install(screen), width);
                try {
                    await page.evaluate(theme => document.documentElement.classList.toggle('dark', theme === 'dark'), theme);
                    const scope = page.locator('.aj-registry-workspace');
                    assert.ok(await scope.isVisible());
                    assert.ok(await scope.locator('.aj-registry-row h2').evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 20));
                    assert.ok(await scope.locator('.aj-registry-row dd').first().evaluate(el => parseFloat(getComputedStyle(el).fontSize) >= 16));
                    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
                    const open = scope.getByRole('link', { name: /^Open (record|travel order)/ });
                    assert.match(await open.getAttribute('href'), screen === 'travel' ? /^\/travel-orders\/synthetic-travel\?return_to=/ : /^\/transactions\/1$/);
                    assert.ok((await open.boundingBox()).height >= 44);
                    if (screen === 'travel') {
                        assert.equal(await scope.locator('a[href="/travel-orders/create"]').count(), 0);
                        assert.match(await scope.locator('dl').innerText(), /12 personnel/);
                    }
                    await scope.getByRole('button', { name: /^Filters/ }).click();
                    assert.ok(await scope.getByRole('dialog').isVisible());
                    await page.keyboard.press('Escape');
                    assert.equal(await scope.getByRole('dialog').isVisible(), false);
                    const search = scope.getByRole('textbox');
                    await search.fill('coordination');
                    await scope.getByRole('button', { name: screen === 'travel' ? 'Apply' : 'Search', exact: true }).click();
                    await page.waitForURL(/search=coordination/);
                    await page.screenshot({ path: `${out}/${screen}-${width}-${theme}.png`, fullPage: true });
                    assert.deepEqual(errors, []);
                } finally { await page.close(); }
            }
        });
    }
}
