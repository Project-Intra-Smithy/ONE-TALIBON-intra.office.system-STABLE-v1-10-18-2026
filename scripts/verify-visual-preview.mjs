import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const root = 'http://127.0.0.1:4173';
const out = 'artifacts/visual-fixture';
const screens = ['login', 'mfa', 'dashboard', 'work', 'correspondence', 'records', 'memoranda', 'calendar', 'employees', 'departments'];
const mobileScreens = ['login', 'dashboard', 'work', 'correspondence', 'calendar', 'employees'];
const server = spawn('npm', ['run', 'dev', '--', '--port', '4173', '--strictPort'], {
    stdio: 'pipe',
    env: { ...process.env, LARAVEL_BYPASS_ENV_CHECK: '1' },
});
let serverOutput = '';
for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => { serverOutput += chunk.toString(); });

async function waitForServer() {
    for (let i = 0; i < 60; i++) {
        if (server.exitCode !== null) throw new Error(`Vite exited: ${serverOutput}`);
        try { const response = await fetch(`${root}/visual-preview.html`); if (response.ok) return; } catch { /* start in progress */ }
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error(`Vite did not start: ${serverOutput}`);
}

let browser;
try {
    await mkdir(out, { recursive: true });
    await waitForServer();
    browser = await chromium.launch({ headless: true });
    for (const [viewport, list] of [
        [{ width: 1440, height: 900 }, screens],
        [{ width: 390, height: 844 }, mobileScreens],
    ]) {
        const mode = viewport.width === 390 ? 'mobile' : 'desktop';
        const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        for (const screen of list) {
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            await page.goto(`${root}/visual-preview.html?screen=${screen}`, { waitUntil: 'networkidle' });
            await page.locator('#visual-fixture-label strong').getByText('VISUAL FIXTURE').waitFor();
            try { await page.locator('#app h1:visible, #app h2:visible').first().waitFor({ timeout: 8000 }); }
            catch {
                await page.screenshot({ path: `${out}/${mode}-${screen}-failure.png`, fullPage: true });
                throw new Error(`${mode}/${screen} did not mount: ${errors.join('; ') || (await page.locator('body').innerText()).slice(0, 500)}; server: ${serverOutput.slice(-500)}`);
            }
            if (await page.getByRole('heading', { name: 'Something went wrong' }).count()) errors.push('Application error boundary rendered');
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
            if (overflow > 1) errors.push(`Horizontal overflow ${overflow}px`);
            await page.screenshot({ path: `${out}/${mode}-${screen}.png`, fullPage: true });
            if (errors.length) throw new Error(`${mode}/${screen}: ${errors.join('; ')}`);
            console.log(`PASS ${mode}/${screen}`);

            if (mode === 'mobile' && screen === 'dashboard') {
                await page.getByRole('button', { name: 'Open navigation' }).click();
                await page.getByRole('dialog', { name: 'Municipal navigation' }).waitFor();
                await page.screenshot({ path: `${out}/mobile-navigation.png`, fullPage: false });
                await page.keyboard.press('Escape');
                if (await page.getByRole('dialog', { name: 'Municipal navigation' }).count()) throw new Error('Mobile navigation did not close on Escape');
                console.log('PASS mobile navigation Escape');
            }
            if (mode === 'mobile' && screen === 'work') {
                await page.getByRole('button', { name: /^Filters/ }).click();
                await page.getByRole('dialog', { name: 'Queue filters' }).waitFor();
                await page.screenshot({ path: `${out}/mobile-work-filters.png`, fullPage: false });
                await page.keyboard.press('Escape');
                console.log('PASS mobile filter dialog Escape');
            }
            await page.close();
        }
        await context.close();
    }
} finally {
    await browser?.close();
    server.kill('SIGTERM');
}
