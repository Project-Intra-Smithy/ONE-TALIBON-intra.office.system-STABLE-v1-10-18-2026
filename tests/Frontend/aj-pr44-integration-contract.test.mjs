import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

test('AJ PR44 presentation preserves canonical Task write controls and mutation-to-read refresh', () => {
    const dashboard = read('../../resources/js/pages/Dashboard.tsx');
    const taskPanel = read('../../resources/js/components/dashboard/r7/lower/R7TaskPanel.tsx');
    const dedicatedTasks = read('../../resources/js/pages/Tasks/Index.tsx');
    const workspace = read('../../resources/js/components/tasks/PersonalTaskWorkspace.tsx');
    assert.match(dashboard, /<R7LowerRegion actions=\{experience\.quickActions\}\s*\/>/);
    assert.match(dedicatedTasks, /<PersonalTaskWorkspace\s*\/>/);
    assert.match(dedicatedTasks, /<PersonalTaskMutationPanel\s*\/>/);
    assert.doesNotMatch(taskPanel, /<PersonalTaskWorkspace\s*\/>/);
    assert.doesNotMatch(taskPanel, /<PersonalTaskMutationPanel\s*\/>/);
    assert.ok(taskPanel.includes('href="/my-tasks"'));
    assert.match(workspace, /one-talibon:personal-task-confirmed/);
    assert.match(workspace, /window\.addEventListener\(TASK_SYNC_EVENT,synchronize\)/);
    assert.match(workspace, /detail\.userId!==userId/);
    assert.match(workspace, /setRefresh\(value=>value\+1\)/);
    assert.match(workspace, /TaskSession key=\{id\} userId=\{id\}/);
    assert.match(workspace, /Due within 48 hours/);
    assert.match(workspace, /Overdue/);
});

test('My Department has an authorized dedicated route and keeps directory separate', () => {
    const dashboard = read('../../resources/js/pages/Dashboard.tsx');
    const nav = read('../../resources/js/navigation/portalNavigation.ts');
    const route = read('../../routes/web.php');
    const controller = read('../../app/Http/Controllers/DepartmentController.php');
    const department = read('../../resources/js/pages/Departments/Workspace.tsx');
    assert.ok(dashboard.includes('href="/my-department"'));
    assert.doesNotMatch(dashboard, /<OfficeOverview/);
    assert.ok(nav.includes("myDepartment: '/my-department'"));
    assert.match(nav, /experiences: \['department_head'\]/);
    assert.ok(route.includes("Route::get('/my-department'"));
    assert.match(controller, /public function myWorkspace/);
    assert.match(department, /<OfficeOverview/);
    assert.ok(department.includes('/departments?view=directory'));
});

test('visible appearance controls persist and apply light dark and system preferences', () => {
    const appearance = read('../../resources/js/theme/appearance.ts');
    assert.match(appearance, /validPreferences[^=]*= \['system', 'light', 'dark'\]/);
    assert.match(appearance, /localStorage\.getItem\(STORAGE_KEY\)/);
    assert.match(appearance, /localStorage\.setItem\(STORAGE_KEY, preference\)/);
    assert.match(appearance, /classList\.toggle\('dark', resolved === 'dark'\)/);
    assert.match(appearance, /matchMedia\('\(prefers-color-scheme: dark\)'\)/);
});
