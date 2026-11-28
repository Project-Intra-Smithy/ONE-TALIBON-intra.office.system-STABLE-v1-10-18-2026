import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch();
try {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    await page.addInitScript(() => localStorage.setItem('ot.synthetic.role', 'department_head'));
    const errors = [], requests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
        if (['fetch', 'xhr'].includes(request.resourceType())) requests.push(request.url());
    });
    const notice = page.getByText('Preview action unavailable. No municipal record was submitted or saved.', { exact: true });
    await page.goto('http://127.0.0.1:4174/login');
    await page.getByLabel('Username or email', { exact: true }).fill('synthetic-only');
    await page.getByLabel('Password', { exact: true }).fill('synthetic-only');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await notice.waitFor();
    assert.equal(new URL(page.url()).pathname, '/login', 'unsupported writes must not navigate or claim authentication');
    await page.goto('http://127.0.0.1:4174/security/mfa');
    await page.getByRole('button', { name: 'Regenerate recovery codes', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
    await notice.waitFor();
    assert.equal(new URL(page.url()).pathname, '/security/mfa');
    await page.goto('http://127.0.0.1:4174/work-requests/origin-delivery-exceptions');
    await page.getByLabel('Acknowledgment and owner follow-up note').fill('SAMPLE follow-up only');
    await page.getByRole('button', { name: 'Acknowledge case', exact: true }).click();
    await notice.waitFor();
    await page.getByRole('button', { name: 'Acknowledge case', exact: true }).waitFor();
    assert.equal(await page.getByLabel('Acknowledgment and owner follow-up note').inputValue(), 'SAMPLE follow-up only', 'blocked commands must not run success/reset callbacks');
    assert.deepEqual(errors, []);
    assert.deepEqual(requests, [], 'unsupported preview commands must not reach a server');
} finally {
    await browser.close();
}
