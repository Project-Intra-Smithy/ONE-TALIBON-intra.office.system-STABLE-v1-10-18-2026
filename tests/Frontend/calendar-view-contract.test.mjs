import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../../resources/js/pages/Calendar/Index.tsx', import.meta.url), 'utf8');

test('calendar has four distinct view regions', () => {
    for (const view of ['week', 'day', 'schedule']) {
        assert.match(source, new RegExp(`view === '${view}'`));
        assert.match(source, new RegExp(`data-calendar-view="${view}"`));
    }

    assert.match(source, /view === 'month'/);
});

test('week is server-windowed and separates all-day from timed events', () => {
    assert.match(source, /rangeDays\.map/);
    assert.match(source, /aria-label="All-day events"/);
    assert.match(source, /aria-label="Timed events"/);
});

test('day and schedule use accessible view-specific organization', () => {
    assert.match(source, /Day agenda for/);
    assert.match(source, /Timed agenda/);
    assert.match(source, /31-day schedule/);
    assert.match(source, /schedule window/);
});

test('schedule navigation advances the backend rolling window', () => {
    assert.match(source, /direction \* 31/);
    assert.doesNotMatch(source, /view === 'month' \|\| view === 'schedule'/);
});
