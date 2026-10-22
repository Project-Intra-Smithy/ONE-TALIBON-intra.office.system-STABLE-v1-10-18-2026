import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:8000';
const PASSWORD = process.env.QA_DEMO_PASSWORD;
const TOTP_SECRET = process.env.QA_TOTP_SECRET;
const EXPECTED_SHA = process.env.QA_EXPECTED_SHA;
const REPORT = 'storage/app/qa/p08-responsive-smoke-report.json';
const SHOTS = 'storage/app/qa/p08-responsive-failures';

if (!PASSWORD || !EXPECTED_SHA) {
    throw new Error('QA_DEMO_PASSWORD and QA_EXPECTED_SHA are required');
}

const actualSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (actualSha !== EXPECTED_SHA) {
    throw new Error(`Exact-head mismatch: expected ${EXPECTED_SHA}, got ${actualSha}`);
}

const report = {
    generatedAt: new Date().toISOString(),
    expectedSha: EXPECTED_SHA,
    actualSha,
    completed: false,
    viewports: [],
    failure: null,
};

async function writeReport() {
    await fs.mkdir('storage/app/qa', { recursive: true });
    await fs.writeFile(REPORT, JSON.stringify(report, null, 2));
}

async function capture(page, name) {
    await fs.mkdir(SHOTS, { recursive: true });
    const file = `${SHOTS}/${name}.png`;
    await page.screenshot({ path: file, fullPage: false, animations: 'disabled' }).catch(() => {});
    return file;
}

function base32(input) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const character of input.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase()) {
        const index = alphabet.indexOf(character);
        if (index < 0) throw new Error('Invalid MFA secret');
        bits += index.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) {
        bytes.push(parseInt(bits.slice(index, index + 8), 2));
    }
    return Buffer.from(bytes);
}

function totp(secret) {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const digest = crypto.createHmac('sha1', base32(secret)).update(counter).digest();
    const offset = digest.at(-1) & 15;
    const number = ((digest[offset] & 127) << 24)
        | (digest[offset + 1] << 16)
        | (digest[offset + 2] << 8)
        | digest[offset + 3];
    return String(number % 1_000_000).padStart(6, '0');
}

async function assertPage(page, route, label) {
    const runtimeErrors = [];
    const onPageError = (error) => runtimeErrors.push(`pageerror: ${error.message}`);
    const onResponse = (response) => {
        if (response.status() >= 500) runtimeErrors.push(`server-${response.status()}: ${response.url()}`);
    };

    page.on('pageerror', onPageError);
    page.on('response', onResponse);

    try {
        const response = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (!response || response.status() >= 400) {
            throw new Error(`${label} returned HTTP ${response?.status() ?? 'none'}`);
        }

        await page.waitForFunction(() => {
            const root = document.getElementById('app');
            const body = document.body?.innerText?.replace(/\s+/g, ' ').trim() || '';
            return document.readyState !== 'loading' && !!root && root.childElementCount > 0 && body.length >= 20;
        }, null, { timeout: 10000 });

        const dimensions = await page.evaluate(() => ({
            viewport: window.innerWidth,
            html: document.documentElement.scrollWidth,
            body: document.body.scrollWidth,
            textLength: (document.body?.innerText || '').trim().length,
        }));

        if (dimensions.html > dimensions.viewport + 1 || dimensions.body > dimensions.viewport + 1) {
            throw new Error(`${label} has horizontal overflow: ${JSON.stringify(dimensions)}`);
        }
        if (dimensions.textLength < 20) {
            throw new Error(`${label} rendered an unexpectedly blank body`);
        }
        if (runtimeErrors.length > 0) {
            throw new Error(`${label} runtime errors: ${runtimeErrors.join(' | ')}`);
        }

        return { route, label, status: response.status(), dimensions, result: 'pass' };
    } finally {
        page.off('pageerror', onPageError);
        page.off('response', onResponse);
    }
}

async function login(page) {
    const response = await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (!response || response.status() !== 200) throw new Error(`Login page returned ${response?.status() ?? 'none'}`);

    await page.locator('input#login-email').fill('employee@talibon.demo');
    await page.locator('input#login-password').fill(PASSWORD);
    await page.getByRole('button', { name: /^Sign in$/i }).click();
    await page.waitForURL((url) => ['/dashboard', '/security/mfa/challenge'].includes(url.pathname), { timeout: 15000 });

    if (new URL(page.url()).pathname === '/security/mfa/challenge') {
        if (!TOTP_SECRET) throw new Error('QA_TOTP_SECRET is required when the account is challenged for MFA');
        await page.getByLabel('Authenticator code').fill(totp(TOTP_SECRET));
        await page.getByRole('button', { name: 'Verify and continue', exact: true }).click();
        await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 15000 });
    }
}

async function runViewport(browser, spec) {
    const context = await browser.newContext({
        viewport: { width: spec.width, height: spec.height },
        extraHTTPHeaders: { skip_zrok_interstitial: '1' },
    });
    const page = await context.newPage();
    const row = { ...spec, checks: [], result: 'fail', screenshot: null };
    report.viewports.push(row);

    try {
        const publicHome = await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (!publicHome || publicHome.status() >= 400) throw new Error(`Public home returned ${publicHome?.status() ?? 'none'}`);
        const publicDimensions = await page.evaluate(() => ({ viewport: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
        if (publicDimensions.html > publicDimensions.viewport + 1 || publicDimensions.body > publicDimensions.viewport + 1) {
            throw new Error(`Public home has horizontal overflow: ${JSON.stringify(publicDimensions)}`);
        }

        await login(page);

        for (const [route, label] of [
            ['/dashboard', 'Dashboard'],
            ['/transactions', 'Work Requests'],
            ['/records', 'Records'],
        ]) {
            row.checks.push(await assertPage(page, route, label));
        }
        row.authenticatedScreenshot = await capture(page, `${spec.width}x${spec.height}-records`);

        const messaging = await page.goto(`${BASE}/messages`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        assert.equal(messaging?.status(), 403, 'Withdrawn Messaging must remain denied');
        row.checks.push({ route: '/messages', label: 'Messaging denial', status: 403, result: 'pass' });
        row.denialScreenshot = await capture(page, `${spec.width}x${spec.height}-messaging-denial`);

        row.result = 'pass';
    } catch (error) {
        row.failure = String(error?.message || error);
        row.screenshot = await capture(page, `${spec.width}x${spec.height}`);
        throw error;
    } finally {
        await context.close();
    }
}

const browser = await chromium.launch({ headless: true });
try {
    await runViewport(browser, { width: 1440, height: 900 });
    await runViewport(browser, { width: 390, height: 844 });
    report.completed = true;
} catch (error) {
    report.failure = String(error?.message || error);
    process.exitCode = 1;
} finally {
    await browser.close().catch(() => {});
    await writeReport();
}
