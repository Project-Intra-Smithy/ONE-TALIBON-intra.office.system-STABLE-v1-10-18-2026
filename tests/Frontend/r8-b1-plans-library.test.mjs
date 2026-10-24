import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
const page = read('resources/js/pages/Plans/Index.tsx');
const card = read('resources/js/components/plans/PlanCard.tsx');
const filters = read('resources/js/components/plans/PlanFilterBar.tsx');
const css = read('resources/css/r8-plans.css');
const dataset = read('resources/js/data/municipal/plans.ts');
test('B1 cover grid uses source-owned plan fields and explicit illustrative label', () => {
  for (const field of ['plan.code', 'plan.title', 'plan.coverageStart', 'plan.coverageEnd', 'plan.status', 'plan.leadOffice', 'plan.horizon']) assert.ok(card.includes(field), field);
  assert.match(card, /Illustrative library cover/);
  assert.match(page, /r8-plans-grid/);
  assert.match(page, /not validated live municipal approvals/i);
  assert.match(page, /Not a validated live municipal approval or certified document/);
  assert.doesNotMatch(card, /href=|download=/);
});
test('B1 filters preserve dataset-backed predicates and reset', () => {
  assert.match(page, /municipalPlans\.filter/);
  for (const field of ['status', 'horizon', 'leadOffice', 'query']) assert.ok(page.includes('filters.' + field));
  assert.match(filters, /onChange\(\{ query: '', status: 'All', horizon: 'All', leadOffice: 'All' \}\)/);
  assert.match(filters, /resultCount/);
  assert.match(dataset, /export const municipalPlans/);
});
test('B1 dialog retains Escape, Tab cycle, focus restoration and scroll lock', () => {
  for (const fragment of ["event.key === 'Escape'", "event.key !== 'Tab'", "document.body.style.overflow = 'hidden'", "document.body.style.overflow = previousOverflow", 'closeButtonRef.current?.focus()', 'role="dialog"', 'aria-modal="true"', 'aria-labelledby=', 'aria-describedby=', "requestAnimationFrame(() => document.getElementById"]) assert.ok(page.includes(fragment), fragment);
  assert.match(page, /event.currentTarget === event.target/);
  assert.doesNotMatch(page, /router\.post|fetch\(|approvePlan|uploadPlan/);
});
test('B1 styling is rooted and includes compact mobile, reduced-motion and high-contrast accommodations', () => {
  assert.match(page, /className="ot-r6-modules ot-r6-plans r8-plans"/);
  assert.match(css, /@media \(max-width: 639px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(css, /(?:^|\n)\s*(body|html|:root|\.municipal-panel)\s*\{/);
});
