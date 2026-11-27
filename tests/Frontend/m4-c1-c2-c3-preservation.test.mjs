import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

test('C1: TransactionLiveQuery and Show.tsx preserve canClose, Close Work Request outcome, and N03 custody gate', () => {
    const liveQuery = read('../../app/Services/TransactionLiveQuery.php');
    const showPage = read('../../resources/js/pages/Transactions/Show.tsx');
    const workflowService = read('../../app/Services/TransactionWorkflowService.php');

    assert.match(liveQuery, /'canClose'\s*=>\s*\$canClose/);
    assert.match(liveQuery, /'allowedActions'\s*=>\s*\$allowedActions/);
    assert.match(showPage, /canClose:\s*boolean/);
    assert.match(showPage, /Close Work Request/);
    assert.match(showPage, /permissions\.canClose && tx\.status === 'for_review' && liveState !== 'expired'/);
    assert.match(showPage, /disabled=\{form\.processing \|\| !form\.data\.remarks\.trim\(\)\}/);
    assert.match(showPage, /transition\('close'\)/);
    assert.match(workflowService, /Work Request completion requires the verified N03 custody path/);
});

test('C1 / P2 OT-QA-R1-001: repeat Mark for Review is suppressed when already for_review', () => {
    const showPage = read('../../resources/js/pages/Transactions/Show.tsx');
    const liveQuery = read('../../app/Services/TransactionLiveQuery.php');

    assert.match(showPage, /MARK_REVIEW_ELIGIBLE_STATES = \['submitted', 'returned', 'information_requested'\]/);
    assert.match(showPage, /canMarkReview && \(/);
    assert.match(liveQuery, /\$rule->allowsFrom\(\$transaction->status\)/);
});

test('C2: Transactions/Index.tsx and DeliveryExceptions.tsx preserve originDeliveryQueueAvailable conditional link and queue', () => {
    const indexPage = read('../../resources/js/pages/Transactions/Index.tsx');
    const deliveryPage = read('../../resources/js/pages/Transactions/DeliveryExceptions.tsx');
    const controller = read('../../app/Http/Controllers/TransactionController.php');

    assert.match(controller, /\$workspace\['originDeliveryQueueAvailable'\]\s*=\s*\$request->user\(\)->isRole\('department_head'\)/);
    assert.match(indexPage, /originDeliveryQueueAvailable\?:\s*boolean/);
    assert.match(indexPage, /originDeliveryQueueAvailable && \(/);
    assert.match(indexPage, /href="\/work-requests\/origin-delivery-exceptions"/);
    assert.match(indexPage, /Origin notice exceptions/);
    assert.match(deliveryPage, /\/work-requests\/origin-delivery-exceptions\//);
});

test('C3: TCDS v2 CommandPalette only navigates to server-authorized navigationGroups and never imports synthetic planning store', () => {
    const palette = read('../../resources/js/components/shell/CommandPalette.tsx');

    assert.match(palette, /navigationGroups\.flatMap/);
    assert.doesNotMatch(palette, /loadPlanningMaps|localStorage\.getItem\(['"]ot\./);
});
