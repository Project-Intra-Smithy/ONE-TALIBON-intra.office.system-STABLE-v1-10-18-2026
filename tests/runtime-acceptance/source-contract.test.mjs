import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const yaml = fs.readFileSync(path.join(root, '.github/workflows/frontend-reg-001-runtime-acceptance.yml'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'scripts/ci/frontend-reg-001/overlay-manifest.json'), 'utf8'));

test('manual workflow is inert on CI branch, hosted-only and read-only', () => {
  assert.match(yaml, /^on:\s*\n\s{2}workflow_dispatch:\s*$/m);
  assert.doesNotMatch(yaml, /^\s{2}(push|pull_request|pull_request_target|schedule|workflow_run|repository_dispatch):/m);
  assert.match(yaml, /^\s{4}runs-on: ubuntu-latest$/m);
  assert.doesNotMatch(yaml, /runs-on:\s*\[[^\]]*self-hosted|runs-on:\s*self-hosted/i);
  assert.match(yaml, /^permissions:\s*\n\s{2}contents: read$/m);
  assert.match(yaml, /timeout-minutes: 30/);
  assert.match(yaml, /github\.ref == 'refs\/heads\/main'/);
  assert.match(yaml, /RTCI_APPROVED_SHA/);
  assert.match(yaml, /RTCI_BILLING_HARD_STOP_CONFIRMED/);
  assert.match(yaml, /RT_CI_BACKEND_CONTENTS_READ_TOKEN/);
  assert.match(yaml, /persist-credentials: false/g);
  assert.doesNotMatch(yaml, /\$\{\{\s*secrets\.GITHUB_TOKEN\s*\}\}|pull_request_target/);
});

test('canonical source tuple is immutable, includes repaired PR9 identities and no preview-only paths', () => {
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.source.frontendCommit, 'd66c677c830b84326765cee9046b018a7c0ab91d');
  assert.equal(manifest.source.backendCommit, '92778ba06d992c278177e0354014ab1b77dbea82');
  assert.equal(manifest.files.length, 33);
  const paths = manifest.files.map(v => v.path);
  assert.equal(new Set(paths).size, paths.length);
  for (const path of paths) {
    assert.match(path, /^resources\/(js|css)\/[A-Za-z0-9_./-]+$/);
    assert.ok(!path.includes('..') && !path.endsWith('.php'));
  }
  for (const path of ['resources/js/navigation/portalNavigation.ts', 'resources/js/layouts/AppLayout.tsx', 'resources/js/components/PageFrame.tsx']) {
    assert.ok(paths.includes(path), 'PR9 repaired path absent: ' + path);
  }
  assert.ok(!paths.includes('resources/js/types.ts'));
  assert.ok(!paths.includes('resources/js/visual-fixtures.ts'));
  assert.ok(!paths.includes('resources/js/visual-preview.tsx'));
  assert.ok(!paths.some(p => p.startsWith('routes/') || p.startsWith('app/')));
  for (const item of manifest.files) {
    assert.match(item.sourceGitBlob, /^[a-f0-9]{40}$/);
    assert.ok(item.targetGitBlob === null || /^[a-f0-9]{40}$/.test(item.targetGitBlob));
  }
});

test('all privileged prerequisites are explicit and no non-allowlisted source files are staged', () => {
  const assembly = fs.readFileSync(path.join(root, 'scripts/ci/frontend-reg-001/assemble.mjs'), 'utf8');
  const db = fs.readFileSync(path.join(root, 'scripts/ci/frontend-reg-001/db-preflight.mjs'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'scripts/ci/frontend-reg-001/run-native.sh'), 'utf8');
  const browser = fs.readFileSync(path.join(root, 'tests/runtime-acceptance/browser.mjs'), 'utf8');
  assert.match(assembly, /hash-object/);
  assert.match(assembly, /sha256/);
  assert.match(assembly, /symbolicLink|SymbolicLink/);
  assert.match(db, /RUNNER_ENVIRONMENT/);
  assert.match(db, /phpunit.xml/);
  assert.match(db, /relations !== '0'/);
  assert.match(script, /migrate:fresh --seed --force/);
  assert.match(script, /trap cleanup EXIT INT TERM/);
  assert.match(browser, /CSRF_LOGIN_419/);
  assert.match(browser, /CSRF_TASK_419_JSON/);
  assert.match(browser, /TASK_CROSS_OWNER_404/);
  assert.match(browser, /NOT_RUN/);
});
