import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const directory = source('resources/js/pages/Departments/Index.tsx');
const plans = source('resources/js/pages/Plans/Index.tsx');
const card = source('resources/js/components/plans/PlanCard.tsx');
const planFilters = source('resources/js/components/plans/PlanFilterBar.tsx');
const ppas = source('resources/js/pages/PPAs/Index.tsx');
const ppaFilters = source('resources/js/components/ppas/PPAFilters.tsx');
const register = source('resources/js/components/ppas/PPARegister.tsx');
const detail = source('resources/js/components/ppas/PPADetailPanel.tsx');
const css = source('resources/css/ot-r6-modules.css');

test('Worker 03 styling is page-scoped with no app-wide CSS or new UI dependency', () => {
    for (const page of [directory, plans, ppas]) {
        assert.doesNotMatch(page, /import '\.\.\/\.\.\/\.\.\/css\/ot-r6-modules\.css'/);
        assert.doesNotMatch(page, /import '\.\.\/\.\.\/\.\.\/css\/portal-visual-redesign\.css'/);
    }
    assert.match(css, /\.ot-r6-modules/);
    assert.doesNotMatch(css, /(?:^|\n)\s*(?:body|html|:root|\.municipal-panel)\s*\{/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(css, /@media \(forced-colors: active\)/);
});

test('office grouping, search, permitted Records route and reference disclosure are retained', () => {
    assert.match(directory, /function filterDirectoryEntries/);
    assert.match(directory, /entry\.group === group/);
    assert.match(directory, /function groupDirectoryEntries/);
    assert.match(directory, /function safeRecordsHref/);
    assert.match(directory, /entry\.recordsHref === '\/records' \? '\/records' : null/);
    assert.match(directory, /directoryEntries \?\? \[\]/);
    assert.match(directory, /\{groupedVisible\.map/);
    assert.match(directory, /\{recordsHref \? \(/);
    assert.match(directory, /Records access unavailable — authority pending/);
    assert.match(directory, /subject to LGU validation/);
    assert.match(directory, /aria-live="polite"/);
    assert.match(directory, /Clear filters/);
});

test('plan filter behavior and safe detail focus restoration are preserved', () => {
    assert.match(plans, /municipalPlans\.filter/);
    for (const key of ['status', 'horizon', 'leadOffice']) assert.match(plans, new RegExp(`filters\\.${key}`));
    assert.match(planFilters, /min-h-11/);
    assert.match(planFilters, /resultCount/);
    assert.match(card, /plan\.code/);
    assert.match(card, /plan\.horizon/);
    assert.match(card, /aria-expanded=\{selected\}/);
    const nativeDialog = readFileSync(new URL('../../resources/js/components/ui/Dialog.tsx', import.meta.url), 'utf8');
    assert.match(nativeDialog, /document\.body\.style\.overflow = 'hidden'/);
    assert.match(nativeDialog, /showModal\(\)/);
    assert.match(plans, /requestAnimationFrame\(\(\) => document\.getElementById/);
    assert.match(plans, /<PlanDossierPresentation/);
    assert.match(plans, /records shown here are not validated live municipal approvals/i);
});

test('PPA filter predicates and server-authorized planning boundaries stay intact', () => {
    assert.match(ppas, /ppaRecords\.filter/);
    for (const key of ['sector', 'office', 'year', 'plan', 'fundingSource', 'status']) {
        assert.match(ppas, new RegExp(`filters\\.${key}`));
    }
    assert.match(ppaFilters, /Advanced filters/);
    assert.match(ppaFilters, /min-h-11/);
    assert.match(ppas, /no completion percentage is recorded for PPAs/);
    assert.match(ppas, /do not represent verified live project progress/);
    assert.doesNotMatch(ppas + detail + register, /localStorage\.|fetch\(.*method:\s*'POST'|onClick=\{.*createPPA/i);
});

test('PPA register and detail are responsive, keyboard reachable and preserve selection', () => {
    assert.match(register, /r8-ppas-cards space-y-2 xl:hidden/);
    assert.match(register, /r8-ppas-table-panel hidden overflow-hidden xl:block/);
    assert.match(register, /overflow-x-auto/);
    assert.match(register, /<table/);
    assert.match(register, /<th /);
    assert.match(register, /aria-selected=\{selectedId === record\.id\}/);
    assert.match(register, /aria-expanded=\{selectedId === record\.id\}/);
    assert.match(detail, /selected-ppa-detail/);
    assert.match(detail, /<PlanDossierPresentation/);
    assert.match(detail, /onClose=\{onClose\}/);
    assert.match(ppas, /dataset\.ppaTrigger === id/);
    assert.match(ppas, /trigger\?\.focus\(\)/);
    assert.match(css, /\.ot-r6-ppa-layout--selected/);
    assert.match(css, /\.ot-r6-ppa-detail/);
    assert.match(css, /max-height: calc\(100dvh - 110px\)/);
});
