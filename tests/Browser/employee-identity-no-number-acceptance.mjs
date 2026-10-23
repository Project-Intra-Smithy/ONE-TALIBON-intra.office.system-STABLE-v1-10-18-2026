import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { chromium } from 'playwright';

const required = name => {
    const value = process.env[name];
    assert.ok(value, name + ' must be provided for real Laravel browser acceptance');
    return value;
};
const baseURL = required('BROWSER_ACCEPTANCE_URL');
const adminEmail = required('BROWSER_ADMIN_EMAIL');
const adminPassword = required('BROWSER_ADMIN_PASSWORD');
const inviteeLabel = required('BROWSER_INVITEE_LABEL');
const inviteePassword = required('BROWSER_INVITEE_PASSWORD');
const inviteeRole = process.env.BROWSER_INVITEE_ROLE || 'department_staff';
const output = path.resolve(process.env.BROWSER_ACCEPTANCE_OUTPUT || 'storage/app/qa/employee-identity-no-number-r1');

// RFC 4648 Base32. Never use an empty alphabet when verifying MFA.
export function decodeBase32(secret) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const character of secret.toUpperCase().replace(/=+$/u, '')) {
        const index = alphabet.indexOf(character);
        assert.notEqual(index, -1, 'MFA secret has an invalid Base32 character');
        bits += index.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) {
        bytes.push(Number.parseInt(bits.slice(index, index + 8), 2));
    }
    return Buffer.from(bytes);
}
export function totp(secret, seconds = Math.floor(Date.now() / 1000)) {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(seconds / 30)));
    const digest = createHmac('sha1', decodeBase32(secret)).update(counter).digest();
    const offset = digest[digest.length - 1] & 15;
    return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}

async function loginAdmin(page) {
    await page.goto('/login');
    await page.getByLabel('Email address').fill(adminEmail);
    await page.locator('input[name="password"]').fill(adminPassword);
    await Promise.all([
        page.waitForURL(url => url.pathname !== '/login'),
        page.getByRole('button', { name: 'Sign in' }).click(),
    ]);
    const route = new URL(page.url()).pathname;
    if (route === '/security/mfa/enroll') {
        const secret = (await page.locator('code').textContent())?.trim();
        assert.ok(secret, 'Admin enrollment secret was not rendered');
        await page.getByLabel('Six-digit verification code').fill(totp(secret));
        await Promise.all([
            page.waitForURL('**/security/mfa/recovery-codes'),
            page.getByRole('button', { name: 'Confirm MFA enrollment' }).click(),
        ]);
    } else if (route === '/security/mfa/challenge') {
        await page.getByLabel('Authenticator code').fill(totp(required('BROWSER_ADMIN_MFA_SECRET')));
        await Promise.all([
            page.waitForURL(url => !url.pathname.includes('/security/mfa/challenge')),
            page.getByRole('button', { name: 'Verify and continue' }).click(),
        ]);
    }
}

test('real Laravel: one-time employee activation requires no official number', async () => {
    await mkdir(output, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const admin = await browser.newContext({ baseURL });
    let activationContext;
    try {
        const page = await admin.newPage();
        await loginAdmin(page);
        await page.goto('/admin/invitations');
        await page.getByLabel('Registered employee').selectOption({ label: inviteeLabel });
        await page.getByLabel('Approved portal role').selectOption(inviteeRole);
        await page.getByRole('checkbox').check();
        await Promise.all([
            page.waitForResponse(r => r.url().endsWith('/admin/invitations') && r.request().method() === 'POST'),
            page.getByRole('button', { name: 'Generate one-time invitation' }).click(),
        ]);
        const link = await page.getByLabel('One-time activation link').inputValue();
        assert.ok(link.startsWith(baseURL + '/activate-account/'));
        activationContext = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
        const activation = await activationContext.newPage();
        await activation.goto(link);
        assert.equal(await activation.getByLabel('Registered employee number').count(), 0);
        assert.equal(await activation.locator('input[name="employee_number"]').count(), 0);
        await activation.screenshot({ path: path.join(output, 'activation-no-number-mobile.png'), fullPage: true });
        await activation.getByLabel(/New password/u).fill(inviteePassword);
        await activation.getByLabel('Confirm new password').fill(inviteePassword);
        await Promise.all([
            activation.waitForURL(url => !url.pathname.includes('/activate-account/')),
            activation.getByRole('button', { name: 'Activate account' }).click(),
        ]);
        assert.match(new URL(activation.url()).pathname, /^\/(dashboard|security\/mfa\/enroll)/u);
        const consumed = await browser.newContext({ baseURL });
        try {
            const replay = await consumed.newPage();
            await replay.goto(link);
            await replay.getByText('This invitation has already been used.').waitFor();
        } finally {
            await consumed.close();
        }
    } finally {
        await activationContext?.close();
        await admin.close();
        await browser.close();
    }
});
