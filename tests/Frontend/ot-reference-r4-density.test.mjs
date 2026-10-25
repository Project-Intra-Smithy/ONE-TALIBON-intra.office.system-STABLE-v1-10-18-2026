import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const dashboard = source('resources/js/pages/Dashboard.tsx');
const header = source('resources/js/components/dashboard/DashboardHeader.tsx');
const upper = source('resources/js/components/dashboard/r7/R7UpperRegion.tsx');
const recentWork = source('resources/js/components/dashboard/RecentWorkList.tsx');
const activity = source('resources/js/components/dashboard/ActivityRail.tsx');
const metrics = source('resources/js/components/dashboard/MetricGroup.tsx');
const css = source('resources/css/ot-reference-dashboard.css');

test('one compact municipal toolbar retains all valid in-page jump destinations', () => {
    assert.match(dashboard, /className="ot-dashboard-toolbar(?: [^"]*)?"/);
    assert.match(dashboard, /aria-label="Jump to work section"/);
    for (const destination of ['#work-overview', '#dashboard-correspondence', '#personal-tasks']) {
        assert.ok(dashboard.includes(`href="${destination}"`));
    }
    assert.match(header, /<MunicipalContext\s*\/>/);
});

test('R4 panel treatment is explicitly scoped to dashboard and does not alter source data', () => {
    assert.match(css, /\.ot-reference-dashboard \.ot-dashboard-panel-heading/);
    assert.match(css, /\.ot-reference-dashboard \.ot-dashboard-metrics \.workspace-metric/);
    assert.doesNotMatch(css, /(?:^|\n)\s*(?:body|html|:root|\*|\.municipal-panel)\s*\{/);
    assert.match(upper, /<RecentWorkList\s+compact/);
    assert.match(upper, /<ActivityRail system=/);
    assert.match(upper, /groups\.map\(/);
    assert.match(dashboard, /secondaryGroups\.map\(/);
});

test('compact header does not change the expanded recent-work variant used by other pages', () => {
    assert.match(recentWork, /compact \? 'ot-dashboard-panel-heading ' : ''/);
    assert.match(recentWork, /items\.map\(\(item\) => compact \?/);
    assert.match(recentWork, /href=\{item\.detailUrl\}/);
});

test('activity and metrics render underlying authorized projections without synthetic data', () => {
    assert.match(activity, /notifications\.map\(/);
    assert.match(activity, /system\.security\.recentEvents\.map\(/);
    assert.match(activity, /ot-dashboard-panel-heading municipal-panel-title/);
    assert.match(metrics, /group\.metrics\.map\(/);
    assert.match(metrics, /ot-dashboard-panel-heading/);
    assert.match(metrics, /Categories may overlap/);
});

test('responsive and accessible theme variants are present', () => {
    assert.match(css, /@media \(max-width:767px\)/);
    assert.match(css, /\.dark \.ot-reference-dashboard \.ot-dashboard-panel-heading/);
    assert.match(css, /@media \(prefers-contrast:more\)/);
    assert.match(dashboard, /tabIndex=\{-1\}/);
});
