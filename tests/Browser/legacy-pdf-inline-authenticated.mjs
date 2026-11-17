import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash, createHmac } from 'node:crypto';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const base = 'http://127.0.0.1:8000';
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
assert.equal(sha, process.env.QA_EXPECTED_SHA);
assert.ok(process.env.PDF_QA_PASSWORD?.length >= 20);
const fixture = JSON.parse(await fs.readFile('storage/app/qa/legacy-pdf-fixture.json', 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const report = { sha, synthetic: true, stages: [], completed: false, visualInspection: 'PENDING' };
const dir = 'storage/app/qa';
let browser;
function otp(secret) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    for (const char of secret.replace(/=+$/, '').toUpperCase()) {
        const at = alphabet.indexOf(char);
        assert.ok(at >= 0);
        bits += at.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
    const digest = createHmac('sha1', Buffer.from(bytes)).update(counter).digest();
    const offset = digest.at(-1) & 15;
    return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
try {
    // Headed Chromium under Xvfb: exercise the native browser PDF plugin.
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const preview = base + '/documents/' + fixture.publicId + '/preview';
    const guest = await context.request.get(preview, { maxRedirects: 0 });
    assert.equal(guest.status(), 302);
    await page.goto(base + '/login');
    await page.getByLabel('Username or email').fill('qa.pdf.viewer');
    await page.getByLabel('Password', { exact: true }).fill(process.env.PDF_QA_PASSWORD);
    await page.getByRole('button', { name: /^Sign in$/ }).click();
    await page.waitForURL(url => url.pathname === '/security/mfa/enroll');
    const denied = await context.request.get(preview, { maxRedirects: 0 });
    // Password-only session may be redirected or denied, never given bytes.
    assert.ok([302, 403, 404].includes(denied.status()));
    assert.notEqual(denied.headers()['content-type'], 'application/pdf');
    // The denied safe request intentionally writes url.intended=preview.
    // Return to an ordinary guarded portal journey while MFA is still
    // pending so the recovery-code Continue link targets an Inertia page.
    report.stages.push('guest and password-only retrieval denied');
    await page.goto(base + '/dashboard');
    await page.waitForURL(url => url.pathname === '/security/mfa/enroll');
    const secret = (await page.locator('main code').first().innerText()).trim();
    await page.getByLabel('Six-digit verification code').fill(otp(secret));
    await page.getByRole('button', { name: 'Confirm MFA enrollment' }).click();
    await page.waitForURL(url => url.pathname === '/security/mfa/recovery-codes');
    await page.getByRole('link', { name: 'Continue to portal' }).click();
    await page.waitForURL(url => url.pathname === '/dashboard');
    report.stages.push('real MFA enrollment completed through dashboard continuation');

    await page.goto(base + '/documents?mode=files&document=' + fixture.publicId);
    const open = page.getByRole('link', { name: 'Open PDF', exact: true });
    await open.waitFor();
    assert.equal(await open.getAttribute('target'), '_blank');
    assert.match(await open.getAttribute('rel'), /noopener/);
    let downloads = 0;
    page.on('download', () => downloads++);
    context.on('page', newPage => newPage.on('download', () => downloads++));
    const [popup, navigation] = await Promise.all([
        context.waitForEvent('page'),
        context.waitForEvent('response', { predicate: response => response.url() === preview }),
        open.click(),
    ]);
    await popup.waitForURL(preview);
    assert.equal(navigation.status(), 200);
    const headers = navigation.headers();
    assert.match(headers['content-type'], /^application\/pdf/);
    assert.match(headers['content-disposition'], /^inline/);
    assert.match(headers['cache-control'], /no-store/);
    assert.equal(headers['x-content-type-options'], 'nosniff');
    // Independently verify complete same-session bytes. Chromium's plugin may
    // consume the popup response before Playwright exposes response.body().
    const verified = await context.request.get(preview);
    assert.equal(verified.status(), 200);
    assert.equal(hash(await verified.body()), fixture.sha256);
    assert.equal(new URL(popup.url()).origin, base);
    await popup.locator('embed[type="application/pdf"]').waitFor({ timeout: 15000 });
    await popup.waitForTimeout(2000);
    await popup.screenshot({ path: dir + '/legacy-pdf-native-viewer.png' });
    assert.equal(downloads, 0);
    report.stages.push('real new tab, inline navigation, native PDF embed, screenshot, verified same-session bytes, no download');
    await popup.close();

    const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('link', { name: 'Download', exact: true }).click(),
    ]);
    assert.equal(hash(await fs.readFile(await download.path())), fixture.sha256);
    report.stages.push('explicit attachment download exact bytes');
    report.completed = true;
} finally {
    await browser?.close();
    await fs.writeFile(dir + '/legacy-pdf-browser.json', JSON.stringify(report, null, 2));
}
