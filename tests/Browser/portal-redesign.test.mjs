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
const out = 'storage/app/qa/redesign-r1/screenshots';
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


// Existing production pages, synthetic transport only. No municipal records are created.
const office = { id: 1, code: 'TEST', name: 'Synthetic test office', shortName: 'Test Office' };
const evidence = { record: [], events: {} };
const timestamp = '2026-10-27T08:00:00+08:00';
const surfaces = [
    ['correspondence-detail', 'Correspondence/Show', { correspondence: { publicId: 'synthetic-cor', reference: 'TEST-COR', externalReference: 'TEST-EXT', lifecycleState: 'received', classification: 'internal', source: { senderName: 'Synthetic sender', source: 'external' }, content: { subject: 'Synthetic correspondence with a longer subject for readability' }, accountability: { currentOffice: office }, dates: { receivedAt: timestamp } }, timeline: [], capabilities: { canRegister: false, canClassify: false, canRoute: false, canAct: false }, routeOptions: [], evidence }],
    ['travel-detail', 'TravelOrders/Show', { travelOrder: { publicId: 'synthetic-travel', referenceNumber: 'TEST-TRAVEL', issuanceDate: '2026-10-27', purpose: 'Synthetic approved travel record for presentation checks', destination: 'Test destination', office, travelStartDate: '2026-11-01', travelEndDate: '2026-11-02', status: 'approved', issuedTo: [], issuedToCount: 0, events: [], eventCount: 0 }, evidence, capabilities: { canChangeStatus: false } }],
    ['memo-detail', 'Memoranda/Show', { memorandum: { id: 1, memo_number: 'TEST-MEMO', title: 'Synthetic memorandum for presentation checks', body: 'Synthetic test content. No municipal instruction or record.', classification: 'internal', audience_type: 'departments', requires_acknowledgement: false, published_at: timestamp, issuer: { name: 'Synthetic issuer' }, issuing_department: office }, recipient: null, canInspectIssuance: false, statistics: null }],
    ['work-detail', 'Transactions/Show', { transaction: { id: 1, reference_no: 'TEST-WORK', title: 'Synthetic work request for readable detail checks', description: 'Test transport only.', transaction_type: 'work_request', priority: 'normal', status: 'for_review', created_at: timestamp, origin_department: office, current_department: office, creator: { name: 'Synthetic creator' }, events: [] }, departments: [], assignableEmployees: [], accountability: { dueState: 'on_track', timeInCurrentOffice: '1 hour' }, transactionPermissions: { canTransition: false, canMayorDecision: false, canAssign: false }, evidence }],
    ['search', 'Search/Index', { archiveActivity: { sentCount: 0, receivedCount: 0, recentSent: [], recentReceived: [] } }],
    ['plans', 'Plans/Index', {}],
    ['ppas', 'PPAs/Index', {}],
    ['travel-create', 'TravelOrders/Create', { departments: [] }],
    ['memo-create', 'Memoranda/Create', { departments: [], employees: [], suggestedMemoNumber: '', authority: { canPublish: false, allowedAudienceTypes: [] } }],
    ['directory-profile', 'Employees/DirectoryProfile', { employee: { id: 1, number: 'TEST-001', name: 'Synthetic directory profile', email: null, position: 'Test position', office: null, presence: 'offline' }, isSelf: false }],
];
for (const width of [390, 768, 1024, 1280, 1440]) {
    for (const theme of ['light', 'dark']) {
        test(`Reference presentation surfaces ${width} ${theme}`, async () => {
            for (const [name, component, props] of surfaces) {
                install('dashboard');
                const data = structuredClone(pages.get('/dashboard'));
                data.component = component; data.url = `/visual-check/${name}`;
                Object.assign(data.props, props);
                pages.set(data.url, data);
                const { page, errors } = await mount(data.url, width);
                try {
                    await page.evaluate(theme => document.documentElement.classList.toggle('dark', theme === 'dark'), theme);
                    const scope = page.locator('.civic-page');
                    assert.ok(await scope.isVisible(), name);
                    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), name + ' overflow');
                    const control = scope.locator('a[href], button:not([disabled]), input:not([disabled])').first();
                    if (await control.count()) {
                        await control.focus();
                        assert.ok(await control.evaluate(el => el === document.activeElement && getComputedStyle(el).outlineStyle !== 'none'), name + ' visible keyboard focus');
                    }
                    if (name === 'memo-create') assert.ok(await page.getByRole('button', { name: 'Publish & Deliver' }).isDisabled());
                    assert.deepEqual(errors, [], name);
                    await page.evaluate(() => window.scrollTo(0, 0));
                    await page.screenshot({ path: `${out}/${name}-${width}-${theme}.png`, fullPage: true });
                } finally { await page.close(); }
            }
        });
    }
}
