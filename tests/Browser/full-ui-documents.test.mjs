/** Built app.tsx + real Inertia bootstrap/navigation. HTTP props are test-controlled,
 * NOT authenticated Laravel evidence. No alternate page, resolver or preview entry. */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { chromium } from 'playwright';
import { fixturePage } from './ux-fixtures.ts';

let browser, server, root, manifest;
let pages = new Map();
const requests = [];
const out = 'storage/app/qa/full-ui/screenshots';
const scriptJson = data => JSON.stringify(data).replaceAll('<', '\\u003c');
function install(screen, role = 'employee', change = () => {}) {
    const data = structuredClone(fixturePage(screen, role));
    data.props.auth.user.name = 'Transport Actor';
    change(data.props);
    const page = { ...data, props: { ...data.props, errors: {} }, version: null,
        clearHistory: false, encryptHistory: false, rescuedProps: [], flash: {}, rememberedState: {} };
    pages.set(data.url, page);
    return data.url;
}

before(async () => {
    await mkdir(out, { recursive: true });
    // Reuse only when the caller has just built this exact worktree.
    if (process.env.REDESIGN_USE_EXISTING_BUILD !== '1') {
        const { stdout, stderr } = await promisify(execFile)(process.execPath, ['node_modules/vite/bin/vite.js', 'build']);
        await import('node:fs/promises').then(fs => fs.writeFile(`${out}/entry-build.log`, stdout + stderr));
    }
    manifest = JSON.parse(await readFile('public/build/manifest.json', 'utf8'));
    try { browser = await chromium.launch({ channel: 'chrome' }); }
    catch { browser = await chromium.launch(); }
    server = createServer(async (req, res) => {
        try {
            const path = new URL(req.url, 'http://localhost').pathname;
            requests.push({ url: req.url, inertia: req.headers['x-inertia'] });
            if (/^\/(build\/assets|images|brand)\//.test(path) && !path.includes('..')) {
                const contentType = path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.svg') ? 'image/svg+xml' : 'image/jpeg';
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(await readFile(`public${path}`));
                return;
            }
            if (path === '/notifications/feed' || path === '/tasks') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(path === '/tasks' ? { data: [], meta: { page: 1, per_page: 10, last_page: 1, total: 0 } } : { notifications: [], unreadMemoCount: 0, pendingMemo: null }));
                return;
            }
            const data = pages.get(path);
            if (!data) { res.writeHead(404); res.end(); return; }
            const body = structuredClone({ ...data, url: req.url });
            if (path === '/calendar') {
                const params = new URL(req.url, 'http://localhost').searchParams;
                body.props.calendar.view = params.get('view') || body.props.calendar.view;
                body.props.calendar.anchor_date = params.get('date') || body.props.calendar.anchor_date;
            }
            if (req.headers['x-inertia']) {
                res.writeHead(200, { 'Content-Type': 'application/json', 'X-Inertia': 'true', Vary: 'X-Inertia' });
                res.end(JSON.stringify(body));
            } else {
                const entry = manifest['resources/js/app.tsx'];
                const css = new Set([manifest['resources/css/app.css'].file, ...(entry.css || [])]);
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="csrf-token" content="synthetic-csrf">${[...css].map(file => `<link rel="stylesheet" href="/build/${file}">`).join('')}</head><body><script data-page="app" type="application/json">${scriptJson(body)}</script><div id="app"></div><script type="module" src="/build/${entry.file}"></script></body></html>`);
            }
        } catch (error) { res.writeHead(500); res.end(String(error)); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    root = `http://127.0.0.1:${server.address().port}`;
});
after(async () => { await browser?.close(); await new Promise(resolve => server ? server.close(resolve) : resolve()); });

async function mount(path, width = 1440) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(root + path);
    try { await page.locator('#portal-content h1').waitFor({ timeout: 10000 }); }
    catch (error) {
        const detail = JSON.stringify({ errors, text: await page.locator('body').innerText(), requests: requests.slice(-12) });
        await page.close();
        throw new Error(`${error.message}\n${detail}`);
    }
    return { page, errors };
}


// Real application entry with synthetic HTTP props; not authenticated Laravel QA.


function documentsPage(mode) {
    install('records');
    const data = structuredClone(pages.get('/records'));
    data.component = 'Documents/Index'; data.url = '/documents';
    const item = { publicId: 'sample-file', name: 'Office coordination and supporting documents.pdf', title: 'Coordination evidence', documentType: 'PDF', documentTypeValue: 'pdf', classification: 'Internal', classificationValue: 'internal', sizeBytes: 2048, uploadedBy: 'Synthetic staff', uploadedByMe: true, uploadedAt: '2026-10-26T10:35:00+08:00', relationship: 'Supporting evidence', direction: 'upload', downloadUrl: '/documents/sample-file/download', ownerOffice: { id: 1, name: 'Sample Office', code: 'SAMPLE' } };
    data.props.mode = mode;
    data.props.archive = { records: { data: [item], total: 1, current_page: 1, last_page: 1, per_page: 20 }, selected: item,
        counts: { all: 1, my_sent: 0, my_received: 0, my_uploads: 1 },
        filters: { archive_scope: 'all', archive_search: '', document_type: '', classification: '', archive_office_id: null, archive_year: '' },
        filterOptions: { documentTypes: ['pdf'], classifications: ['internal'], years: ['2026'], offices: [{ id: 1, code: 'SAMPLE', name: 'Sample Office' }] } };
    pages.set(data.url, data); return data.url;
}
for (const width of [390, 768, 1024, 1280, 1440]) {
    for (const theme of ['light', 'dark']) {
        test(`Document Center ${width} ${theme}`, async () => {
            for (const mode of ['records', 'files']) {
                const { page, errors } = await mount(documentsPage(mode), width);
                try {
                    await page.evaluate(theme => document.documentElement.classList.toggle('dark', theme === 'dark'), theme);
                    if (mode === 'records') {
                        await page.locator('.dc-record-title button').first().click();
                        assert.ok(await page.locator('.dc-inline-metadata').isVisible());
                        await page.locator('.dc-inline-metadata').getByRole('button', { name: 'Close document metadata' }).click();
                        assert.equal(await page.locator('.dc-inline-metadata').count(), 0);
                        await page.getByLabel('Search authorized records').fill('office');
                        await page.getByRole('form', { name: 'Document search and filters' }).getByRole('button', { name: 'Search', exact: true }).click();
                        await page.waitForURL(/search=office/);
                        await page.locator('.dc-record-title button').first().click();
                    } else {
                        assert.equal(await page.getByRole('link', { name: 'Download', exact: true }).getAttribute('href'), '/documents/sample-file/download');
                        await page.getByPlaceholder('Filename, record, office...').fill('coordination');
                        await page.getByRole('button', { name: /^Apply/ }).click();
                        await page.waitForURL(/archive_search=coordination/);
                    }
                    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'No document viewport overflow');
                    const small = await page.locator('.aj-documents button, .aj-documents input, .aj-documents select').evaluateAll(els => els.filter(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height < 43).map(el => el.textContent));
                    assert.deepEqual(small, [], 'Document touch controls');
                    await page.evaluate(() => window.scrollTo(0, 0));
                    await page.screenshot({ path: `${out}/documents-${mode}-${width}-${theme}.png`, fullPage: true });
                    assert.deepEqual(errors, []);
                } finally { await page.close(); }
            }
        });
    }
}
