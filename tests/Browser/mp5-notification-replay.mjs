import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:8000';
const PASSWORD = process.env.QA_DEMO_PASSWORD;
const EXPECTED_SHA = process.env.QA_EXPECTED_SHA;
const EMAIL = process.env.QA_NOTIFICATION_EMAIL || 'employee@talibon.demo';
const REPORT = 'storage/app/qa/mp5-notification-replay-report.json';

if (!PASSWORD || !EXPECTED_SHA) {
  throw new Error('QA_DEMO_PASSWORD and QA_EXPECTED_SHA are required');
}

const runId = Date.now();
const existingKey = `mp5-notification-existing-${runId}`;
const newKey = `mp5-notification-new-${runId}`;
const existingTitle = `MP5 existing transaction notification ${runId}`;
const newTitle = `MP5 new transaction notification ${runId}`;

const state = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  git: { expectedSha: EXPECTED_SHA, actualSha: '', exactHead: false },
  environment: null,
  database: null,
  checks: {},
  counts: { pageerrors: 0, server5xx: 0, navigationFailures: 0 },
  failure: null,
  completed: false,
};

const writeReport = async () => {
  await fs.mkdir('storage/app/qa', { recursive: true });
  await fs.writeFile(REPORT, JSON.stringify(state, null, 2));
};

function php(code) {
  return execFileSync('php', ['artisan', 'tinker', `--execute=${code}`], {
    encoding: 'utf8',
    env: process.env,
  }).trim();
}

function phpString(value) {
  return JSON.stringify(String(value));
}

function assertIsolatedTestingDatabase() {
  const output = php(
    'echo "ENV=".app()->environment()." DB=".DB::connection()->getDatabaseName();',
  );
  const match = output.match(/ENV=([^\\s]+) DB=([^\\s]+)/);
  if (!match) throw new Error(`Unable to resolve isolated test database: ${output}`);

  state.environment = match[1];
  state.database = match[2];

  if (state.environment !== 'testing') {
    throw new Error(`Refusing notification injection outside APP_ENV=testing (observed ${state.environment})`);
  }
  if (!/(test|qa|mp5|h1)/i.test(state.database)) {
    throw new Error(`Refusing notification injection into non-test database ${state.database}`);
  }
}

function injectNotification(eventKey, title, ageSeconds = 0) {
  const code = [
    `$user=App\\Models\\User::query()->where('email',${phpString(EMAIL)})->firstOrFail();`,
    `$notification=app(App\\Services\\PlatformNotificationService::class)->notifyUser($user,[`,
    `'event_key'=>${phpString(eventKey)},`,
    `'source_domain'=>'transaction',`,
    `'source_type'=>App\\Models\\WorkflowTransaction::class,`,
    `'priority'=>'action_required',`,
    `'title'=>${phpString(title)},`,
    `'message'=>${phpString('Synthetic MP5 notification lifecycle proof')},`,
    `'action_url'=>'/transactions',`,
    `]);`,
    ageSeconds > 0
      ? `$at=now()->subSeconds(${ageSeconds});$notification->forceFill(['created_at'=>$at,'updated_at'=>$at])->saveQuietly();`
      : '',
    'echo $notification->id;',
  ].join('');

  const id = Number.parseInt(php(code), 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`Notification injection failed for ${eventKey}`);
  }
  return id;
}

async function ready(page) {
  await page.waitForFunction(() => {
    const root = document.getElementById('app');
    const body = document.body?.innerText?.replace(/\\s+/g, ' ').trim() || '';
    return document.readyState !== 'loading'
      && !!root
      && root.childElementCount > 0
      && body.length >= 20;
  }, null, { timeout: 10000 });
}

function watch(page) {
  page.on('pageerror', () => { state.counts.pageerrors++; });
  page.on('response', (response) => {
    if (response.status() >= 500) state.counts.server5xx++;
  });
  page.on('requestfailed', (request) => {
    if (request.isNavigationRequest()) state.counts.navigationFailures++;
  });
}

async function login(page) {
  const response = await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  if (response?.status() !== 200) throw new Error(`Login page returned ${response?.status()}`);
  await ready(page);

  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PASSWORD);
  await Promise.all([
    page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 15000 }),
    page.getByRole('button', { name: 'Sign In' }).click(),
  ]);
  await ready(page);
}

async function notificationFeedSettled(page) {
  await page.waitForResponse(
    (response) => response.url().includes('/notifications/feed') && response.status() === 200,
    { timeout: 10000 },
  ).catch(() => null);
  await page.waitForTimeout(250);
}

async function assertNoLiveAlert(page, label) {
  const count = await page.locator('[role="status"][aria-live="polite"]').count();
  if (count !== 0) throw new Error(`${label}: unexpected live notification alert`);
}

async function navigateViaPortal(page, href) {
  const link = page.locator(`a[href="${href}"]`).first();
  if (!await link.isVisible().catch(() => false)) {
    throw new Error(`Portal navigation link not visible: ${href}`);
  }

  await Promise.all([
    page.waitForURL((url) => url.pathname === href, { timeout: 15000 }),
    link.click(),
  ]);
  await ready(page);
  await notificationFeedSettled(page);
}

async function openNotificationHistory(page) {
  const button = page.getByRole('button', { name: /Open notifications/i });
  await button.click();
  await page.locator('#portal-notifications').waitFor({ state: 'visible', timeout: 5000 });
}

async function main() {
  state.git.actualSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  state.git.exactHead = state.git.actualSha === EXPECTED_SHA;
  if (!state.git.exactHead) {
    throw new Error(`Exact-head mismatch: expected ${EXPECTED_SHA}, observed ${state.git.actualSha}`);
  }

  assertIsolatedTestingDatabase();

  injectNotification(existingKey, existingTitle, 30);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  watch(page);

  try {
    await login(page);
    await notificationFeedSettled(page);

    await assertNoLiveAlert(page, 'initial historical baseline');
    state.checks.existingHistoryDoesNotInitialToast = true;

    await openNotificationHistory(page);
    await page.getByText(existingTitle, { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
    state.checks.existingHistoryVisibleInBell = true;
    await page.getByRole('button', { name: 'Close notifications' }).click();

    for (const href of ['/transactions', '/records', '/dashboard']) {
      await navigateViaPortal(page, href);
      await assertNoLiveAlert(page, `historical navigation ${href}`);
    }
    state.checks.existingHistoryDoesNotReplayAcrossNavigation = true;

    injectNotification(newKey, newTitle);

    const liveAlert = page.locator('[role="status"][aria-live="polite"]');
    await liveAlert.getByText(newTitle, { exact: true }).waitFor({ state: 'visible', timeout: 12000 });
    state.checks.genuinelyNewNotificationAlerts = true;

    await liveAlert.getByRole('button', { name: 'Dismiss notification' }).click();
    await liveAlert.waitFor({ state: 'detached', timeout: 5000 }).catch(async () => {
      if (await liveAlert.count()) throw new Error('Live notification did not dismiss');
    });

    for (const href of ['/transactions', '/records', '/dashboard']) {
      await navigateViaPortal(page, href);
      await assertNoLiveAlert(page, `new-notification navigation ${href}`);
    }
    state.checks.newNotificationDoesNotReplayAcrossNavigation = true;

    await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
    await ready(page);
    await notificationFeedSettled(page);
    await assertNoLiveAlert(page, 'direct reload');
    state.checks.directReloadDoesNotReplay = true;

    await openNotificationHistory(page);
    await page.getByText(existingTitle, { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
    await page.getByText(newTitle, { exact: true }).waitFor({ state: 'visible', timeout: 5000 });
    state.checks.historyRetainsBothNotifications = true;

    state.checks.runtimeClean = state.counts.pageerrors === 0
      && state.counts.server5xx === 0
      && state.counts.navigationFailures === 0;

    state.completed = Object.values(state.checks).every(Boolean);
    if (!state.completed) {
      throw new Error(`MP5 notification lifecycle checks failed: ${JSON.stringify(state.checks)}`);
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  await writeReport();
  console.log(`MP5_NOTIFICATION_REPLAY_QA_PASS sha=${state.git.actualSha}`);
}

main().catch(async (error) => {
  state.failure = { message: String(error?.message || error) };
  await writeReport().catch(() => {});
  console.error(`MP5_NOTIFICATION_REPLAY_QA_FAIL ${state.failure.message}`);
  process.exitCode = 1;
});
