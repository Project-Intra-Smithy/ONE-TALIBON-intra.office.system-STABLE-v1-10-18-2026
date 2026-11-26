import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
const root = 'resources/js/components/municipal-systems/', ref = process.env.PHASE_A_REGRESSION_REF;
const files = fs.readdirSync(root).filter(f => f.endsWith('.tsx'));
const read = file => ref ? execFileSync('git', ['show', ref + ':' + root + file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) : fs.readFileSync(root + file, 'utf8');
const attr = (n, key) => n.attributes.properties.find(a => ts.isJsxAttribute(a) && a.name.getText() === key);
test('municipal generic containers never declare prohibited accessible names', () => {
    const invalid = [];
    for (const file of files) {
        if (ref && file === 'MunicipalTabs.tsx')
            continue;
        const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        function visit(n) { if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
            if (['div', 'span', 'p'].includes(n.tagName.getText()) && attr(n, 'aria-label') && !attr(n, 'role') && !n.attributes.properties.some(a => ts.isJsxSpreadAttribute(a) && /^(?:viewTabs|detailTabs)\.listProps$/.test(a.expression.getText())))
                invalid.push(file + ':' + (source.getLineAndCharacterOfPosition(n.getStart()).line + 1));
        } ts.forEachChild(n, visit); }
        visit(source);
    }
    assert.deepEqual(invalid, []);
});
test('all fourteen declared municipal tablists consume the shared keyboard and panel contract', () => {
    let shared = 0;
    const raw = [];
    for (const file of files) {
        if (file === 'MunicipalTabs.tsx')
            continue;
        const s = read(file);
        shared += (s.match(/\.listProps\}/g) ?? []).length;
        if (/role="tablist"|role="tab"/.test(s))
            raw.push(file);
        assert.equal((s.match(/<MunicipalTabPanels /g) ?? []).length, (s.match(/\.listProps\}/g) ?? []).length, file + ' panel ownership');
    }
    assert.deepEqual(raw, []);
    assert.equal(shared, 14);
});
