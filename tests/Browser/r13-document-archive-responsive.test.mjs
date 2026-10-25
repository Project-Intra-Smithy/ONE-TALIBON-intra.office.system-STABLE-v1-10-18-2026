import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// Source contract only. A real authenticated browser is required to certify scrollWidth.
const source = readFileSync(new URL('../../resources/js/components/documents/DocumentArchive.tsx', import.meta.url), 'utf8');
const form = source.match(/<form onSubmit=\{submit\}[\s\S]*?<\/form>/)?.[0] ?? '';
const toolbar = form.match(/<div className="([^"]+)"/)?.[1] ?? '';
const columnToken = toolbar.split(/\s+/).find((token) => token.includes('grid-cols-[')) ?? '';
const alignmentToken = toolbar.split(/\s+/).find((token) => token.endsWith(':items-end')) ?? '';

test('archive toolbar stays single-column at 1024px alongside the expanded sidebar', () => {
    assert.ok(form, 'archive filter form must exist');
    assert.equal(columnToken, 'xl:grid-cols-[minmax(260px,2fr)_repeat(4,minmax(120px,1fr))_auto]');
    assert.equal(alignmentToken, 'xl:items-end');
    assert.doesNotMatch(toolbar, /(?:^|\s)lg:(?:grid-cols-|items-end)/);
    for (const width of [390, 768, 1024, 1280, 1440]) {
        const wideToolbarEnabled = width >= 1280; // Tailwind xl breakpoint
        assert.equal(width >= 1280, wideToolbarEnabled);
        if (width === 1024) assert.ok(!wideToolbarEnabled, 'six columns may not start at 1024');
    }
});

test('all original filter inputs and actions remain in native keyboard order', () => {
    const ordered = [
        '<input value={search}',
        '<select value={documentType}',
        '<select value={classification}',
        '<select value={officeId}',
        '<select value={year}',
        '<button className="min-h-10',
        '<button type="button" onClick={clear}',
    ];
    const positions = ordered.map((selector) => {
        const at = form.indexOf(selector);
        assert.ok(at >= 0, 'missing archive control: ' + selector);
        return at;
    });
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
    assert.equal((form.match(/<label className="block min-w-0">/g) ?? []).length, 5);
    assert.doesNotMatch(form, /className="[^"]*\b(?:overflow-x-hidden|invisible|hidden)\b/);
    assert.doesNotMatch(form, /\btabIndex=\{-1\}/);
});

test('archive reads, GET filters and protected links are unchanged by responsive refinement', () => {
    for (const contract of [
        "mode: 'files'",
        "router.get('/documents'",
        'archive_scope: archive.filters.archive_scope',
        'archive_search: search',
        'document_type: documentType',
        'classification: classification',
        'archive_office_id: officeId',
        'archive_year: year',
        'archive.records.data.map',
        'selected.downloadUrl',
    ]) assert.ok(source.includes(contract), 'missing archive contract: ' + contract);
    assert.doesNotMatch(form, /overflow-x-hidden/);
});
