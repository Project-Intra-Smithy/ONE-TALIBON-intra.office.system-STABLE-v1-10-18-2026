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
    const data = structuredClone(fixturePage(screen, role));
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

function requestPage() {
    install('dashboard');
    const data = structuredClone(pages.get('/dashboard'));
    data.component = 'Transactions/Create'; data.url = '/transactions/create';
    Object.assign(data.props, {
        departments: [{ id: 10, name: 'Administration Office', branch: 'executive' }, { id: 27, name: 'Municipal Planning Office', branch: 'executive' }, { id: 83, name: 'Legislative Office', branch: 'legislative' }],
        assignableEmployees: [{ id: 7, employee_number: 'TEST-7', full_name: 'Planning staff', department_id: 27, position_title: 'Staff' }],
        requestCategories: { General: ['Coordination'] }, actionOptions: ['Review'],
    });
    pages.set(data.url, data); return data.url;
}
for (const width of [390, 768, 1024, 1280, 1440]) {
    for (const mode of ['light', 'dark']) {
        test(`Receiving office search ${width} ${mode}`, async () => {
            const { page, errors } = await mount(requestPage(), width);
            try {
                await page.evaluate(mode => document.documentElement.classList.toggle('dark', mode === 'dark'), mode);
                const combo = page.getByRole('combobox', { name: 'Receiving Office' });
                await combo.fill('pLaN');
                assert.equal(await page.getByRole('option', { name: /Municipal Planning/ }).count(), 1);
                assert.equal(await page.getByRole('listbox').getByRole('option').count(), 1);
                await combo.press('Enter');
                await page.getByLabel(/Assigned Person/).selectOption('7');
                await combo.fill('no matching office');
                await page.getByText('No matching offices. Try another name.').waitFor();
                await combo.press('Escape');
                assert.equal(await combo.inputValue(), 'Municipal Planning Office');
                assert.equal(await page.getByLabel(/Assigned Person/).inputValue(), '7');
                await combo.click(); await combo.fill(''); await combo.press('ArrowDown'); await combo.press('ArrowDown'); await combo.press('Enter');
                assert.equal(await combo.inputValue(), 'Legislative Office');
                assert.equal(await page.getByLabel(/Assigned Person/).inputValue(), '');
                await combo.fill('plan'); await page.getByRole('option', { name: /Municipal Planning/ }).click();
                await page.getByLabel('Target Completion').fill('2026-11-01');
                await page.getByLabel('Subject').fill('Synthetic request');
                let payload;
                await page.route('**/transactions', async route => { payload = route.request().postData(); await route.fulfill({ status: 200, contentType: 'application/json', headers: { 'X-Inertia': 'true' }, body: JSON.stringify(pages.get('/transactions/create')) }); });
                await page.getByRole('button', { name: 'Submit Work Request' }).click();
                await page.waitForTimeout(200);
                assert.match(payload, /name="target_department_id"\r\n\r\n27/);
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
                await combo.fill('office');
                await page.evaluate(() => window.scrollTo(0, 0));
                await page.screenshot({ path: `${out}/receiving-office-${width}-${mode}.png`, fullPage: true });
                assert.deepEqual(errors, []);
            } finally { await page.close(); }
        });
    }
}

for (const width of [390, 768, 1024, 1280, 1440]) {
    for (const mode of ['light', 'dark']) {
        test(`Notification presentation ${width} ${mode}`, async () => {
            const { page, errors } = await mount(install('dashboard'), width);
            try {
                await page.route('**/notifications/feed', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({
                    notifications: [
                        { key: 'platform-1', type: 'transaction', title: 'Transaction approved', message: 'SYNTHETIC-001 ? Coordination request', url: '/transactions/1', read_url: '/notifications/1/read', urgent: true, created_at: '2026-10-26T10:35:00+08:00' },
                        { key: 'event-2', type: 'transaction', title: 'Transaction routed to your office', message: 'SYNTHETIC-002 ? Supporting documents', url: '/transactions/2', urgent: false, created_at: null },
                    ], unreadMemoCount: 0, pendingMemo: null,
                }) }));
                await page.reload();
                const rail = page.locator('.r7-top-activity');
                await rail.getByRole('heading', { name: 'Transaction approved' }).waitFor();
                await page.evaluate(mode => document.documentElement.classList.toggle('dark', mode === 'dark'), mode);
                assert.equal(await rail.getByText('Unread', { exact: true }).count(), 1);
                assert.equal(await rail.locator('a[href="/transactions/1"]').count(), 1);
                await rail.getByText('SYNTHETIC-001 ? Coordination request').waitFor();
                await rail.getByText('Not recorded', { exact: true }).waitFor();
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
                await rail.screenshot({ path: `${out}/notifications-${width}-${mode}.png` });
                assert.deepEqual(errors, []);
            } finally { await page.close(); }
        });
    }
}
