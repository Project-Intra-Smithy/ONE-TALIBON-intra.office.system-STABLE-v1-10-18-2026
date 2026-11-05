import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const dir = path.join(root, 'resources/js/components/ui');
const read = (name) => readFileSync(path.join(dir, name), 'utf8');
const require = createRequire(import.meta.url);
let ts;
try { ts = require('typescript'); } catch {
    // Also execute when npm packages cannot be fetched but the VM has a global tsc.
    ts = require(path.join(execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).trim(), 'typescript'));
}

const factories = {
    jsx: (type, props, key) => ({ type, props: props ?? {}, key }),
    jsxs: (type, props, key) => ({ type, props: props ?? {}, key }),
};
const icons = new Proxy({}, { get: (_, name) => typeof name === 'string' ? ((props) => factories.jsx('svg', props)) : undefined });
const mockReact = { useId: () => 'r6-test-id' };
const components = new Map();
function load(name) {
    if (components.has(name)) return components.get(name);
    const file = path.join(dir, `${name}.tsx`);
    const compilation = ts.transpileModule(read(`${name}.tsx`), {
        fileName: file,
        reportDiagnostics: true,
        compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    });
    assert.deepEqual((compilation.diagnostics ?? []).filter(d => d.category === ts.DiagnosticCategory.Error).map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')), [], `${name} syntax`);
    const module = { exports: {} };
    const modules = {
        'react/jsx-runtime': factories,
        react: mockReact,
        'lucide-react': icons,
        '@inertiajs/react': { Link: (props) => factories.jsx('a', props) },
    };
    const resolve = (id) => {
        if (id.endsWith('.css')) return {};
        if (id.startsWith('./')) {
            const ref = id.slice(2).replace(/\.tsx$/, '');
            return { default: load(ref), ...components.get(`${ref}:module`) };
        }
        assert.ok(id in modules, `Unexpected import: ${id}`);
        return modules[id];
    };
    runInNewContext(compilation.outputText, { module, exports: module.exports, require: resolve }, { filename: file });
    const value = module.exports.default;
    components.set(name, value);
    components.set(`${name}:module`, module.exports);
    return value;
}
function expand(node) {
    if (Array.isArray(node)) return node.flatMap(n => {
        const value = expand(n);
        return Array.isArray(value) ? value : [value];
    });
    if (!node || typeof node !== 'object' || !('type' in node)) return node;
    if (typeof node.type === 'function') return expand(node.type(node.props));
    if (typeof node.type === 'object' && typeof node.type?.default === 'function') return expand(node.type.default(node.props));
    return { type: node.type, props: { ...node.props, children: expand(node.props.children) } };
}
function nodes(tree, tag) {
    const matches = [];
    const visit = (n) => {
        if (Array.isArray(n)) return n.forEach(visit);
        if (!n || typeof n !== 'object') return;
        if (n.type === tag) matches.push(n);
        visit(n.props?.children);
    };
    visit(tree);
    return matches;
}

const sourceNames = ['UiPanel', 'UiPanelHeader', 'UiScrollArea', 'UiEmptyState', 'UiLoadingState', 'UiFilterShell', 'UiDataRegion', 'UiActionButton'];

test('all eight primitives compile to JSX and explicitly load the scoped stylesheet', () => {
    for (const name of sourceNames) {
        assert.equal(typeof load(name), 'function', `${name} default export`);
        assert.match(read(`${name}.tsx`), /import '\.\/ui-system\.css'/);
    }
    const css = read('ui-system.css');
    assert.match(css, /\.ot-ui-panel--compact/);
    assert.match(css, /var\(--municipal-surface\)/);
    assert.doesNotMatch(css, /(?:^|\n)\s*(?:html|body|:root|\.municipal-panel)\s*\{/);
});

test('panel composes header, body and footer without forcing a height', () => {
    const tree = expand(load('UiPanel')({ as: 'section', density: 'compact', 'aria-labelledby': 'record-heading', header: 'Header', footer: 'Footer', children: 'Record' }));
    assert.equal(tree.type, 'section');
    assert.equal(tree.props['aria-labelledby'], 'record-heading');
    assert.match(tree.props.className, /ot-ui-panel--compact/);
    assert.equal(nodes(tree, 'div').length, 3);
    assert.doesNotMatch(read('ui-system.css'), /\.ot-ui-panel\s*\{[^}]*height\s*:/s);
});

test('heading supports IDs, zero count, long titles, icons and action slots', () => {
    const title = 'Long municipal office name '.repeat(12);
    const tree = expand(load('UiPanelHeader')({ title, headingId: 'example', icon: icons.Building2, count: 0, actions: factories.jsx('button', { children: 'Open' }) }));
    assert.equal(nodes(tree, 'h2')[0].props.id, 'example');
    assert.equal(nodes(tree, 'h2')[0].props.children, title);
    assert.equal(nodes(tree, 'svg')[0].props['aria-hidden'], 'true');
    assert.equal(nodes(tree, 'button').length, 1);
    assert.equal(nodes(tree, 'span')[0].props['aria-label'], '0 items');
    assert.match(read('ui-system.css'), /overflow-wrap:\s*anywhere/);
});

test('scroll area is natively focusable, named and expands on narrow screens', () => {
    const tree = expand(load('UiScrollArea')({ label: 'Recent work', maxHeight: '320px', children: 'Rows' }));
    assert.equal(tree.props.role, 'region');
    assert.equal(tree.props['aria-label'], 'Recent work');
    assert.equal(tree.props.tabIndex, 0);
    assert.equal(tree.props.style.maxHeight, '320px');
    const css = read('ui-system.css');
    assert.match(css, /scrollbar-width:\s*thin/);
    assert.match(css, /@media \(max-width: 767px\)[\s\S]*\.ot-ui-scroll-area\s*\{\s*max-height:\s*none\s*!important/);
    assert.match(css, /\.ot-ui-scroll-area:focus-visible/);
});

test('unauthorized and authority-pending states remain distinct from ordinary emptiness', () => {
    const empty = expand(load('UiEmptyState')({ title: 'No work' }));
    const denied = expand(load('UiEmptyState')({ kind: 'unauthorized', title: 'Access denied' }));
    const pending = expand(load('UiEmptyState')({ kind: 'pending-authority', title: 'Awaiting LGU decision', action: factories.jsx('a', { href: '/guide', children: 'Guide' }) }));
    assert.match(empty.props.className, /--empty/);
    assert.equal(denied.props.role, 'alert');
    assert.match(denied.props.className, /--unauthorized/);
    assert.match(pending.props.className, /--pending-authority/);
    assert.equal(nodes(pending, 'a')[0].props.href, '/guide');
});

test('loading skeleton is bounded, announced, and hidden after session expiry', () => {
    const normal = expand(load('UiLoadingState')({ label: 'Loading register', rows: 20 }));
    assert.equal(normal.props['aria-busy'], 'true');
    assert.equal(normal.props.role, 'status');
    assert.equal(nodes(normal, 'div').filter(n => n.props.className === 'ot-ui-loading__row').length, 8);
    const expired = expand(load('UiLoadingState')({ sessionExpired: true }));
    assert.equal(nodes(expired, 'div').filter(n => n.props.className === 'ot-ui-loading__row').length, 0);
    assert.match(expired.props.className, /unavailable/);
});

test('filters are presentation only, with named group and caller-owned controls', () => {
    const tree = expand(load('UiFilterShell')({ label: 'Transaction filters', controls: factories.jsx('input', { 'aria-label': 'Search' }), actions: factories.jsx('button', { children: 'Apply' }) }));
    assert.equal(tree.props.role, 'group');
    assert.equal(tree.props['aria-label'], 'Transaction filters');
    assert.equal(nodes(tree, 'input').length, 1);
    assert.equal(nodes(tree, 'button').length, 1);
    assert.doesNotMatch(read('UiFilterShell.tsx'), /\bfetch\(|router\.|URLSearchParams|useEffect/);
});

test('data region supplies accessible headings, loading and denial gates', () => {
    const ready = expand(load('UiDataRegion')({ title: 'Records', resultCount: 0, filters: factories.jsx('input', { 'aria-label': 'Search records' }), children: factories.jsx('table', { children: 'Only authorized rows' }) }));
    assert.equal(ready.type, 'section');
    assert.equal(ready.props['aria-labelledby'], 'r6-test-id');
    assert.equal(nodes(ready, 'h2')[0].props.id, 'r6-test-id');
    assert.equal(nodes(ready, 'table').length, 1);
    assert.equal(nodes(ready, 'div').find(n => n.props.className === 'ot-ui-data__viewport').props.tabIndex, 0);
    const loading = expand(load('UiDataRegion')({ title: 'Records', state: 'loading', children: factories.jsx('table', {}) }));
    assert.equal(loading.props['aria-busy'], true);
    assert.equal(nodes(loading, 'table').length, 0);
    const denied = expand(load('UiDataRegion')({ title: 'Records', resultCount: 42, state: 'unauthorized', filters: factories.jsx('input', {}), children: factories.jsx('table', {}) }));
    assert.equal(nodes(denied, 'table').length, 0);
    assert.equal(nodes(denied, 'input').length, 0);
    assert.equal(nodes(denied, 'span').filter(n => n.props.className === 'ot-ui-panel-heading__count').length, 0);
    assert.ok(nodes(denied, 'div').some(n => n.props.role === 'alert'));
    assert.match(read('ui-system.css'), /\.ot-ui-data__viewport\s*\{[^}]*overflow-x:\s*auto/s);
});

test('actions respect handlers, keyboard geometry, pending and disabled states', () => {
    const handler = () => 'handled';
    const button = expand(load('UiActionButton')({ children: 'Save', onClick: handler, variant: 'secondary' }));
    assert.equal(button.type, 'button');
    assert.equal(button.props.type, 'button');
    assert.equal(button.props.onClick, handler);
    assert.equal(button.props.disabled, false);
    const pending = expand(load('UiActionButton')({ children: 'Saving', pending: true }));
    assert.equal(pending.props.disabled, true);
    assert.equal(pending.props['aria-busy'], true);
    const activeLink = expand(load('UiActionButton')({ children: 'Open', href: '/transactions' }));
    assert.equal(activeLink.type, 'a');
    assert.equal(activeLink.props.href, '/transactions');
    const disabledLink = expand(load('UiActionButton')({ children: 'Open', href: '/transactions', disabled: true }));
    assert.equal(disabledLink.type, 'span');
    assert.equal(disabledLink.props['aria-disabled'], 'true');
    assert.equal(disabledLink.props.href, undefined);
    const css = read('ui-system.css');
    assert.match(css, /min-height:\s*var\(--municipal-control-height, 44px\)/);
    assert.match(css, /@media \(forced-colors: active\)/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('exports are additive and primitives have no data access or authorization decisions', () => {
    const index = read('index.ts');
    for (const name of sourceNames) assert.ok(index.includes(`as ${name} }`), `${name} is exported`);
    for (const name of sourceNames) assert.doesNotMatch(read(`${name}.tsx`), /\b(?:fetch|axios|usePage|useQuery|localStorage|sessionStorage|PermissionService|AuthorizationService)\b/);
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    assert.equal(pkg.dependencies['@radix-ui/react-scroll-area'], undefined);
    assert.equal(pkg.dependencies['@tanstack/react-table'], undefined);
    assert.match(read('ui-system.css'), /\.dark\b|var\(--municipal-surface\)/);
});
