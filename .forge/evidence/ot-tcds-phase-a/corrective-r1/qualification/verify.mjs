import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const sha = '9ea015a8a3a6131a18ac6bb800edc9dbad0f065a';
const sealed = new Set();
for (const line of fs.readFileSync(path.join(root, 'SHA256SUMS'), 'utf8').trim().split('\n')) {
    const match = line.match(/^([0-9a-f]{64})  (.+)$/);
    assert.ok(match, 'Malformed checksum line');
    const [, hash, file] = match;
    assert.ok(!path.isAbsolute(file) && !file.split(/[\\/]/).includes('..') && !sealed.has(file));
    sealed.add(file);
    assert.equal(digest(fs.readFileSync(path.join(root, file))), hash, file);
}
const files = [];
function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const file = path.join(dir, entry.name);
        assert.ok(!entry.isSymbolicLink());
        if (entry.isDirectory()) walk(file);
        else files.push(path.relative(root, file).replaceAll('\\', '/'));
    }
}
walk(root);
assert.deepEqual([...sealed].sort(), files.filter(f => f !== 'SHA256SUMS').sort());
const inventory = read('publication-inventory.json');
assert.equal(inventory.sourceSha, sha);
assert.equal(new Set(inventory.files.map(f => f.file)).size, inventory.files.length);
for (const entry of inventory.files) {
    assert.ok(!path.isAbsolute(entry.file) && !entry.file.split(/[\\/]/).includes('..'));
    const bytes = fs.readFileSync(path.join(root, entry.file));
    assert.equal(bytes.length, entry.bytes, entry.file);
    assert.equal(digest(bytes), entry.sha256, entry.file);
}
for (const key of ['expanded', 'axe', 'focus', 'forced', 'previewTabs', 'regressions', 'followups', 'supplemental']) {
    const receipt = read('receipts/' + key + '.json');
    assert.equal(receipt.sourceSha, sha, key);
    assert.equal(receipt.completed, true, key);
    assert.equal(receipt.passed, true, key);
    if ('sourceWorktreeDirty' in receipt) assert.equal(receipt.sourceWorktreeDirty, false, key);
}
for (const key of ['municipal', 'core']) {
    const bytes = fs.readFileSync(path.join(root, 'receipts/' + key + '-build-manifest.json'));
    assert.equal(digest(bytes), read('receipts/' + key + '.json').buildManifestSha256, key + ' build manifest');
}
const municipal = read('receipts/municipal.json');
assert.equal(municipal.sourceSha, sha);
assert.equal(municipal.sourceWorktreeDirty, false);
assert.equal(municipal.completed, true);
assert.equal(municipal.passed, false, 'Original tool findings must not be rewritten as passed');
assert.equal(municipal.observations.length, 666);
assert.equal(municipal.tabChecks.length, 78);
assert.equal(municipal.observations.filter(o => o.incomplete.some(i => i.id === 'aria-prohibited-attr')).length, 0);
const findings = municipal.observations.filter(o => o.violations.length);
assert.equal(findings.length, 2);
assert.ok(findings.every(o => o.width === 320 && /^FUT-10-view-2-(light|dark)$/.test(o.label) && o.violations.length === 1 && o.violations[0].id === 'target-size'));
const review = read('receipts/target-review.json');
assert.equal(review.sourceSha, sha);
assert.equal(review.completed, true);
assert.equal(review.passed, true);
assert.equal(review.checks.length, 2);
assert.ok(review.checks.every(c => c.hidden.width === 32 && c.hidden.height === 32 && c.hidden.entirelyAboveOrBehindHeader && c.atRestViolationIds.length === 0 && c.focused.focused && c.focused.fullyClear && c.focused.hitCenter && c.focused.outlineWidth >= 2));
assert.equal(read('receipts/expanded.json').observations.length, 508);
assert.deepEqual(read('receipts/expanded.json').failures, []);
const protectedProof = read('receipts/protected-preservation.json');
assert.equal(protectedProof.successor, sha);
assert.equal(protectedProof.blobs.length, 616);
assert.ok(protectedProof.blobs.every(b => b.baseline === b.successor));
assert.deepEqual(protectedProof.changedProtectedPaths, []);
for (const key of ['backend', 'presentation']) {
    const run = read('receipts/hosted-' + key + '.json');
    assert.equal(run.head_sha, sha);
    assert.equal(run.status, 'completed');
    assert.equal(run.conclusion, 'success');
}
console.log('Verified exact-successor receipt identities, artifact hashes, manifests and bounded corrective invariants.');
