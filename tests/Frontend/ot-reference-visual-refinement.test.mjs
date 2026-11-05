import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { selectDashboardShortcuts } from '../../resources/js/components/dashboard/dashboardShortcuts.ts';

const rootFile = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const shortcutsComponent = rootFile('resources/js/components/dashboard/QuickActions.tsx');
const header = rootFile('resources/js/components/dashboard/DashboardHeader.tsx');
const css = rootFile('resources/css/ot-reference-dashboard.css');

test('authorized role actions remain first and are not overwritten by module shortcuts', () => {
    const actions = [{ label: 'Needs Action', url: '/transactions?view=needs_my_action' }, { label: 'Correspondence', url: '/correspondence' }];
    const permitted = [
        { key: 'myWork', label: 'Work Requests', href: '/transactions' },
        { key: 'calendar', label: 'Calendar', href: '/calendar' },
        { key: 'documentCenter', label: 'Documents', href: '/documents' },
    ];
    assert.deepEqual(selectDashboardShortcuts(actions, permitted).map((action) => action.href),
        ['/transactions?view=needs_my_action', '/correspondence', '/documents', '/calendar']);
});

test('never invent shortcuts for missing or staged destinations', () => {
    const permitted = [{ key: 'calendar', label: 'Calendar', href: '/calendar' }];
    const shortcuts = selectDashboardShortcuts([], permitted);
    assert.deepEqual(shortcuts.map((action) => action.href), ['/calendar']);
    assert.equal(shortcuts.some((action) => action.href === '/operations'), false);
    assert.equal(shortcuts.some((action) => action.href === '/announcements'), false);
});

test('bounded, distinct destinations reject arbitrary absolute or protocol-relative routes', () => {
    const actions = [{ label: 'Unsafe', url: '//outside.example' }, { label: 'Action', url: '/transactions?view=mine' }];
    const permitted = [
        { key: 'documentCenter', label: 'Documents', href: 'https://outside.example' },
        { key: 'calendar', label: 'Calendar', href: '/calendar' },
        { key: 'messages', label: 'Messages', href: '/messages' },
    ];
    assert.deepEqual(selectDashboardShortcuts(actions, permitted, 2).map((action) => action.href),
        ['/transactions?view=mine', '/calendar']);
    assert.deepEqual(selectDashboardShortcuts(actions, permitted, 0), []);
});

test('the dashboard inventory is sourced from permission-aware sidebar navigation', () => {
    assert.match(shortcutsComponent, /buildPortalNavigation\(page\.workspaceExperience/);
    assert.match(shortcutsComponent, /page\.permissions\?\.navigation/);
    assert.match(shortcutsComponent, /isStagedInertiaPath\(action\.url\)/);
    assert.match(shortcutsComponent, /selectDashboardShortcuts\(safeActions, permitted\)/);
    assert.doesNotMatch(shortcutsComponent, /\b(?:fetch|axios|XMLHttpRequest)\(/);
});

test('municipal hall artwork is reused locally and composition is compact/responsive', () => {
    assert.match(header, /\/images\/municipality\/talibon-homepage-hero\.jpg/);
    assert.match(css, /background-size:cover, 58% auto/);
    assert.match(css, /@media \(max-width:479px\)/);
    assert.match(css, /\.ot-dashboard-tiles \{ grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
    assert.match(css, /\.dark \.ot-dashboard-quick/);
});
