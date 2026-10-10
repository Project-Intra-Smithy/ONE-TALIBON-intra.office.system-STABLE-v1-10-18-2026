// RT-CI-001: exact, file-by-file frontend overlay onto an ephemeral canonical Laravel checkout.
// Remote backend is read-only; this script mutates ONLY a disposable runner checkout.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const fail = (message) => { throw new Error('RT-CI ASSEMBLY HOLD: ' + message); };
const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');
const git = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const root = path.resolve(process.cwd());
const frontend = path.resolve(process.argv[2] || '');
const backend = path.resolve(process.argv[3] || '');
const output = path.resolve(process.env.RTCI_REPORT_DIR || path.join(root, 'rtci-report'));
const manifestPath = path.join(root, 'scripts/ci/frontend-reg-001/overlay-manifest.json');

function safePath(base, relative, allowMissing) {
  if (!/^(resources\/js\/|resources\/css\/)[\w./-]+$/.test(relative) || relative.includes('..') || path.isAbsolute(relative)) {
    fail('path not allowlisted: ' + relative);
  }
  const resolved = path.resolve(base, relative);
  if (!resolved.startsWith(base + path.sep)) fail('path containment failure: ' + relative);
  let cursor = base;
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part);
    if (!fs.existsSync(cursor)) {
      if (!allowMissing) fail('source path is missing: ' + relative);
      break;
    }
    if (fs.lstatSync(cursor).isSymbolicLink()) fail('symlink forbidden: ' + relative);
  }
  return resolved;
}
const doc = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const expectedFrontend = 'd66c677c830b84326765cee9046b018a7c0ab91d';
const expectedBackend = '92778ba06d992c278177e0354014ab1b77dbea82';
if (doc.schemaVersion !== 1 || doc.source.frontendCommit !== expectedFrontend || doc.source.backendCommit !== expectedBackend) fail('manifest source tuple not pinned');
if (!Array.isArray(doc.files) || doc.files.length !== 33) fail('unexpected file count');
if (git(frontend, 'rev-parse', 'HEAD') !== expectedFrontend) fail('frontend exact SHA mismatch');
if (git(backend, 'rev-parse', 'HEAD') !== expectedBackend) fail('backend exact SHA mismatch');
if (git(backend, 'status', '--porcelain') !== '') fail('backend checkout not clean before overlay');
if (git(frontend, 'status', '--porcelain') !== '') fail('frontend checkout not clean before overlay');

const seen = new Set();
const prepared = [];
for (const file of doc.files) {
  if (!file || typeof file.path !== 'string' || !/^[a-f0-9]{40}$/.test(file.sourceGitBlob)) fail('invalid manifest record');
  if (seen.has(file.path)) fail('duplicate manifest path');
  seen.add(file.path);
  const src = safePath(frontend, file.path, false);
  const dst = safePath(backend, file.path, file.targetGitBlob === null);
  if (!fs.statSync(src).isFile()) fail('non-regular source: ' + file.path);
  const actualSource = git(frontend, 'hash-object', '--', file.path);
  if (actualSource !== file.sourceGitBlob) fail('source blob diverged: ' + file.path);
  const exists = fs.existsSync(dst);
  if (file.targetGitBlob === null) {
    if (exists) fail('unexpected existing target: ' + file.path);
  } else {
    if (!exists || !/^[a-f0-9]{40}$/.test(file.targetGitBlob)) fail('target integrity metadata missing');
    if (git(backend, 'hash-object', '--', file.path) !== file.targetGitBlob) fail('target blob diverged: ' + file.path);
  }
  prepared.push({ path: file.path, src, dst, sourceGitBlob: actualSource, sourceSha256: sha256(fs.readFileSync(src)), targetGitBlob: file.targetGitBlob });
}
if (seen.has('resources/js/types.ts') || Array.from(seen).some(p => p.endsWith('.php'))) fail('protected source selected');
for (const file of prepared) {
  fs.mkdirSync(path.dirname(file.dst), { recursive: true });
  fs.copyFileSync(file.src, file.dst);
  if (sha256(fs.readFileSync(file.dst)) !== file.sourceSha256) fail('copy integrity failed: ' + file.path);
}
fs.mkdirSync(output, { recursive: true });
const attestation = {
  schemaVersion: 1,
  sourceTuple: doc.source,
  manifestSha256: sha256(fs.readFileSync(manifestPath)),
  selectedFileCount: prepared.length,
  files: prepared.map(({ path, sourceGitBlob, sourceSha256, targetGitBlob }) => ({ path, sourceGitBlob, sourceSha256, targetGitBlob })),
  // No secrets, environment dumps or file contents are recorded.
};
fs.writeFileSync(path.join(output, 'source-attestation.json'), JSON.stringify(attestation, null, 2) + '\n', { mode: 0o600 });
console.log('RT-CI source tuple and selective overlay SHA-256 attested: ' + prepared.length + ' files; manifest=' + attestation.manifestSha256);
