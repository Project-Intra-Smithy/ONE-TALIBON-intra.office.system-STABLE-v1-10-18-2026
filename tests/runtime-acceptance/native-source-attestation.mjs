// Native frontend integration: attest exact backend parent and 33 reviewed overlay blobs.
// This validation runs on a disposable test branch; never mutates production source.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const base = '92778ba06d992c278177e0354014ab1b77dbea82';
const source = 'd66c677c830b84326765cee9046b018a7c0ab91d';
const manifestPath = 'scripts/ci/frontend-reg-001/overlay-manifest.json';
const doc = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const must = (ok, what) => { if (!ok) throw new Error('NATIVE ASSEMBLY HOLD: ' + what); };
must(process.env.GITHUB_REPOSITORY === 'Project-Intra-Smithy/Talibon-Sales-Prototype', 'unexpected repository');
must(process.env.GITHUB_REF === 'refs/heads/forge/frontend-reg-001-native-integration-20261011', 'unexpected ref');
must(process.env.RUNNER_ENVIRONMENT === 'github-hosted', 'requires hosted isolated runner');
must(git('status', '--porcelain') === '', 'working tree changed');
must(git('merge-base', base, 'HEAD') === base, 'backend base must be an ancestor');
const merges = git('rev-list', '--min-parents=2', base + '..HEAD');
must(merges === '', 'merge commits forbidden in disposable integration branch');
must(doc.source.frontendCommit === source && doc.source.backendCommit === base, 'source tuple drift');
must(doc.files.length === 33 && new Set(doc.files.map(x => x.path)).size === 33, 'expected 33 unique overlay paths');
const allowed = new Set([
  '.github/workflows/frontend-reg-001-native-integration.yml',
  manifestPath,
  'scripts/ci/frontend-reg-001/db-preflight.mjs',
  'scripts/ci/frontend-reg-001/run-native.sh',
  'tests/runtime-acceptance/browser.mjs',
  'tests/runtime-acceptance/native-source-attestation.mjs',
]);
for (const item of doc.files) {
  must(/^(resources\/js\/|resources\/css\/)[\w./-]+$/.test(item.path) && !item.path.includes('..'), 'bad path');
  must(/^[a-f0-9]{40}$/.test(item.sourceGitBlob), 'bad source SHA');
  const full = path.resolve(root, item.path);
  must(full.startsWith(root + path.sep), 'path escape');
  let cur = root;
  for (const seg of item.path.split('/')) {
    cur = path.join(cur, seg);
    must(!fs.lstatSync(cur).isSymbolicLink(), 'symlink');
  }
  must(fs.statSync(full).isFile(), 'source not regular');
  must(git('hash-object', '--', item.path) === item.sourceGitBlob, 'source blob mismatch: ' + item.path);
  const old = execFileSync('git', ['ls-tree', base, '--', item.path], {encoding:'utf8'}).toString().trim();
  const oldSha = old ? old.split(/\s+/)[2] : null;
  must(oldSha === item.targetGitBlob, 'backend original blob mismatch: ' + item.path);
  allowed.add(item.path);
}
const changed = git('diff', '--name-only', base, 'HEAD').split('\n').filter(Boolean);
must(changed.length === allowed.size && changed.every(x => allowed.has(x)), 'changed-file scope mismatch');
const dest = process.env.RTCI_REPORT_DIR;
must(dest && dest.startsWith(process.env.RUNNER_TEMP + path.sep), 'report outside disposable runner');
fs.mkdirSync(dest, { recursive: true, mode: 0o700 });
fs.writeFileSync(path.join(dest, 'source-attestation.json'), JSON.stringify({
  verified: true,
  backend: base, frontend: source,
  integrationCommit: git('rev-parse', 'HEAD'),
  overlayCount: doc.files.length,
  verifiedSourceGitBlobs: doc.files.map(x => ({path:x.path, blob:x.sourceGitBlob})),
}, null, 2) + '\n', { mode: 0o600 });
console.log('FRONTEND-REG-001: 33 source blobs, parent and exclusive integration scope VERIFIED');