import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

test('Document Center collection controls stay inside /documents and external workspaces are distinct', () => {
    const rail = read('../../resources/js/components/documents/DocumentCollectionNav.tsx');
    const index = read('../../resources/js/pages/Documents/Index.tsx');
    assert.match(rail, /Record collections/);
    assert.match(rail, /onClick=\{\(\) => onSelect\(item\.value\)\}/);
    assert.match(rail, /Related workspaces \(opens another page\)/);
    assert.match(rail, /they are not document filters/);
    assert.match(index, /mode: 'records'/);
    assert.match(index, /Attached Files/);
});

test('document metadata never represents a source-workflow link as a PDF', () => {
    const metadata = read('../../resources/js/components/documents/DocumentMetadataPanel.tsx');
    assert.match(metadata, /This is a register entry/);
    assert.match(metadata, /Open source workflow \(leaves Document Center\)/);
    assert.match(metadata, /Browse authorized attached files/);
});

test('Plans transparently present illustrative authority and absent real PDFs', () => {
    const plans = read('../../resources/js/pages/Plans/Index.tsx');
    const card = read('../../resources/js/components/plans/PlanCard.tsx');
    assert.match(plans, /No verified PDF or edition history/);
    assert.match(plans, /Illustrative status \(unverified\)/);
    assert.match(plans, /Example authority note \(not validated\)/);
    assert.match(card, /Example: \{plan\.status\}/);
});

test('Personal Task create accepts optional instructions/deadline under existing HTTP contract', () => {
    const ui = read('../../resources/js/components/tasks/PersonalTaskMutationPanel.tsx');
    const controller = read('../../app/Http/Controllers/Tasks/IndividualTaskController.php');
    assert.match(ui, /payload\.instructions = instructions\.trim\(\)/);
    assert.match(ui, /payload\.due_at = parsed\.toISOString\(\)/);
    assert.match(ui, /Calendar syncing is not yet enabled/);
    assert.match(controller, /'due_at' => \['sometimes', 'nullable', 'date_format:Y-m-d/);
    assert.match(controller, /'instructions' => \['sometimes', 'nullable', 'string', 'max:10000'\]/);
});

test('Work Requests and Calendar do not imply personal task/Calendar equivalence', () => {
    const work = read('../../resources/js/pages/Transactions/Index.tsx');
    const calendar = read('../../resources/js/pages/Calendar/Index.tsx');
    assert.match(work, /title="Work Requests"/);
    assert.match(work, /Personal Tasks — separate from Work Requests/);
    assert.match(calendar, /may not appear until its source workflow publishes a Calendar event/);
});
