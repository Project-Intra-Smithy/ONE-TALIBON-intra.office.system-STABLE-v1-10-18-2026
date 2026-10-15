import test from 'node:test';
import assert from 'node:assert/strict';
import {dateKey, monthDays, intervalPosition} from '../resources/js/components/dashboard/schedulePresentation.ts';
test('schedule dates respect municipal timezone, date-only values and leap years',()=>{
 assert.equal(dateKey('2026-10-15T18:00:00Z','Asia/Manila'),'2026-10-16');
 assert.equal(dateKey('2026-02-30'),null);
 assert.equal(dateKey('2026-10-16'),'2026-10-16');
 assert.equal(dateKey('invalid'),null);
 assert.equal(monthDays('2024-02-15').length,29);
 assert.equal(monthDays('2026-02-15').length,28);
});
test('timeline clips real durations and rejects missing, reversed or out-of-range intervals',()=>{
 assert.deepEqual(intervalPosition('2026-10-01','2026-10-03','2026-10-02','2026-10-04'),{left:0,width:50});
 assert.equal(intervalPosition('2026-10-01',null,'2026-10-02','2026-10-04'),null);
 assert.equal(intervalPosition('2026-10-03','2026-10-01','2026-10-02','2026-10-04'),null);
 assert.equal(intervalPosition('2026-10-05','2026-10-06','2026-10-02','2026-10-04'),null);
});
