import { chromium } from 'playwright';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:8000';
const MODE = process.env.QA_MODE || 'production';
const stamp = `${MODE}-${Date.now()}`;

function check(name, ok, details = '') {
    if (!ok) throw new Error(`${name}: ${details}`);
    console.log(`PASS ${name}${details ? ` — ${details}` : ''}`);
}

async function enterDepartmentHead(page, office) {
    await page.goto(`${BASE}/login`);
    await page.getByRole('button', { name: 'Open Municipal Workspace', exact: true }).click();
    await page.getByRole('button', { name: /^Department Head/ }).click();
    await page.getByRole('heading', { name: 'Choose office context', exact: true }).waitFor();
    await page.getByRole('button', { name: new RegExp(`^${office}`) }).click();
    await page.waitForURL((url) => url.pathname === '/dashboard');
}

function messageGet(page, channel, timeout = 5000) {
    return page.waitForResponse((response) => {
        const url = new URL(response.url());
        return response.request().method() === 'GET'
            && url.pathname === '/messages/feed'
            && url.searchParams.get('channel') === channel;
    }, { timeout });
}

async function openChat(page, channel) {
    const sync = messageGet(page, channel);
    await page.goto(`${BASE}/messages?channel=${encodeURIComponent(channel)}&view=thread`);
    check(`${channel} initial sync`, (await sync).status() === 200);
    await page.getByRole('heading', { name: channel, exact: true }).waitFor();
}

async function selectChat(page, channel) {
    const sync = messageGet(page, channel);
    await page.getByRole('button').filter({ hasText: channel }).first().click();
    check(`${channel} switch sync`, (await sync).status() === 200);
    await page.getByRole('heading', { name: channel, exact: true }).waitFor();
}

async function sendMessage(page, channel, body) {
    const field = page.getByRole('textbox', { name: `Message ${channel}`, exact: true });
    await field.fill(body);
    const responsePromise = page.waitForResponse((response) => (
        response.request().method() === 'POST'
        && new URL(response.url()).pathname === '/messages/feed'
    ));
    await field.press('Enter');
    const response = await responsePromise;
    check(`${MODE} send ${channel}`, response.status() === 201, `status=${response.status()}`);
    await page.getByText(body, { exact: true }).last().waitFor();
}

async function assertAssetMode(page) {
    await page.goto(`${BASE}/login`);
    const hmr = await page.locator('script[src*="@vite/client"]').count();
    const built = await page.locator('script[src*="/build/assets/"]').count();
    if (MODE === 'hmr') check('HMR asset mode', hmr > 0, `vite-client=${hmr}`);
    else check('production asset mode', hmr === 0 && built > 0, `vite-client=${hmr}, built=${built}`);
}

async function assertChannelErrorIsolation(page) {
    await selectChat(page, 'General');
    let failed = false;
    await page.route('**/messages/feed', async (route) => {
        if (!failed && route.request().method() === 'POST') {
            failed = true;
            await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
            return;
        }
        await route.continue();
    });
    const field = page.getByRole('textbox', { name: 'Message General', exact: true });
    await field.fill(`Retain ${stamp}`);
    await field.press('Enter');
    await page.getByText('Message was not sent. Keep the text and try again.', { exact: true }).waitFor();
    check('failed send retains text', await field.inputValue() === `Retain ${stamp}`);
    await page.unroute('**/messages/feed');
    await selectChat(page, 'MPDO Planning');
    check('channel error isolation', await page.getByText('Message was not sent. Keep the text and try again.', { exact: true }).count() === 0);
}

async function run() {
    const browser = await chromium.launch({ headless: true, ...(process.env.QA_BROWSER_EXECUTABLE_PATH ? { executablePath: process.env.QA_BROWSER_EXECUTABLE_PATH } : {}) });
    try {
        const contextA = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const contextB = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const a = await contextA.newPage();
        const b = await contextB.newPage();

        await assertAssetMode(a);
        await enterDepartmentHead(a, 'Municipal Engineering Office');
        await enterDepartmentHead(b, 'Municipal Budget Office');

        await openChat(a, 'Department Heads');
        const aMessage = `Closure A ${stamp}`;
        await sendMessage(a, 'Department Heads', aMessage);

        await openChat(b, 'Department Heads');
        await b.getByText(aMessage, { exact: true }).waitFor({ timeout: 2000 });
        const bMessage = `Closure B ${stamp}`;
        await sendMessage(b, 'Department Heads', bMessage);
        await a.getByText(bMessage, { exact: true }).waitFor({ timeout: 4500 });
        check('two-user polling', true);

        await a.reload();
        await b.reload();
        await a.getByText(aMessage, { exact: true }).waitFor();
        await b.getByText(bMessage, { exact: true }).waitFor();
        check('refresh persistence', true);

        await selectChat(a, 'General');
        const generalMessage = `General isolation ${stamp}`;
        await sendMessage(a, 'General', generalMessage);
        await selectChat(b, 'MPDO Planning');
        await b.waitForTimeout(3200);
        check('channel isolation', await b.getByText(generalMessage, { exact: true }).count() === 0);

        await selectChat(a, 'MPDO Planning');
        await selectChat(a, 'Department Heads');
        await a.getByText(aMessage, { exact: true }).waitFor({ timeout: 2000 });
        check('rapid channel switch immediate sync', true);
        await assertChannelErrorIsolation(a);

        await contextA.close();
        await contextB.close();
    } finally {
        await browser.close();
    }
}

run().catch((error) => {
    console.error(`FAIL MP0 ${MODE}: ${error.message}`);
    process.exitCode = 1;
});
