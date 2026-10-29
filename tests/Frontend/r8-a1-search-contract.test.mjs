import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../../resources/js/pages/Search/Index.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../../resources/css/r8-search.css', import.meta.url), 'utf8');

test('uses permission-filtered destinations and preserves portal q', () => {
    assert.match(page, /buildPortalNavigation\(workspaceExperience, permissions\.navigation\)/);
    assert.match(page, /searchParams\.get\('q'\)/);
    assert.match(page, /searchParams\.set\('q', query\)/);
    assert.match(page, /searchParams\.delete\('q'\)/);
    assert.match(page, /setQuery\(urlQuery\)/);
});

test('all type, office, year and status filters constrain local results', () => {
    for (const predicate of ["item.kind === scope", "item.office === office", "item.year === year", "item.status === status"]) {
        assert.ok(page.includes(predicate), 'missing filter: ' + predicate);
    }
    assert.match(page, /setScope\('all'\)/);
    assert.match(page, /setOffice\(''\)/);
    assert.match(page, /setYear\(''\)/);
    assert.match(page, /setStatus\(''\)/);
});

test('planning references retain source provenance; no fabricated document downloads', () => {
    assert.match(page, /municipalPlans\.map/);
    assert.match(page, /ppaRecords\.map/);
    assert.match(page, /prototype reference entries, not validated municipal approvals or downloadable files/);
    assert.doesNotMatch(page, /href=\{[^}]*\.pdf/);
    assert.doesNotMatch(page, /download\s*=/);
});

test('authorized Records and Document Center remain separate', () => {
    assert.match(page, /permissions\.navigation\.records/);
    assert.match(page, /\/records\?search=/);
    assert.match(page, /documentsAllowed/);
    assert.match(page, /\/documents\?mode=files&archive_scope=/);
});

test('responsive and accessible controls use page-root CSS', () => {
    assert.match(page, /className="[^"]*\br8-search max-w/);
    assert.match(page, /\.\.\/\.\.\/\.\.\/css\/r8-search\.css/);
    assert.match(page, /aria-controls="r8-search-filters"/);
    assert.match(page, /aria-pressed=\{scope === option\.key\}/);
    assert.match(page, /aria-live="polite"/);
    assert.match(styles, /\.r8-search \.r8-search-result/);
    assert.match(styles, /max-width: 420px/);
    assert.match(styles, /forced-colors: active/);
    assert.doesNotMatch(styles, /(^|\n)\s*(html|body|:root)\s*\{/);
});
