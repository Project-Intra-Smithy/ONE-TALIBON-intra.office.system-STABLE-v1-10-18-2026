# R6 municipal UI primitives — additive interface

The eight exports are available from `resources/js/components/ui` and may be used independently. Each component imports `./ui-system.css` directly; the bundler deduplicates that stylesheet. All styles use opt-in `ot-ui-*` selectors and existing `--municipal-*` variables. No global style or app route is changed.

| Export | Required props | Optional props/defaults | Semantics |
| --- | --- | --- | --- |
| `UiPanel` | `children` | `as='div'`, `density='standard'`, `header`, `footer`, native attributes | Layout; label sections with `aria-labelledby` or `aria-label` |
| `UiPanelHeader` | `title` | `headingLevel='h2'`, `headingId`, `icon`, `count`, `actions`, `emphasis='neutral'` | Actual heading; decorative icon; optional supplied count |
| `UiScrollArea` | `label`, `children` | `maxHeight`, `style`, native div attributes | Named, keyboard-focusable native scroll region; bounded only when consumer supplies max height; grows on mobile |
| `UiEmptyState` | `title` | `kind='empty'`, `description`, `icon`, `action` | `empty`, `unauthorized`, `unavailable`, `pending-authority` states; denial uses alert semantics |
| `UiLoadingState` | — | `label='Loading results'`, `rows=3` (clamped 1–8), `sessionExpired=false` | Status and hidden skeletons; expired session renders distinct unavailable state |
| `UiFilterShell` | `controls` | `label='Filters'`, `actions`, `activeFilters` | Presentational group; caller owns query state and navigation |
| `UiDataRegion` | `title` | `titleId`, `resultCount`, `filters`, `actions`, `children`, `state='ready'`, `stateTitle`, `stateDescription`, `stateAction`, `density='standard'` | Named data section and focusable native horizontal viewport; no pagination/query logic |
| `UiActionButton` | `children` | `variant='primary'`, `pending=false`, `disabled=false`, `href` for app links, native button props | Inertia link or native button; disabled/pending links are inert; pending buttons actually disabled |

```tsx
import { UiPanel, UiPanelHeader, UiScrollArea, UiActionButton, UiEmptyState } from '@/components/ui';

<UiPanel as="section" aria-labelledby="authorized-work" density="compact"
  header={<UiPanelHeader title="Recent work" headingId="authorized-work" count={items.length} />}
  footer={<UiActionButton variant="secondary" href="/transactions">Open work</UiActionButton>}>
  {items.length ? <UiScrollArea label="Recent work items" maxHeight="320px">
    {items.map(item => <AuthorizedWorkRow key={item.id} item={item} />)}
  </UiScrollArea> : <UiEmptyState title="No recent work" />}
</UiPanel>
```

`items` above is a caller-controlled **server-authorized** collection; `AuthorizedWorkRow` is a consuming feature's component, not part of these primitives. `UiActionButton` does not infer whether a route is authorized. The caller must only render legitimate actions. A consumer must pass `sessionExpired` when its authenticated session expires, and keep authority-denial state distinct from an empty dataset.

**Suggested integrations (not performed in this branch):** gradually adopt `UiPanel`/`UiPanelHeader` for presentation-only dashboard cards; prefer the existing `DashboardScrollRegion` for current dashboard consumers unless its behavior differs from the desired contract; consider `UiFilterShell` as a layout wrapper around the existing `ProgressiveFilterBar`, never as a replacement for its controlled state; use `UiDataRegion` for document/transaction registers only after an owning worker verifies data and permission projections. `PageFrame`, `PageHeader`, `StatusBadge`, `PortalModuleCard` and `AuthorityPendingSurface` remain authoritative for their current responsibilities.
