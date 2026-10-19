// Real built Inertia entry with synthetic HTTP responses. NOT Laravel authentication E2E.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

let server, browser, base, manifest;
const out = 'storage/app/qa/aj-home-auth';
const posts = [];
const content = JSON.parse(execFileSync(process.env.PHP_BINARY || 'php', ['-r', "echo json_encode(require 'config/public_portal.php');"], { encoding: 'utf8' }));
const experience = { key: 'employee', label: 'Employee', department: { id: 1, code: 'TEST', name: 'Test office' }, scopes: { personal: true, office: false, municipal: false, system: false }, capabilities: { openOfficeWorkspace: false, viewMunicipalAggregates: false, openSystemAdministration: false }, quickActions: [] };
function pageData(path, errors = {}) {
    const component = { '/': 'Public/Home', '/authenticated-home': 'Public/Home', '/login': 'Auth/Login', '/security/mfa/challenge': 'Auth/MfaChallenge', '/dashboard': 'Dashboard' }[path];
    return { component, url: path, version: null, clearHistory: false, encryptHistory: false, rescuedProps: [], flash: {}, rememberedState: {}, props: {
        appName: 'ONE TALIBON', authenticated: path === '/dashboard' || path === '/authenticated-home', content, errors, flash: {}, auth: { user: { id: 1, name: 'Test Actor', role: 'employee', employee: { department: experience.department } } },
        permissions: { reports: false, navigation: {} }, experience, metricGroups: [], recentWork: [],
    } };
}
before(async () => {
    manifest = JSON.parse(await readFile('public/build/manifest.json', 'utf8'));
    await mkdir(out, { recursive: true });
    try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }
    server = createServer(async (req, res) => {
        try {
            const path = new URL(req.url, 'http://localhost').pathname;
            if (/^\/(build\/assets|images|brand)\//.test(path) && !path.includes('..')) {
                res.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg');
                res.end(await readFile(`public${path}`)); return;
            }
            if (path === '/notifications/feed' || path === '/tasks') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(path === '/tasks' ? { data: [], meta: { page: 1, per_page: 10, last_page: 1, total: 0 } } : { notifications: [], unreadMemoCount: 0, pendingMemo: null })); return;
            }
            let errors = {};
            if (req.method === 'POST') {
                let raw = ''; for await (const chunk of req) raw += chunk;
                const payload = JSON.parse(raw || '{}'); posts.push({ path, payload });
                await new Promise(resolve => setTimeout(resolve, 600));
                errors = path === '/login' ? { email: 'Test server: credentials rejected', password: 'Test server: password rejected' } : payload.recovery_code ? { recovery_code: 'Test server: recovery rejected' } : { code: 'Test server: code rejected' };
            }
            const data = pageData(path === '/logout' ? '/login' : path, errors);
            if (!data.component) { res.writeHead(404); res.end(); return; }
            if (req.headers['x-inertia']) {
                res.writeHead(200, { 'Content-Type': 'application/json', 'X-Inertia': 'true', Vary: 'X-Inertia' }); res.end(JSON.stringify(data)); return;
            }
            const entry = manifest['resources/js/app.tsx'];
            const css = new Set([manifest['resources/css/app.css'].file, ...(entry.css || [])]);
            res.setHeader('Content-Type', 'text/html');
            res.end(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">${[...css].map(file => `<link rel="stylesheet" href="/build/${file}">`).join('')}</head><body><script data-page="app" type="application/json">${JSON.stringify(data).replaceAll('<', '\\u003c')}</script><div id="app"></div><script type="module" src="/build/${entry.file}"></script></body></html>`);
        } catch (error) { res.writeHead(500); res.end(String(error)); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await browser?.close(); await new Promise(resolve => server ? server.close(resolve) : resolve()); });
async function mount(path, width = 390) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + path); await page.locator('main').first().waitFor(); await page.waitForTimeout(250);
    return { page, errors };
}
for (const width of [320, 390, 768, 1024, 1440]) {
    test(`built pages: ${width}px homepage, Login, MFA and Dashboard`, async () => {
        for (const path of ['/', '/login', '/security/mfa/challenge', '/dashboard']) {
            const { page, errors } = await mount(path, width);
            try {
                assert.deepEqual(errors, [], `${path} runtime errors`);
                assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} horizontal overflow at ${width}`);
                if (path === '/') {
                    assert.equal(await page.locator('h1').innerText(), content.hero.title);
                    for (const id of ['home', 'capabilities', 'about-portal', 'support']) assert.equal(await page.locator(`#${id}`).count(), 1);
                    assert.ok(await page.locator('a[href="/login"]').count() >= 3);
                    assert.equal(await page.getByRole('button', { name: 'Open portal navigation', includeHidden: true }).isVisible(), width < 1280);
                }
                if (path === '/login') {
                    assert.equal(await page.getByRole('button', { name: 'Continue with Google' }).isDisabled(), true);
                    assert.equal(await page.locator('.employee-login__panel').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
                    assert.equal((await page.request.get(base + '/images/talibon/municipality-of-talibon.jpg')).status(), 200);
                }
                if (path === '/dashboard') assert.ok(await page.getByRole('heading', { name: 'Personal Tasks', exact: true }).count());
                await page.screenshot({ path: `${out}/${path.replaceAll('/', '-') || 'home'}-${width}.png`, fullPage: true });
            } finally { await page.close(); }
        }
    });
}
test('homepage keyboard, mobile navigation and actual Inertia Login link', async () => {
    const { page } = await mount('/');
    try {
        await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to main content');
        await page.keyboard.press('Enter'); assert.equal(await page.evaluate(() => document.activeElement.id), 'public-content');
        const menu = page.getByRole('button', { name: 'Open portal navigation' });
        await menu.click(); await page.keyboard.press('Escape'); assert.equal(await menu.getAttribute('aria-expanded'), 'false'); assert.equal(await menu.evaluate(el => el === document.activeElement), true);
        await menu.click(); await page.locator('#public-mobile-navigation a[href="#support"]').click(); assert.equal(await menu.getAttribute('aria-expanded'), 'false');
        await page.locator('.public-login-link').click(); await page.waitForURL('**/login'); await page.getByLabel('Email address', { exact: true }).waitFor();
    } finally { await page.close(); }
});
test('Login keyboard, required fields, payload, pending and server errors', async () => {
    const { page } = await mount('/login');
    try {
        await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.activeElement.id), 'login-email');
        await page.getByRole('button', { name: 'Sign in', exact: true }).click(); assert.equal(await page.locator('input:invalid').count(), 2);
        await page.getByLabel('Email address', { exact: true }).fill('actor@example.test'); await page.getByLabel('Password', { exact: true }).fill('synthetic-only');
        await page.getByRole('button', { name: 'Show password' }).click(); assert.equal(await page.locator('#login-password').getAttribute('type'), 'text');
        await page.getByLabel('Remember me on this device').check(); await page.getByRole('button', { name: 'Sign in', exact: true }).click();
        await page.getByRole('button', { name: 'Signing in…' }).waitFor(); assert.equal(await page.locator('#login-email').isDisabled(), true);
        await page.getByText('Test server: credentials rejected').waitFor(); assert.deepEqual(posts.at(-1), { path: '/login', payload: { email: 'actor@example.test', password: 'synthetic-only', remember: true } });
        assert.equal(await page.locator('#login-email').getAttribute('aria-invalid'), 'true');
    } finally { await page.close(); }
});
test('persisted dark appearance, short auth viewport and authenticated homepage destination', async () => {
    const { page } = await mount('/authenticated-home', 320);
    try {
        await page.evaluate(() => document.documentElement.classList.add('dark'));
        assert.equal(await page.locator('.public-refined').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)');
        assert.equal(await page.locator('.public-login-link').getAttribute('href'), '/dashboard');
        await page.locator('.public-login-link').click(); await page.waitForURL('**/dashboard');
        assert.equal(await page.locator('.public-refined').count(), 0);
        await page.goto(base + '/login'); await page.locator('#login-email').waitFor();
        await page.setViewportSize({ width: 320, height: 360 });
        await page.getByRole('button', { name: 'Sign in', exact: true }).scrollIntoViewIfNeeded();
        assert.equal(await page.locator('.employee-login__panel h2').evaluate(el => getComputedStyle(el).color), 'rgb(20, 90, 67)');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        await page.goto(base + '/security/mfa/challenge');
        await page.getByRole('button', { name: 'Sign out' }).scrollIntoViewIfNeeded();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    } finally { await page.close(); }
});
test('MFA focus, challenge/recovery payloads, pending, errors and logout', async () => {
    const { page } = await mount('/security/mfa/challenge');
    try {
        const code = page.getByLabel('Authenticator code'); assert.equal(await code.evaluate(el => el === document.activeElement), true);
        await code.fill('12ab3456'); assert.equal(await code.inputValue(), '1234'); await code.fill('123456');
        await page.getByRole('button', { name: 'Verify and continue' }).click(); await page.getByRole('button', { name: 'Verifying…' }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Use recovery code' }).isDisabled(), true);
        await page.getByText('Test server: code rejected').waitFor(); assert.deepEqual(posts.at(-1), { path: '/security/mfa/challenge', payload: { code: '123456', recovery_code: '' } });
        await page.getByLabel('One-time recovery code').fill('synthetic-recovery'); await page.getByRole('button', { name: 'Use recovery code' }).click();
        await page.getByText('Test server: recovery rejected').waitFor(); assert.deepEqual(posts.at(-1), { path: '/security/mfa/challenge', payload: { code: '', recovery_code: 'synthetic-recovery' } });
        await page.getByRole('button', { name: 'Sign out' }).click(); await page.waitForURL('**/login'); assert.equal(posts.at(-1).path, '/logout');
    } finally { await page.close(); }
});
