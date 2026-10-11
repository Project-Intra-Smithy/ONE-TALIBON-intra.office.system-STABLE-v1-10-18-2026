import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyNotificationFeed, parseNotificationFeed } from '../resources/js/compat/notificationFeed.ts';
import { allowedMemoAudiences, calendarAnchor, correspondenceOverviewCount } from '../resources/js/compat/uiContracts.ts';
import { isStagedInertiaPath } from '../resources/js/navigation/stagedRoutes.ts';

test('canonical shared props omit notifications and the initial feed is safe', () => {
    const shared = { auth: { user: { id: 1 } }, permissions: { navigation: {} } };
    assert.equal(shared.notifications, undefined);
    assert.deepEqual(emptyNotificationFeed().notifications, []);
    assert.equal(emptyNotificationFeed().unreadMemoCount, 0);
    const parsed = parseNotificationFeed({ unreadMemoCount: 2, notifications: [
        { key: 'tx-1', type: 'transaction', title: 'Work', message: 'Assigned', url: '/transactions/1' },
        { key: 'p-2', type: 'messaging', title: 'Other', message: 'New', url: '/dashboard' },
        { key: 'bad', title: 'Unsafe', message: 'URL', url: 'https://example.com' },
        null,
    ] });
    assert.equal(parsed.notifications.length, 2);
    assert.equal(parsed.unreadMemoCount, 2);
    assert.throws(() => parseNotificationFeed({ notifications: null }));
});

test('calendar producer date fallback rejects rollover and supports its four views', () => {
    const calendar = { view: 'week', anchor_date: '2026-02-30', today: '2026-03-01', range_start: '2026-03-01T00:00:00+08:00', range_end: '2026-03-07T23:59:59+08:00' };
    assert.equal(calendarAnchor(calendar.anchor_date, calendar.today), '2026-03-01');
    assert.equal(calendarAnchor('2026-03-02', calendar.today), '2026-03-02');
    assert.equal(calendarAnchor('nonsense', null), null);
    assert.ok(['month', 'week', 'day', 'schedule'].includes(calendar.view));
});

test('memo audiences reflect server authority, including recipient-only', () => {
    assert.deepEqual(allowedMemoAudiences(['departments', 'employees']), ['departments', 'employees']);
    assert.deepEqual(allowedMemoAudiences([]), []);
    assert.deepEqual(allowedMemoAudiences(['all', 'bogus']), ['all']);
});

test('correspondence overview counts are separate from intentionally empty list', () => {
    const fixture = { records: { data: [], total: 0 }, overview: { counts: { all: 7, needs_action: 2 }, previews: { needs_action: [{ publicId: 'ref' }] } } };
    assert.equal(fixture.records.total, 0);
    assert.equal(correspondenceOverviewCount(fixture.overview, 'all'), 7);
    assert.equal(correspondenceOverviewCount(fixture.overview, 'needs_action'), 2);
    assert.equal(correspondenceOverviewCount({ counts: {} }, 'all'), 0);
});

test('staged page links exclude missing backend-rendered components', () => {
    for (const path of ['/dashboard', '/calendar?view=day', '/transactions/1', '/memoranda/create', '/correspondence/a/workspace', '/employees']) assert.equal(isStagedInertiaPath(path), true, path);
    for (const path of ['/', '/activate-account', '/admin', '/audit', '/mayor-office', '/travel-orders', '/reports', '/departments/1/workspace', 'https://example.com']) assert.equal(isStagedInertiaPath(path), false, path);
});
