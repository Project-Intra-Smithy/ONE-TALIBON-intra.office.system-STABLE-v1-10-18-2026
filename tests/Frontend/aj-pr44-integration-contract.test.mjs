import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

test('AJ PR44 presentation preserves canonical Task write controls and mutation-to-read refresh', () => {
    const dashboard = read('../../resources/js/pages/Dashboard.tsx');
    const workspace = read('../../resources/js/components/tasks/PersonalTaskWorkspace.tsx');
    assert.match(dashboard, /<PersonalTaskWorkspace\s*\/>/);
    assert.match(dashboard, /<PersonalTaskMutationPanel\s*\/>/);
    assert.match(workspace, /one-talibon:personal-task-confirmed/);
    assert.match(workspace, /window\.addEventListener\(TASK_SYNC_EVENT,synchronize\)/);
    assert.match(workspace, /detail\.userId!==userId/);
    assert.match(workspace, /setRefresh\(value=>value\+1\)/);
    assert.match(workspace, /TaskSession key=\{id\} userId=\{id\}/);
    assert.match(workspace, /Due within 48 hours/);
    assert.match(workspace, /Overdue/);
});

test('Department overview is a dashboard anchor, not an invented route or authority', () => {
    const dashboard = read('../../resources/js/pages/Dashboard.tsx');
    const nav = read('../../resources/js/navigation/portalNavigation.ts');
    assert.match(dashboard, /id="department-overview" tabIndex=\{-1\}/);
    assert.match(dashboard, /<OfficeOverview overview=\{officeOverview\}/);
    assert.match(nav, /myDepartment: '\/dashboard#department-overview'/);
    assert.match(nav, /experiences: \['department_head'\]/);
});

test('visible appearance controls persist and apply light dark and system preferences', () => {
    const appearance = read('../../resources/js/theme/appearance.ts');
    assert.match(appearance, /validPreferences[^=]*= \['system', 'light', 'dark'\]/);
    assert.match(appearance, /localStorage\.getItem\(STORAGE_KEY\)/);
    assert.match(appearance, /localStorage\.setItem\(STORAGE_KEY, preference\)/);
    assert.match(appearance, /classList\.toggle\('dark', resolved === 'dark'\)/);
    assert.match(appearance, /matchMedia\('\(prefers-color-scheme: dark\)'\)/);
});
