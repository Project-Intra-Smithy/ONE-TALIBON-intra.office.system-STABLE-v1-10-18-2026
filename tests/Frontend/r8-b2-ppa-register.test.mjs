import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const source = (path) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const page = source('resources/js/pages/PPAs/Index.tsx');
const filters = source('resources/js/components/ppas/PPAFilters.tsx');
const register = source('resources/js/components/ppas/PPARegister.tsx');
const detail = source('resources/js/components/ppas/PPADetailPanel.tsx');
const css = source('resources/css/r8-ppas.css');
test('B2 retains all seven reference-data filter predicates and reset', () => {
  assert.match(page, /ppaRecords\.filter/);
  for (const key of ['query','sector','office','year','plan','fundingSource','status']) {
    assert.match(page, new RegExp('filters\\.' + key));
  }
  assert.match(filters, /const reset =/);
  assert.match(filters, /Advanced filters/);
  assert.match(page, /setSelected\(null\)/);
});
test('B2 status badges are restricted to five PPA domain status values', () => {
  for (const status of ['Planned','For Procurement','Ongoing','Completed','On Hold']) assert.ok(register.includes(status));
  assert.match(register, /Record<PPARecord\['status'\], string>/);
  assert.doesNotMatch(register, /percentComplete|completionPercent|progressBar|<progress/i);
});
test('B2 preserves mobile cards, desktop register and detail focus restoration', () => {
  assert.match(register, /lg:hidden/); assert.match(register, /lg:block/);
  assert.match(register, /<table/); assert.match(register, /overflow-x-auto/);
  assert.match(register, /aria-selected=\{selectedId === record\.id\}/);
  assert.match(register, /aria-expanded=\{selectedId === record\.id\}/);
  assert.match(register, /r8-ppas-card-meta/);
  assert.match(detail, /panelRef\.current\?\.focus\(\)/);
  assert.match(detail, /event\.key === 'Escape'/);
  assert.match(page, /dataset\.ppaTrigger === id/);
  assert.match(page, /trigger\?\.focus\(\)/);
});
test('B2 preserves reference disclosures and adds no monitoring or CRUD surface', () => {
  assert.match(page, /no completion percentage is recorded for PPAs/);
  assert.match(page, /do not represent verified live project progress/);
  assert.match(detail, /Not verified live implementation progress/);
  assert.doesNotMatch(page + register + filters + detail, /Add Project|Create PPA|router\.post|percentComplete|progressBar/);
  assert.match(page, /r8-ppas/);
  assert.match(css, /\.r8-ppas/);
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:body|html|:root)\s*\{/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /forced-colors/);
});