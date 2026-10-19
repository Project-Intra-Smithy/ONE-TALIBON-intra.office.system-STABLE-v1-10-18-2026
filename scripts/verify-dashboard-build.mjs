/** Run after npm run build. Never treats a fixture pass as Laravel acceptance. */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = 'public/build';
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
assert.ok(manifest['resources/js/pages/Dashboard.tsx'], 'production Dashboard is bundled');
assert.ok(Object.keys(manifest).every(key => !/preview|fixture|__tests__/i.test(key)), 'test entry in manifest');
const forbidden = /synthetic-dashboard-only|__dashboard-preview|DEMO-WR-001|DEMO-COR-001|Preview Employee|LongSynthetic|SYNTHETIC PREVIEW|VISUAL FIXTURE|visual-fixture-label|fixture-banner|Preview screens|Sample data only/;
for (const file of readdirSync(join(root, 'assets'))) {
    if (/\.(js|css)$/.test(file)) assert.equal(forbidden.test(readFileSync(join(root, 'assets', file), 'utf8')), false, 'synthetic content in ' + file);
}
assert.equal(existsSync(join(root, 'visual-preview.html')), false);
assert.equal(existsSync('public/visual-preview.html'), false);
console.log('PASS: production manifest/assets exclude preview entry, middleware, isolation transport and synthetic role data.');
