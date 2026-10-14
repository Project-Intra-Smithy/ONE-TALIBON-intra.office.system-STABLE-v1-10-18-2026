/** Live local draft integration checks. Does not certify Laravel acceptance. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';
const base = 'http://127.0.0.1:4185';
const out = 'artifacts/rc-draft';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch(existsSync(chromium.executablePath()) ? {} : { channel: 'chrome' });
const results = [], errors = [], forbidden = [], httpErrors = [];
const screens = ['dashboard', 'work', 'correspondence', 'records', 'memoranda', 'calendar', 'employees', 'departments', 'login', 'mfa'];
try {
    for (const width of [320, 390, 768, 1024, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
        const page = await context.newPage();
        page.on('pageerror', error => errors.push({ width, url: page.url(), message: error.message }));
        page.on('response', response => { if (response.status() >= 400) httpErrors.push({ url: response.url(), status: response.status() }); });
        await context.route('**/*', route => {
            const req = route.request(), url = new URL(req.url());
            if (url.origin === base && req.method() === 'GET' && /^\/(visual-preview\.html|@vite\/|@react-refresh|@fs\/|node_modules\/|resources\/|public\/images\/|images\/|__dashboard-preview\/)/.test(url.pathname)) return route.continue();
            forbidden.push({ method: req.method(), url: req.url() });
            return route.abort();
        });
        for (const screen of screens) {
            await page.goto(`${base}/visual-preview.html?screen=${screen}`);
            await page.locator('#app h1:visible, #app h2:visible').first().waitFor();
            await page.evaluate(() => document.fonts.ready);
            const metrics = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, heading: document.querySelector('#app h1, #app h2')?.textContent }));
            results.push({ screen, width, ...metrics });
            await page.screenshot({ path: `${out}/${screen}-${width}.png`, fullPage: true });
            assert.ok(metrics.scrollWidth <= width, `${screen} at ${width}: overflow ${metrics.scrollWidth}`);
            assert.equal(await page.getByRole('heading', { name: 'Something went wrong' }).count(), 0);
            assert.equal(new URL(page.url()).searchParams.get('screen'), screen, 'fixture URL retained');
        }
        await context.close();
    }
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push({ message: error.message }));
    page.on('request', req => {
        const url = new URL(req.url());
        if (req.method() !== 'GET' || url.origin !== base || /^\/(tasks|notifications|login|logout|security|transactions|records|employees|correspondence|memoranda|calendar|departments)(\/|$)/.test(url.pathname)) forbidden.push({ url: req.url(), method: req.method() });
    });
    await page.goto(base + '/visual-preview.html?screen=dashboard');
    // All ten toolbar destinations, including browser back and reload.
    for (const screen of screens) {
        await page.locator(`[aria-label="Preview screens"] a[href*="screen=${screen}"]`).click();
        await page.locator('#app h1:visible, #app h2:visible').first().waitFor();
        assert.equal(new URL(page.url()).searchParams.get('screen'), screen);
    }
    await page.reload();
    await page.getByRole('heading', { name: 'Verify your identity' }).waitFor();
    await page.goBack();
    await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
    // Login submits remain inert, local password visibility still works.
    await page.getByLabel('Email', { exact: true }).fill('preview@example.invalid');
    await page.getByLabel('Password', { exact: true }).fill('synthetic-only');
    await page.getByRole('button', { name: 'Show password', exact: true }).click();
    assert.equal(await page.getByLabel('Password', { exact: true }).getAttribute('type'), 'text');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.locator('#preview-status').getByText(/No request was sent/).waitFor();
    await page.locator('[aria-label="Preview screens"] a[href*="screen=mfa"]').click();
    await page.getByLabel('Authenticator code', { exact: true }).fill('123456');
    await page.getByRole('button', { name: 'Verify and continue' }).click();
    await page.locator('#preview-status').getByText(/No request was sent/).waitFor();
    await page.getByLabel('One-time recovery code').fill('synthetic-only');
    await page.getByRole('button', { name: 'Use recovery code' }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    // Real shell links retain canonical hrefs but navigate only within preview.
    await page.goto(base + '/visual-preview.html?screen=dashboard');
    for (const [path, screen] of [['/transactions','work'],['/correspondence','correspondence'],['/records','records'],['/memoranda','memoranda'],['/calendar','calendar'],['/employees','employees'],['/departments','departments'],['/dashboard','dashboard']]) {
        const link = page.locator(`.portal-desktop-navigation a[href="${path}"]`).first();
        await link.click();
        await page.waitForURL(url => url.searchParams.get('screen') === screen);
        await page.locator('#app h1:visible, #app h2:visible').first().waitFor();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
    await page.locator('.portal-drawer a[href="/records"]').click();
    await page.waitForURL(url => url.searchParams.get('screen') === 'records');
    await page.locator('#app h1:visible').waitFor();
    const probes = await page.evaluate(async () => {
        const results = [];
        for (const [url, options] of [['/login', { method: 'POST' }], ['/records', {}], ['https://example.invalid', {}]]) {
            try { await fetch(url, options); results.push(false); } catch { results.push(true); }
        }
        try { new XMLHttpRequest().open('POST', '/logout'); results.push(false); } catch { results.push(true); }
        return results;
    });
    assert.ok(probes.every(Boolean));
    await context.close();
    assert.deepEqual(errors, [], 'runtime errors');
    assert.deepEqual(forbidden, [], 'protected/external requests');
    assert.deepEqual(httpErrors, [], 'HTTP errors');
    console.log('PASS: 50 responsive mounts; ten-screen toolbar; desktop/mobile shell navigation; back/reload; Login/MFA isolation; zero protected requests, HTTP failures or runtime errors.');
} finally {
    writeFileSync(`${out}/responsive.json`, JSON.stringify({ results, errors, forbidden, httpErrors }, null, 2));
    await browser.close();
}
