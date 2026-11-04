import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const scroller = source('resources/js/components/dashboard/DashboardScrollRegion.tsx');
const recent = source('resources/js/components/dashboard/RecentWorkList.tsx');
const activity = source('resources/js/components/dashboard/ActivityRail.tsx');
const metrics = source('resources/js/components/dashboard/MetricGroup.tsx');
const correspondence = source('resources/js/components/dashboard/CorrespondenceOverview.tsx');
const css = source('resources/css/ot-reference-dashboard.css');
const pkg = JSON.parse(source('package.json'));

test('R5 uses native bounded scroll regions, named and keyboard-accessible for longer lists', () => {
    assert.match(scroller, /itemCount >= 4/);
    assert.match(scroller, /role=\{keyboardRegion \? 'region' : undefined\}/);
    assert.match(scroller, /aria-label=\{keyboardRegion \? label : undefined\}/);
    assert.match(scroller, /tabIndex=\{keyboardRegion \? 0 : undefined\}/);
    assert.match(css, /\.ot-reference-dashboard \.ot-dashboard-scroll-region/);
    assert.match(css, /max-height:clamp\(210px,31vh,340px\)/);
    assert.match(css, /overflow-y:auto/);
    assert.match(css, /scrollbar-width:thin/);
    assert.match(css, /:focus-visible/);
});

test('operational work and notification rows keep their actual data, links and server state', () => {
    for (const component of [recent, activity, metrics, correspondence]) {
        assert.match(component, /<DashboardScrollRegion/);
    }
    assert.match(recent, /items\.map\(\(item\) => compact \? <Link/);
    assert.match(recent, /href=\{item\.detailUrl\}/);
    assert.match(recent, /compact \?/);
    assert.match(activity, /notifications\.map\(/);
    assert.match(activity, /notificationState === 'expired'/);
    assert.match(activity, /system\.security\.recentEvents\.map\(/);
    assert.match(metrics, /group\.metrics\.map\(/);
    assert.match(metrics, /Categories may overlap/);
    assert.match(correspondence, /overview\.recentlyReceived/);
    assert.match(correspondence, /overview\.recentlyRouted/);
});

test('panel chrome has readable counts and remains scoped to dashboard only', () => {
    assert.match(recent, /items\.length} recent work items/);
    assert.match(activity, /eventCount} activity items/);
    assert.match(css, /\.ot-reference-dashboard \.ot-dashboard-panel-count/);
    assert.match(css, /@media \(max-width:767px\)/);
    assert.match(css, /max-height:none/);
    assert.match(css, /overflow:visible/);
    assert.match(css, /\.dark \.ot-reference-dashboard \.ot-dashboard-scroll-region/);
    assert.doesNotMatch(css, /(?:^|\n)\s*(?:body|html|:root|\.municipal-panel)\s*\{/);
});

test('R5 does not bring in unverified UI packages or change application dependencies', () => {
    assert.equal(pkg.dependencies['@radix-ui/react-scroll-area'], undefined);
    assert.equal(pkg.dependencies['@tanstack/react-virtual'], undefined);
    assert.match(scroller, /native scrolling/);
});
