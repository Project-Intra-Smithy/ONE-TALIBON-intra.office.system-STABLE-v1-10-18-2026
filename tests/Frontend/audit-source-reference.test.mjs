import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const source = readFileSync(new URL('../../resources/js/pages/Audit/Index.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const exports = {};
const require = createRequire(import.meta.url);
runInNewContext(compiled, { exports, require: name => name === 'react/jsx-runtime' ? require(name) : {} });
const render = source => renderToStaticMarkup(React.createElement(exports.SourceReferenceLink, { source }));

test('null and malformed references render no link or protected text', () => {
    for (const source of [null, undefined, {}, { kind: 'transaction', href: '/transactions/1', reference: '' },
        { kind: 'unknown', href: '/transactions/1', reference: 'SECRET' },
        ...['javascript:alert(1)', '//foreign.test', '/transactions/1?secret=x', '/transactions/1/extra', '/documents/1/preview'].map(href => ({ kind: 'transaction', reference: 'SECRET', href }))]) {
        assert.equal(render(source), '');
    }
});

test('transaction link is a native keyboard-accessible anchor with visible reference', () => {
    const html = render({ kind: 'transaction', href: '/transactions/12', reference: 'WR-12' });
    assert.match(html, /href="\/transactions\/12"/);
    assert.match(html, /View source: WR-12/);
    assert.match(html, /focus-visible:ring-2/);
    assert.match(html, /max-w-full break-all/);
    assert.doesNotMatch(html, /target=|tabindex="-1"|data-/);
});

test('PDF uses a native new tab, announces it, and safely escapes reference text', () => {
    const html = render({ kind: 'document', href: '/documents/12345678-abcd-abcd-abcd-123456789abc/preview', reference: '<unsafe>' });
    assert.match(html, /target="_blank" rel="noopener noreferrer"/);
    assert.match(html, /View PDF: &lt;unsafe&gt;/);
    assert.match(html, /opens in a new tab/);
    assert.doesNotMatch(html, /download=|iframe|<unsafe>/);
});
