/** Actual Dashboard and Phase 1 shell. Synthetic HTTP only, no Laravel acceptance. */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { once } from 'node:events';
import { chromium } from 'playwright';
import { dashboardFixture, dashboardRoles } from '../resources/js/components/dashboard/preview-fixtures.ts';

const base = 'http://127.0.0.1:4188';
const evidence = 'artifacts/fe-dash-01';
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let browser, server, output = '';
before(async () => {
    mkdirSync(evidence, { recursive: true });
    browser = await chromium.launch(existsSync(chromium.executablePath()) ? { headless: true } : { channel: 'chrome', headless: true });
    server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4188', '--strictPort'], { stdio: 'pipe', env: { ...process.env, LARAVEL_BYPASS_ENV_CHECK: '1', FRONTEND_TEST_CACHE_DIR: 'node_modules/.vite-test-dashboard' } });
    for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { output += String(chunk); });
    let ready = false;
    for (let i = 0; i < 80; i++) {
        if (server.exitCode !== null) throw new Error(output);
        try { if ((await fetch(base + '/visual-preview.html')).ok) { ready = true; break; } } catch {}
        await sleep(500);
    }
    assert.ok(ready, output);
});
after(async () => {
    await browser?.close();
    if (server && server.exitCode === null) { server.kill('SIGTERM'); await Promise.race([once(server, 'close'), sleep(2500)]); }
});
async function mount(role, width = 390, state = 'populated') {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
    const page = await context.newPage(), errors = [], blocked = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', async route => {
        const req = route.request(), url = new URL(req.url());
        requests.push({ path: url.pathname, method: req.method(), cookie: req.headers().cookie });
        const permitted = url.origin === base && req.method() === 'GET' &&
            (/^\/(?:visual-preview\.html|@vite\/|@react-refresh|@fs\/|node_modules\/|resources\/|__dashboard-preview\/)/.test(url.pathname));
        if (permitted) return route.continue();
        blocked.push(req.url()); return route.abort();
    });
    await page.goto(base + '/visual-preview.html?screen=dashboard&role=' + role + '&state=' + state);
    await page.locator('.dashboard h1').waitFor();
    await page.getByText('No individual Tasks in this state.', { exact: true }).waitFor();
    return { page, context, errors, blocked, requests };
}
async function layout(page) {
    const result = await page.evaluate(() => {
        const sections = [...document.querySelectorAll('.dashboard-content > section')].map(el => el.getBoundingClientRect());
        const root = document.querySelector('.dashboard-content').getBoundingClientRect();
        return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            stacked: sections.every((rect, i) => Math.abs(rect.width - root.width) < 2 && (!i || rect.top >= sections[i - 1].bottom)),
            small: [...document.querySelectorAll('.dashboard-section p, .dashboard-section a, .dashboard-section dt, .dashboard-section td')].filter(el => parseFloat(getComputedStyle(el).fontSize) < 16).length,
            shortTargets: [...document.querySelectorAll('.dashboard a, .dashboard button:not(:disabled)')].filter(el => el.checkVisibility() && el.getBoundingClientRect().height < 44).map(el => el.textContent),
        };
    });
    assert.equal(result.overflow, false, 'horizontal page overflow');
    assert.equal(result.stacked, true, 'primary sections must be stacked full-width');
    assert.equal(result.small, 0, 'dashboard body text must be at least 16px');
    assert.deepEqual(result.shortTargets, [], 'touch targets');
}
for (const role of dashboardRoles) {
    for (const width of [320, 390, 768, 1024, 1440]) {
        test(`dashboard: ${role} at ${width}px preserves content and stacks sections`, async () => {
            const { page, context, errors, blocked, requests } = await mount(role, width);
            try {
                await layout(page);
                const compact = await page.evaluate(() => {
                    const shell = document.querySelector('.portal-shell').getBoundingClientRect();
                    const chart = document.querySelector('.dashboard-metrics--chart').getBoundingClientRect();
                    const search = document.querySelector('.portal-records-search');
                    return {
                        chartTop: chart.top - shell.top,
                        headerHeight: document.querySelector('.portal-header').getBoundingClientRect().height,
                        jumpsAfterMetrics: document.querySelector('.dashboard-jumps').getBoundingClientRect().top >= chart.bottom,
                        searchHeight: search?.getBoundingClientRect().height,
                    };
                });
                assert.ok(compact.chartTop < (width < 768 ? 450 : 370), 'primary metrics stay near the application top, excluding the development toolbar');
                assert.ok(compact.headerHeight <= (width >= 1280 ? 80 : 150), 'compact responsive header');
                assert.equal(compact.jumpsAfterMetrics, true, 'section shortcuts follow primary metrics');
                if (compact.searchHeight !== undefined) assert.ok(compact.searchHeight >= 44, 'search retains a usable target');
                const fixture = dashboardFixture(role);
                for (const group of fixture.metricGroups) for (const metric of group.metrics) {
                    assert.ok(await page.locator('.dashboard-metrics dt').getByText(metric.label, { exact: true }).count(), metric.label);
                }
                if (role === 'department_head') assert.equal(await page.getByRole('table').getByRole('row').count(), 3);
                if (role === 'executive_oversight') await page.getByRole('heading', { name: 'Recently completed', exact: true }).waitFor();
                if (role === 'system_administration') {
                    await page.getByRole('heading', { name: 'Security activity' }).waitFor();
                    assert.equal(await page.locator('.dashboard a[href="/admin"]').count(), 0, 'unstaged administration remains unavailable');
                }
                for (const region of await page.locator('.dashboard-table-scroll').all()) {
                    if (width <= 390) {
                        await region.focus(); await page.keyboard.press('End');
                        await page.keyboard.press('ArrowRight');
                        await page.waitForTimeout(200);
                        assert.ok(await region.evaluate(el => el.scrollLeft > 0), 'table scrolls to final column');
                        await region.evaluate(el => { el.scrollLeft = el.scrollWidth; });
                        await region.evaluate(el => { el.scrollLeft = 0; });
                    }
                }
                await page.screenshot({ path: evidence + '/' + role + '-' + width + '.png', fullPage: true });
                assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
                assert.ok(requests.some(req => req.path === '/__dashboard-preview/tasks'));
                assert.equal(requests.some(req => /^\/(tasks|notifications|dashboard|login|logout)(\/|$)/.test(req.path)), false);
            } finally { await context.close(); }
        });
    }
    test(`dashboard: ${role} empty, nullable, absent and long data`, async () => {
        for (const state of ['empty', 'nullable', 'missing', 'long']) {
            const { page, context, errors, blocked } = await mount(role, 320, state);
            try {
                await layout(page);
                if (state === 'missing') assert.equal(await page.locator('.dashboard-section').count(), role === 'employee' || role === 'department_head' ? 2 : role === 'executive_oversight' ? 1 : 0);
                if (state === 'nullable' && role !== 'system_administration') assert.ok(await page.locator('.dashboard').getByText(/Not recorded/).count());
                if (state === 'empty') {
                    const rows = await page.locator('.dashboard-metrics dd').allTextContents();
                    assert.ok(rows.every(value => value === '0'));
                }
                if (state === 'long') await page.screenshot({ path: evidence + '/' + role + '-long-320.png', fullPage: true });
                assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
            } finally { await context.close(); }
        }
    });
}
test('dashboard: role switch, keyboard focus, action destinations, preview transport isolation', async () => {
    const { page, context, errors, blocked, requests } = await mount('employee');
    try {
        await context.addCookies([{ name: 'preview-isolation-probe', value: 'synthetic', url: base }]);
        const link = page.locator('.dashboard a[href="/transactions?view=needs_my_action"]').first();
        const initialUrl = page.url();
        await link.focus();
        assert.equal(await link.evaluate(el => getComputedStyle(el).outlineStyle), 'solid');
        await page.keyboard.press('Enter');
        await page.getByRole('status').getByText(/Preview only/).waitFor();
        assert.equal(page.url(), initialUrl);
        await page.getByRole('button', { name: 'Refresh', exact: true }).click();
        await page.getByText('No individual Tasks in this state.', { exact: true }).waitFor();
        assert.ok(requests.filter(req => req.path.startsWith('/__dashboard-preview/')).every(req => !req.cookie), 'synthetic transport omits cookies');
        const probes = await page.evaluate(async () => {
            const results = [];
            for (const [url, options] of [['/admin', {}], ['https://example.invalid/secret', {}], ['/tasks', { method: 'POST' }], ['/logout', { method: 'POST' }]]) {
                try { await fetch(url, options); results.push(false); } catch { results.push(true); }
            }
            try { new XMLHttpRequest().open('POST', '/login'); results.push(false); } catch { results.push(true); }
            try { await fetch(new Request(location.origin + '/tasks', { method: 'POST' })); results.push(false); } catch { results.push(true); }
            return results;
        });
        assert.ok(probes.every(Boolean));
        for (const role of dashboardRoles) {
            await page.getByLabel('Workspace', { exact: true }).selectOption(role);
            await page.locator('.dashboard-eyebrow').getByText(dashboardFixture(role).experience.label, { exact: true }).waitFor();
            await layout(page);
        }
        assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
    } finally { await context.close(); }
});
test('dashboard: missing isolation middleware fails closed before mounting production components', async () => {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const page = await context.newPage(), calls = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => calls.push(new URL(request.url()).pathname));
    await page.route('**/__dashboard-preview/ready', route => route.fulfill({ status: 404, body: '{}' }));
    try {
        await page.goto(base + '/visual-preview.html?screen=dashboard');
        await page.waitForFunction(() => document.readyState === 'complete');
        assert.equal(await page.locator('.dashboard').count(), 0);
        assert.ok(errors.some(message => message.includes('isolation middleware')));
        await page.getByRole('alert').getByText(/Preview unavailable/).waitFor();
        assert.equal(calls.some(path => /\/(tasks|notifications\/feed)$/.test(path)), false);
    } finally { await context.close(); }
});
test('dashboard: zoom reflow, heading hierarchy and keyboard table access', async () => {
    const { page, context, errors } = await mount('department_head', 1440);
    try {
        assert.equal(await page.locator('h1').count(), 1);
        assert.equal(await page.getByRole('main').count(), 1);
        assert.equal(await page.getByRole('table').getByRole('columnheader').count(), 4);
        await page.locator('.dashboard-table-scroll').focus();
        assert.equal(await page.locator('.dashboard-table-scroll').evaluate(el => document.activeElement === el), true);
        await page.evaluate(() => { document.documentElement.style.zoom = '200%'; });
        await layout(page);
        await page.screenshot({ path: evidence + '/zoom-200.png', fullPage: true });
        assert.deepEqual(errors, []);
    } finally { await context.close(); }
});

test('refinement: charts expose exact counts and supplied destinations; every jump moves focus', async () => {
    for (const role of dashboardRoles) {
        const { page, context, blocked } = await mount(role, 1440);
        try {
            for (const jump of await page.getByRole('navigation', { name: 'Dashboard sections' }).getByRole('button').all()) {
                const label = await jump.textContent();
                await jump.focus(); await page.keyboard.press('Enter');
                assert.equal(await page.evaluate(label => document.activeElement?.getAttribute('aria-label') === label || (label === 'Personal Tasks' && document.activeElement?.id === 'dashboard-personal-tasks'), label), true, label);
            }
            for (const group of dashboardFixture(role).metricGroups) {
                for (const metric of group.metrics) {
                    const title = { personal: 'My work', office: 'Office workload', executive: 'Municipal workload', system: 'Accounts and security' }[group.key] || group.title;
                    const row = page.getByRole('region', { name: title, exact: true }).locator('.dashboard-metrics--chart > div').filter({ has: page.locator('dt').getByText(metric.label, { exact: true }) }).first();
                    assert.equal(await row.locator('dd').textContent(), String(metric.value));
                    const anchor = row.locator('a');
                    if (await anchor.count()) {
                        assert.equal(await anchor.getAttribute('href'), metric.link);
                        await row.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
                        const bar = await row.locator('.dashboard-bar').boundingBox();
                        await page.mouse.click(bar.x + bar.width / 2, bar.y + bar.height / 2);
                        const previewScreen = { '/transactions': 'work', '/correspondence': 'correspondence', '/records': 'records', '/memoranda': 'memoranda', '/employees': 'employees', '/departments': 'departments' }[metric.link];
                        const verifyDestination = async () => {
                            if (previewScreen) {
                                await page.waitForURL(url => url.searchParams.get('screen') === previewScreen);
                                await page.locator('#app h1:visible').waitFor();
                                await page.goBack();
                                await page.locator('.dashboard h1').waitFor();
                            } else await page.getByRole('status').getByText(/Preview only/).waitFor();
                        };
                        await verifyDestination();
                        await anchor.focus(); await page.keyboard.press('Enter');
                        await verifyDestination();
                    } else assert.equal(await row.locator('button').count(), 0, 'unavailable metric does not pretend to navigate');
                }
            }
            assert.deepEqual(blocked, []);
        } finally { await context.close(); }
    }
});

test('refinement: routed details expand with keyboard and appearance stays in settings', async () => {
    const { page, context } = await mount('employee', 390);
    try {
        const details = page.locator('.dashboard-details');
        assert.equal(await details.getAttribute('open'), null);
        await details.locator('summary').focus(); await page.keyboard.press('Enter');
        await details.getByText('Illustrative document routing notice').waitFor();
        await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
        const settings = page.getByRole('dialog').locator('.portal-settings');
        assert.equal(await settings.getAttribute('open'), null);
        await settings.locator('summary').focus(); await page.keyboard.press('Enter');
        await settings.getByRole('button', { name: 'Dark', exact: true }).click();
        await page.keyboard.press('Escape');
        await layout(page);
        await page.screenshot({ path: evidence + '/refinement-dark-390.png', fullPage: true });
    } finally { await context.close(); }
});

test('refinement: existing Calendar shares the light shell across target widths', async () => {
    for (const width of [320, 390, 768, 1024, 1440]) {
        const context = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: 'block' });
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await context.route('**/*', route => {
            const url = new URL(route.request().url());
            return url.origin === base && /^\/(?:visual-preview\.html|@vite\/|@react-refresh|@fs\/|node_modules\/|resources\/|__dashboard-preview\/)/.test(url.pathname) ? route.continue() : route.abort();
        });
        try {
            await page.goto(base + '/visual-preview.html?screen=calendar');
            await page.getByRole('heading', { name: 'Events, deadlines & schedules', exact: true }).waitFor();
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            await page.screenshot({ path: evidence + '/calendar-' + width + '.png', fullPage: true });
            assert.deepEqual(errors, []);
        } finally { await context.close(); }
    }
});


test('preview: refreshing retains the isolated URL, selected role and current navigation', async () => {
    const { page, context, errors, blocked } = await mount('department_head', 390);
    try {
        await page.getByRole('heading', { name: 'Staff workload', exact: true }).waitFor();
        await page.waitForTimeout(100);
        assert.ok(page.url().includes('/visual-preview.html?screen=dashboard&role=department_head'));
        await page.reload();
        await page.getByRole('heading', { name: 'Staff workload', exact: true }).waitFor();
        assert.equal(await page.getByLabel('Workspace', { exact: true }).inputValue(), 'department_head');
        await page.getByRole('button', { name: 'Open navigation', exact: true }).click();
        assert.equal(await page.getByRole('dialog').locator('a[aria-current="page"]').getAttribute('href'), '/dashboard');
        assert.deepEqual(errors, []); assert.deepEqual(blocked, []);
    } finally { await context.close(); }
});
