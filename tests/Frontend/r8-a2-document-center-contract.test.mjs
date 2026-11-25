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
 assert.match(page, /mode === 'files' \? \(\s*<DocumentArchive archive={archive}/);
 assert.match(page, /mode: 'records'/);
 assert.match(archive, /mode: 'files'/);
 assert.match(page, /href="\/documents\?mode=files"/);
});
test('selected metadata uses an accessible donor drawer and remains bound to current authorized records', () => {
 assert.match(page, /records\.data\.find\(record => record\.detailUrl === selectedUrl\)/);
 assert.match(page, /open={Boolean\(selectedRecord\)}/);
 assert.match(page, /variant="drawer-right"/);
 assert.match(page, /onClose={\(\) => setSelectedUrl\(null\)}/);
 assert.match(page, /href={selectedRecord\.detailUrl}/);
 assert.match(page, /selectedRecord\.source/);
 assert.match(page, /selectedRecord\.assignedEmployee\?\.name/);
});
test('pagination, server filters and legitimate empty state are retained', () => {
 assert.match(page, /records\.next_page_url/);
 assert.match(page, /params\.set\('mode', 'records'\)/);
 assert.match(page, /date_from/);
 assert.match(page, /office_id/);
 assert.match(page, /No matching documents/);
 assert.match(page, /draft\.date_from/);
 assert.match(page, /draft\.date_to/);
 assert.match(page, /permissions\.navigation/);
});
test('classification and file actions remain tied to server projection', () => {
 assert.match(archive, /classification: string/);
 assert.match(archive, /archive\.filterOptions\.classifications/);
 assert.match(archive, /selected\.downloadUrl/);
 assert.doesNotMatch(page + register + metadata, /UploadCloud|downloadUrl|uploadUrl/);
 assert.doesNotMatch(css, /(^|\n)\s*(html|body|:root)\b/);
});

test('authorized preview projection uses native isolated new-tab anchors and retains download', () => {
 const evidence = source('resources/js/components/documents/EvidenceList.tsx');
 assert.match(archive, /<a href=\{selected\.previewUrl\} target="_blank" rel="noopener noreferrer"/);
 assert.match(evidence, /<a href=\{item\.previewUrl\} target="_blank" rel="noopener noreferrer"/);
 assert.match(archive, /<a href=\{selected\.downloadUrl\}/);
 assert.match(evidence, /href=\{item\.downloadUrl\}/);
 assert.doesNotMatch(archive + evidence, /<iframe|createObjectURL|window\.open/);
});
