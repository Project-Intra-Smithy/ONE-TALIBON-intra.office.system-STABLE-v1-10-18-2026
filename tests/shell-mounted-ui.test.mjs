/** Actual AppLayout + Inertia, synthetic HTTP only; no Laravel acceptance. */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { once } from 'node:events';
import { chromium } from 'playwright';
const base = 'http://127.0.0.1:4176';
const url = base + '/tests/fixtures/shell.html';
const evidence = 'artifacts/phase-one-shell';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, server, output = '';
before(async () => {
    mkdirSync(evidence, { recursive: true });
    browser = await chromium.launch(existsSync(chromium.executablePath()) ? { headless: true } : { channel: 'chrome', headless: true });
    server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4176', '--strictPort'], { stdio: 'pipe', env: { ...process.env, LARAVEL_BYPASS_ENV_CHECK: '1', FRONTEND_TEST_CACHE_DIR: 'node_modules/.vite-test-shell' } });
    for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { output += String(chunk); });
    let ready = false;
    for (let i = 0; i < 60; i++) {
        if (server.exitCode !== null) throw new Error(output);
        try { if ((await fetch(url)).ok) { ready = true; break; } } catch {}
        await sleep(500);
    }
    assert.ok(ready, output);
});
after(async () => {
    await browser?.close();
    if (server && server.exitCode === null) { server.kill('SIGTERM'); await Promise.race([once(server, 'close'), sleep(2500)]); }
});
async function mount(width = 390, query = '', height = 900, configure) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/notifications/feed', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ unreadMemoCount: 0, pendingMemo: null, notifications: [] }) }));
    await configure?.(page);
    await page.goto(url + query);
    await page.getByRole('heading', { name: 'Workspace layout preview' }).waitFor();
    return { page, context, errors };
}
async function noOverflow(page) {
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'page horizontal overflow');
}
for (const width of [320, 390, 768, 1024, 1440]) {
    test(`shell: ${width}px layout, active navigation, drawer keyboard and targets`, async () => {
        const { page, context, errors } = await mount(width);
        try {
            await noOverflow(page);
            assert.ok(await page.getByRole('searchbox').isVisible(), 'records search remains available');
            await page.screenshot({ path: `${evidence}/shell-${width}.png`, fullPage: true });
            if (width < 1024) {
                const trigger = page.getByRole('button', { name: 'Open navigation', exact: true });
                await trigger.focus(); await page.keyboard.press('Enter');
                const dialog = page.getByRole('dialog', { name: 'Workspace navigation' });
                await dialog.waitFor();
                assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
                assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Close navigation');
                await page.keyboard.press('Shift+Tab');
                assert.ok(await dialog.evaluate(el => el.contains(document.activeElement)), 'backwards focus trapped');
                await page.keyboard.press('Tab');
                assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Close navigation');
                await page.locator('.portal-drawer-content').evaluate(el => el.scrollTop = 0);
                await page.screenshot({ path: `${evidence}/drawer-${width}.png` });
                const active = dialog.locator('a[aria-current="page"]');
                assert.equal(await active.getAttribute('href'), '/records');
                const bad = await dialog.locator('a, button:not(.portal-drawer-backdrop)').evaluateAll(elements => elements.filter(el => { const r = el.getBoundingClientRect(); return r.width < 43 || r.height < 43; }).map(el => el.textContent));
                assert.deepEqual(bad, [], 'minimum control targets');
                await page.keyboard.press('Escape');
                assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
                assert.equal(await trigger.evaluate(el => el === document.activeElement), true);
                assert.equal(await page.evaluate(() => document.body.style.overflow), '');
            } else {
                assert.equal(await page.locator('.portal-desktop-navigation a[aria-current="page"]').getAttribute('href'), '/records');
                await page.getByRole('button', { name: 'Collapse navigation' }).click();
                await noOverflow(page);
                assert.equal(await page.locator('.portal-desktop-navigation a[aria-current="page"]').getAttribute('aria-label'), 'Municipal Records');
                await page.getByRole('button', { name: 'Expand navigation' }).click();
            }
            assert.deepEqual(errors, []);
        } finally { await context.close(); }
    });
}
test('shell: denied flags filter both navigation and records search', async () => {
    const { page, context } = await mount(390, '?denied');
    try {
        assert.equal(await page.getByRole('searchbox').count(), 0);
        await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
        const links = await page.getByRole('dialog').locator('nav a').evaluateAll(items => items.map(el => el.getAttribute('href')));
        assert.deepEqual(links.sort(), ['/calendar', '/employees']); // existing unflagged destinations
    } finally { await context.close(); }
});
test('shell: search GET and logout POST keep Inertia transport and CSRF', async () => {
    for (const width of [390, 1440]) {
        const { page, context } = await mount(width);
        try {
            await context.addCookies([{ name: 'XSRF-TOKEN', value: 'synthetic-shell-csrf', url: base }]);
            await page.route(/\/records\?search=/, async route => {
                const initial = await page.evaluate(() => JSON.parse(document.getElementById('app').dataset.page));
                await route.fulfill({ contentType: 'application/json', headers: { 'X-Inertia': 'true' }, body: JSON.stringify({ ...initial, url: '/records?search=Office%20reference' }) });
            });
            await page.getByRole('searchbox').fill('Office reference');
            const search = page.waitForRequest(request => new URL(request.url()).pathname === '/records');
            await page.getByRole('button', { name: 'Search', exact: true }).click();
            const get = await search;
            assert.equal(get.method(), 'GET');
            assert.equal(new URL(get.url()).searchParams.get('search'), 'Office reference');
            await page.waitForURL('**/records?search=*');
            await page.route('**/logout', route => route.fulfill({ status: 204, body: '' }));
            if (width < 1024) await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
            const logout = page.waitForRequest('**/logout');
            await page.getByRole('button', { name: 'Sign out', exact: true }).filter({ visible: true }).click();
            const post = await logout;
            assert.equal(post.method(), 'POST');
            assert.equal(post.headers()['x-xsrf-token'], 'synthetic-shell-csrf');
            assert.equal(post.headers()['x-inertia'], 'true');
        } finally { await context.close(); }
    }
});
test('shell: short viewport, zoom, resize focus and skip link', async () => {
    const { page, context } = await mount(390, '?error', 480);
    try {
        await page.keyboard.press('Tab');
        assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Skip to content');
        await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(() => document.activeElement?.id), 'portal-content');
        assert.equal(await page.getByRole('alert').count(), 1);
        await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
        const logout = page.getByRole('dialog').getByRole('button', { name: 'Sign out' });
        await logout.scrollIntoViewIfNeeded();
        assert.ok(await logout.isVisible());
        const rect = await logout.boundingBox();
        assert.ok(rect.y >= 0 && rect.y + rect.height <= 480);
        await page.screenshot({ path: `${evidence}/drawer-short-390.png` });
        await page.setViewportSize({ width: 1024, height: 768 });
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Collapse navigation');
        await page.setViewportSize({ width: 640, height: 900 });
        await page.evaluate(() => document.documentElement.style.zoom = '2');
        await noOverflow(page);
        await page.screenshot({ path: `${evidence}/zoom-200.png`, fullPage: true });
    } finally { await context.close(); }
});
test('shell: navigation visit closes drawer and updates active state', async () => {
    const { page, context } = await mount();
    try {
        await page.route('**/calendar', async route => {
            const initial = await page.evaluate(() => JSON.parse(document.getElementById('app').dataset.page));
            await route.fulfill({ contentType: 'application/json', headers: { 'X-Inertia': 'true' }, body: JSON.stringify({ ...initial, url: '/calendar' }) });
        });
        await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
        await page.getByRole('dialog').getByRole('link', { name: 'Calendar', exact: true }).click();
        await page.getByRole('dialog').waitFor({ state: 'hidden' });
        await page.waitForURL('**/calendar');
        await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
        assert.equal(await page.getByRole('dialog').locator('a[aria-current="page"]').getAttribute('href'), '/calendar');
    } finally { await context.close(); }
});

test('shell: notification polling, expired state, focus return and dark preference', async () => {
    let polls = 0;
    // Install the expired response before mount so the initial poll cannot race it.
    const { page, context, errors } = await mount(320, '', 900, async page => {
        await page.route('**/notifications/feed', route => {
            polls++;
            return route.fulfill({ status: 419, contentType: 'application/json', body: '{}' });
        });
    });
    try {
        await page.getByRole('button', { name: 'Open notifications' }).click();
        await page.getByText('Session expired. Sign in again to refresh.').waitFor({ timeout: 12000 });
        assert.ok(polls >= 1, 'existing poll still runs');
        await noOverflow(page);
        await page.screenshot({ path: `${evidence}/notifications-320.png` });
        await page.keyboard.press('Escape');
        assert.equal(await page.getByRole('button', { name: 'Open notifications' }).evaluate(el => el === document.activeElement), true);
        await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
        await page.getByRole('dialog').getByText('Appearance settings', { exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Dark', exact: true }).click();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('html').getAttribute('data-appearance'), 'dark');
        await noOverflow(page);
        await page.screenshot({ path: `${evidence}/dark-320.png`, fullPage: true });
        assert.deepEqual(errors, []);
    } finally { await context.close(); }
});
