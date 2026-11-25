import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const output = '.forge/evidence/ot-tcds-phase-a/studios';
await mkdir(output, { recursive: true });

const browser = await chromium.launch();
const results = [];

const assertDialogContained = async (dialog, width, label) => {
    const bounds = await dialog.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, viewportWidth: innerWidth, viewportHeight: innerHeight };
    });
    assert.ok(bounds.left >= 0 && bounds.right <= bounds.viewportWidth + 1, `${label} must fit the ${width}px viewport`);
    assert.ok(bounds.top >= 0 && bounds.bottom <= bounds.viewportHeight + 1, `${label} must fit the viewport height`);
};

const assertControlsNamed = async (dialog, label) => {
    const unnamed = await dialog.locator('input, select, textarea, button, a[href]').evaluateAll((nodes) =>
        nodes
            .filter((node) => {
                if (node instanceof HTMLInputElement && node.type === 'hidden') return false;
                const labelled = node.labels?.length || node.getAttribute('aria-label') || node.getAttribute('aria-labelledby');
                const text = node.textContent?.trim();
                const title = node.getAttribute('title');
                return !labelled && !text && !title;
            })
            .map((node) => `${node.tagName.toLowerCase()}:${node.getAttribute('name') ?? node.getAttribute('type') ?? ''}`),
    );
    assert.deepEqual(unnamed, [], `${label} controls need accessible names`);
};

try {
    for (const width of [1440, 768, 390]) {
        for (const theme of ['light', 'dark']) {
            const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
            await context.addInitScript(() => localStorage.setItem('ot.synthetic.role', 'mpdc_designated_staff'));
            const page = await context.newPage();
            const errors = [];
            const consoleErrors = [];
            const requests = [];
            page.on('pageerror', (error) => errors.push(error.message));
            page.on('console', (message) => {
                if (message.type() === 'error') consoleErrors.push(message.text());
            });
            page.on('request', (request) => {
                const url = new URL(request.url());
                if (url.origin !== 'http://127.0.0.1:4174') requests.push(request.url());
            });

            await page.goto('http://127.0.0.1:4174/development-plans');
            const addPlan = page.getByRole('button', { name: 'Add Plan', exact: true });
            await addPlan.click();
            const planForm = page.getByRole('dialog', { name: 'Add Development Plan', exact: true });
            await planForm.waitFor();
            await assertDialogContained(planForm, width, 'plan form');
            await assertControlsNamed(planForm, 'plan form');
            await page.keyboard.press('Escape');
            await planForm.waitFor({ state: 'hidden' });
            assert.equal(await addPlan.evaluate((element) => element === document.activeElement), true, 'plan form must restore trigger focus');

            const planTrigger = page.getByRole('button', { name: /^View details for / }).first();
            await planTrigger.click();
            const dossier = page.getByRole('dialog');
            await dossier.waitFor();
            await dossier.getByRole('tab', { name: /^Linked PPAs/ }).click();
            await dossier.getByRole('tab', { name: /^Chapters & Maps/ }).click();
            await dossier.getByRole('tab', { name: /^Supporting Docs/ }).click();
            await assertDialogContained(dossier, width, 'plan dossier');
            await assertControlsNamed(dossier, 'plan dossier');
            await page.keyboard.press('Escape');
            await dossier.waitFor({ state: 'hidden' });

            await page.goto('http://127.0.0.1:4174/ppas');
            const addPpa = page.getByRole('button', { name: 'Add PPA', exact: true });
            await addPpa.click();
            const ppaForm = page.getByRole('dialog', { name: 'Add PPA to Municipal Register', exact: true });
            await ppaForm.waitFor();
            await assertDialogContained(ppaForm, width, 'PPA form');
            await assertControlsNamed(ppaForm, 'PPA form');
            await page.keyboard.press('Escape');
            await ppaForm.waitFor({ state: 'hidden' });
            assert.equal(await addPpa.evaluate((element) => element === document.activeElement), true, 'PPA form must restore trigger focus');

            const viewPpa = page.getByRole('button', { name: /^View(?: details)?$/ }).first();
            await viewPpa.click();
            const ppaDetail = page.getByRole('dialog');
            await ppaDetail.waitFor();
            await assertDialogContained(ppaDetail, width, 'PPA detail');
            await assertControlsNamed(ppaDetail, 'PPA detail');
            await page.keyboard.press('Escape');
            await ppaDetail.waitFor({ state: 'hidden' });

            await page.goto('http://127.0.0.1:4174/planning-maps');
            const addMap = page.getByRole('button', { name: 'Add Planning Map', exact: true });
            await addMap.click();
            const mapForm = page.getByRole('dialog', { name: 'Add Municipal Planning Map', exact: true });
            await mapForm.waitFor();
            await mapForm.getByRole('button', { name: 'Pick on Talibon map', exact: true }).click();
            await mapForm.getByRole('application', { name: 'Click to pick map pin coordinates in Talibon' }).waitFor();
            await assertDialogContained(mapForm, width, 'planning map form');
            await assertControlsNamed(mapForm, 'planning map form');
            await page.keyboard.press('Escape');
            await mapForm.waitFor({ state: 'hidden' });
            assert.equal(await addMap.evaluate((element) => element === document.activeElement), true, 'map form must restore trigger focus');

            const openPlate = page.getByRole('button', { name: 'Open Full Map Plate', exact: true });
            await openPlate.click();
            const plate = page.getByRole('dialog');
            await plate.waitFor();
            await plate.getByRole('button', { name: 'Zoom in map plate' }).click();
            await assertDialogContained(plate, width, 'map plate');
            await assertControlsNamed(plate, 'map plate');
            await page.keyboard.press('Escape');
            await plate.waitFor({ state: 'hidden' });

            await page.goto('http://127.0.0.1:4174/transactions');
            const addRequest = page.getByRole('link', { name: 'New Work Request', exact: true });
            await addRequest.click();
            const requestDrawer = page.getByRole('dialog', { name: 'New Work Request', exact: true });
            await requestDrawer.waitFor();
            await assertDialogContained(requestDrawer, width, 'Work Request drawer');
            await assertControlsNamed(requestDrawer, 'Work Request drawer');
            await requestDrawer.getByLabel('Subject').fill('Sample cross-module coordination request');
            await requestDrawer.getByLabel('Target Completion Date').fill('2027-03-15');
            await page.keyboard.press('Escape');
            await requestDrawer.waitFor({ state: 'hidden' });
            await page.getByRole('link', { name: 'New Work Request', exact: true }).waitFor();

            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
            await page.screenshot({ path: `${output}/work-request-${width}-${theme}.png`, fullPage: true });
            results.push({ width, theme, errors, consoleErrors, externalRequests: requests, overflow });
            await context.close();
        }
    }
} finally {
    await browser.close();
    await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
}

assert.ok(results.every((result) => !result.errors.length), JSON.stringify(results));
assert.ok(results.every((result) => !result.consoleErrors.length), JSON.stringify(results));
assert.ok(results.every((result) => !result.externalRequests.length), JSON.stringify(results));
assert.ok(results.every((result) => !result.overflow), JSON.stringify(results));
