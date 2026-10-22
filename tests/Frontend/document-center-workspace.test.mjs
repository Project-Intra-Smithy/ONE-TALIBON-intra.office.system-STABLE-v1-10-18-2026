import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    fileCatalogQuery,
    fileSizeLabel,
    recordDateError,
    recordFiltersQuery,
    recordPaginationHref,
    safeDownloadHref,
    safeInternalHref,
} from '../../resources/js/components/documents/documentCenterNavigation.ts';

const records = (extra = {}) => ({
    search: '',
    record_type: 'all',
    state: '',
    office_id: null,
    date_from: '',
    date_to: '',
    ...extra,
});

test('record query filters are bounded to existing backend keys and preserve applied dates', () => {
    assert.deepEqual(recordFiltersQuery(records()), { mode: 'records', record_type: 'all' });
    assert.deepEqual(recordFiltersQuery(records({
        search: '  road order  ', record_type: 'correspondence', office_id: 3,
        state: 'routed', date_from: '2026-10-01', date_to: '2026-10-22',
    })), {
        mode: 'records', record_type: 'correspondence', search: 'road order',
        state: 'routed', office_id: 3, date_from: '2026-10-01', date_to: '2026-10-22',
    });
    assert.equal(recordDateError(records({ date_from: '2026-10-22', date_to: '2026-10-01' })),
        'The start date must not be after the end date.');
    assert.equal(recordDateError(records({ date_from: '2026-02-30' })), 'Enter a valid start date.');
    assert.equal(recordDateError(records({ date_from: '2026-10-01', date_to: '2026-10-22' })), null);
});

test('record pagination retains server filters and blocks foreign route navigation', () => {
    assert.equal(recordPaginationHref('https://example.invalid/documents?search=memorandum&page=2&mode=files'),
        '/documents?search=memorandum&page=2&mode=records');
    assert.equal(recordPaginationHref('/documents?page=4&office_id=9&date_from=2026-10-01'),
        '/documents?page=4&office_id=9&date_from=2026-10-01&mode=records');
    assert.equal(recordPaginationHref('https://example.invalid/admin?page=2'), '/documents?mode=records');
});

test('file catalog query preserves pagination, selection and already-authorized scopes', () => {
    const applied = {
        archive_scope: 'my_received', archive_search: 'old',
        document_type: '', classification: '', archive_office_id: null, archive_year: '',
    };
    const draft = { search: '  memo ', documentType: 'Report', classification: 'Restricted', officeId: '12', year: '2026' };
    assert.deepEqual(fileCatalogQuery(applied, draft, 3, 'file-uuid'), {
        mode: 'files', archive_scope: 'my_received', page: 3,
        archive_search: 'memo', document_type: 'Report', classification: 'Restricted',
        archive_office_id: '12', archive_year: '2026', document: 'file-uuid',
    });
    assert.deepEqual(fileCatalogQuery(applied, { search: '', documentType: '', classification: '', officeId: '', year: '' }, 0),
        { mode: 'files', archive_scope: 'my_received', page: 1 });
});

test('record links and download URLs are local, not external or inert placeholder actions', () => {
    assert.equal(safeInternalHref('/transactions/21'), '/transactions/21');
    assert.equal(safeInternalHref('//evil.example/transactions/21'), null);
    assert.equal(safeInternalHref('https://evil.example/transactions/21'), null);
    assert.equal(safeInternalHref('/transactions/21\nx'), null);
    assert.equal(safeDownloadHref('/documents/abc-123/download'), '/documents/abc-123/download');
    assert.equal(safeDownloadHref('/documents/abc-123/download?revision=1'), '/documents/abc-123/download?revision=1');
    assert.equal(safeDownloadHref('/documents/abc-123'), null);
    assert.equal(safeDownloadHref('javascript:alert(1)'), null);
    assert.equal(fileSizeLabel(0), '0 B');
    assert.equal(fileSizeLabel(null), 'Not supplied');
});

test('Documents page keeps records and file catalog separate and exposes loading/error state', () => {
    const index = readFileSync(new URL('../../resources/js/pages/Documents/Index.tsx', import.meta.url), 'utf8');
    const archive = readFileSync(new URL('../../resources/js/components/documents/DocumentArchive.tsx', import.meta.url), 'utf8');
    const register = readFileSync(new URL('../../resources/js/components/documents/DocumentRegister.tsx', import.meta.url), 'utf8');
    const collection = readFileSync(new URL('../../resources/js/components/documents/DocumentCollectionNav.tsx', import.meta.url), 'utf8');

    assert.match(index, /mode === 'files' \? <DocumentArchive/);
    assert.match(index, /aria-current=\{mode === 'records'/);
    assert.match(index, /recordDateError\(next\)/);
    assert.match(index, /recordPaginationHref\(href\)/);
    assert.match(index, /aria-live="polite"/);
    assert.match(index, /role="alert"/);
    assert.match(index, /formal transfer to municipal archives/);
    assert.match(archive, /fileCatalogQuery\(scoped, values, page, document\)/);
    assert.match(archive, /safeDownloadHref\(selected\?\.downloadUrl\)/);
    assert.match(archive, /aria-busy=\{loading\}/);
    assert.match(archive, /No authorized download link supplied/);
    assert.doesNotMatch(archive, />Archive state</);
    assert.match(register, /aria-expanded=\{selected\}/);
    assert.match(collection, /\{ label: 'Procurement Documents' \}/);
    assert.doesNotMatch(collection, /'Procurement Documents', destination: 'projectMonitoring'/);
});
