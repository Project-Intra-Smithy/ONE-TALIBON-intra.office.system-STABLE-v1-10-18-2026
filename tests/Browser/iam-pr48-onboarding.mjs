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
    console.log('IAM_BROWSER_CHECKPOINT_START ' + name);
    await action();
    report.passed.push(name);
    console.log('IAM_BROWSER_CHECKPOINT_PASS ' + name);
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
// Bounded read-only synthetic DB proof. Fingerprints stay in process memory;
 // only equality is recorded, never account fields, keys or digest values.
const fingerprintKey = crypto.randomBytes(32).toString('hex');
function ordinaryMutationFingerprint() {
    const script = "\nif (getenv('GITHUB_ACTIONS') !== 'true' || getenv('APP_ENV') !== 'testing'\n    || getenv('DB_DATABASE') !== 'talibon_portal_test' || getenv('DB_HOST') !== '127.0.0.1') {\n    exit(2);\n}\nrequire 'vendor/autoload.php';\n$app = require 'bootstrap/app.php';\n$app->make(\\Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();\n$db = \\Illuminate\\Support\\Facades\\DB::class;\nif ($db::connection()->getDriverName() !== 'pgsql'\n    || $db::selectOne('select current_database() as name')->name !== 'talibon_portal_test') {\n    exit(2);\n}\n$account = $db::table('users')->where('username', 'qa.ordinary')->first([\n    'id', 'password', 'session_version', 'remember_token', 'mfa_version',\n    'mfa_secret', 'mfa_confirmed_at', 'mfa_recovery_codes',\n    'mfa_recovery_codes_generated_at', 'is_active', 'account_status',\n]);\n$key = getenv('IAM_QA_FINGERPRINT_KEY');\nif (!$account || !is_string($key) || strlen($key) !== 64) {\n    exit(2);\n}\n$audits = $db::table('audit_logs')->where('actor_user_id', $account->id)\n    ->where('action', 'identity.password.changed')->where('outcome', 'allowed')->count();\necho hash_hmac('sha256', json_encode([$account, $audits], JSON_THROW_ON_ERROR), $key);\n";
    const digest = execFileSync('php', ['-r', script], {
        encoding: 'utf8', env: { ...process.env, IAM_QA_FINGERPRINT_KEY: fingerprintKey },
        stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!/^[a-f0-9]{64}$/.test(digest)) throw Error('Invalid synthetic state fingerprint');
    return digest;
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
    return secret;
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
    return enroll(page);
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

    await checkpoint('owner-only-database-registers-employee-through-real-ui', async () => {
        const eligible = admin.getByLabel('Eligible employee');
        assert.equal(await eligible.locator('option').count(), 1, 'Target employee must not be pre-seeded');
        const form = admin.getByRole('form', { name: 'Employee registration' });
        await form.getByLabel('Full name', { exact: true }).fill('Synthetic QA Employee');
        await form.getByLabel('Department or office').selectOption({ index: 1 });
        await form.getByLabel('Position title').fill('Synthetic Team Lead');
        await form.getByLabel('Employee number (optional)').fill('QA-EMP-001');
        await form.getByLabel('Employment type (optional)').selectOption('permanent');
        await form.getByRole('button', { name: 'Register employee', exact: true }).click();
        await eligible.getByRole('option', { name: /Synthetic QA Employee/ }).waitFor({ state: 'attached' });
        assert.equal(await eligible.locator('option').count(), 2);
        await noOverflow(admin, 'employee registration desktop');
        await admin.goto(BASE + '/employees?q=QA-EMP-001');
        await admin.getByText('Synthetic QA Employee', { exact: true }).first().waitFor();
        await admin.goto(BASE + '/admin');
        await admin.getByLabel('Eligible employee').waitFor();
    });

    let firstCode;
    let adminAssetVersion;
    await checkpoint('admin-add-user-with-office-role-and-private-code', async () => {
        const section = admin.locator('section').filter({
            has: admin.getByRole('heading', { name: 'Add user' }),
        }).first();
        await section.getByLabel('Eligible employee').selectOption({ index: 1 });
        await section.getByLabel('Portal role').selectOption('department_head');
        await section.getByLabel('Portal username').fill('qa.employee');
        const pageResponse = admin.waitForResponse(response => response.url() === BASE + '/admin'
            && response.request().method() === 'GET' && response.status() === 200
            && response.headers()['x-inertia'] === 'true');
        await section.getByRole('button', { name: 'Generate activation code' }).click();
        // Retain only the public asset-version string, never the page body in evidence.
        adminAssetVersion = (await (await pageResponse).json()).version;
        assert.equal(typeof adminAssetVersion, 'string');
        await admin.locator('section[role="status"] code').first().waitFor();
        firstCode = await getPrivateCode(admin);
    });


    await checkpoint('g2b-activation-credential-one-time-history-and-reload', async () => {
        await admin.waitForFunction(() => history.state !== null);
        assert.ok(await admin.evaluate(code => !JSON.stringify(history.state).includes(code), firstCode), 'Credential persisted in navigation history');
        const partial = await admin.request.get(BASE + '/admin', {
            headers: {'X-Inertia':'true','X-Inertia-Version':adminAssetVersion,'X-Inertia-Partial-Component':'Admin/Index','X-Inertia-Partial-Data':'registry'},
        });
        assert.equal(partial.status(), 200);
        assert.ok(!(await partial.text()).includes(firstCode), 'Partial response exposed a credential');
        await admin.goto(BASE + '/dashboard');
        await admin.goBack();
        await admin.getByRole('heading', { name: 'Accounts & Access' }).waitFor();
        assert.equal(await admin.locator('section[role="status"] code').count(), 0, 'Back navigation restored a credential');
        await admin.goForward();
        await admin.waitForURL(url => url.pathname === '/dashboard');
        await admin.goBack();
        await admin.getByRole('heading', { name: 'Accounts & Access' }).waitFor();
        assert.equal(await admin.locator('section[role="status"] code').count(), 0, 'Repeated navigation restored a credential');
        await admin.reload();
        await admin.getByRole('heading', { name: 'Accounts & Access' }).waitFor();
        assert.equal(await admin.locator('section[role="status"] code').count(), 0, 'Reload restored a credential');
        report.activationCustody = { historyExcluded: true, partialExcluded: true, backForwardExcluded: true, reloadExcluded: true };
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
    let recoveredSecret;
    await checkpoint('employee-recovery-reactivation-and-new-mfa', async () => {
        recoveredSecret = await redeem(employee, replacementCode, recoveryPassword);
        await noOverflow(employee, 'recovered employee mobile');
        const forbidden = await employee.request.get(BASE + '/admin', { maxRedirects: 0 });
        assert.equal(forbidden.status(), 403);
    });
    async function changePassword(page, currentPassword, nextPassword) {
        await page.getByLabel('Current password', { exact: true }).fill(currentPassword);
        await page.getByLabel('New password', { exact: true }).fill(nextPassword);
        await page.getByLabel('Confirm new password', { exact: true }).fill(nextPassword);
        await page.getByRole('button', { name: 'Update password', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('input[aria-label="Current password"]')?.value === '');
    }

    await checkpoint('g2a-privileged-real-mfa-password-change-and-old-session-denial', async () => {
        const secondContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const second = await secondContext.newPage();
        monitor(second);
        await signIn(second, 'qa.employee', recoveryPassword);
        await second.waitForURL(url => url.pathname === '/security/mfa/challenge');
        await second.goto(BASE + '/security/account');
        await second.waitForURL(url => url.pathname === '/security/mfa/challenge');
        await second.getByLabel('Authenticator code').fill(totp(recoveredSecret));
        await second.getByRole('button', { name: 'Verify and continue' }).click();
        await second.waitForURL(url => url.pathname === '/security/account');
        await employee.goto(BASE + '/dashboard');
        await employee.getByRole('button', { name: 'Open navigation', exact: true }).click();
        await employee.getByRole('link', { name: 'Account security', exact: true }).click();
        await employee.waitForURL(url => url.pathname === '/security/account');
        await noOverflow(employee, 'privileged password mobile');
        const next = crypto.randomBytes(20).toString('hex') + 'Aa1!';
        await changePassword(employee, recoveryPassword, next);
        await employee.goto(BASE + '/security/mfa');
        await employee.getByRole('heading', { name: 'Multi-factor authentication', exact: true }).waitFor();
        await second.goto(BASE + '/security/account');
        await second.waitForURL(url => url.pathname === '/login');
        await secondContext.close();
    });

    await checkpoint('g2a-ordinary-desktop-compact-mobile-password-csrf-and-session-revocation', async () => {
        const ordinaryContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const ordinary = await ordinaryContext.newPage();
        monitor(ordinary);
        const staleContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const stale = await staleContext.newPage();
        monitor(stale);
        await ordinary.goto(BASE + '/login');
        assert.equal(await ordinary.getByRole('checkbox', { name: /remember/i }).count(), 0);
        await signIn(ordinary, 'qa.ordinary', firstPassword);
        await ordinary.waitForURL(url => url.pathname === '/dashboard');
        await signIn(stale, 'qa.ordinary', firstPassword);
        await stale.waitForURL(url => url.pathname === '/dashboard');
        await ordinary.getByRole('link', { name: 'Account security', exact: true }).click();
        await ordinary.waitForURL(url => url.pathname === '/security/account');
        await noOverflow(ordinary, 'ordinary security desktop');
        await ordinary.getByRole('link', { name: 'Back to dashboard' }).click();
        await ordinary.waitForURL(url => url.pathname === '/dashboard');
        await ordinary.getByRole('button', { name: 'Collapse navigation' }).click();
        await ordinary.getByRole('link', { name: 'Account security', exact: true }).click();
        await ordinary.waitForURL(url => url.pathname === '/security/account');
        await ordinary.getByRole('link', { name: 'Back to dashboard' }).click();
        await ordinary.waitForURL(url => url.pathname === '/dashboard');
        await ordinary.setViewportSize({ width: 390, height: 844 });
        await ordinary.getByRole('button', { name: 'Open navigation', exact: true }).click();
        await ordinary.getByRole('link', { name: 'Account security', exact: true }).click();
        await ordinary.waitForURL(url => url.pathname === '/security/account');
        await noOverflow(ordinary, 'ordinary security mobile');
        // A separate synthetic candidate ensures the forged credential is never
        // the one intentionally installed by the subsequent legitimate change.
        const forgedPassword = crypto.randomBytes(20).toString('hex') + 'Aa1!';
        const next = crypto.randomBytes(20).toString('hex') + 'Aa1!';
        const beforeDeniedMutation = ordinaryMutationFingerprint();
        const forged = await ordinary.request.put(BASE + '/security/password', {
            headers: { Accept: 'application/json' },
            data: { current_password: firstPassword, password: forgedPassword, password_confirmation: forgedPassword },
            maxRedirects: 0,
        });
        // APIRequestContext shares the authenticated cookies but sends no
        // CSRF token/header or browser same-origin Fetch Metadata shortcut.
        // JSON negotiation preserves Laravel's native rejection status.
        assert.equal(forged.status(), 419, 'Password mutation without CSRF token must fail');
        assert.ok(beforeDeniedMutation === ordinaryMutationFingerprint(), 'Denied CSRF mutation changed persisted account or success audit');
        report.csrf = { tokenlessStatus: forged.status(), persistedSecurityStateUnchanged: true };

        // Prove the rejection did not install the forged credential. Use new
        // browser contexts, not the existing authenticated session or a mock.
        const deniedContext = await browser.newContext();
        const denied = await deniedContext.newPage();
        monitor(denied);
        try {
            await signIn(denied, 'qa.ordinary', forgedPassword);
            await denied.getByRole('alert').first().waitFor();
            await denied.waitForURL(url => url.pathname === '/login');
            await denied.goto(BASE + '/security/account');
            await denied.waitForURL(url => url.pathname === '/login');
            report.csrf.forgedPasswordDenied = true;
        } finally {
            await deniedContext.close();
        }
        const oldContext = await browser.newContext();
        const old = await oldContext.newPage();
        monitor(old);
        try {
            await signIn(old, 'qa.ordinary', firstPassword);
            await old.waitForURL(url => url.pathname === '/dashboard');
            await old.goto(BASE + '/security/account');
            await old.getByRole('heading', { name: 'Account security', exact: true }).waitFor();
            report.csrf.originalPasswordAccepted = true;
        } finally {
            await oldContext.close();
        }
        // Both existing sessions must remain eligible until a real change.
        await stale.goto(BASE + '/security/account');
        await stale.getByRole('heading', { name: 'Account security', exact: true }).waitFor();
        await ordinary.goto(BASE + '/security/account');
        await ordinary.getByRole('heading', { name: 'Account security', exact: true }).waitFor();
        report.csrf.existingSessionsPreserved = true;

        await changePassword(ordinary, firstPassword, next);
        await ordinary.goto(BASE + '/security/account');
        await ordinary.getByRole('heading', { name: 'Account security', exact: true }).waitFor();
        await stale.goto(BASE + '/security/account');
        await stale.waitForURL(url => url.pathname === '/login');
        await signIn(stale, 'qa.ordinary', firstPassword);
        await stale.getByRole('alert').first().waitFor();
        await signIn(stale, 'qa.ordinary', next);
        await stale.waitForURL(url => url.pathname === '/dashboard');
        report.csrf.legitimateChangeAndStaleSessionDenial = true;
        await ordinaryContext.close();
        await staleContext.close();
    });
    await checkpoint('g4-mobile-administrator-registration-and-desktop-ordinary-activation', async () => {
        await admin.setViewportSize({ width: 390, height: 844 });
        await admin.goto(BASE + '/admin');
        const form = admin.getByRole('form', { name: 'Employee registration' });
        await form.getByLabel('Full name', { exact: true }).fill('Synthetic Mobile Registered Person');
        await form.getByLabel('Department or office').selectOption({ index: 1 });
        await form.getByLabel('Position title').fill('Synthetic Staff');
        await form.getByLabel('Employee number (optional)').fill('QA-MOBILE-001');
        await form.getByRole('button', { name: 'Register employee', exact: true }).click();
        const section = admin.locator('section').filter({ has: admin.getByRole('heading', { name: 'Add user' }) }).first();
        const eligible = section.getByLabel('Eligible employee');
        const option = eligible.getByRole('option', { name: /Synthetic Mobile Registered Person/ });
        await option.waitFor({ state: 'attached' });
        await noOverflow(admin, 'mobile registration');
        await eligible.selectOption(await option.getAttribute('value'));
        await section.getByLabel('Portal role').selectOption('employee');
        await section.getByLabel('Portal username').fill('qa.mobile.ordinary');
        await section.getByRole('button', { name: 'Generate activation code' }).click();
        const mobileCode = await getPrivateCode(admin);
        await noOverflow(admin, 'mobile activation disclosure');
        await admin.locator('section[role="status"]').getByRole('button', { name: 'Dismiss', exact: true }).click();
        await admin.locator('section[role="status"] code').waitFor({ state: 'detached' });
        const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
        const desktop = await desktopContext.newPage();
        monitor(desktop);
        try {
            await desktop.goto(BASE + '/activate-account');
            await desktop.getByLabel('Activation code').fill(mobileCode);
            await desktop.getByLabel('Choose password').fill(firstPassword);
            await desktop.getByLabel('Confirm password').fill(firstPassword);
            await desktop.getByRole('button', { name: 'Activate account', exact: true }).click();
            await desktop.waitForURL(url => url.pathname === '/dashboard');
            await noOverflow(desktop, 'ordinary desktop activation');
            const forbidden = await desktop.request.get(BASE + '/admin', { maxRedirects: 0 });
            assert.equal(forbidden.status(), 403);
            const task = await desktop.request.get(BASE + '/tasks', { headers: { Accept: 'application/json' } });
            assert.equal(task.status(), 200);
        } finally {
            await desktopContext.close();
        }
        await admin.reload();
        await admin.locator('table tbody tr').filter({ hasText: '@qa.mobile.ordinary' }).waitFor();
    });
    if (fail.length) throw Error('Browser/server runtime error count: ' + fail.length);
    report.completed = true;
} catch (error) {
    report.errorStage = stageName;
    const kind = ['AssertionError', 'TimeoutError', 'Error', 'TypeError', 'ReferenceError'].includes(error?.name)
        ? error.name : 'CheckpointError';
    const location = String(error?.stack ?? '').match(/iam-pr48-onboarding\.mjs:(\d+):(\d+)/);
    report.runtimeFailures = [...fail, kind];
    report.failureLocation = location ? { line: Number(location[1]), column: Number(location[2]) } : null;
    // Assertions may include secrets. Emit scalar diagnostics only.
    report.assertionNumbers = Number.isFinite(error?.actual) && Number.isFinite(error?.expected)
        ? { actual: error.actual, expected: error.expected } : null;
    process.exitCode = 1;
} finally {
    await browser?.close().catch(() => {});
    await fs.mkdir('storage/app/qa', { recursive: true });
    await fs.writeFile(REPORT, JSON.stringify(report, null, 2));
    console.log('IAM_BROWSER_RECEIPT ' + JSON.stringify(report));
}
