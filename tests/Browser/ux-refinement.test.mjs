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
const out = 'storage/app/qa/ux-refinement';
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

for (const width of [320, 390, 768, 1024, 1440]) {
    test(`workspace responsive controls at ${width}px`, async () => {
        for (const screen of ['dashboard', 'calendar', 'correspondence']) {
            const { page, errors } = await mount(install(screen), width);
            try {
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${screen} overflow ${width}: ${JSON.stringify(await page.locator("body *").evaluateAll(els => els.filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 10).map(el => ({tag:el.tagName, cls:el.className, right:el.getBoundingClientRect().right}))))}`);
                const bottom = page.getByRole('navigation', { name: 'Mobile workspace navigation' });
                assert.equal(await bottom.isVisible(), width < 768);
                if (screen === 'dashboard') {
                    const filters = page.getByRole('group', { name: 'Task state filter' });
                    for (const label of ['Open', 'In Progress', 'Completed']) {
                        const tab = filters.getByRole('button', { name: new RegExp(label, 'i') });
                        await tab.focus(); await page.keyboard.press('Enter');
                        assert.equal(await tab.getAttribute('aria-pressed'), 'true');
                        assert.equal(await filters.locator('[aria-pressed="true"]').count(), 1);
                    }
                    if (width < 768) {
                        await bottom.getByRole('link', { name: 'Tasks', exact: true }).click();
                        await page.waitForFunction(() => document.activeElement.id === 'personal-tasks');
                        await page.waitForFunction(() => document.querySelector('nav[aria-label="Mobile workspace navigation"] a[href="/dashboard#personal-tasks"]')?.getAttribute('aria-current') === 'page');
                        await bottom.getByRole('button', { name: 'Open more navigation options' }).click();
                        await page.getByRole('dialog', { name: 'Municipal navigation' }).waitFor();
                        await page.keyboard.press('Escape');
                    }
                }
                if (screen === 'calendar') {
                    await page.getByRole('button', { name: 'Next calendar month' }).click();
                    await page.waitForURL('**/calendar?view=month&date=2026-11-01');
                    await page.getByRole('button', { name: 'Today', exact: true }).click();
                    await page.waitForURL('**/calendar?view=month&date=2026-10-09');
                }
                await page.screenshot({ path: `${out}/${screen}-${width}.png`, fullPage: true });
                assert.deepEqual(errors, []);
            } finally { await page.close(); }
        }
    });
}

test('navigation respects supplied permissions for all four experiences', async () => {
    for (const role of ['employee', 'department_head', 'executive_oversight', 'system_administration']) {
        const { page, errors } = await mount(install('dashboard', role, props => {
            props.permissions.navigation = { dashboard: true, transactions: false, correspondence: false, records: false };
            props.permissions.reports = false;
        }), 390);
        try {
            const bottom = page.getByRole('navigation', { name: 'Mobile workspace navigation' });
            assert.equal(await bottom.locator('a[href="/transactions"]').count(), 0);
            assert.equal(await page.locator('aside a[href="/transactions"]').count(), 0);
            assert.equal(await page.locator('aside a[href="/correspondence"]').count(), 0);
            assert.deepEqual(errors, []);
        } finally { await page.close(); }
    }
});

test('Calendar dialog traps focus, closes with Escape and restores trigger focus', async () => {
    const { page } = await mount(install('calendar'), 1440);
    try {
        const trigger = page.getByRole('button', { name: /Sample office coordination/ }).first();
        await trigger.click();
        const dialog = page.getByRole('dialog'); await dialog.waitFor();
        await dialog.getByRole('button', { name: 'Close', exact: true }).focus();
        await page.keyboard.press('Tab');
        assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)));
        await page.keyboard.press('Escape');
        assert.equal(await dialog.count(), 0);
        assert.ok(await trigger.evaluate(el => el === document.activeElement));
    } finally { await page.close(); }
});

test('personal Task selection, keyboard back action and denied reads', async () => {
    const { page } = await mount(install('dashboard'), 390);
    const task = { id: 7, kind: 'individual', title: 'Synthetic Task', instructions: 'Test instructions', state: 'open', owning_department_id: null, due_at: null, completed_at: null, created_at: '2026-10-09T09:00:00+08:00', updated_at: '2026-10-09T09:00:00+08:00' };
    let denied = false;
    const methods = [];
    try {
        await page.route(/\/tasks(?:\/|\?|$)/, route => {
            methods.push(route.request().method());
            return route.fulfill({ status: denied ? 403 : 200, contentType: 'application/json', body: JSON.stringify(denied ? { message: 'Forbidden' } : route.request().url().includes('/tasks/7') ? { data: task } : { data: [task], meta: { page: 1, per_page: 10, last_page: 1, total: 1 } }) });
        });
        await page.getByRole('button', { name: 'Refresh', exact: true }).click();
        const row = page.getByRole('button', { name: /Synthetic Task/ }); await row.waitFor();
        await row.focus(); await page.keyboard.press('Enter');
        await page.getByRole('region', { name: 'Personal Task detail' }).waitFor();
        const back = page.getByRole('button', { name: 'Back to tasks' }); await back.focus(); await page.keyboard.press('Enter');
        assert.equal(await page.getByRole('region', { name: 'Personal Task detail' }).count(), 0);
        denied = true;
        await page.getByRole('button', { name: 'Refresh', exact: true }).click();
        await page.getByRole('alert').filter({ hasText: 'Personal Tasks unavailable' }).waitFor();
        assert.equal(await page.getByRole('button', { name: /Synthetic Task/ }).count(), 0);
        assert.ok(methods.length >= 3 && methods.every(method => method === 'GET'));
    } finally { await page.close(); }
});

test('server-confirmed Task mutations refresh the read workspace without optimistic state', async () => {
    const { page } = await mount(install('dashboard'), 1440);
    let task = null;
    let rejectNextStart = false;
    const responseTask = () => ({ data: task });
    try {
        await page.route(/\/tasks(?:\/|\?|$)/, async route => {
            const request = route.request();
            const url = new URL(request.url());
            if (request.method() === 'POST' && url.pathname === '/tasks') {
                const payload = request.postDataJSON();
                task = { id: 41, kind: 'individual', title: payload.title, instructions: null, state: 'open', owning_department_id: null, due_at: null, completed_at: null, created_at: '2026-10-20T09:00:00+08:00', updated_at: '2026-10-20T09:00:00+08:00' };
                return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(responseTask()) });
            }
            if (request.method() === 'POST' && url.pathname.endsWith('/start')) {
                if (rejectNextStart) {
                    rejectNextStart = false;
                    return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ message: 'Rejected' }) });
                }
                task = { ...task, state: 'in_progress', updated_at: '2026-10-20T09:01:00+08:00' };
                return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseTask()) });
            }
            if (request.method() === 'POST' && url.pathname.endsWith('/complete')) {
                task = { ...task, state: 'completed', completed_at: '2026-10-20T09:02:00+08:00', updated_at: '2026-10-20T09:02:00+08:00' };
                return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseTask()) });
            }
            if (url.pathname === '/tasks/41') {
                return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responseTask()) });
            }
            const requestedState = url.searchParams.get('state');
            const data = task && (!requestedState || task.state === requestedState) ? [task] : [];
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data, meta: { page: 1, per_page: 20, last_page: 1, total: data.length } }) });
        });

        const actions = page.getByRole('region', { name: 'Personal Task actions' });
        await page.getByLabel('New personal Task title').fill('Synchronized Task');
        await page.getByRole('button', { name: 'Create Task' }).click();
        await actions.getByText(/Server confirmed: Synchronized Task — open/).waitFor();
        await page.getByRole('list', { name: 'Open personal Tasks' }).getByText('Synchronized Task').waitFor();

        await page.getByRole('button', { name: /Synchronized Task/ }).first().click();
        await page.getByRole('region', { name: 'Personal Task detail' }).waitFor();
        await actions.getByRole('button', { name: 'Start' }).click();
        await actions.getByText(/Server confirmed: Synchronized Task — in progress/).waitFor();
        await page.getByRole('list', { name: 'In Progress personal Tasks' }).getByText('Synchronized Task').waitFor();
        assert.equal(await page.getByRole('region', { name: 'Personal Task detail' }).count(), 0);

        await actions.getByRole('button', { name: 'Complete' }).click();
        await actions.getByText(/Server confirmed: Synchronized Task — completed/).waitFor();
        await page.getByRole('list', { name: 'Completed personal Tasks' }).getByText('Synchronized Task').waitFor();

        await page.getByLabel('New personal Task title').fill('Rejected Task');
        await page.getByRole('button', { name: 'Create Task' }).click();
        await actions.getByText(/Server confirmed: Rejected Task — open/).waitFor();
        rejectNextStart = true;
        await page.getByRole('list', { name: 'Open personal Tasks' }).getByText('Rejected Task').waitFor();
        await actions.getByRole('button', { name: 'Start' }).click();
        await actions.getByRole('alert').filter({ hasText: 'rejected (422)' }).waitFor();
        await page.getByRole('list', { name: 'Open personal Tasks' }).getByText('Rejected Task').waitFor();
    } finally { await page.close(); }
});
