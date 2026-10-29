import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const layout = source('resources/js/layouts/AppLayout.tsx');
const sidebar = source('resources/js/components/shell/PortalSidebar.tsx');
const dialog = source('resources/js/components/shell/MobileNavigation.tsx');
const styles = source('resources/css/ot-reference-shell.css');

test('reference stylesheet is activated only through the authenticated shell', () => {
    assert.match(layout, /import ['"]\.\.\/\.\.\/css\/ot-reference-shell\.css['"]/);
    assert.match(styles, /\[data-workspace-shell\] \.portal-sidebar/);
    assert.doesNotMatch(styles, /(?:^|\n)\s*(?:html|body|:root)\s*\{/);
});

test('permission-aware navigation and current-route semantics remain in place', () => {
    assert.match(layout, /buildPortalNavigation\(/);
    assert.match(layout, /pageProps\.permissions\?\.navigation/);
    assert.match(sidebar, /navigationGroups\.map\(/);
    assert.match(sidebar, /isPortalPathActive\(/);
    assert.match(sidebar, /aria-current=\{active \? 'page' : undefined\}/);
});

test('collapsible navigation and preference persistence remain connected', () => {
    assert.match(layout, /talibon\.sidebar\.collapsed/);
    assert.match(layout, /localStorage\.setItem\(SIDEBAR_COLLAPSED_STORAGE_KEY/);
    assert.match(layout, /onToggleCollapsed=\{toggleDesktopSidebar\}/);
    assert.match(sidebar, /aria-label=\{compact \? 'Expand navigation' : 'Collapse navigation'\}/);
});

test('mobile dialog retains focus trap, escape, scroll lock and focus return', () => {
    assert.match(dialog, /showModal\(\)/);
    assert.match(dialog, /event\.key !== 'Tab'/);
    assert.match(dialog, /onCancel=\{/);
    assert.match(dialog, /previousFocus\?\.focus\(\)/);
    assert.match(dialog, /document\.body\.style\.overflow = 'hidden'/);
    assert.match(layout, /lg:hidden/);
    assert.match(layout, /<aside className="hidden/);
});

test('live shell controls and semantic colors are not replaced by mock controls', () => {
    assert.match(layout, /useVisiblePolling\(/);
    assert.match(layout, /<RecordsSearch/);
    assert.match(layout, /<PortalLauncher/);
    assert.match(layout, /<PortalIdentity/);
    assert.match(sidebar, /<AppearanceControl/);
    assert.match(sidebar, /router\.post\('\/logout'\)/);
    assert.match(styles, /#0b442d/i);
    assert.match(styles, /prefers-reduced-motion/);
    assert.match(styles, /forced-colors/);
});
