import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { selectDashboardShortcuts } from '../../resources/js/components/dashboard/dashboardShortcuts.ts';

const source = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const dashboard = source('resources/js/pages/Dashboard.tsx');
const header = source('resources/js/components/dashboard/DashboardHeader.tsx');
const upper = source('resources/js/components/dashboard/r7/R7UpperRegion.tsx');
const taskPanel = source('resources/js/components/dashboard/r7/lower/R7TaskPanel.tsx');
const quick = source('resources/js/components/dashboard/QuickActions.tsx');
const recent = source('resources/js/components/dashboard/RecentWorkList.tsx');
const activity = source('resources/js/components/dashboard/ActivityRail.tsx');
const metrics = source('resources/js/components/dashboard/MetricGroup.tsx');
const scroll = source('resources/js/components/dashboard/DashboardScrollRegion.tsx');
const css = source('resources/css/ot-reference-dashboard.css');

test('R6 retains all four backend-role variants and role-scoped operational sections', () => {
    for (const role of ['employee', 'department_head', 'executive_oversight', 'system_administration']) {
        assert.ok(dashboard.includes(`${role}:`), `Missing role mapping ${role}`);
    }
    for (const component of ['OfficeOverview', 'ExecutiveOverview', 'SystemOverview', 'CorrespondenceOverview']) {
        assert.ok(dashboard.includes(`<${component}`), `Missing ${component}`);
    }
    for (const component of ['RecentWorkList', 'ActivityRail']) {
        assert.ok(upper.includes(`<${component}`), `Missing ${component}`);
    }
    assert.match(taskPanel, /<PersonalTaskWorkspace\s*\/>/);
    assert.match(upper, /groups\.map\(/);
    assert.match(dashboard, /secondaryGroups\.map\(/);
    assert.match(dashboard, /!experience\?\.department/);
});

test('Quick Access is still permission-derived, deduplicated and uses destination icons', () => {
    assert.match(quick, /buildPortalNavigation\(page\.workspaceExperience/);
    assert.match(quick, /selectDashboardShortcuts\(safeActions, permitted\)/);
    assert.match(quick, /isStagedInertiaPath\(action\.url\)/);
    assert.match(quick, /destination\?\.icon \|\| LayoutGrid/);
    assert.doesNotMatch(quick, /tileColors|iconColors/);
    const shortcuts = selectDashboardShortcuts(
        [{ label: 'Action', url: '/transactions?view=needs_my_action' }],
        [{ key: 'myWork', label: 'Work', href: '/transactions' }, { key: 'calendar', label: 'Calendar', href: '/calendar' }],
    );
    assert.deepEqual(shortcuts.map(({ href }) => href), ['/transactions?view=needs_my_action', '/calendar']);
});

test('R6 grid breakpoints are based on usable dashboard width, not the window alone', () => {
    assert.match(css, /container:\s*ot-dashboard\s*\/\s*inline-size/);
    for (const size of [520, 730, 1080]) assert.ok(css.includes(`@container ot-dashboard (min-width:${size}px)`));
    assert.match(css, /@container ot-dashboard \(max-width:729px\)/);
    assert.match(css, /\.ot-reference-dashboard \.ot-dashboard-work \{\s*grid-template-columns:minmax\(0,1fr\)/);
    assert.match(css, /\.ot-reference-dashboard \.ot-dashboard-tiles \{\s*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
    assert.match(css, /\.ot-dashboard-panel-heading \{\s*display:flex;\s*align-items:center;/);
    assert.doesNotMatch(css, /(?:^|\n)\s*(?:html|body|:root)\s*\{/);
});

test('R6 retains real records, empty states, notification state distinctions and focusable scrolls', () => {
    assert.match(recent, /items\.map\(/);
    assert.match(recent, /items\.length === 0/);
    assert.match(activity, /notificationState === 'loading'/);
    assert.match(activity, /notificationState === 'expired'/);
    assert.match(activity, /notificationState === 'unavailable'/);
    assert.match(activity, /notificationState === 'current' && notifications\.length === 0/);
    assert.match(metrics, /group\.metrics\.map\(/);
    assert.match(metrics, /Categories may overlap/);
    assert.match(scroll, /tabIndex=\{keyboardRegion \? 0 : undefined\}/);
    assert.match(css, /\.ot-dashboard-scroll-region :is\(a,button\):focus-visible/);
    assert.match(css, /@media \(forced-colors:active\)/);
    assert.match(css, /\.dark \.ot-reference-dashboard \.ot-dashboard-tile-icon/);
});

test('Hero uses local municipal seal and authenticated identity without invented activity', () => {
    assert.match(header, /usePage<SharedProps>\(\)\.props/);
    assert.match(header, /auth\.user\?\.name\?\.trim\(\)/);
    assert.match(header, /experience\.department\.shortName \|\| experience\.department\.name/);
    assert.match(header, /\/brand\/municipal\.logo\.png/);
    assert.doesNotMatch(dashboard + header + quick, /(?:sampleUnreadCount|fakePending|mockEmployeeData)/);
});
