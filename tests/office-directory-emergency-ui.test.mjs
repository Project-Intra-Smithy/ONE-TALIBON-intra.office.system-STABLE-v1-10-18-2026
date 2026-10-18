import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(path.join(root, 'resources/js/pages/Departments/Index.tsx'), 'utf8');
const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    reportDiagnostics: true,
});
assert.equal((result.diagnostics ?? []).filter((x) => x.category === ts.DiagnosticCategory.Error).length, 0);
const module = { exports: {} };
const stub = () => null;
const requireStub = (name) => {
    if (name === 'react') return { useState: () => ['', stub] };
    if (name === 'lucide-react') return new Proxy({}, { get: () => stub });
    if (name === 'react/jsx-runtime') return { jsx: stub, jsxs: stub };
    if (name.includes('PageFrame') || name.includes('PageHeader') || name.includes('AppLayout')) return { __esModule: true, default: stub };
    throw new Error('Unexpected import: ' + name);
};
new Function('require', 'module', 'exports', result.outputText)(requireStub, module, module.exports);
const { filterDirectoryEntries: filter, groupDirectoryEntries: grouped, safeRecordsHref: safe } = module.exports;
const labels = ['Planning','Executive','Legislative','Infrastructure','Finance','Administration','Social','Economic','Environment','Education','Transport','National Agency','Community','Community Partners'];
const counts = [1,2,2,2,4,4,9,8,2,1,1,1,1,2];
const entries = labels.flatMap((group, index) => Array.from({ length: counts[index] }, (_, item) => ({
    key: 'FOCAL-' + String(1 + counts.slice(0,index).reduce((a,b)=>a+b,0) + item).padStart(3,'0'),
    group,shortName:group + item,name:group + ' sample ' + item,responsibility:group + ' planning and permit services',
    backingDepartmentCode:null,recordsHref:null,routable:false,
})));
test('exported safeRecordsHref permits only literal /records and denies URL normalization escapes', () => {
    const entry = entries[0];
    assert.equal(safe({ ...entry, recordsHref: '/records' }), '/records');
    for (const href of [
        null, '', '/records/', '/records/123',
        '/records/../admin', '/records/%2e%2e/admin',
        '/records/%2E./admin', '/records/foo/../../messages',
        '/records?office=FOCAL-001', '/records#other',
        '/records/%2fadmin', '/records/%5cadmin',
        '/records%2fadmin', '/records//admin',
        '//evil.example', '/admin', 'javascript:alert(1)',
        'https://evil.example/records', 'http://127.0.0.1/records',
        'file:///records', 'https://[bad-url',
        String.raw`/records\private`, String.raw`\records`,
        String.raw`/records\..\admin`, '/records' + String.fromCharCode(0),
        ' /records', '/records ', '/RECORDS'
    ]) {
        assert.equal(safe({ ...entry, recordsHref: href }), null, `Unsafe target accepted: ${String(href)}`);
    }
});

test('synthetic 40/14 group shape is complete and ordered', () => {
    assert.equal(entries.length,40);
    const groups = grouped(entries,labels);
    assert.equal(groups.length,14);
    assert.deepEqual(groups.map(g => g.groupName),labels);
    assert.deepEqual(groups.map(g => g.entries.length),counts);
});
test('search and group intersect and no-match yields zero groups', () => {
    assert.equal(filter(entries, '  PLANnIng ', '').length,40);
    assert.equal(filter(entries, 'PERMIT','Finance').length,4);
    assert.equal(grouped(filter(entries,'NOTHING-XYZ',''),labels).length,0);
    assert.equal(filter(entries, 'anything', 'Finance').length,0);
    assert.equal(filter(entries,'  ','').length,40);
});
test('unknown group not silently lost and unsafe records URLs remain disabled', () => {
    assert.equal(grouped([{...entries[0],group:'Extra'}],labels)[0].groupName,'Extra');
    for(const href of [null,'','//evil.com','https://evil.com/records','javascript:alert(1)','/admin','/records?office=FOCAL-001','/records\\unsafe']){
        assert.equal(safe({...entries[0],recordsHref:href}),null);
    }
    assert.equal(safe({...entries[0],recordsHref:'/records'}),'/records');
});
test('no hard-coded directory catalog, Messaging URL, or Task mutations added', () => {
    assert.ok(source.includes('groupedVisible.map'));
    assert.ok(source.includes('aria-live="polite"'));
    assert.ok(source.includes('Records access unavailable'));
    assert.ok(!source.includes('FOCAL-040'));
    assert.ok(!source.includes('router.post('));
    assert.ok(!source.includes('/messages'));
});
