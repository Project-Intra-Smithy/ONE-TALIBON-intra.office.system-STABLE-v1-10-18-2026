import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');

test('PL-07: Plans, PPAs, and Planning Maps connect exclusively to server-authorized Laravel endpoints with zero localStorage persistence or synthetic blob downloads', () => {
    const plansPage = read('resources/js/pages/Plans/Index.tsx');
    const ppasPage = read('resources/js/pages/PPAs/Index.tsx');
    const mapsPage = read('resources/js/pages/PlanningMaps/Index.tsx');
    const docsPanel = read('resources/js/components/planning/SupportingDocsPanel.tsx');
    const staffModal = read('resources/js/components/planning/DesignatedStaffModal.tsx');

    for (const [name, source] of [
        ['Plans/Index.tsx', plansPage],
        ['PPAs/Index.tsx', ppasPage],
        ['PlanningMaps/Index.tsx', mapsPage],
        ['SupportingDocsPanel.tsx', docsPanel],
        ['DesignatedStaffModal.tsx', staffModal],
    ]) {
        assert.doesNotMatch(source, /localStorage\.|sessionStorage\.|planningStore|URL\.createObjectURL/, `${name} must not use client-side storage or synthetic blob downloads`);
    }

    assert.match(plansPage, /router\.post\(\s*'\/development-plans'/);
    assert.match(ppasPage, /router\.post\(\s*'\/ppas'/);
    assert.match(ppasPage, /\/ppas\/export\/csv/);
    assert.match(mapsPage, /router\.post\(\s*'\/planning-maps'/);
    assert.match(docsPanel, /router\.post\('\/planning\/attachments'/);
    assert.match(staffModal, /router\.post\(\s*'\/planning\/designated-staff'/);
});

test('PL-08: PlanningMaps uses self-contained SVG spatial reference plates with awaiting_official_gis disclosure and zero third-party tile leakage', () => {
    const mapsPage = read('resources/js/pages/PlanningMaps/Index.tsx');
    assert.match(mapsPage, /awaiting_official_gis/);
    assert.match(mapsPage, /SCHEMATIC PLATE · NOT AN OFFICIAL CADASTRAL SURVEY/);
    assert.doesNotMatch(mapsPage, /tile\.openstreetmap\.org|cartocdn\.com|mapbox\.com|googleapis\.com/);
});

test('HELD boundaries: Messages and unverified Correspondence mutations remain fail-closed in routes/web.php', () => {
    const routes = read('routes/web.php');
    assert.match(routes, /Route::get\('\/messages'.*DenyUnapprovedMessaging::class/);
    assert.match(routes, /Route::post\('\/messages\/feed'[\s\S]*?DenyUnapprovedMessaging::class/);
    assert.match(routes, /Route::post\('\/correspondence\/\{correspondence\}\/workspace\/register'.*DenyUnverifiedCorrespondenceMutations::class/);
    assert.match(routes, /Route::get\('\/hris', fn \(\) => redirect\(\)->route\('employees\.index'\)\)/);
});
