import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8');

test('mobile destinations derive from permitted navigation, not an independent route catalog', () => {
    const shell = read('../../resources/js/layouts/AppLayout.tsx');
    assert.match(shell, /navigationGroups\.flatMap\(group => group\.items\)/);
    assert.match(shell, /\.filter\(item => \['home', 'myWork', 'calendar'\]/);
    assert.match(shell, /isPortalPathActive\(currentUrl, item\.href\)/);
    assert.match(shell, /navigationGroups\.some\(group => group\.items\.some/);
});

test('mobile shell accommodates editing, safe areas, and Task anchor focus', () => {
    const shell = read('../../resources/js/layouts/AppLayout.tsx');
    assert.match(shell, /editingField \? 'hidden' : 'grid'/);
    assert.match(shell, /safe-area-inset-bottom/);
    assert.match(shell, /safe-area-inset-left/);
    assert.match(shell, /safe-area-inset-right/);
    assert.match(shell, /getElementById\('personal-tasks'\)\?\.focus/);
});

test('reconciled sidebar retains keyboard tooltip cleanup and municipal identity', () => {
    const sidebar = read('../../resources/js/components/shell/PortalSidebar.tsx');
    assert.match(sidebar, /event\.key === 'Escape'/);
    assert.match(sidebar, /window\.addEventListener\('resize', dismiss\)/);
    assert.match(sidebar, /prefers-reduced-motion: reduce/);
    assert.match(sidebar, /portal-sidebar-civic-note/);
    assert.match(sidebar, /<AppearanceControl iconOnly \/>/);
});

test('light and dark sidebar plus drawer styles remain present', () => {
    const css = read('../../resources/css/workspace-refinement.css');
    assert.match(css, /:root:not\(\.dark\) \[data-workspace-shell\] \.portal-sidebar/);
    assert.match(css, /\.dark \.portal-sidebar/);
    assert.match(css, /\.portal-mobile-navigation:has\(\.portal-sidebar\)/);
    assert.match(css, /prefers-reduced-motion: reduce/);
});

test('Task board keeps fail-closed reads, mutation refresh, and municipal selection', () => {
    const tasks = read('../../resources/js/components/tasks/PersonalTaskWorkspace.tsx');
    assert.match(tasks, /onAccessBoundary\(r\.error\)/);
    assert.match(tasks, /setBoundary\(error\)/);
    assert.match(tasks, /one-talibon:personal-task-confirmed/);
    assert.match(tasks, /<PersonalTaskMutationPanel \/>/);
    assert.match(tasks, /border-emerald-700 bg-emerald-50/);
    assert.doesNotMatch(tasks, /border-blue-500 bg-blue-50/);
});
