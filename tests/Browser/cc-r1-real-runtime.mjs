/**
 * CC-R1: REAL Laravel/Inertia + PostgreSQL16 + Chromium runtime acceptance.
 * Source: frontend PR #35. No page.route, HAR replay, mock endpoints or fixture mounts.
 * Run from a disposable assembled backend + an independently pinned frontend source.
 * The exact combined backend SHA is intentionally NOT hardcoded before acceptance.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright';

const FRONTEND_SHA = '431fe2e19daf41138791d1dbad2cbeedc5dbff42';
const SOURCE_BACKEND_SHA = 'd99285f96b0bbcfd4156139c4fc01e3db62ed26b';
const FRONTEND_REPO = 'Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE';
const BACKEND_REPO = 'Project-Intra-Smithy/Talibon-Sales-Prototype';
const SHA = /^[a-f0-9]{40}$/;
const env = process.env;
const results = {
  mission: 'CC-FRONTEND-RUNTIME-INTEGRATION-R1',
  status: 'BLOCKED',
  timestamp: new Date().toISOString(),
  source: { frontend: FRONTEND_SHA, backendBaseline: SOURCE_BACKEND_SHA, actualBackend: null },
  runtime: {}, cases: [], http: [], screenshots: [], errors: [],
};
const success = (name, evidence = {}) => results.cases.push({ name, result: 'PASS', ...evidence });
const block = (message) => { const error = new Error(message); error.disposition = 'BLOCKED'; throw error; };
const required = (name) => { const value = env[name]; if (!value?.trim()) block('Missing required ' + name); return value; };
const run = (cmd, args, cwd) => execFileSync(cmd, args, {
  cwd, encoding: 'utf8', env, timeout: 30000, maxBuffer: 1024 * 1024,
}).trim();

let browser, contextA, contextB, pageA, pageB, output, backendDir, origin;
let pageErrors = [];
async function screenshot(page, name) {
  const target = join(output, name + '.png');
  await page.screenshot({ path: target, fullPage: false });
  results.screenshots.push(name + '.png');
}
function watch(page, actor) {
  page.on('pageerror', (error) => {
    pageErrors.push(actor + ': ' + String(error.message).slice(0, 300));
  });
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname;
    if (/^\/(tasks|login|logout|dashboard|transactions|calendar|notifications|messages|documents|correspondence)/.test(path))
      results.http.push({ actor, method: response.request().method(), path, status: response.status() });
  });
  page.on('requestfailed', (request) => {
    if (!request.failure()?.errorText?.includes('ERR_ABORTED')) {
      results.errors.push({ actor, path: new URL(request.url()).pathname, reason: 'request_failed' });
    }
  });
}
function php(code, overrides = {}) {
  return execFileSync('php', ['-r', code], {
    cwd: backendDir, encoding: 'utf8',
    env: { ...env, ...overrides }, timeout: 30000, maxBuffer: 1024 * 1024,
  }).trim();
}
const PHP_BOOT = [
  "require 'vendor/autoload.php';",
  "$app = require 'bootstrap/app.php';",
  "$app->make(\\Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();",
].join('');
function pgPreflight() {
  const code = PHP_BOOT + [
    "$db = \\Illuminate\\Support\\Facades\\DB::connection();",
    "$version = (int) $db->selectOne('SHOW server_version_num')->server_version_num;",
    "$users = \\App\\Models\\User::query()->whereIn('email',[getenv('CC_RT_A_EMAIL'),getenv('CC_RT_B_EMAIL')])->with('employee.department')->get();",
    "$actors = $users->map(fn ($u) => ['id'=>$u->id,'email'=>$u->email,'active'=>(bool)$u->is_active,",
    " 'employee_status'=>$u->employee?->employment_status,'office_active'=>$u->employee?->department?->is_active])->values()->all();",
    "echo json_encode(['environment'=>app()->environment(),'driver'=>$db->getDriverName(),",
    " 'database'=>$db->getDatabaseName(),'postgresVersion'=>$version,'actors'=>$actors],JSON_THROW_ON_ERROR);",
  ].join('');
  const value = JSON.parse(php(code));
  if (value.environment !== 'testing') block('Laravel APP_ENV must equal testing');
  if (value.driver !== 'pgsql' || value.postgresVersion < 160000 || value.postgresVersion >= 170000)
    block('A genuine PostgreSQL16 database is required');
  if (!/(test|qa|disposable|acceptance)/i.test(value.database))
    block('Database is not explicitly named as disposable test/QA');
  assert.equal(value.actors.length, 2, 'Both disposable users must exist');
  assert.notEqual(value.actors[0].id, value.actors[1].id, 'Accounts must be distinct');
  for (const actor of value.actors) {
    assert.equal(actor.active, true, 'Active account required: ' + actor.email);
    assert.equal(actor.employee_status, 'active', 'Active employment required');
    assert.equal(actor.office_active, true, 'Active department required');
  }
  results.runtime.database = {
    driver: value.driver, version: value.postgresVersion,
    name: value.database, environment: value.environment,
    distinctActors: true,
  };
  success('POSTGRES16_DISPOSABLE_PREFLIGHT');
}
function dbTask(id) {
  const code = PHP_BOOT + [
    "$task = \\App\\Models\\Task::query()->findOrFail((int)getenv('CC_RT_TASK_ID'));",
    "$events = \\App\\Models\\TaskEvent::query()->where('task_id',$task->id)->orderBy('id')->get(['action','previous_state','new_state'])->toArray();",
    "$owner = \\App\\Models\\User::query()->where('email',getenv('CC_RT_A_EMAIL'))->firstOrFail();",
    "echo json_encode(['id'=>$task->id,'title'=>$task->title,'state'=>$task->state,",
    " 'kind'=>$task->task_kind,'created_by_owner'=>(int)$task->created_by_user_id===(int)$owner->id,",
    " 'assigned_to_user_id'=>$task->assigned_to_user_id,'events'=>$events],JSON_THROW_ON_ERROR);",
  ].join('');
  return JSON.parse(php(code, { CC_RT_TASK_ID: String(id) }));
}
function assertDb(task, expected, actions) {
  assert.equal(task.state, expected, 'PostgreSQL Task state must equal browser readback');
  assert.equal(task.kind, 'individual');
  assert.equal(task.created_by_owner, true);
  assert.equal(task.assigned_to_user_id, null);
  assert.deepEqual(task.events.map(x => x.action), actions, 'Persisted Task event history mismatch');
}
async function liveJson(page, path, options = {}) {
  return page.evaluate(async ({ path, options }) => {
    const response = await fetch(path, {
      method: options.method || 'GET', credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(options.method ? {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      } : {}) },
    });
    return { status: response.status, body: response.headers.get('content-type')?.includes('application/json')
      ? await response.json() : null };
  }, { path, options });
}
async function login(page, email, password) {
  const response = await page.goto(origin + '/login', { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200, 'Real Laravel login screen required');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => url.pathname === '/dashboard', { timeout: 20000 });
  await page.getByRole('heading', { name: 'Personal Tasks' }).waitFor();
}
async function inertia(page, url, component) {
  const response = await page.goto(origin + url, { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200, url + ' must render HTTP 200');
  // Inertia Laravel v3 embeds bootstrap JSON in a script[data-page="app"].
  // Older Inertia versions use #app[data-page]. Read the genuine navigation
  // HTTP body before hydration and require the real React screen afterward.
  const raw = await page.evaluate(
    (html) => {
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      return parsed.querySelector('script[data-page="app"][type="application/json"]')?.textContent
        ?? parsed.querySelector('#app[data-page]')?.getAttribute('data-page')
        ?? null;
    },
    await response.text(),
  );
  assert.ok(raw, url + ' must contain genuine Laravel Inertia page props');
  const data = JSON.parse(raw);
  assert.equal(data.component, component, 'Unexpected Laravel Inertia component for ' + url);
  assert.equal(typeof data.props, 'object');
  assert.ok(data.props.auth?.user?.id > 0, 'Authenticated identity missing in Inertia props');
  await page.locator('#portal-content').waitFor({ state: 'attached' });
  return data.props;
}
async function taskList(page, state) {
  const response = await liveJson(page, '/tasks?state=' + state + '&per_page=50&page=1');
  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body?.data), 'Task list must be server JSON');
  return response.body.data;
}
async function taskDetail(page, id) {
  const response = await liveJson(page, '/tasks/' + id);
  assert.equal(response.status, 200);
  assert.equal(response.body?.data?.id, id);
  return response.body.data;
}
async function stateTab(page, name) {
  await page.getByRole('button', { name, exact: true }).click();
}
async function openTask(page, title) {
  await page.getByRole('button', { name: new RegExp(title) }).first().click();
  await page.getByRole('region', { name: 'Personal Task detail' }).waitFor();
}
async function main() {
  backendDir = resolve(required('CC_RT_BACKEND_DIR'));
  output = resolve(required('CC_RT_REPORT_DIR'));
  origin = required('CC_RT_BASE_URL').replace(/\/$/, '');
  const targetBackend = required('CC_RT_BACKEND_SHA');
  const manifestPath = resolve(required('CC_RT_ASSEMBLY_MANIFEST'));
  if (!/^http:\/\/(127\.0\.0\.1|localhost):[0-9]{2,5}$/.test(origin))
    block('Runtime origin must be an isolated loopback HTTP server, not a hosted application');
  if (!SHA.test(targetBackend) || targetBackend === SOURCE_BACKEND_SHA)
    block('A distinct, exact, assembled combined-backend commit is required, not baseline PR #81');
  if (!existsSync(join(backendDir, 'artisan')) || !existsSync(manifestPath))
    block('Laravel root or exact-source assembly manifest is missing');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.schemaVersion !== 1 || manifest.candidateKind !== 'combined-p0-p4' ||
      manifest.status !== 'runtime-testing-authorized' || manifest.frontend?.sha !== FRONTEND_SHA ||
      manifest.frontend?.repository !== FRONTEND_REPO ||
      manifest.backend?.sha !== targetBackend || manifest.backend?.repository !== BACKEND_REPO)
    block('Assembly attestation does not match the frozen frontend and approved combined-backend tuple');
  const gitHead = run('git', ['rev-parse', 'HEAD'], backendDir);
  if (gitHead !== targetBackend) block('Backend checkout HEAD does not match approved manifest');
  if (!Array.isArray(manifest.overlay?.files) || manifest.overlay.files.length !== 29)
    block('Incomplete selective 29-file frontend blob attestation');
  const seen = new Set();
  for (const item of manifest.overlay.files) {
    if (typeof item.path !== 'string' || !item.path.startsWith('resources/') ||
        !SHA.test(item.gitBlob) || seen.has(item.path)) block('Invalid overlay manifest path');
    seen.add(item.path);
    if (!existsSync(join(backendDir, item.path)) ||
        run('git', ['hash-object', item.path], backendDir) !== item.gitBlob)
      block('Frontend overlay content differs from PR #35: ' + item.path);
  }
  results.source.actualBackend = targetBackend;
  results.runtime.origin = origin;
  results.runtime.overlayFiles = seen.size;
  success('PINNED_SOURCE_TUPLE_AND_BLOBS');
  pgPreflight();
  const aEmail = required('CC_RT_A_EMAIL'), bEmail = required('CC_RT_B_EMAIL');
  const aPassword = required('CC_RT_A_PASSWORD'), bPassword = required('CC_RT_B_PASSWORD');
  if (aEmail === bEmail) block('Two distinct authenticated test accounts are required');
  browser = await chromium.launch({ headless: true });
  contextA = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  contextB = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  pageA = await contextA.newPage(); pageB = await contextB.newPage();
  pageA.setDefaultTimeout(15000); pageB.setDefaultTimeout(15000);
  watch(pageA, 'A'); watch(pageB, 'B');
  await login(pageA, aEmail, aPassword);
  await login(pageB, bEmail, bPassword);
  success('AUTHENTICATED_LARAVEL_INERTIA_LOGIN_TWO_ACCOUNTS');
  const title = 'CCRT' + Date.now() + Math.floor(Math.random() * 10000);
  const createForm = pageA.getByRole('form', { name: 'Create individual Task' });
  await createForm.getByRole('textbox', { name: 'Title' }).fill(title);
  await createForm.getByRole('button', { name: 'Create Task' }).click();
  await pageA.getByText(/Task #\d+ created\./).waitFor();
  const own = (await taskList(pageA, 'open')).filter(row => row.title === title);
  assert.equal(own.length, 1, 'Task POST must create exactly one visible persisted row');
  const id = own[0].id;
  assertDb(dbTask(id), 'open', ['created']);
  assert.ok(results.http.some(x => x.actor === 'A' && x.method === 'POST' && x.path === '/tasks' && x.status === 201),
    'Task UI create must have an actual Laravel HTTP 201 response');
  success('TASK_CREATED_HTTP201_AND_PG16_READBACK', { taskId: id });
  await screenshot(pageA, '01-created-desktop');
  await pageA.reload({ waitUntil: 'domcontentloaded' });
  await pageA.getByRole('heading', { name: 'Personal Tasks' }).waitFor();
  assert.equal((await taskList(pageA, 'open')).find(row => row.id === id)?.state, 'open');
  await openTask(pageA, title);
  success('TASK_SURVIVES_REAL_HTTP_RELOAD');
  const foreignList = await taskList(pageB, 'open');
  assert.equal(foreignList.some(row => row.id === id), false, 'Foreign record leaked into list');
  assert.equal((await liveJson(pageB, '/tasks/' + id)).status, 404,
    'Foreign Task ID must remain masked with HTTP 404');
  await screenshot(pageB, '02-foreign-mobile');
  success('FOREIGN_ACCOUNT_LIST_AND_DETAIL_MASKED');
  await Promise.all([
    pageA.waitForResponse(x => x.request().method() === 'POST' && new URL(x.url()).pathname === '/tasks/' + id + '/start' && x.status() === 200),
    pageA.getByRole('button', { name: 'Start Task' }).click(),
  ]);
  await pageA.getByRole('region', { name: 'Personal Task detail' }).waitFor({ state: 'detached' });
  await stateTab(pageA, 'In Progress');
  assert.equal((await taskDetail(pageA, id)).state, 'in_progress');
  assertDb(dbTask(id), 'in_progress', ['created', 'start']);
  await openTask(pageA, title);
  success('TASK_START_HTTP_AND_PG16_EVENT');
  await Promise.all([
    pageA.waitForResponse(x => x.request().method() === 'POST' && new URL(x.url()).pathname === '/tasks/' + id + '/complete' && x.status() === 200),
    pageA.getByRole('button', { name: 'Complete Task' }).click(),
  ]);
  await pageA.getByRole('region', { name: 'Personal Task detail' }).waitFor({ state: 'detached' });
  await stateTab(pageA, 'Completed');
  assert.equal((await taskDetail(pageA, id)).state, 'completed');
  assertDb(dbTask(id), 'completed', ['created', 'start', 'complete']);
  await screenshot(pageA, '03-completed-desktop');
  await pageA.reload({ waitUntil: 'domcontentloaded' });
  await stateTab(pageA, 'Completed');
  assert.ok((await taskList(pageA, 'completed')).some(row => row.id === id));
  success('TASK_COMPLETE_EVENTS_AND_RELOAD_PERSISTENCE');
  const workProps = await inertia(pageA, '/transactions', 'Transactions/Index');
  assert.ok(workProps.records && Array.isArray(workProps.scopeGroups));
  await pageA.getByRole('heading', { name: 'Personal Tasks' }).waitFor();
  await pageA.getByRole('heading', { name: 'Work Requests' }).waitFor();
  await screenshot(pageA, '04-my-work-requests');
  success('WORK_REQUEST_AND_PERSONAL_TASK_PRESENTATION');
  const note = await liveJson(pageA, '/notifications/feed');
  assert.equal(note.status, 200);
  assert.ok(Array.isArray(note.body?.notifications), 'Backend notification feed must be JSON');
  await pageA.getByRole('button', { name: 'Open notifications' }).click();
  await screenshot(pageA, '05-notifications-desktop');
  success('P2_NOTIFICATION_FEED_REAL_HTTP');
  const calendar = await inertia(pageA, '/calendar', 'Calendar/Index');
  assert.ok(Array.isArray(calendar.events) && calendar.calendar);
  await screenshot(pageA, '06-calendar-desktop');
  success('P2_CALENDAR_AUTHENTICATED_INERTIA');
  await inertia(pageA, '/messages', 'Messages/Index');
  await screenshot(pageA, '07-messages-desktop');
  success('P2_MESSAGES_AUTHENTICATED_INERTIA');
  const docs = await inertia(pageA, '/documents', 'Documents/Index');
  assert.ok(docs.records && Array.isArray(docs.records.data), 'Documents must be authorized server props');
  await screenshot(pageA, '08-document-center-desktop');
  const files = await inertia(pageA, '/documents?mode=files', 'Documents/Index');
  assert.ok(files.archive && Array.isArray(files.archive.records?.data),
    'Document archive must use backend-authorized records');
  success('P3_DOCUMENT_REGISTER_AND_ARCHIVE_INERTIA');
  const correspondence = await inertia(pageA, '/correspondence', 'Correspondence/Index');
  assert.ok(correspondence.records && Array.isArray(correspondence.records.data));
  await screenshot(pageA, '09-correspondence-desktop');
  success('P3_CORRESPONDENCE_AUTHORIZED_INERTIA');
  await pageB.goto(origin + '/dashboard');
  await pageB.getByRole('heading', { name: 'Personal Tasks' }).waitFor();
  await screenshot(pageB, '10-mobile-dashboard');
  assert.equal((await taskList(pageB, 'completed')).some(row => row.id === id), false);
  success('MOBILE_RENDERS_AND_CROSS_ACCOUNT_COMPLETED_ISOLATION');
  await pageA.goto(origin + '/dashboard');
  await Promise.all([
    pageA.waitForResponse(x => x.request().method() === 'POST' && new URL(x.url()).pathname === '/logout'),
    pageA.getByRole('button', { name: 'Sign out' }).first().click(),
  ]);
  await pageA.waitForURL((url) => url.pathname === '/login');
  assert.equal((await liveJson(pageA, '/tasks')).status, 401);
  assert.equal((await liveJson(pageB, '/tasks?per_page=1&page=1')).status, 200);
  success('LOGOUT_REVOKES_A_AND_LEAVES_B_SESSION_INDEPENDENT');
  assert.deepEqual(pageErrors, [], 'Chromium application uncaught JS errors');
  assert.equal(results.errors.length, 0, 'Unexpected browser network request failures');
  results.status = 'PASS';
}
try {
  // No execution is permitted until all source and environmental gates succeed.
  output = resolve(required('CC_RT_REPORT_DIR'));
  await mkdir(output, { recursive: true });
  await main();
} catch (error) {
  results.status = error.disposition || 'FAIL';
  results.errors.push({ step: results.cases.at(-1)?.name || 'preflight',
    error: String(error.message || error).slice(0, 1500) });
  console.error('CC_REAL_RUNTIME_' + results.status + ': ' + String(error.message || error));
} finally {
  await contextA?.close().catch(() => {});
  await contextB?.close().catch(() => {});
  await browser?.close().catch(() => {});
  if (output) {
    await mkdir(output, { recursive: true }).catch(() => {});
    await writeFile(join(output, 'result.json'), JSON.stringify(results, null, 2));
  }
}
if (results.status !== 'PASS') process.exitCode = 1;
else console.log('CC_REAL_LARAVEL_PG16_CHROMIUM_PASS');
