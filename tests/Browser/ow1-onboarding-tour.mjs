import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE = process.env.QA_BASE_URL || 'http://127.0.0.1:8000';
const OUT = 'storage/app/qa/ow1-onboarding-tour-report.json';
const report = { generatedAt: new Date().toISOString(), completed: false, checks: [], diagnostics: [], failure: null };
const diagnostics = [];
let stage = 'bootstrap';

const check = (name, ok, details = '') => {
    const row = { name, ok: Boolean(ok), details: String(details) };
    report.checks.push(row);
    if (!row.ok) throw new Error(name + ': ' + details);
};

const write = async () => {
    await fs.mkdir('storage/app/qa', { recursive: true });
    await fs.writeFile(OUT, JSON.stringify(report, null, 2));
};

const monitor = (page) => {
    page.on('pageerror', (error) => diagnostics.push({ type: 'pageerror', path: new URL(page.url()).pathname, details: error.message }));
    page.on('response', (response) => {
        if (response.status() >= 500) diagnostics.push({ type: 'server-5xx', path: new URL(response.url()).pathname, details: String(response.status()) });
    });
};

const noOverflow = async (page, label) => {
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, root: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    check(label + ': no horizontal overflow', dimensions.root <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1, JSON.stringify(dimensions));
};

const insideViewport = async (locator, page, label) => {
    const box = await locator.boundingBox();
    const viewport = page.viewportSize();
    check(label + ': visible box', Boolean(box && viewport), JSON.stringify({ box, viewport }));
    check(label + ': inside viewport', box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, JSON.stringify({ box, viewport }));
};

async function openSelector(page) {
    const response = await page.goto(BASE + '/login');
    check('login loads', response?.status() === 200, String(response?.status()));
    await page.getByRole('button', { name: 'Open Municipal Workspace', exact: true }).click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
}

async function enterWorkspace(page, role, office = null) {
    await openSelector(page);
    await page.getByRole('button', { name: new RegExp('^' + role) }).click();
    if (office) {
        await page.getByRole('heading', { name: 'Choose office context', exact: true }).waitFor();
        await page.getByRole('button', { name: new RegExp('^' + office) }).click();
    }
    await page.waitForURL((url) => url.pathname === '/dashboard');
    await page.locator('#portal-content').waitFor({ state: 'visible' });
}

async function advanceWizardToFinal(page) {
    const wizard = page.locator('[data-onboarding="welcome-wizard"]');
    await wizard.waitFor({ state: 'visible' });
    for (let step = 1; step < 5; step += 1) {
        await page.getByRole('button', { name: 'Continue', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Start guided tour', exact: true }).waitFor();
}

async function finishTour(page) {
    const tour = page.locator('[data-onboarding="guided-tour"]');
    await tour.waitFor({ state: 'visible' });
    for (let guard = 0; guard < 12; guard += 1) {
        const finish = page.getByRole('button', { name: 'Finish tour', exact: true });
        if (await finish.isVisible().catch(() => false)) {
            await finish.click();
            await tour.waitFor({ state: 'detached' });
            return;
        }
        await page.getByRole('button', { name: 'Next', exact: true }).click();
    }
    throw new Error('Tour did not reach Finish tour within guard limit.');
}

async function firstRunYes(browser) {
    stage = 'first-run-yes';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    monitor(page);
    await enterWorkspace(page, 'Employee');

    const prompt = page.locator('[data-onboarding="first-run"]');
    await prompt.waitFor({ state: 'visible' });
    check('first-run question appears', await page.getByRole('heading', { name: 'Is this your first time exploring ONE TALIBON?' }).isVisible());

    await page.getByRole('button', { name: 'Yes, show me around', exact: true }).click();
    const wizard = page.locator('[data-onboarding="welcome-wizard"]');
    await wizard.waitFor({ state: 'visible' });
    check('welcome visible', await page.getByRole('heading', { name: 'Welcome to ONE TALIBON', exact: true }).isVisible());
    check('current persona visible', await wizard.getByText('Employee', { exact: true }).isVisible());
    check('current office visible', await wizard.getByText('Municipal Planning and Development Office', { exact: true }).isVisible());

    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    check('connected-work screen visible', await page.getByRole('heading', { name: 'One municipality. Connected work.', exact: true }).isVisible());

    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    check('prototype notice visible', await page.getByRole('heading', { name: 'Prototype & Interface Notice', exact: true }).isVisible());
    check('prototype status wording visible', await wizard.getByText(/evaluation prototype/).isVisible());

    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    check('credits visible', await page.getByRole('heading', { name: 'Development credits', exact: true }).isVisible());

    const kirchCredit = wizard.getByText('Kirch Ivan Balite', { exact: true }).locator('..');
    check('Kirch approved credit visible', await kirchCredit.getByText('Chief Technology Officer (CTO) / Technical Authority', { exact: true }).isVisible());
    check('Kirch specialization visible', await kirchCredit.getByText('Backend Systems & Architecture', { exact: true }).isVisible());
    check('Kirch organization visible', await kirchCredit.getByText('Kirjane Labs', { exact: true }).isVisible());

    const osirisCredit = wizard.getByText('Osiris Kedigadash Palac', { exact: true }).locator('..');
    check('Osiris approved credit visible', await osirisCredit.getByText('DevOps Lead · Kirjane Labs', { exact: true }).isVisible());

    const kurtCredit = wizard.getByText('Kurt Shine Khasi Halasan', { exact: true }).locator('..');
    check('Kurt approved credit visible', await kurtCredit.getByText('Developer / DevOps & Release Operations · Kirjane Labs', { exact: true }).isVisible());

    const ajCredit = wizard.getByText('AJ RIENZE', { exact: true }).locator('..');
    check('AJ approved credit visible', await ajCredit.getByText('Chief Executive Officer (CEO) · ALZA IT Solutions', { exact: true }).isVisible());

    const kikiamCredit = wizard.getByText('Kikiam', { exact: true }).locator('..');
    check('Kikiam approved credit visible', await kikiamCredit.getByText('Chief Operating Officer (COO) · ALZA IT Solutions', { exact: true }).isVisible());

    check('approved collaboration visible', await wizard.getByText('Kirjane Labs × ALZA IT Solutions', { exact: true }).isVisible());

    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    check('start-tour action visible', await page.getByRole('button', { name: 'Start guided tour', exact: true }).isVisible());
    await page.getByRole('button', { name: 'Start guided tour', exact: true }).click();
    await page.locator('[data-onboarding="guided-tour"]').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Exit tour', exact: true }).click();
    await context.close();
}

async function firstRunNoAndPersistence(browser) {
    stage = 'first-run-no-persistence';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    monitor(page);
    await enterWorkspace(page, 'Employee');
    await page.getByRole('button', { name: 'No, enter workspace', exact: true }).click();
    check('first-run NO enters dashboard', await page.locator('#portal-content').isVisible());
    check('first-run prompt closes', await page.locator('[data-onboarding="first-run"]').count() === 0);

    await page.reload();
    await page.locator('#portal-content').waitFor({ state: 'visible' });
    check('global intro does not return after reload', await page.locator('[data-onboarding="first-run"], [data-onboarding="welcome-wizard"]').count() === 0);
    const offer = page.locator('[data-onboarding="persona-offer"]');
    if (await offer.count()) await page.getByRole('button', { name: 'Not now', exact: true }).click();
    await context.close();
}

async function personaCompletionSwitchAndReplay(browser) {
    stage = 'persona-switch-replay';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    monitor(page);
    await enterWorkspace(page, 'Municipal Executive');
    await page.getByRole('button', { name: 'Yes, show me around', exact: true }).click();
    await advanceWizardToFinal(page);
    await page.getByRole('button', { name: 'Start guided tour', exact: true }).click();
    await finishTour(page);

    await page.reload();
    await page.locator('#portal-content').waitFor({ state: 'visible' });
    check('completed persona tour does not auto-run', await page.locator('[data-onboarding="guided-tour"], [data-onboarding="persona-offer"]').count() === 0);

    const switcher = page.locator('#portal-shell [data-tour="shell:workspace-switcher"]').first();
    await switcher.waitFor({ state: 'visible' });
    check('persistent Switch Workspace is discoverable outside Account & tools', await switcher.getAttribute('aria-label') === null || await switcher.getAttribute('aria-label') === 'Switch Workspace');
    await switcher.click();
    await page.waitForFunction(() => window.location.pathname === '/login');

    await page.getByRole('button', { name: 'Open Municipal Workspace', exact: true }).click();
    await page.getByRole('button', { name: /^Employee/ }).click();
    await page.waitForURL((url) => url.pathname === '/dashboard');

    const offer = page.locator('[data-onboarding="persona-offer"]');
    await offer.waitFor({ state: 'visible' });
    check('new persona gets quick-tour offer', await page.getByRole('heading', { name: 'Explore this workspace?', exact: true }).isVisible());
    check('global introduction does not repeat on persona change', await page.locator('[data-onboarding="welcome-wizard"]').count() === 0);
    await page.getByRole('button', { name: 'Not now', exact: true }).click();

    const replayAccountTools = page.locator('details.portal-account-tools').first();
    await replayAccountTools.waitFor({ state: 'visible' });
    if (!(await replayAccountTools.evaluate((node) => node.open))) {
        await replayAccountTools.locator('summary[aria-label="Account and tools"]').click();
    }
    const guidedTour = replayAccountTools.getByRole('button', { name: 'Guided tour', exact: true });
    await guidedTour.waitFor({ state: 'visible' });
    await guidedTour.click();
    await page.locator('[data-onboarding="guide"]').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /Replay this workspace tour/ }).click();
    check('manual replay starts completed/incomplete persona tour', await page.locator('[data-onboarding="guided-tour"]').isVisible());
    await page.getByRole('button', { name: 'Exit tour', exact: true }).click();
    await context.close();
}

async function storageFailure(browser) {
    stage = 'storage-failure';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
        const getItem = Storage.prototype.getItem;
        const setItem = Storage.prototype.setItem;
        Storage.prototype.getItem = function (key) {
            if (this === window.localStorage) throw new Error('OW1 simulated localStorage read failure');
            return getItem.call(this, key);
        };
        Storage.prototype.setItem = function (key, value) {
            if (this === window.localStorage) throw new Error('OW1 simulated localStorage write failure');
            return setItem.call(this, key, value);
        };
    });
    monitor(page);
    await enterWorkspace(page, 'Employee');
    await page.locator('[data-onboarding="first-run"]').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'No, enter workspace', exact: true }).click();
    check('storage failure does not block dashboard', await page.locator('#portal-content').isVisible());
    await page.reload();
    await page.locator('#portal-content').waitFor({ state: 'visible' });
    check('session fallback preserves intro completion', await page.locator('[data-onboarding="first-run"]').count() === 0);
    await context.close();
}

async function mobileViewport(browser) {
    stage = 'mobile-390x844';
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    monitor(page);
    await enterWorkspace(page, 'Employee');
    await page.getByRole('button', { name: 'Yes, show me around', exact: true }).click();
    const wizard = page.locator('[data-onboarding="welcome-wizard"]');
    await wizard.waitFor({ state: 'visible' });
    await insideViewport(wizard, page, 'mobile wizard');
    await noOverflow(page, 'mobile wizard');

    await advanceWizardToFinal(page);
    await page.getByRole('button', { name: 'Start guided tour', exact: true }).click();
    const coach = page.locator('[data-onboarding="guided-tour"]');
    await coach.waitFor({ state: 'visible' });
    await insideViewport(coach, page, 'mobile coach');
    await noOverflow(page, 'mobile tour');
    await page.getByRole('button', { name: 'Exit tour', exact: true }).click();
    await context.close();
}

async function desktopViewport(browser) {
    stage = 'desktop-1366x768';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    monitor(page);
    await enterWorkspace(page, 'Employee');
    await page.getByRole('button', { name: 'Yes, show me around', exact: true }).click();
    const wizard = page.locator('[data-onboarding="welcome-wizard"]');
    await wizard.waitFor({ state: 'visible' });
    await insideViewport(wizard, page, 'desktop wizard');
    await advanceWizardToFinal(page);
    await page.getByRole('button', { name: 'Start guided tour', exact: true }).click();
    const coach = page.locator('[data-onboarding="guided-tour"]');
    await coach.waitFor({ state: 'visible' });
    await insideViewport(coach, page, 'desktop coach');
    await page.getByRole('button', { name: 'Exit tour', exact: true }).click();
    await context.close();
}

async function keyboardFocus(browser) {
    stage = 'keyboard-focus';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    monitor(page);
    await enterWorkspace(page, 'Employee');
    const dialog = page.locator('[data-onboarding="first-run"]');
    await dialog.waitFor({ state: 'visible' });
    await page.waitForTimeout(50);
    check('initial focus enters first-run dialog', await dialog.evaluate((node) => node.contains(document.activeElement)));
    for (let i = 0; i < 8; i += 1) {
        await page.keyboard.press('Tab');
        check('tab remains inside first-run dialog ' + (i + 1), await dialog.evaluate((node) => node.contains(document.activeElement)));
    }
    await page.keyboard.press('Escape');
    await dialog.waitFor({ state: 'detached' });
    check('Escape leaves workspace usable', await page.locator('#portal-content').isVisible());
    await context.close();
}

async function reducedMotion(browser) {
    stage = 'reduced-motion';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    monitor(page);
    await enterWorkspace(page, 'Employee');
    await page.getByRole('button', { name: 'Yes, show me around', exact: true }).click();
    await advanceWizardToFinal(page);
    await page.getByRole('button', { name: 'Start guided tour', exact: true }).click();
    const spotlight = page.locator('[data-onboarding="tour-spotlight"]');
    await spotlight.waitFor({ state: 'visible' });
    const transition = await spotlight.evaluate((node) => getComputedStyle(node).transitionDuration);
    check('reduced motion disables spotlight transition', transition === '0s' || transition.split(',').every((value) => value.trim() === '0s'), transition);
    await page.getByRole('button', { name: 'Exit tour', exact: true }).click();
    await context.close();
}

async function protectedRegressionSmoke(browser) {
    stage = 'protected-regression-smoke';
    const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    monitor(page);
    await enterWorkspace(page, 'Employee');
    await page.getByRole('button', { name: 'No, enter workspace', exact: true }).click();

    for (const [route, label] of [['/dashboard', 'Dashboard'], ['/messages', 'Messages'], ['/calendar', 'Calendar'], ['/meetings', 'Meetings']]) {
        const response = await page.goto(BASE + route);
        check(label + ' regression route loads', response?.status() === 200, route + ' status=' + response?.status());
        await page.locator('#portal-content').waitFor({ state: 'visible' });
    }

    const nav = page.locator('nav[aria-label="Primary navigation"]');
    check('navigation remains present', await nav.isVisible());

    const publicPage = await context.newPage();
    monitor(publicPage);
    const publicResponse = await publicPage.goto(BASE + '/');
    check('public homepage regression route loads', publicResponse?.status() === 200, String(publicResponse?.status()));
    await context.close();
}

await write();
let browser;
try {
    browser = await chromium.launch({ headless: true, ...(process.env.QA_BROWSER_EXECUTABLE_PATH ? { executablePath: process.env.QA_BROWSER_EXECUTABLE_PATH } : {}) });
    await firstRunYes(browser);
    await firstRunNoAndPersistence(browser);
    await personaCompletionSwitchAndReplay(browser);
    await storageFailure(browser);
    await mobileViewport(browser);
    await desktopViewport(browser);
    await keyboardFocus(browser);
    await reducedMotion(browser);
    await protectedRegressionSmoke(browser);

    check('no browser page errors or server 5xx', diagnostics.length === 0, JSON.stringify(diagnostics));
    report.completed = true;
    report.diagnostics = diagnostics;
    await write();
    console.log('OW1_ONBOARDING_BROWSER_PASS checks=' + report.checks.length);
} catch (error) {
    report.completed = false;
    report.failure = { stage, error: error?.stack || String(error) };
    report.diagnostics = diagnostics;
    await write();
    console.error('OW1_ONBOARDING_BROWSER_FAIL stage=' + stage + ' error=' + (error?.message || error));
    process.exitCode = 1;
} finally {
    if (browser) await browser.close();
}
