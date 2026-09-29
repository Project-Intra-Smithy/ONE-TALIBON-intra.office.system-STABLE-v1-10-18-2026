import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.QA_BASE_URL ?? 'http://127.0.0.1:8000';
const outputDir = process.env.QA_OUTPUT_DIR ?? 'storage/app/qa/public-homepage';

const viewports = [
    { name: 'mobile-390x844', width: 390, height: 844 },
    { name: 'tablet-768x1024', width: 768, height: 1024 },
    { name: 'desktop-1366x768', width: 1366, height: 768 },
    { name: 'desktop-1920x1080', width: 1920, height: 1080 },
];

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });

try {
    for (const viewport of viewports) {
        const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
        const applicationErrors = [];

        page.on('pageerror', error => applicationErrors.push(error.message));
        page.on('console', message => {
            if (message.type() === 'error') applicationErrors.push(message.text());
        });

        await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });

        await page.getByRole('heading', { name: 'TALIBON INTRA-OFFICE PORTAL' }).waitFor({ state: 'visible', timeout: 15_000 });

        const requiredText = [
            'Tools for authorized municipal work',
            'One municipality. Connected internal work.',
            'AUTHORIZED EMPLOYEE ACCESS',
            'Portal Help & Support',
        ];

        for (const text of requiredText) {
            await page.getByText(text, { exact: true }).first().waitFor({ state: 'visible', timeout: 15_000 });
        }

        const login = page.getByRole('link', { name: /Employee Login|Open Employee Portal/ }).first();
        await login.waitFor({ state: 'visible', timeout: 15_000 });

        const removedPublicWebsiteLabels = [
            'Quick Services',
            'MDRRMO Advisories',
            'Upcoming Events',
            'Transparency & Public Documents',
            'Latest Projects',
        ];

        for (const text of removedPublicWebsiteLabels) {
            if (await page.getByText(text, { exact: true }).count()) {
                throw new Error(`Public-LGU scope label still rendered at ${viewport.name}: ${text}`);
            }
        }

        const metrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: document.documentElement.clientWidth,
            images: Array.from(document.images).map(image => ({
                src: image.currentSrc || image.src,
                naturalWidth: image.naturalWidth,
                naturalHeight: image.naturalHeight,
            })),
        }));

        if (metrics.scrollWidth !== metrics.clientWidth) {
            throw new Error(`Horizontal overflow at ${viewport.name}: ${metrics.scrollWidth}px != ${metrics.clientWidth}px`);
        }

        const brokenImages = metrics.images.filter(image => image.naturalWidth === 0 || image.naturalHeight === 0);
        if (brokenImages.length) {
            throw new Error(`Broken public images at ${viewport.name}: ${JSON.stringify(brokenImages)}`);
        }

        if (applicationErrors.length) {
            throw new Error(`Browser application errors at ${viewport.name}: ${JSON.stringify(applicationErrors)}`);
        }

        await page.screenshot({
            path: path.join(outputDir, `${viewport.name}.png`),
            fullPage: true,
        });

        await page.close();
    }
} finally {
    await browser.close();
}

console.log(`INTRA_OFFICE_GATEWAY_VISUAL_PASS viewports=${viewports.length}`);
