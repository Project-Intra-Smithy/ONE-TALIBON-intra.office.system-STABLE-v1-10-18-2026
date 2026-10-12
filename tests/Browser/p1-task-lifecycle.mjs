import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

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
