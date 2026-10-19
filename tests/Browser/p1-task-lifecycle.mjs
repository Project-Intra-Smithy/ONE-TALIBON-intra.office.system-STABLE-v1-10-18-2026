import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';

const origin = process.env.P1_BROWSER_ORIGIN ?? 'http://127.0.0.1:8000';
const password = process.env.PROTOTYPE_DEMO_PASSWORD;
const output = process.env.P1_BROWSER_REPORT_DIR;
if (!password || !output || !origin.startsWith('http://127.0.0.1:')) {
    throw new Error('Disposable browser test configuration is missing');
}
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const receipts = [];
let contextA;
let contextB;
try {
    contextA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    contextB = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();
    pageA.setDefaultTimeout(20000);
    pageB.setDefaultTimeout(20000);

    async function login(page, email) {
        await page.goto(origin + '/login');
        await page.locator('input[type="email"]').fill(email);
        await page.locator('input[type="password"]').fill(password);
        await page.getByRole('button', { name: 'Sign In' }).click();
        await page.getByRole('heading', { name: 'Personal Task actions' }).waitFor({ state: 'visible' });
        await page.getByRole('button', { name: 'Create Task' }).waitFor({ state: 'visible' });
    }

    async function taskList(page) {
        const response = await page.evaluate(async () => {
            const result = await fetch('/tasks?per_page=20&page=1', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            });
            return { status: result.status, body: result.ok ? await result.json() : null };
        });
        assert.equal(response.status, 200);
        assert.ok(Array.isArray(response.body?.data));
        return response.body.data;
    }

    const title = 'P1 exact-head browser ' + process.env.GITHUB_RUN_ID;
    await login(pageA, 'employee@talibon.demo');
    await pageA.getByLabel('New personal Task title').fill(title);
    await pageA.getByRole('button', { name: 'Create Task' }).click();
    await pageA.getByText('Server confirmed: ' + title + ' — open').waitFor({ state: 'visible' });
    let own = (await taskList(pageA)).filter(task => task.title === title);
    assert.equal(own.length, 1, 'Creator must see exactly one newly created Task');
    const id = own[0].id;
    assert.equal(own[0].state, 'open');
    receipts.push('LOGIN_A_CREATE_CONFIRMED');

    await pageA.reload();
    await pageA.getByRole('heading', { name: 'Personal Task actions' }).waitFor({ state: 'visible' });
    const ownList = pageA.getByRole('list', { name: 'Personal Task actions list' });
    await ownList.getByRole('listitem').filter({ hasText: title }).waitFor({ state: 'visible' });
    receipts.push('RELOAD_PERSISTED');

    await login(pageB, 'p1qa2@talibon.demo');
    const foreign = await pageB.evaluate(async taskId => {
        const r = await fetch('/tasks/' + taskId, {
            credentials: 'same-origin', headers: { Accept: 'application/json' },
        });
        return r.status;
    }, id);
    assert.equal(foreign, 404, 'Foreign Task ID must remain concealed');
    assert.equal((await taskList(pageB)).filter(task => task.title === title).length, 0);
    receipts.push('FOREIGN_ACCOUNT_CONCEALED_MOBILE');

    const row = () => pageA.getByRole('list', { name: 'Personal Task actions list' })
        .getByRole('listitem').filter({ hasText: title });
    await row().getByRole('button', { name: 'Start', exact: true }).click();
    await pageA.getByText('Server confirmed: ' + title + ' — in progress').waitFor({ state: 'visible' });
    assert.equal((await taskList(pageA)).find(task => task.id === id)?.state, 'in_progress');
    receipts.push('START_CONFIRMED');

    await row().getByRole('button', { name: 'Complete', exact: true }).click();
    await pageA.getByText('Server confirmed: ' + title + ' — completed').waitFor({ state: 'visible' });
    assert.equal((await taskList(pageA)).find(task => task.id === id)?.state, 'completed');
    await pageA.screenshot({ path: output + '/task-completed-desktop.png', fullPage: false });
    await pageB.screenshot({ path: output + '/foreign-account-mobile.png', fullPage: false });
    receipts.push('COMPLETE_CONFIRMED');

    // This mutation is restricted to the CI-created, disposable PG16 account
    // and is intentionally performed OUTSIDE the active Chromium session.
    // Thus the browser must recheck eligibility rather than trust old cookies.
    const prepare = `
require 'vendor/autoload.php';
\$app = require 'bootstrap/app.php';
\$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
\$user = App\\Models\\User::query()->where('email', 'p1qa2@talibon.demo')->firstOrFail();
\$employee = App\\Models\\Employee::query()->where('user_id', \$user->id)->firstOrFail();
App\\Models\\PlatformNotification::query()->create([
    'user_id' => \$user->id,
    'event_key' => 'p1-h-browser-'.getenv('GITHUB_RUN_ID'),
    'source_domain' => 'hr_contract',
    'source_type' => App\\Models\\Employee::class,
    'source_id' => \$employee->id,
    'title' => 'P1-H-BROWSER-PROTECTED-METADATA',
    'message' => 'P1-H-BROWSER-PRIVATE-MESSAGE',
    'priority' => 'info',
    'action_url' => '/transactions/999999',
]);
echo json_encode(['employee_id' => \$employee->id]);
`;
    const prepared = JSON.parse(execFileSync('php', ['-r', prepare], { encoding: 'utf8' }));
    const profile = '/employees/' + prepared.employee_id;
    const http = async (path) => pageB.evaluate(async (url) => {
        const r = await fetch(url, {
            credentials: 'same-origin', headers: { Accept: 'application/json' }, redirect: 'manual',
        });
        return { status: r.status, body: await r.text(), redirected: r.redirected, url: r.url };
    }, path);

    assert.equal((await http(profile)).status, 200, 'Own employee profile should load when active');
    const beforeRevocation = await http('/notifications/feed');
    assert.equal(beforeRevocation.status, 200);
    assert.ok(beforeRevocation.body.includes('P1-H-BROWSER-PROTECTED-METADATA'));
    assert.ok(!beforeRevocation.body.includes('/transactions/999999'),
        'Cached foreign destination must not be projected');

    const revoke = `
require 'vendor/autoload.php';
\$app = require 'bootstrap/app.php';
\$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();
\$user = App\\Models\\User::query()->where('email', 'p1qa2@talibon.demo')->firstOrFail();
App\\Models\\Employee::query()->where('user_id', \$user->id)->update(['employment_status' => 'separated']);
echo 'P1_H_BROWSER_EMPLOYEE_SEPARATED';
`;
    assert.equal(execFileSync('php', ['-r', revoke], { encoding: 'utf8' }).trim(),
        'P1_H_BROWSER_EMPLOYEE_SEPARATED');
    const deniedProfile = await http(profile);
    assert.equal(deniedProfile.status, 404, 'Separated employees must disappear from the active Directory surface');
    assert.equal(deniedProfile.redirected, false, 'Directory denial must not redirect and restore access');
    assert.equal(new URL(deniedProfile.url).pathname, profile);
    assert.ok(!deniedProfile.body.includes('P1-H-BROWSER-PRIVATE-MESSAGE'));
    assert.ok(!deniedProfile.body.includes('P1-H-BROWSER-PROTECTED-METADATA'));

    const deniedFeed = await http('/notifications/feed');
    assert.equal(deniedFeed.status, 200, 'Notification feed must fail closed with empty content');
    const empty = JSON.parse(deniedFeed.body);
    assert.equal(empty.unreadPlatformNotificationCount, 0);
    assert.equal(empty.notificationCount, 0);
    assert.deepEqual(empty.notifications, []);
    assert.ok(!deniedFeed.body.includes('P1-H-BROWSER-PROTECTED-METADATA'));
    receipts.push('RETAINED_SESSION_EMPLOYMENT_REVOKED');


    await pageA.getByRole('button', { name: 'Sign out' }).first().click();
    await pageA.waitForURL('**/login');
    const afterLogout = await pageA.evaluate(async () => {
        const r = await fetch('/tasks', { headers: { Accept: 'application/json' } });
        return r.status;
    });
    assert.equal(afterLogout, 401, 'Signed-out session must not expose Tasks');
    receipts.push('LOGOUT_REVOKED');

    await writeFile(output + '/browser-cases.json', JSON.stringify({
        result: 'PASS', head: process.env.GITHUB_SHA, run: process.env.GITHUB_RUN_ID,
        cases: receipts, page_sizes: ['1280x800', '390x844'], persistence: 'server-readback',
    }, null, 2));
    console.log('P1_TASK_BROWSER_PASS ' + receipts.join(','));
} catch (error) {
    await writeFile(output + '/browser-cases.json', JSON.stringify({
        result: 'FAIL', head: process.env.GITHUB_SHA, run: process.env.GITHUB_RUN_ID,
        casesCompleted: receipts, error: String(error?.message ?? error),
    }, null, 2));
    console.error('P1_TASK_BROWSER_FAIL:', error);
    throw error;
} finally {
    await contextA?.close();
    await contextB?.close();
    await browser.close();
}
