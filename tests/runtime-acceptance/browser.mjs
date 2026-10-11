// RT-CI-001: REAL HTTP/Chromium acceptance against a disposable Laravel server.
// No cookies, passwords, TOTP seeds, request payloads, response bodies, user data or traces are serialized.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const backend = path.resolve(process.env.RTCI_BACKEND_DIR || '');
const { chromium } = createRequire(path.join(backend, 'package.json'))('playwright');
const base = 'http://127.0.0.1:8000';
const reportDir = path.resolve(process.env.RTCI_REPORT_DIR || './rtci-report');
const password = process.env.QA_DEMO_PASSWORD;
if (!password || process.env.APP_ENV !== 'local' || process.env.RTCI_BASE_URL !== base) throw new Error('RT-CI browser prerequisites are missing');
if (process.env.RUNNER_ENVIRONMENT !== 'github-hosted') throw new Error('RT-CI requires hosted runner');
fs.mkdirSync(reportDir, { recursive: true, mode: 0o700 });

const plannedCases = [
  'GUEST_PUBLIC_DESKTOP_MOBILE', 'GUEST_PROTECTED_REDIRECT', 'GUEST_TASK_401_JSON',
  'CSRF_LOGIN_419', 'CSRF_TASK_419_JSON', 'EMPLOYEE_LOGIN_DESKTOP',
  'EMPLOYEE_CALENDAR_NAV_DESKTOP', 'EMPLOYEE_LOGIN_MOBILE', 'EMPLOYEE_CALENDAR_NAV_MOBILE',
  'EMPLOYEE_ADMIN_DENIED_403', 'TASK_CREATE_201', 'TASK_INVALID_FIELDS_422',
  'TASK_OWNER_TRANSITIONS_200', 'ADMIN_LOGIN_MFA_DESKTOP', 'ADMIN_PROTECTED_PAGE',
  'TASK_CROSS_OWNER_404', 'ADMIN_LOGIN_MFA_MOBILE', 'MFA_EPOCH_RESET_REVOKES_ASSURANCE',
  'MFA_CROSS_SESSION_REVOCATION', 'CSRF_LOGOUT_419_AND_VALID_LOGOUT',
  'MFA_PENDING_TASK_403_JSON', 'MFA_ENROLL_BAD_TOTP_DENIED',
  'MFA_CHALLENGE_BAD_TOTP_DENIED', 'RATE_LIMIT_HTTP_429', 'RECOVERY_CODE_REPLAY',
];
const results = [];
let failed = false;
let browser;
const register = (name, status, detail = '') => {
  results.push({ name, status, ...(detail ? { detail } : {}) });
  if (status === 'FAIL') failed = true;
  console.log('RT-CI ' + name + ': ' + status);
};
async function check(name, fn) {
  try {
    await fn();
    register(name, 'PASS');
    return true;
  } catch {
    // Suppress raw error text because network exceptions may contain secret-bearing URLs/headers.
    register(name, 'FAIL', 'assertion-failed; inspect confidential runner logs locally, not artifacts');
    return false;
  }
}
const asPath = (url) => new URL(url).pathname;
const mfaTotp = (secret, stepOffset = 0) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of secret.toUpperCase().replace(/=|\s/g, '')) {
    const n = alphabet.indexOf(char);
    if (n < 0) throw new Error('invalid MFA material');
    bits += n.toString(2).padStart(5, '0');
  }
  const raw = Buffer.from(Array.from({ length: Math.floor(bits.length / 8) }, (_, i) => parseInt(bits.slice(i * 8, i * 8 + 8), 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000) + stepOffset));
  const digest = crypto.createHmac('sha1', raw).update(counter).digest();
  const off = digest[digest.length - 1] & 15;
  return ((digest.readUInt32BE(off) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
};
function deliberatelyInvalidTotp(secret) {
  const validWindow = new Set([-1, 0, 1].map(offset => mfaTotp(secret, offset)));
  const bad = ['000000', '111111', '222222', '333333'].find(value => !validWindow.has(value));
  assert.ok(bad);
  return bad;
}
async function requireCase(name, fn) {
  const passed = await check(name, fn);
  if (!passed) throw new Error('Security contract failed: ' + name);
}
async function newContext(viewport) {
  return browser.newContext({ viewport, baseURL: base, acceptDownloads: false, serviceWorkers: 'block' });
}
function monitor(page) {
  const errors = [];
  page.on('pageerror', () => errors.push('pageerror'));
  page.on('response', r => { if (r.status() >= 500) errors.push('server5xx'); });
  return errors;
}
async function login(page, role, otpSecret = null) {
  const r = await page.goto(base + '/login', { waitUntil: 'domcontentloaded', timeout: 20000 });
  assert.equal(r?.status(), 200);
  await page.getByLabel('Email').fill(role === 'admin' ? 'admin@talibon.demo' : 'employee@talibon.demo');
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL(url => ['/dashboard', '/security/mfa/enroll', '/security/mfa/challenge'].includes(url.pathname), { timeout: 20000 });
  if (role === 'employee') {
    assert.equal(asPath(page.url()), '/dashboard');
    return null;
  }
  assert.notEqual(asPath(page.url()), '/dashboard', 'admin password step bypassed MFA');
  const blocked = await page.context().request.get(base + '/dashboard', { maxRedirects: 0 });
  assert.equal(blocked.status(), 302);
  const redirect = blocked.headers().location || '';
  assert.match(redirect, /security\/mfa\/(?:enroll|challenge)/);
  if (otpSecret === null) {
    await requireCase('MFA_PENDING_TASK_403_JSON', async () => {
      const context = page.context();
      const read = await context.request.get(base + '/tasks', { maxRedirects: 0 });
      assert.equal(read.status(), 403);
      assert.match(read.headers()['content-type'] || '', /application\/json/);
      assert.equal((await read.json()).code, 'MFA_REQUIRED');
      const write = await requestJson(context, 'POST', '/tasks', { title: 'Must not create before MFA' });
      assert.equal(write.status(), 403);
      assert.equal((await write.json()).code, 'MFA_REQUIRED');
    });
  }
  if (asPath(page.url()) === '/security/mfa/enroll') {
    otpSecret = (await page.locator('code').first().innerText()).trim();
    if (!otpSecret) throw new Error('MFA enrollment material unavailable');
    await requireCase('MFA_ENROLL_BAD_TOTP_DENIED', async () => {
      await page.getByLabel('Six-digit verification code').fill(deliberatelyInvalidTotp(otpSecret));
      await page.getByRole('button', { name: /Confirm MFA enrollment/i }).click();
      await page.locator('span.text-red-600').first().waitFor({ state: 'visible', timeout: 12000 });
      assert.equal(asPath(page.url()), '/security/mfa/enroll');
      const r = await page.context().request.get(base + '/dashboard', { maxRedirects: 0 });
      assert.equal(r.status(), 302);
    });
    await page.getByLabel('Six-digit verification code').fill(mfaTotp(otpSecret));
    await page.getByRole('button', { name: /Confirm MFA enrollment/i }).click();
    await page.waitForURL(url => url.pathname === '/security/mfa/recovery-codes', { timeout: 20000 });
    // Recovery codes remain browser memory only; never read, copy, screenshot or artifact them.
    await page.getByRole('link', { name: /Continue to portal/i }).click();
    await page.waitForURL(url => url.pathname === '/dashboard', { timeout: 20000 });
  } else {
    assert.equal(asPath(page.url()), '/security/mfa/challenge');
    if (!otpSecret) throw new Error('missing in-memory TOTP for existing admin');
    await requireCase('MFA_CHALLENGE_BAD_TOTP_DENIED', async () => {
      await page.getByLabel('Authenticator code').fill(deliberatelyInvalidTotp(otpSecret));
      await page.getByRole('button', { name: /Verify and continue/i }).click();
      await page.locator('span.text-red-600').first().waitFor({ state: 'visible', timeout: 12000 });
      assert.equal(asPath(page.url()), '/security/mfa/challenge');
      const r = await page.context().request.get(base + '/dashboard', { maxRedirects: 0 });
      assert.equal(r.status(), 302);
    });
    await page.getByLabel('Authenticator code').fill(mfaTotp(otpSecret));
    await page.getByRole('button', { name: /Verify and continue/i }).click();
    await page.waitForURL(url => url.pathname === '/dashboard', { timeout: 20000 });
  }
  return otpSecret;
}
async function xsrfHeader(context) {
  const cookies = await context.cookies(base);
  const token = cookies.find(c => c.name === 'XSRF-TOKEN');
  assert.ok(token?.value);
  return { 'X-XSRF-TOKEN': decodeURIComponent(token.value), Accept: 'application/json' };
}
async function requestJson(context, method, endpoint, data = {}) {
  const headers = await xsrfHeader(context);
  return context.request.fetch(base + endpoint, { method, headers, data, maxRedirects: 0 });
}
const status = async (response, expected) => assert.equal(response.status(), expected);
const roles = {};
try {
  browser = await chromium.launch({ headless: true });
  await check('GUEST_PUBLIC_DESKTOP_MOBILE', async () => {
    for (const [key, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
      const ctx = await newContext(viewport);
      const page = await ctx.newPage();
      const r = await page.goto(base + '/login');
      await status(r, 200);
      await page.getByRole('button', { name: 'Sign In' }).waitFor();
      // Screenshot only anonymous login before any credential entry.
      await page.screenshot({ path: path.join(reportDir, 'guest-' + key + '.png'), animations: 'disabled' });
      await ctx.close();
    }
  });
  await check('GUEST_PROTECTED_REDIRECT', async () => {
    const ctx = await newContext({ width: 1440, height: 900 });
    const r = await ctx.request.get(base + '/dashboard', { maxRedirects: 0 });
    await status(r, 302);
    assert.match(r.headers().location || '', /login/);
    await ctx.close();
  });
  await check('GUEST_TASK_401_JSON', async () => {
    const ctx = await newContext({ width: 1440, height: 900 });
    const r = await ctx.request.get(base + '/tasks', { maxRedirects: 0 });
    await status(r, 401);
    assert.match(r.headers()['content-type'] || '', /application\/json/);
    await ctx.close();
  });
  await check('CSRF_LOGIN_419', async () => {
    const ctx = await newContext({ width: 1440, height: 900 });
    const r = await ctx.request.post(base + '/login', { form: { email: 'invalid@example.test', password: 'invalid' }, headers: { 'X-CSRF-TOKEN': 'wrong', Accept: 'application/json' }, maxRedirects: 0 });
    await status(r, 419);
    await ctx.close();
  });
  await check('CSRF_TASK_419_JSON', async () => {
    const ctx = await newContext({ width: 1440, height: 900 });
    const r = await ctx.request.post(base + '/tasks', { data: { title: 'Denied' }, headers: { 'X-CSRF-TOKEN': 'wrong', Accept: 'application/json' }, maxRedirects: 0 });
    await status(r, 419);
    assert.match(r.headers()['content-type'] || '', /application\/json/);
    await ctx.close();
  });
  for (const [key, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
    await check('EMPLOYEE_LOGIN_' + key.toUpperCase(), async () => {
      const context = await newContext(viewport), page = await context.newPage(), errors = monitor(page);
      await login(page, 'employee');
      await page.locator('#portal-content').waitFor();
      assert.equal(errors.length, 0, 'frontend error');
      roles['employee-' + key] = { context, page, errors };
    });
    if (roles['employee-' + key]) await check('EMPLOYEE_CALENDAR_NAV_' + key.toUpperCase(), async () => {
      const { page, errors } = roles['employee-' + key];
      const r = await page.goto(base + '/calendar', { waitUntil: 'domcontentloaded' });
      await status(r, 200);
      await page.locator('#portal-content').waitFor();
      assert.equal(errors.length, 0);
    });
  }
  if (roles['employee-desktop']) await check('EMPLOYEE_ADMIN_DENIED_403', async () => {
    const r = await roles['employee-desktop'].context.request.get(base + '/admin', { maxRedirects: 0 });
    await status(r, 403);
  });
  let employeeTaskId;
  if (roles['employee-desktop']) {
    await check('TASK_CREATE_201', async () => {
      const ctx = roles['employee-desktop'].context;
      const r = await requestJson(ctx, 'POST', '/tasks', { title: 'RT-CI synthetic task ' + crypto.randomUUID().slice(0, 8) });
      await status(r, 201);
      employeeTaskId = (await r.json()).data.id;
      assert.ok(Number.isInteger(employeeTaskId));
    });
    if (employeeTaskId) await check('TASK_INVALID_FIELDS_422', async () => {
      const r = await requestJson(roles['employee-desktop'].context, 'POST', '/tasks', { title: 'invalid', created_by_user_id: 999 });
      await status(r, 422);
    });
    if (employeeTaskId) await check('TASK_OWNER_TRANSITIONS_200', async () => {
      const ctx = roles['employee-desktop'].context;
      await status(await requestJson(ctx, 'POST', '/tasks/' + employeeTaskId + '/start'), 200);
      await status(await requestJson(ctx, 'POST', '/tasks/' + employeeTaskId + '/complete'), 200);
    });
  }
  let adminSecret;
  await check('ADMIN_LOGIN_MFA_DESKTOP', async () => {
    const context = await newContext({ width: 1440, height: 900 }), page = await context.newPage(), errors = monitor(page);
    adminSecret = await login(page, 'admin');
    assert.equal(errors.length, 0);
    roles.adminDesktop = { context, page, errors };
  });
  if (roles.adminDesktop) {
    await check('ADMIN_PROTECTED_PAGE', async () => {
      const r = await roles.adminDesktop.context.request.get(base + '/admin');
      await status(r, 200);
    });
    if (employeeTaskId) await check('TASK_CROSS_OWNER_404', async () => {
      const ctx = roles.adminDesktop.context;
      await status(await ctx.request.get(base + '/tasks/' + employeeTaskId, { maxRedirects: 0 }), 404);
      await status(await requestJson(ctx, 'POST', '/tasks/' + employeeTaskId + '/start'), 404);
    });
  }
  if (adminSecret) await check('ADMIN_LOGIN_MFA_MOBILE', async () => {
    const context = await newContext({ width: 390, height: 844 }), page = await context.newPage(), errors = monitor(page);
    await login(page, 'admin', adminSecret);
    await page.locator('#portal-content').waitFor();
    assert.equal(errors.length, 0);
    roles.adminMobile = { context, page, errors };
  });
  if (roles.adminDesktop) await check('MFA_EPOCH_RESET_REVOKES_ASSURANCE', async () => {
    const ctx = roles.adminDesktop.context;
    const r = await requestJson(ctx, 'POST', '/security/mfa/reset');
    assert.equal(r.status(), 302);
    const blocked = await ctx.request.get(base + '/dashboard', { maxRedirects: 0 });
    await status(blocked, 302);
    assert.match(blocked.headers().location || '', /security\/mfa\/enroll/);
  });
  if (roles['employee-desktop']) await check('CSRF_LOGOUT_419_AND_VALID_LOGOUT', async () => {
    const ctx = roles['employee-desktop'].context;
    await status(await ctx.request.post(base + '/logout', { headers: { 'X-CSRF-TOKEN': 'invalid', Accept: 'application/json' }, maxRedirects: 0 }), 419);
    await status(await ctx.request.get(base + '/dashboard', { maxRedirects: 0 }), 200);
    await status(await requestJson(ctx, 'POST', '/logout'), 302);
    await status(await ctx.request.get(base + '/dashboard', { maxRedirects: 0 }), 302);
  });
  if (roles.adminMobile) await check('MFA_CROSS_SESSION_REVOCATION', async () => {
    const blocked = await roles.adminMobile.context.request.get(base + '/dashboard', { maxRedirects: 0 });
    await status(blocked, 302);
    assert.match(blocked.headers().location || '', /security\/mfa\/(?:enroll|challenge)/);
  });
  register('RATE_LIMIT_HTTP_429', 'NOT_RUN', 'canonical Laravel uses validation errors; separate throttling review needed');
  register('RECOVERY_CODE_REPLAY', 'NOT_RUN', 'never serialize recovery codes; bounded fixture/helper needed');
} finally {
  for (const v of Object.values(roles)) await v.context?.close().catch(() => {});
  await browser?.close().catch(() => {});
  for (const name of plannedCases) {
    if (!results.some(row => row.name === name)) register(name, 'NOT_RUN', 'blocked by an upstream prerequisite or assertion failure');
  }
  const summary = { schemaVersion: 1, source: 'real-http-chromium', target: 'localhost-disposable-laravel',
    results, counts: { passed: results.filter(x => x.status === 'PASS').length, failed: results.filter(x => x.status === 'FAIL').length, notRun: results.filter(x => x.status === 'NOT_RUN').length },
    completed: true };
  fs.writeFileSync(path.join(reportDir, 'browser-cases.json'), JSON.stringify(summary, null, 2) + '\n', { mode: 0o600 });
}
if (failed) process.exitCode = 1;
