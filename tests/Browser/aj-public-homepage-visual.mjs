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

        await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60_000 });

        const hero = page.getByRole('heading', { name: 'TALIBON, BOHOL' });
        await hero.waitFor({ state: 'visible', timeout: 15_000 });

        const requiredText = [
            'Quick Services',
            'Talibon at a Glance',
            'MDRRMO Advisories',
            'Upcoming Events',
            'Transparency & Public Documents',
        ];

        for (const text of requiredText) {
            const locator = page.getByText(text, { exact: true }).first();
            await locator.waitFor({ state: 'visible', timeout: 15_000 });
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

        if (metrics.scrollWidth > metrics.clientWidth + 2) {
            throw new Error(`Horizontal overflow at ${viewport.name}: ${metrics.scrollWidth}px > ${metrics.clientWidth}px`);
        }

        const brokenImages = metrics.images.filter(image => image.naturalWidth === 0 || image.naturalHeight === 0);
        if (brokenImages.length) {
            throw new Error(`Broken public images at ${viewport.name}: ${JSON.stringify(brokenImages)}`);
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

console.log(`PUBLIC_HOMEPAGE_VISUAL_PASS viewports=${viewports.length}`);
