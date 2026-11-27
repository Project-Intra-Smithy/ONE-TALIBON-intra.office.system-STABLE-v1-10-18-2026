import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch();
try {
    const page = await browser.newPage();
    await page.addInitScript(() => localStorage.setItem('ot.synthetic.role', 'employee'));
    const requests = [];
    page.on('request', request => {
        if (request.resourceType() === 'fetch' || request.resourceType() === 'xhr') requests.push(request.url());
    });
    await page.goto('http://127.0.0.1:4174/my-tasks');
    await page.getByLabel('New personal Task title').fill('SAMPLE preview mutation cycle');
    await page.getByRole('button', { name: 'Create Task', exact: true }).click();
    await page.getByText('Preview simulated: SAMPLE preview mutation cycle — open', { exact: true }).waitFor();
    const row = page.getByRole('list', { name: 'Personal Task actions list' }).getByRole('listitem').filter({ hasText: 'SAMPLE preview mutation cycle' });
    await row.getByRole('button', { name: 'Start', exact: true }).click();
    await page.getByText('Preview simulated: SAMPLE preview mutation cycle — in progress', { exact: true }).waitFor();
    await row.getByRole('button', { name: 'Complete', exact: true }).click();
    await page.getByText('Preview simulated: SAMPLE preview mutation cycle — completed', { exact: true }).waitFor();
    const negatives = await page.evaluate(async () => {
        const list = await (await fetch('/tasks?per_page=20&page=1')).json();
        const task = list.data.find(item => item.title === 'SAMPLE preview mutation cycle');
        const duplicate = await fetch(`/tasks/${task.id}/complete`, { method: 'POST', body: '{}' });
        const invalid = await fetch('/tasks', { method: 'POST', body: '{"title":""}' });
        localStorage.setItem('ot.synthetic.role', 'system_administration');
        const denied = await fetch('/tasks', { method: 'POST', body: '{"title":"denied"}' });
        return [duplicate.status, invalid.status, denied.status];
    });
    assert.deepEqual(negatives, [409, 422, 403]);
    assert.deepEqual(requests, [], 'synthetic mutations must never perform network requests');
    await page.reload();
    await page.getByLabel('New personal Task title').waitFor();
    assert.equal(await page.getByText('SAMPLE preview mutation cycle', { exact: true }).count(), 0, 'reload clears the simulated mutation');
} finally {
    await browser.close();
}
