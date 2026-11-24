import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('F01: Transactions/Index routes New Work Request to canonical /transactions/create with zero fabricated drawer values', () => {
    const indexPage = read('resources/js/pages/Transactions/Index.tsx');
    // Primary action must link directly to canonical server-authorized create route
    assert.match(indexPage, /<Link\s+href="\/transactions\/create"[^>]*>[\s\S]*?New Work Request/);
    // Zero fabricated employee IDs, employee numbers, synthetic categories, or hardcoded action options
    assert.doesNotMatch(indexPage, /EMP-\$\{/);
    assert.doesNotMatch(indexPage, /id:\s*i\s*\+\s*1/);
    assert.doesNotMatch(indexPage, /branch:\s*['"]executive['"]/);
    assert.doesNotMatch(indexPage, /Approve & Endorse/);
    assert.doesNotMatch(indexPage, /Verify & Certify/);
    assert.doesNotMatch(indexPage, /<WorkRequestCreateForm/);
    // Preserves C2 conditional origin delivery exception queue link
    assert.match(indexPage, /originDeliveryQueueAvailable && \(/);
    assert.match(indexPage, /href="\/work-requests\/origin-delivery-exceptions"/);
});

test('F02: Dashboard consumes NotificationContext and NotificationStateContext inside AppLayout provider and never swallows task errors', () => {
    const dashboard = read('resources/js/pages/Dashboard.tsx');
    const layout = read('resources/js/layouts/AppLayout.tsx');

    // AppLayout must provide both NotificationStateContext and NotificationContext around children
    assert.match(layout, /<NotificationStateContext\.Provider value=\{feedState\}>/);
    assert.match(layout, /<NotificationContext\.Provider value=\{notifications\}>/);

    // Dashboard root component must NOT call useContext(NotificationContext) before <AppLayout>
    const rootFnEnd = dashboard.indexOf('function DashboardUpdatesPanel');
    assert.ok(rootFnEnd > 0, 'DashboardUpdatesPanel descendant component must exist');
    const rootBody = dashboard.slice(0, rootFnEnd);
    const panelBody = dashboard.slice(rootFnEnd);

    assert.doesNotMatch(rootBody, /useContext\(NotificationContext\)/, 'Dashboard root must not read NotificationContext outside AppLayout provider');
    assert.match(rootBody, /<DashboardUpdatesPanel\b/);

    // Descendant panel must consume both contexts and distinguish loading, expired, unavailable, and confirmed empty
    assert.match(panelBody, /useContext\(NotificationContext\)/);
    assert.match(panelBody, /useContext\(NotificationStateContext\)/);
    assert.match(panelBody, /feedState === 'loading'/);
    assert.match(panelBody, /feedState === 'expired'/);
    assert.match(panelBody, /feedState === 'unavailable'/);

    // Task preview must distinguish loading/unavailable from confirmed empty (no silent .catch(() => {}))
    assert.doesNotMatch(rootBody, /\.catch\(\(\)\s*=>\s*\{\s*\}\)/);
    assert.match(rootBody, /setTaskState\('unavailable'\)/);
    assert.match(rootBody, /taskState === 'unavailable'/);
});
