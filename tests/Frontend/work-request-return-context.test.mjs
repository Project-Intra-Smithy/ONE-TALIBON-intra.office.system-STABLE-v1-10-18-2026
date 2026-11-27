import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Execute the real list component with the JSX runtime reduced to data objects.
// No browser, backend auth or application fetches are mocked as having passed.
const listPath = fileURLToPath(new URL('../../resources/js/components/work-queue/WorkItemList.tsx', import.meta.url));
const listSource = readFileSync(listPath, 'utf8');
const showSource = readFileSync(fileURLToPath(new URL('../../resources/js/pages/Transactions/Show.tsx', import.meta.url)), 'utf8');
const controllerSource = readFileSync(fileURLToPath(new URL('../../app/Http/Controllers/TransactionController.php', import.meta.url)), 'utf8');

function compileWorkList(pageUrl) {
    const { outputText, diagnostics } = ts.transpileModule(listSource, {
        fileName: listPath,
        reportDiagnostics: true,
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX,
        },
    });
    assert.equal(diagnostics?.length ?? 0, 0);
    const module = { exports: {} };
    const jsx = (type, props) => ({ type, props });
    runInNewContext(outputText, {
        module,
        exports: module.exports,
        require(name) {
            if (name === '@inertiajs/react') return { usePage: () => ({ url: pageUrl }), Link: 'Link' };
            if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx };
            if (name === 'lucide-react') return new Proxy({}, { get: (_target, key) => key });
            throw new Error('Unexpected import: ' + name);
        },
    }, { filename: listPath });
    return module.exports.default;
}

function findOpenLink(node) {
    if (!node || typeof node !== 'object') return null;
    if (Array.isArray(node)) {
        for (const item of node) {
            const found = findOpenLink(item);
            if (found) return found;
        }
        return null;
    }
    if (node.type === 'Link' && node.props?.['aria-label']?.startsWith('Open work item ')) return node;
    return findOpenLink(node.props?.children);
}

function renderedOpenHref(pageUrl) {
    const component = compileWorkList(pageUrl);
    const record = {
        id: 28,
        reference: 'TAL-F5-QA-REPORT-0001',
        transactionType: 'internal_request',
        title: 'Synthetic Engineering request',
        priority: 'high',
        status: 'submitted',
        dueState: 'on_track',
        requiresAction: true,
        expectedAction: 'Open',
        updatedAt: '2026-11-10T00:00:00Z',
    };
    const root = component({
        title: 'Work Requests',
        records: {
            data: [record],
            total: 1,
            from: 1,
            to: 1,
            last_page: 1,
            current_page: 1,
        },
    });
    const link = findOpenLink(root);
    assert.ok(link, 'Expected actual rendered Work Request Open link');
    return link.props.href;
}

test('real list component encodes the exact applied Work Requests list URL', () => {
    const list = '/transactions?view=office_queue&search=TAL-F5-QA-REPORT-0001&status=submitted&priority=high&office_id=4&page=2';
    const href = renderedOpenHref(list);
    assert.equal(href, '/transactions/28?return_to=' + encodeURIComponent(list));
    assert.equal(new URL(href, 'http://test.invalid').searchParams.get('return_to'), list);
});

test('list component uses only Work Requests list path as source of return hint', () => {
    assert.equal(renderedOpenHref('/dashboard'), '/transactions/28?return_to=%2Ftransactions');
    assert.equal(renderedOpenHref('/transactions-extra?search=ignored'), '/transactions/28?return_to=%2Ftransactions');
    assert.equal(renderedOpenHref('/transactions'), '/transactions/28?return_to=%2Ftransactions');
});

test('detail UI accepts only server-projected return URL; old label and hardcoded link absent', () => {
    assert.match(showSource, /\breturnTo:\s*string/);
    assert.match(showSource, /<Link href=\{returnTo\}/);
    assert.match(showSource, /Back to Work Requests/);
    assert.doesNotMatch(showSource, /Back to My Work/);
    assert.doesNotMatch(showSource, /<Link href="\/transactions" className="text-\[12px\]/);
    assert.match(controllerSource, /ValidatedListReturn::validate\(\$candidate, '\/transactions'\)/);
    assert.match(controllerSource, /'returnTo'\s*=>\s*\$returnTo/);
    assert.match(controllerSource, /\$this->authorize\('view', \$transaction\)/);
});
