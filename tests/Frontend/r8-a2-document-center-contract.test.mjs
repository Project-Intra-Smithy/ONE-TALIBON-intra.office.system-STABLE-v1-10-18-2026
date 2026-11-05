import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = process.cwd();
const source = (path) => readFileSync(root + '/' + path, 'utf8');
const page = source('resources/js/pages/Documents/Index.tsx');
const register = source('resources/js/components/documents/DocumentRegister.tsx');
const archive = source('resources/js/components/documents/DocumentArchive.tsx');
const metadata = source('resources/js/components/documents/DocumentMetadataPanel.tsx');
const css = source('resources/css/r8-documents.css');
test('server-backed records and files remain distinct modes', () => {
 assert.match(page, /mode === 'files' \? <DocumentArchive archive={archive}/);
 assert.match(page, /mode: 'records'/);
 assert.match(archive, /mode: 'files'/);
 assert.match(page, /href="\/documents\?mode=files"/);
});
test('selected authorized record metadata has a dedicated desktop pane and mobile inline disclosure', () => {
 assert.match(page, /className="r8-documents-details"/);
 assert.match(page, /<DocumentMetadataPanel record={selected}/);
 assert.match(register, /aria-pressed={selected}/);
 assert.match(register, /aria-expanded={selected}/);
 assert.match(register, /dc-inline-metadata/);
 assert.match(metadata, /onClick={onClose}/);
 assert.match(css, /max-width:1279px/);
});
test('pagination, server filters and legitimate empty state are retained', () => {
 assert.match(page, /records\.next_page_url/);
 assert.match(page, /params\.set\('mode', 'records'\)/);
 assert.match(page, /date_from/);
 assert.match(page, /office_id/);
 assert.match(register, /No authorized records match these filters/);
});
test('classification and file actions remain tied to server projection', () => {
 assert.match(archive, /classification: string/);
 assert.match(archive, /archive\.filterOptions\.classifications/);
 assert.match(archive, /selected\.downloadUrl/);
 assert.doesNotMatch(page + register + metadata, /UploadCloud|downloadUrl|uploadUrl/);
 assert.doesNotMatch(css, /(^|\n)\s*(html|body|:root)\b/);
});
