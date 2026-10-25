import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const template = readFileSync(new URL('../../resources/views/app.blade.php', import.meta.url), 'utf8');
const bootstrap = template.match(/<script>\s*([\s\S]*?)\s*<\/script>/)?.[1];

function renderBootstrap({ stored = null, systemDark = false, getFailure = false } = {}) {
    const classes = new Set(['app-root']);
    const root = {
        classList: {
            toggle(name, enabled) { enabled ? classes.add(name) : classes.delete(name); },
            contains(name) { return classes.has(name); },
        },
        dataset: {},
        style: {},
    };
    const writes = [];
    const storage = {
        getItem(key) {
            assert.equal(key, 'talibon.appearance');
            if (getFailure) throw new Error('storage unavailable');
            return stored;
        },
        setItem(...args) { writes.push(args); },
    };
    const mediaQueries = [];
    const window = {
        localStorage: storage,
        matchMedia(query) {
            mediaQueries.push(query);
            return { matches: systemDark };
        },
    };
    assert.ok(bootstrap, 'pre-Vite inline bootstrap exists');
    runInNewContext(bootstrap, { document: { documentElement: root }, window });
    return { root, classes, writes, mediaQueries };
}

for (const preference of ['light', 'dark', 'system']) {
    for (const systemDark of [false, true]) {
        test('saved ' + preference + ' preference survives initial load with systemDark=' + systemDark, () => {
            const { root, classes, writes, mediaQueries } = renderBootstrap({ stored: preference, systemDark });
            const dark = preference === 'dark' || (preference === 'system' && systemDark);
            assert.equal(root.dataset.appearance, preference);
            assert.equal(root.classList.contains('dark'), dark);
            assert.equal(root.style.colorScheme, dark ? 'dark' : 'light');
            assert.ok(classes.has('app-root'), 'unrelated root classes preserved');
            assert.deepEqual(writes, [], 'bootstrap must not overwrite saved preference');
            assert.deepEqual(mediaQueries, preference === 'system' ? ['(prefers-color-scheme: dark)'] : []);
        });
    }
}

test('missing or invalid stored preference falls back to system without mutating storage', () => {
    for (const stored of [null, '', 'garbage', 'DARK']) {
        const { root, writes } = renderBootstrap({ stored, systemDark: true });
        assert.equal(root.dataset.appearance, 'system');
        assert.equal(root.classList.contains('dark'), true);
        assert.deepEqual(writes, []);
    }
});

test('storage read failure falls back to system without blocking initial theme', () => {
    const { root, writes } = renderBootstrap({ getFailure: true, systemDark: true });
    assert.equal(root.dataset.appearance, 'system');
    assert.equal(root.classList.contains('dark'), true);
    assert.equal(root.style.colorScheme, 'dark');
    assert.deepEqual(writes, []);
});

test('system preference reflects OS changes on a subsequent page load', () => {
    assert.equal(renderBootstrap({ stored: 'system', systemDark: false }).root.style.colorScheme, 'light');
    assert.equal(renderBootstrap({ stored: 'system', systemDark: true }).root.style.colorScheme, 'dark');
});

test('Blade keeps Inertia entry, CSRF and Vite anchors used by login and MFA', () => {
    assert.match(template, /<meta name="csrf-token"/);
    assert.match(template, /@viteReactRefresh/);
    assert.match(template, /@vite\(\['resources\/css\/app\.css', 'resources\/js\/app\.tsx'\]\)/);
    assert.match(template, /@inertiaHead/);
    assert.match(template, /@inertia\s*\n/);
    assert.ok(template.indexOf('<script>') < template.indexOf('@viteReactRefresh'), 'theme applies before app assets');
});
