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
for (const width of [390, 768, 1024, 1280, 1440]) {
    for (const mode of ['light', 'dark']) {
        test(`Dashboard readable layout ${width}px ${mode}`, async () => {
            for (const role of ['employee', 'department_head', 'executive_oversight', 'system_administration']) {
                const { page, errors } = await mount(install('dashboard', role), width);
                try {
                    await page.evaluate(mode => {
                        document.documentElement.classList.toggle('dark', mode === 'dark');
                        document.documentElement.dataset.theme = mode;
                    }, mode);
                    const summary = page.locator('.r7-top-summary');
                    const work = page.locator('.r7-top-work');
                    const activity = page.locator('.r7-top-activity');
                    const a = await summary.boundingBox(), b = await work.boundingBox(), c = await activity.boundingBox();
                    assert.ok(a.y + a.height <= b.y && b.y + b.height <= c.y, 'Summary, work and activity must be separate wide sections');
                    assert.ok(Math.abs(a.width - b.width) < 2);
                    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No viewport overflow');
                    for (const metric of await summary.locator('.workspace-metric').all()) {
                        assert.ok(await metric.evaluate(el => parseFloat(getComputedStyle(el.children[1]).fontSize) >= 16));
                    }
                    const jump = page.locator('a[href="#work-overview"]');
                    await jump.focus();
                    assert.ok(await jump.evaluate(el => el === document.activeElement && getComputedStyle(el).outlineStyle !== 'none'));
                    await page.evaluate(() => window.scrollTo(0, 0));
                    await page.screenshot({ path: `${out}/dashboard-${role}-${width}-${mode}.png`, fullPage: true });
                    assert.deepEqual(errors, []);
                } finally { await page.close(); }
            }
        });
    }
}

for (const width of [390, 768, 1024, 1280, 1440]) {
    for (const mode of ['light', 'dark']) {
        test(`Calendar views ${width}px ${mode}`, async () => {
            for (const view of ['month', 'week', 'day', 'schedule']) {
                const { page, errors } = await mount(install('calendar', 'employee', props => {
                    props.calendar.view = view;
                    if (view === 'week') {
                        props.calendar.range_start = '2026-10-04T00:00:00+08:00';
                        props.calendar.range_end = '2026-10-10T23:59:59+08:00';
                    }
                    props.events[0].title = 'Sample office coordination with a long descriptive event title';
                }), width);
                try {
                    await page.evaluate(mode => document.documentElement.classList.toggle('dark', mode === 'dark'), mode);
                    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No viewport overflow');
                    const trigger = page.getByRole('button', { name: /Sample office coordination/ }).first();
                    await trigger.click();
                    await page.getByRole('dialog').waitFor();
                    await page.keyboard.press('Escape');
                    assert.ok(await trigger.evaluate(el => el === document.activeElement), 'Focus returns to event');
                    const smallControls = await page.locator('.aj-calendar button, .aj-calendar input, .aj-calendar a').evaluateAll(els => els.filter(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height < 43).map(el => el.textContent));
                    assert.deepEqual(smallControls, [], 'Calendar touch targets');
                    await page.evaluate(() => window.scrollTo(0, 0));
                    await page.screenshot({ path: `${out}/calendar-${view}-${width}-${mode}.png`, fullPage: true });
                    assert.deepEqual(errors, []);
                } finally { await page.close(); }
            }
        });
    }
}
