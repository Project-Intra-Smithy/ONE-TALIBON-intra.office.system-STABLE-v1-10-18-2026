import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const layout = source('resources/js/layouts/AppLayout.tsx');
const app = source('resources/js/app.tsx');
const appCss = source('resources/css/app.css');
const activeShell = source('resources/css/ot-reference-shell.css');
const modal = source('resources/js/components/shell/MobileNavigation.tsx');

function rule(selector) {
    const escaped = selector.replace(/[.*+?^$\{\}()|[\]\\]/g, '\\$&');
    const match = activeShell.match(new RegExp(escaped + '\\s*\\{([^}]+)\\}'));
    assert.ok(match, 'Missing active-shell CSS for ' + selector);
    return match[1];
}

test('mobile modal layout is present in the actually imported shell, not the retired stylesheet', () => {
    assert.match(layout, /import '\.\.\/\.\.\/css\/ot-reference-shell\.css';/);
    assert.match(app, /import '\.\.\/css\/app\.css';/);
    assert.match(app, /import '\.\.\/css\/workspace-refinement\.css';/);
    assert.doesNotMatch(layout + app + appCss + activeShell, /@import\s+['"](?:\.\/)?phase-one-shell\.css['"]/);
    assert.match(layout, /<MobileNavigation/);
    assert.match(layout, /data-workspace-shell=\{workspaceRefinement \|\| undefined\}/);
    assert.match(modal, /<dialog id="portal-mobile-navigation"/);
});

test('mobile modal occupies the viewport with an actual covering backdrop and bounded drawer', () => {
    const dialog = rule('[data-workspace-shell] .portal-mobile-navigation');
    assert.match(dialog, /position:\s*fixed\s*;/);
    assert.match(dialog, /inset:\s*0\s*;/);
    assert.match(dialog, /height:\s*100dvh\s*;/);
    assert.match(dialog, /max-width:\s*none\s*;/);
    assert.match(rule('[data-workspace-shell] .portal-mobile-navigation::backdrop'), /background:/);
    assert.match(rule('[data-workspace-shell] .portal-drawer-backdrop'), /position:\s*absolute\s*;/);
    const drawer = rule('[data-workspace-shell] .portal-drawer');
    assert.match(drawer, /display:\s*flex\s*;/);
    assert.match(drawer, /flex-direction:\s*column\s*;/);
    assert.match(drawer, /width:\s*min\(352px,\s*100%\)\s*;/);
});

test('Navigation and Close are separated, have accessible targets, and keep focus behavior', () => {
    const heading = rule('[data-workspace-shell] .portal-drawer-heading');
    assert.match(heading, /display:\s*flex\s*;/);
    assert.match(heading, /justify-content:\s*space-between\s*;/);
    assert.match(heading, /align-items:\s*center\s*;/);
    assert.match(heading, /gap:\s*12px\s*;/);
    const close = rule('[data-workspace-shell] .portal-drawer-heading button');
    assert.match(close, /min-width:\s*44px\s*;/);
    assert.match(close, /min-height:\s*44px\s*;/);
    assert.match(rule('[data-workspace-shell] .portal-drawer-heading button:focus-visible'), /outline:\s*3px\s+solid/);
    assert.match(modal, /aria-label="Close navigation"/);
    assert.match(modal, /onCancel=\{\(event\) => \{ event\.preventDefault\(\); onClose\(\); \}\}/);
    assert.match(modal, /previousFocus\?\.focus\(\)/);
});

test('drawer remains scrollable without hiding account controls when content grows', () => {
    const content = rule('[data-workspace-shell] .portal-drawer-content');
    assert.match(content, /min-height:\s*0\s*;/);
    assert.match(content, /flex:\s*1\s*;/);
    assert.match(content, /overflow-y:\s*auto\s*;/);
    const sidebar = rule('[data-workspace-shell] .portal-drawer-content .portal-sidebar');
    assert.match(sidebar, /height:\s*auto\s*;/);
    assert.match(sidebar, /min-height:\s*100%\s*;/);
});
