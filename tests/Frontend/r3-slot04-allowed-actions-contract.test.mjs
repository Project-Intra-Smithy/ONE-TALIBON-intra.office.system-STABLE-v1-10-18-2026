import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = readFileSync(fileURLToPath(new URL('../../resources/js/pages/Transactions/Show.tsx', import.meta.url)), 'utf8');

test('transaction actions fail closed without server allowed_actions', () => {
    assert.match(source, /allowed_actions\?: string\[\]/);
    assert.match(source, /Array\.isArray\(initialAllowedActions\) \? initialAllowedActions : \[\]/);
    assert.match(source, /Array\.isArray\(payload\.allowed_actions\) \? payload\.allowed_actions : \[\]/);
    assert.match(source, /liveState === 'current' && allowedActions\.includes\(action\)/);
    assert.doesNotMatch(source, /\{permissions\.canTransition && \(/);
    assert.doesNotMatch(source, /\{permissions\.canMayorDecision && \(/);
    assert.doesNotMatch(source, /transition\('close'\)|transition\('complete'\)/);
});

test('each rendered transition button is guarded by its exact server action', () => {
    for (const action of ['assign', 'mark_review', 'send_to_mayor', 'return_origin', 'forward', 'approve', 'disapprove', 'request_information']) {
        assert.ok(source.includes(`{mayAct('${action}')`), `Missing exact guard for ${action}`);
    }
});

test('stale responses and submission failures revoke action inventory and provide recovery', () => {
    assert.match(source, /setAllowedActions\(\[\]\); setLiveState\('stale'\)/);
    assert.match(source, /onError: \(\) => \{/);
    assert.match(source, /submissionLock\.current \|\| form\.processing \|\| !mayAct\(action\)/);
    assert.match(source, /Refresh transaction/);
    assert.match(source, /Object\.entries\(form\.errors\)/);
});
