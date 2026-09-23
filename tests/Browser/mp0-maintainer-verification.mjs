import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:8000';
const PASSWORD = process.env.QA_DEMO_PASSWORD;
if (!PASSWORD) throw new Error('QA_DEMO_PASSWORD is required');

const OUT = 'storage/app/qa/mp0-maintainer';
const report = {
  candidate: '6718d9c8cc1dda090af649da76228f818822dae8',
  generatedAt: new Date().toISOString(),
  checks: [],
  screenshots: [],
};

function check(name, ok, details = '') {
  const row = { name, ok: Boolean(ok), details: String(details || '') };
  report.checks.push(row);
  console.log(`${row.ok ? 'PASS' : 'FAIL'} | ${name}${row.details ? ` | ${row.details}` : ''}`);
}

function decodeBase32(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of input.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase()) {
    const i = alphabet.indexOf(char);
    if (i < 0) throw new Error('Invalid base32 MFA secret');
    bits += i.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}

function totp(secret) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = crypto.createHmac('sha1', decodeBase32(secret)).update(counter).digest();
  const offset = digest.at(-1) & 0x0f;
  const value = ((digest[offset] & 0x7f) << 24)
    | (digest[offset + 1] << 16)
    | (digest[offset + 2] << 8)
    | digest[offset + 3];
  return String(value % 1_000_000).padStart(6, '0');
}

async function screenshot(page, name) {
  await fs.mkdir(OUT, { recursive: true });
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path, fullPage: false, animations: 'disabled' });
  report.screenshots.push(path);
}

async function loginAndEnroll(page, email) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await Promise.all([
    page.waitForURL((url) => ['/dashboard', '/security/mfa/enroll', '/security/mfa/challenge'].includes(url.pathname)),
    page.getByRole('button', { name: 'Sign In' }).click(),
  ]);

  if (new URL(page.url()).pathname === '/security/mfa/enroll') {
    const secret = (await page.locator('code').first().innerText()).trim();
    await page.getByLabel('Six-digit verification code').fill(totp(secret));
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/security/mfa/recovery-codes'),
      page.getByRole('button', { name: /Confirm MFA enrollment/i }).click(),
    ]);
    await Promise.all([
      page.waitForURL((url) => url.pathname === '/dashboard'),
      page.getByRole('link', { name: /Continue to portal/i }).click(),
    ]);
  }

  check(`${email}: authenticated`, new URL(page.url()).pathname === '/dashboard', page.url());
}

function threadScroller(page, channel) {
  return page.locator(`[aria-label="${channel} coordination history and live messages"]`).first();
}

async function scrollMetrics(locator) {
  return locator.evaluate((el) => ({
    scrollTop: el.scrollTop,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    distanceFromBottom: el.scrollHeight - el.scrollTop - el.clientHeight,
  }));
}

async function setScrollTop(locator, value) {
  await locator.evaluate((el, top) => {
    el.scrollTop = top;
    el.dispatchEvent(new Event('scroll', { bubbles: true }));
  }, value);
  await new Promise((resolve) => setTimeout(resolve, 120));
}

async function openChannel(page, channel, messageId = null) {
  const params = new URLSearchParams({ channel, view: 'thread' });
  if (messageId) params.set('message', messageId);
  await page.goto(`${BASE}/messages?${params}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: channel, exact: true }).waitFor({ state: 'visible' });
  await page.getByText('Live prototype messages', { exact: true }).waitFor({ state: 'visible' });
  await page.waitForTimeout(900);
}

async function sendMessage(page, body) {
  const box = page.getByLabel('Message', { exact: true });
  await box.fill(body);
  await box.press('Enter');
  await page.getByText(body, { exact: true }).last().waitFor({ state: 'visible', timeout: 8000 });
}

async function verifyDocumentOrder(page) {
  const order = await page.evaluate(() => {
    const older = document.getElementById('older-coordination-title');
    const live = document.getElementById('live-prototype-title');
    const composer = document.getElementById('prototype-message-body')?.closest('form');
    if (!older || !live || !composer) return null;
    const olderBeforeLive = Boolean(older.compareDocumentPosition(live) & Node.DOCUMENT_POSITION_FOLLOWING);
    const liveBeforeComposer = Boolean(live.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING);
    return { olderBeforeLive, liveBeforeComposer };
  });
  check('visual order: older -> live -> composer', Boolean(order?.olderBeforeLive && order?.liveBeforeComposer), JSON.stringify(order));
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const contextA = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const contextB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    await loginAndEnroll(pageA, 'engineering@talibon.demo');

    // 1. First visit: no saved position, no highlight.
    await openChannel(pageA, 'Department Heads');
    await verifyDocumentOrder(pageA);
    const firstScroller = threadScroller(pageA, 'Department Heads');
    const first = await scrollMetrics(firstScroller);
    check('first visit lands/follows near live messaging area', first.distanceFromBottom <= 120, JSON.stringify(first));
    await screenshot(pageA, '01-first-visit-mobile');

    // 2. Saved-position restore using the same mounted workspace on mobile.
    const maxScroll = Math.max(0, first.scrollHeight - first.clientHeight);
    const target = Math.max(0, Math.min(Math.round(maxScroll * 0.35), Math.max(0, maxScroll - 220)));
    await setScrollTop(firstScroller, target);
    const saved = (await scrollMetrics(firstScroller)).scrollTop;
    await pageA.getByRole('button', { name: 'Back to conversations' }).click();
    await pageA.getByRole('button', { name: /General/ }).click();
    await pageA.getByRole('heading', { name: 'General', exact: true }).waitFor({ state: 'visible' });
    await pageA.getByRole('button', { name: 'Back to conversations' }).click();
    await pageA.getByRole('button', { name: /Department Heads/ }).click();
    await pageA.getByRole('heading', { name: 'Department Heads', exact: true }).waitFor({ state: 'visible' });
    await pageA.waitForTimeout(300);
    const restored = (await scrollMetrics(threadScroller(pageA, 'Department Heads'))).scrollTop;
    check('saved-position restore', Math.abs(restored - saved) <= 8, `saved=${saved} restored=${restored}`);

    // 3. Highlighted static record should override first-visit bottom behavior and remain stable through polling.
    await openChannel(pageA, 'Department Heads', 'MSG-26-002');
    const highlighted = pageA.locator('#message-MSG-26-002');
    await highlighted.waitFor({ state: 'visible' });
    const highlightVisibility = await pageA.evaluate(() => {
      const item = document.getElementById('message-MSG-26-002');
      const scroller = document.querySelector('[aria-label="Department Heads coordination history and live messages"]');
      if (!item || !scroller) return null;
      const a = item.getBoundingClientRect();
      const b = scroller.getBoundingClientRect();
      const centerDelta = Math.abs((a.top + a.height / 2) - (b.top + b.height / 2));
      return { visible: a.bottom > b.top && a.top < b.bottom, centerDelta, viewport: b.height };
    });
    check('highlighted static record is visible/centered', Boolean(highlightVisibility?.visible && highlightVisibility.centerDelta <= highlightVisibility.viewport * 0.45), JSON.stringify(highlightVisibility));
    const highlightScroller = threadScroller(pageA, 'Department Heads');
    const highlightBefore = (await scrollMetrics(highlightScroller)).scrollTop;
    await pageA.waitForTimeout(3500);
    const highlightAfter = (await scrollMetrics(highlightScroller)).scrollTop;
    check('highlight survives idle polling without bottom yank', Math.abs(highlightAfter - highlightBefore) <= 8, `before=${highlightBefore} after=${highlightAfter}`);
    await screenshot(pageA, '02-highlighted-static-record');

    // Switch to desktop for two-account interaction.
    await pageA.setViewportSize({ width: 1280, height: 800 });
    await openChannel(pageA, 'Department Heads');
    const scrollerA = threadScroller(pageA, 'Department Heads');

    // 4. Failed send must not change scroll position and must retain text.
    const m0 = await scrollMetrics(scrollerA);
    await setScrollTop(scrollerA, Math.min(100, Math.max(0, m0.scrollHeight - m0.clientHeight)));
    const failedBefore = (await scrollMetrics(scrollerA)).scrollTop;
    let aborted = false;
    await pageA.route('**/messages/prototype/messages', async (route) => {
      if (!aborted && route.request().method() === 'POST') {
        aborted = true;
        await route.abort();
      } else {
        await route.continue();
      }
    });
    const failedBody = 'Intentional failed send';
    await pageA.getByLabel('Message', { exact: true }).fill(failedBody);
    await pageA.getByLabel('Message', { exact: true }).press('Enter');
    await pageA.getByText('Message was not sent. Keep the text and try again.', { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
    const failedAfter = (await scrollMetrics(scrollerA)).scrollTop;
    const failedRetained = await pageA.getByLabel('Message', { exact: true }).inputValue();
    check('failed send does not change scroll position', Math.abs(failedAfter - failedBefore) <= 8, `before=${failedBefore} after=${failedAfter}`);
    check('failed send retains composer text', failedRetained === failedBody, `value=${failedRetained}`);
    await pageA.unroute('**/messages/prototype/messages');
    await pageA.getByLabel('Message', { exact: true }).fill('');

    // 5. Own send follows to bottom and shows real identity.
    await setScrollTop(scrollerA, 0);
    await sendMessage(pageA, 'Budget files are ready.');
    const ownMetrics = await scrollMetrics(scrollerA);
    const ownArticle = pageA.locator('article').filter({ hasText: 'Budget files are ready.' }).last();
    const ownText = await ownArticle.innerText();
    check('own-send follow', ownMetrics.distanceFromBottom <= 120, JSON.stringify(ownMetrics));
    check('own-send real User A identity', ownText.includes('Maria Santos') && ownText.includes('You'), ownText);
    check('own-send composer clears', (await pageA.getByLabel('Message', { exact: true }).inputValue()) === '', 'composer value checked');
    await screenshot(pageA, '03-own-send-desktop');

    // Authenticate User B and verify the persisted User A message.
    await loginAndEnroll(pageB, 'budget@talibon.demo');
    await openChannel(pageB, 'Department Heads');
    const aMessageVisibleToB = await pageB.getByText('Budget files are ready.', { exact: true }).last().isVisible();
    check('two-account: User B sees User A persisted message', aMessageVisibleToB, 'Budget files are ready.');

    // 6. Near-bottom polling follow.
    await setScrollTop(scrollerA, (await scrollMetrics(scrollerA)).scrollHeight);
    await sendMessage(pageB, 'Received.');
    await pageA.getByText('Received.', { exact: true }).last().waitFor({ state: 'visible', timeout: 9000 });
    const nearBottomAfterPoll = await scrollMetrics(scrollerA);
    check('near-bottom polling follow', nearBottomAfterPoll.distanceFromBottom <= 120, JSON.stringify(nearBottomAfterPoll));
    await screenshot(pageA, '04-near-bottom-poll-follow');

    // 7. Scrolled-up no-yank behavior.
    await setScrollTop(scrollerA, 0);
    const noYankBefore = (await scrollMetrics(scrollerA)).scrollTop;
    await sendMessage(pageB, 'Second polling test.');
    await pageA.getByText('Second polling test.', { exact: true }).last().waitFor({ state: 'visible', timeout: 9000 });
    const noYankAfter = (await scrollMetrics(scrollerA)).scrollTop;
    check('scrolled-up incoming poll does not yank', Math.abs(noYankAfter - noYankBefore) <= 8, `before=${noYankBefore} after=${noYankAfter}`);
    await screenshot(pageA, '05-scrolled-up-no-yank');

    // Highlighted static record + real incoming poll must also preserve reading position.
    await openChannel(pageA, 'Department Heads', 'MSG-26-002');
    const highlightedLiveScroller = threadScroller(pageA, 'Department Heads');
    const highlightedPollBefore = (await scrollMetrics(highlightedLiveScroller)).scrollTop;
    await sendMessage(pageB, 'Highlighted polling test.');
    await pageA.getByText('Highlighted polling test.', { exact: true }).last().waitFor({ state: 'visible', timeout: 9000 });
    const highlightedPollAfter = (await scrollMetrics(highlightedLiveScroller)).scrollTop;
    check('highlighted static record resists incoming polling yank', Math.abs(highlightedPollAfter - highlightedPollBefore) <= 8, `before=${highlightedPollBefore} after=${highlightedPollAfter}`);

    // 8. Refresh persistence.
    await openChannel(pageA, 'Department Heads');
    await pageA.reload({ waitUntil: 'domcontentloaded' });
    await pageA.getByText('Live prototype messages', { exact: true }).waitFor({ state: 'visible' });
    const persistedBodies = ['Budget files are ready.', 'Received.', 'Second polling test.', 'Highlighted polling test.'];
    for (const body of persistedBodies) {
      const present = await pageA.getByText(body, { exact: true }).last().isVisible();
      check(`refresh persistence: ${body}`, present, body);
    }

    // 9. Channel isolation.
    await openChannel(pageA, 'General');
    await sendMessage(pageA, 'General isolation test.');
    await openChannel(pageA, 'MPDO Planning');
    const leaked = await pageA.getByText('General isolation test.', { exact: true }).count();
    check('channel isolation: General message absent from MPDO Planning', leaked === 0, `count=${leaked}`);
    await openChannel(pageA, 'General');
    const persistedGeneral = await pageA.getByText('General isolation test.', { exact: true }).last().isVisible();
    check('channel isolation: General message persists in General', persistedGeneral, 'General isolation test.');

    // Final mobile evidence.
    await pageA.setViewportSize({ width: 390, height: 844 });
    await openChannel(pageA, 'Department Heads');
    await screenshot(pageA, '06-mobile-final');

    // Dark-mode evidence: use existing appearance control if present.
    const darkButton = pageA.getByRole('button', { name: 'Dark', exact: true }).first();
    if (await darkButton.count()) {
      await darkButton.click();
      await pageA.waitForTimeout(250);
      await screenshot(pageA, '07-mobile-dark');
      check('dark-mode evidence captured', true, '07-mobile-dark.png');
    } else {
      check('dark-mode evidence captured', false, 'Dark appearance control not found');
    }
  } catch (error) {
    check('browser verification completed without harness exception', false, error?.stack || error?.message || String(error));
  } finally {
    await browser.close();
    await fs.writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 2));
  }

  const failures = report.checks.filter((row) => !row.ok);
  console.log(`MP0 verification checks: ${report.checks.length}; failures: ${failures.length}`);
  if (failures.length) process.exitCode = 1;
}

await main();
