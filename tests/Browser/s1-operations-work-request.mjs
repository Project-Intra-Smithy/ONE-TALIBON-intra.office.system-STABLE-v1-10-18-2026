import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:8000';

async function enterPersona(page, role, office = null) {
    await page.goto(`${BASE}/login`);
    await page.getByRole('button', { name: 'Open Municipal Workspace', exact: true }).click();
    await page.getByRole('button', { name: new RegExp(`^${role}`) }).click();
    if (office) {
        await page.getByRole('heading', { name: 'Choose office context', exact: true }).waitFor();
        await page.getByRole('button', { name: new RegExp(`^${office}`) }).click();
    }
    await page.waitForURL((url) => url.pathname === '/dashboard');
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
    await enterPersona(page, 'Employee');
    const response = await page.goto(`${BASE}/transactions/create`);
    if (response?.status() !== 200) throw new Error(`work request form status=${response?.status()}`);

    await page.getByLabel('Request Category', { exact: true }).selectOption({ label: 'Planning & Development' });
    const requestType = page.getByLabel('Request Type', { exact: true });
    if (await requestType.locator('option', { hasText: 'GIS / Mapping' }).count() !== 1) throw new Error('GIS / Mapping subtype missing');
    await requestType.selectOption({ label: 'GIS / Mapping' });

    await page.getByLabel('Action Required', { exact: true }).selectOption({ label: 'For Review' });
    await page.getByLabel('Receiving Office', { exact: true }).selectOption({ label: 'Municipal Engineering Office' });

    const assigned = page.getByLabel('Assigned Person', { exact: false });
    if (await assigned.locator('option', { hasText: 'Maria Santos' }).count() !== 1) throw new Error('engineering assignee missing');
    if (await assigned.locator('option', { hasText: 'Juan Cruz' }).count() !== 0) throw new Error('cross-office assignee exposed');
    await assigned.selectOption({ label: 'Maria Santos · Municipal Engineer' });

    await page.getByLabel('Priority', { exact: true }).selectOption({ label: 'Priority' });
    const due = new Date();
    due.setDate(due.getDate() + 3);
    const dueValue = [due.getFullYear(), String(due.getMonth() + 1).padStart(2, '0'), String(due.getDate()).padStart(2, '0')].join('-');
    await page.getByLabel('Target Completion', { exact: true }).fill(dueValue);
    await page.getByLabel('Subject', { exact: true }).fill('Browser verified GIS work request');
    await page.getByLabel('Description', { exact: true }).fill('Browser verification of the presentation work request flow.');

    const pngPath = '/tmp/s1-work-request.png';
    await fs.writeFile(pngPath, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl7sWcAAAAASUVORK5CYII=', 'base64'));
    await page.locator('input[type="file"]').setInputFiles(pngPath);

    await Promise.all([
        page.waitForURL((url) => /^\/transactions\/\d+$/.test(url.pathname)),
        page.getByRole('button', { name: 'Submit Work Request', exact: true }).click(),
    ]);

    const body = await page.locator('body').innerText();
    for (const expected of ['Planning & Development', 'GIS / Mapping', 'For Review', 'Maria Santos']) {
        if (!body.includes(expected)) throw new Error(`result view missing ${expected}`);
    }

    console.log('S1_OPERATIONS_BROWSER_PASS');
} catch (error) {
    console.error('S1_OPERATIONS_BROWSER_FAIL', error?.stack || String(error));
    process.exitCode = 1;
} finally {
    await browser.close();
}
