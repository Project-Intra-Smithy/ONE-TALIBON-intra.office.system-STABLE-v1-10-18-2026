import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const directory = source('resources/js/pages/Departments/Index.tsx');
const css = source('resources/css/r8-directory.css');
const workspace = source('resources/js/pages/Departments/Workspace.tsx');

test('A3 preserves server supplied directory and office counts without synthetic KPIs', () => {
 assert.match(directory, /directoryEntries \?\? \[\]/);
 assert.match(directory, /directoryGroups \?\? \[\]/);
 assert.match(directory, /\{entries\.length\}/);
 assert.match(directory, /\{visible\.length\} of \{entries\.length\}/);
 for (const key of ['offices','executiveOffices','legislativeOffices','employees','activeTransactions']) assert.match(directory, new RegExp('summary\\.'+key));
 assert.match(directory, /office\.active_employees_count/);
 assert.match(directory, /office\.active_transactions_count/);
 assert.doesNotMatch(directory, /Math\.random|fakeProgress|pendingTasks|projectCompletion/);
});

test('A3 retains real office grouping and normalized search', () => {
 assert.match(directory, /function filterDirectoryEntries/);
 assert.match(directory, /entry\.group === group/);
 assert.match(directory, /entry\.shortName, entry\.name, entry\.responsibility/);
 assert.match(directory, /function groupDirectoryEntries/);
 assert.match(directory, /groupOrder\.includes\(group\)/);
 assert.match(directory, /groupedVisible\.map/);
 assert.match(directory, /visible\.length === 0/);
 assert.match(directory, /Clear filters/);
 assert.match(directory, /aria-live="polite"/);
});

test('A3 retains guarded Records access and authority boundary', () => {
 assert.match(directory, /function safeRecordsHref/);
 assert.match(directory, /entry\.recordsHref === '\/records' \? '\/records' : null/);
 assert.match(directory, /\{recordsHref \? \(/);
 assert.match(directory, /Records access unavailable — authority pending/);
 assert.match(directory, /subject to LGU validation/);
 assert.match(workspace, /AuthorityPendingSurface/);
 assert.doesNotMatch(directory, /router\.post|router\.delete|fetch\(/);
});

test('A3 styling is page-scoped, responsive and accessibility-aware', () => {
 assert.match(directory, /import '\.\.\/\.\.\/\.\.\/css\/r8-directory\.css'/);
 assert.match(directory, /ot-r6-modules ot-r6-departments r8-directory/g);
 assert.match(css, /\.r8-directory \.r8-directory-card/);
 assert.match(css, /@media \(max-width:767px\)/);
 assert.match(css, /@media \(max-width:390px\)/);
 assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
 assert.match(css, /@media \(forced-colors: active\)/);
 assert.doesNotMatch(css, /(?:^|\n)\s*(?:body|html|:root|\.municipal-panel)\s*\{/);
});
