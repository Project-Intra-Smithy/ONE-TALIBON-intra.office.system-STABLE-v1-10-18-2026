import { chromium } from 'playwright';
import crypto from 'node:crypto';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:8000';
const MODE = process.env.QA_MODE || 'production';
const PASSWORD = process.env.QA_DEMO_PASSWORD;
const stamp = `${MODE}-${Date.now()}`;

if (!PASSWORD) throw new Error('QA_DEMO_PASSWORD is required');

function check(name, ok, details = '') {
    if (!ok) throw new Error(`${name}: ${details}`);
    console.log(`PASS ${name}${details ? ` — ${details}` : ''}`);
}

function base32(input) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const c of input.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase()) {
        const i = alphabet.indexOf(c);
        if (i < 0) throw new Error('Invalid MFA secret');
        bits += i.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    return Buffer.from(bytes);
}

function totp(secret) {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const digest = crypto.createHmac('sha1', base32(secret)).update(counter).digest();
    const offset = digest.at(-1) & 15;
    const value = ((digest[offset] & 127) << 24)
        | (digest[offset + 1] << 16)
        | (digest[offset + 2] << 8)
        | digest[offset + 3];
    return String(value % 1_000_000).padStart(6, '0');
}

async function enterDepartmentHead(page, email) {
    const response = await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    check(`${email} login page`, response?.status() === 200, `status=${response?.status()}`);

    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await Promise.all([
        page.waitForURL((url) => ['/dashboard', '/security/mfa/enroll', '/security/mfa/challenge'].includes(url.pathname), { timeout: 15000 }),
        page.getByRole('button', { name: 'Sign In' }).click(),
    ]);

    let path = new URL(page.url()).pathname;
    if (path === '/security/mfa/challenge') {
        throw new Error(`${email} unexpectedly had an existing MFA enrollment in the fresh P08 fixture`);
    }

    if (path === '/security/mfa/enroll') {
        const secret = (await page.locator('code').first().innerText()).trim();
        await page.getByLabel('Six-digit verification code').fill(totp(secret));
        await Promise.all([
            page.waitForURL((url) => url.pathname === '/security/mfa/recovery-codes', { timeout: 15000 }),
            page.getByRole('button', { name: /Confirm MFA enrollment/i }).click(),
        ]);
        await Promise.all([
            page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 15000 }),
            page.getByRole('link', { name: /Continue to portal/i }).click(),
        ]);
        path = new URL(page.url()).pathname;
    }

    check(`${email} authenticated with MFA`, path === '/dashboard', `path=${path}`);
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
        await enterDepartmentHead(a, 'engineering@talibon.demo');
        await enterDepartmentHead(b, 'budget@talibon.demo');

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
