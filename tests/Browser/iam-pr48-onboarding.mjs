import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8000';
const EXPECTED_SHA = process.env.QA_EXPECTED_SHA;
const ownerPassword = process.env.IAM_QA_ADMIN_PASSWORD;
const firstPassword = process.env.IAM_QA_EMPLOYEE_PASSWORD;
const recoveryPassword = process.env.IAM_QA_RECOVERY_PASSWORD;
const REPORT = 'storage/app/qa/iam-pr48-browser.json';
const actualSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (!EXPECTED_SHA || EXPECTED_SHA !== actualSha) throw Error('Exact SHA validation failed');
for (const candidate of [ownerPassword, firstPassword, recoveryPassword]) {
    if (!candidate || candidate.length < 16) throw Error('Synthetic credential missing');
}
const report = {
    schemaVersion: 1, expectedSha: EXPECTED_SHA, actualSha, synthetic: true,
    viewports: [1440, 390], passed: [], completed: false, errorStage: null,
    runtimeFailures: [], note: 'No private activation codes, MFA secrets, passwords, cookies or response bodies captured',
};
let stageName = 'launch';
const fail = [];
let browser;
async function checkpoint(name, action) {
    stageName = name;
    await action();
    report.passed.push(name);
}
function monitor(page) {
    page.on('pageerror', () => fail.push('browser runtime exception'));
    page.on('response', response => {
        if (response.status() >= 500) fail.push('server HTTP 5xx');
    });
}
function base32(value) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const character of value.replace(/=+$/, '').toUpperCase()) {
        const at = alphabet.indexOf(character);
        if (at < 0) throw Error('Invalid private MFA secret format');
        bits += at.toString(2).padStart(5, '0');
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
    const number = ((digest[offset] & 127) << 24) | (digest[offset + 1] << 16)
        | (digest[offset + 2] << 8) | digest[offset + 3];
    return String(number % 1000000).padStart(6, '0');
}
async function noOverflow(page, label) {
    const dimensions = await page.evaluate(() => ({
        viewport: innerWidth,
        html: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
    }));
    assert.ok(dimensions.html <= dimensions.viewport + 1
        && dimensions.body <= dimensions.viewport + 1, label + ' horizontal overflow');
}
async function signIn(page, username, password) {
    await page.goto(BASE + '/login');
    await page.getByLabel('Username or email').fill(username);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: /^Sign in$/ }).click();
}
async function enroll(page) {
    await page.waitForURL(url => url.pathname === '/security/mfa/enroll');
    const secret = (await page.locator('main code').first().innerText()).trim();
    assert.ok(secret.length >= 16, 'MFA enrollment secret absent');
    await page.getByLabel('Six-digit verification code').fill(totp(secret));
    await page.getByRole('button', { name: 'Confirm MFA enrollment' }).click();
    await page.waitForURL(url => url.pathname === '/security/mfa/recovery-codes');
    await page.getByRole('heading', { name: 'Store your recovery codes' }).waitFor();
    await page.getByRole('link', { name: 'Continue to portal' }).click();
    await page.waitForURL(url => url.pathname === '/dashboard');
}
async function getPrivateCode(page) {
    const code = (await page.locator('section[role="status"] code').first().innerText()).trim();
    assert.match(code, /^[A-F0-9]{4}(?:-[A-F0-9]{4}){7}$/, 'Private activation code malformed');
    return code;
}
async function redeem(page, code, password) {
    await page.goto(BASE + '/activate-account');
    await page.getByLabel('Activation code').fill(code);
    await page.getByLabel('Choose password').fill(password);
    await page.getByLabel('Confirm password').fill(password);
    await page.getByRole('button', { name: 'Activate account', exact: true }).click();
    await enroll(page);
}
async function registryRow(page) {
    const row = page.locator('table tbody tr').filter({ hasText: '@qa.employee' });
    await row.waitFor();
    return row;
}
try {
    browser = await chromium.launch({ headless: true });
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const admin = await adminContext.newPage();
    monitor(admin);
    const employeeContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const employee = await employeeContext.newPage();
    monitor(employee);

    await checkpoint('admin-password-login-and-real-totp-enrollment', async () => {
        await signIn(admin, 'qa.owner', ownerPassword);
        await enroll(admin);
        await admin.goto(BASE + '/admin');
        await admin.getByRole('heading', { name: 'Accounts & Access' }).waitFor();
        await noOverflow(admin, 'admin desktop');
    });

    await checkpoint('admin-mobile-390px-responsive', async () => {
        await admin.setViewportSize({ width: 390, height: 844 });
        await admin.reload();
        await admin.getByRole('heading', { name: 'Accounts & Access' }).waitFor();
        await noOverflow(admin, 'admin mobile');
        await admin.setViewportSize({ width: 1440, height: 900 });
    });

    let firstCode;
    await checkpoint('admin-add-user-with-office-role-and-private-code', async () => {
        const section = admin.locator('section').filter({
            has: admin.getByRole('heading', { name: 'Add user' }),
        }).first();
        await section.getByLabel('Eligible employee').selectOption({ index: 1 });
        await section.getByLabel('Portal role').selectOption('department_head');
        await section.getByLabel('Portal username').fill('qa.employee');
        await section.getByRole('button', { name: 'Generate activation code' }).click();
        await admin.locator('section[role="status"] code').first().waitFor();
        firstCode = await getPrivateCode(admin);
    });

    await checkpoint('employee-mobile-activation-password-and-totp', async () => {
        await redeem(employee, firstCode, firstPassword);
        await noOverflow(employee, 'employee mobile');
        const forbidden = await employee.request.get(BASE + '/admin', { maxRedirects: 0 });
        assert.equal(forbidden.status(), 403, 'Non-admin entered administrator workspace');
        const task = await employee.request.get(BASE + '/tasks', { headers: { Accept: 'application/json' } });
        assert.equal(task.status(), 200, 'Assured Task access failed');
        const messaging = await employee.request.get(BASE + '/messages', { maxRedirects: 0 });
        assert.equal(messaging.status(), 403, 'Withdrawn messaging route opened');
    });

    await checkpoint('suspension-revokes-existing-session', async () => {
        await admin.reload();
        const row = await registryRow(admin);
        admin.once('dialog', dialog => void dialog.accept('Synthetic QA suspension'));
        await row.getByRole('button', { name: 'Suspend' }).click();
        await row.getByRole('button', { name: 'Reactivate' }).waitFor();
        await employee.goto(BASE + '/dashboard');
        await employee.waitForURL(url => url.pathname === '/login');
    });

    await checkpoint('admin-reactivation-and-credential-recovery', async () => {
        let row = await registryRow(admin);
        await row.getByRole('button', { name: 'Reactivate' }).click();
        await row.getByRole('button', { name: 'Suspend' }).waitFor();
        row = await registryRow(admin);
        admin.once('dialog', dialog => void dialog.accept());
        await row.getByRole('button', { name: 'Recover' }).click();
        await admin.locator('section[role="status"] code').first().waitFor();
    });

    const replacementCode = await getPrivateCode(admin);
    await checkpoint('old-employee-password-invalid-after-recovery', async () => {
        await signIn(employee, 'qa.employee', firstPassword);
        await employee.waitForURL(url => url.pathname === '/login');
        await employee.getByRole('alert').first().waitFor();
    });
    await checkpoint('employee-recovery-reactivation-and-new-mfa', async () => {
        await redeem(employee, replacementCode, recoveryPassword);
        await noOverflow(employee, 'recovered employee mobile');
        const forbidden = await employee.request.get(BASE + '/admin', { maxRedirects: 0 });
        assert.equal(forbidden.status(), 403);
    });
    if (fail.length) throw Error('Browser/server runtime error count: ' + fail.length);
    report.completed = true;
} catch (error) {
    report.errorStage = stageName;
    report.runtimeFailures = [...fail, String(error?.message || error)];
    process.exitCode = 1;
} finally {
    await browser?.close().catch(() => {});
    await fs.mkdir('storage/app/qa', { recursive: true });
    await fs.writeFile(REPORT, JSON.stringify(report, null, 2));
}
