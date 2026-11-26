# G1 Department Head synthetic fixture evidence

This note applies only to the isolated standalone evaluation harness. It does not describe or change production routing, backend authorization, municipal policy, or operational data.

## Route and role boundary

- `/my-department` selects `Departments/Workspace` only for the synthetic `department_head` role.
- Non-Head roles receive the existing restricted-access page.
- `/departments` remains the general `Departments/Index` directory for all representative roles.
- `/transactions` and `/work-requests` select the same isolated Work Request queue. Direct URL query values are applied to authorized synthetic records.
- `/work-requests/{synthetic-id}` and `/transactions/{synthetic-id}` select the existing Work Request detail only when the synthetic role may see that item.
- Unknown or malformed IDs use the existing isolated 404 page. Existing but unauthorized synthetic IDs use the restricted page.
- Detail mutation permissions are always false. The description explicitly states that workflow actions are unavailable and nothing can be saved; no action control reaches the incomplete form adapter.
- Direct component-catalog entry to `Departments/Workspace` is restricted for every non-Head synthetic role.

## Deterministic dataset

- Clock: `2026-11-14T09:00:00+08:00`
- Timezone: `Asia/Manila`
- 12 staff: 8 active, 2 overdue, 1 unavailable, 1 without assignments
- 24 Work Requests: 5 Head-action, 4 overdue, 5 due soon, 3 unassigned, 5 in progress, 2 recently completed
- 12 correspondence items
- 18 document/record examples, including restricted metadata and unavailable-file states
- 8 personal tasks, 6 calendar events, 4 memoranda, and 3 announcements
- Synthetic references use `SYN-`; any identity email exposed by shared standalone props uses `example.invalid`

## Journey coverage

1. Dashboard to Work Requests to a synthetic detail and back to the office queue.
2. My Department workload overview to status/owner-oriented office work.
3. My Department overdue metric to overdue queue and detail.
4. Documents/Records synthetic dataset with permitted, restricted, and unavailable examples.
5. My Department staff workload to associated authorized office work.

## State boundaries

The Work Request fixture contract distinguishes:

- `empty`: the authorized synthetic source contains zero records.
- `no_match`: the authorized source contains records, but the active query/filter returns zero.

The extracted Work Request list presents zero filtered rows as “No matching work,” so the no-match scenario is executable there. The extracted `Departments/Workspace` has no search/filter contract and cannot visually distinguish a no-match state from source emptiness. Its `state=no_match` variant therefore retains source data and is documented as **not exercised** rather than presenting a false empty workspace. Changing that presentation would require forbidden `resources/js/**` work.

Slow, retryable, and stale behavior remains represented only where extracted components already support those states. No new backend or browser capability was invented.

## R3 GET adapter correction

The separately authorized `standalone/inertia.tsx` amendment now serializes data supplied to `router.get()` into a safe relative URL. Apply, Clear, and queue-tab actions therefore trigger the existing standalone `popstate` redraw with the selected query state intact.

The adapter contract is intentionally narrower than real Inertia:

1. Only same-origin relative paths beginning with one `/` are accepted.
2. Strings, finite numbers, booleans, and arrays of those scalar values are supported. Arrays use repeated keys.
3. Empty strings, `null`, `undefined`, non-finite numbers, and unsupported objects remove the named query key rather than being flattened.
4. Existing unrelated query keys and URL hashes are preserved.
5. `replace: true`, `onSuccess`, and `onFinish` are honored. Other Inertia state/scroll options remain presentation-only metadata in this harness.
6. GET navigation uses browser history and `popstate` only. It performs no fetch, XHR, persistence, or backend call.
7. `post`, `put`, `patch`, and `delete` retain their previous navigation-only behavior.
8. `useForm.transform()` remains intentionally unimplemented because Work Request mutation permissions remain disabled.

Behavior-level Node tests instrument history and a forbidden network surface, covering scalar and array values, query merging/removal, hashes, special characters, callback order, replace/push behavior, repeated visits, unsafe URL denial, Work Request integration, role scope, and unchanged mutation methods.

## R4 return-context projection

The standalone provider now projects `usePage().url` to the canonical `/transactions` path only while rendering `Transactions/Index` from `/work-requests` or `/transactions`. It retains the browser's exact query string and omits an irrelevant fragment from the projected value. The real browser address, history entry, fixture selection, and role scope remain unchanged.

This lets the immutable `WorkItemList` apply its existing production-compatible rule and encode the complete canonical list context into each detail link. The extracted detail page then receives the same validated search, filter, and queue context for its Back link.

The projection does not apply to detail pages, authentication, Documents, Records, My Department, the public homepage, or any other component. Ten non-browser R4 scenarios execute the actual helper extracted from `standalone/main.tsx` and the actual transpiled `WorkItemList` link-construction rule, including Head and Employee flows, negative roles, 403/404 behavior, encoded punctuation, and fragment exclusion.

## Browser restriction

R5 was validated without browser substitution. UX-01 R2 remains a separate partial visual-audit lane; R5 makes no new responsive, keyboard, contrast, or visual-acceptance claim.

## R5 fixture closure

- The synthetic HR identity is now `hr_admin` / HR Officer with the employee workspace experience. It has no Department Head office scope, capability, navigation projection, `/my-department` access, or component-catalog workspace access.
- The eight existing personal Task fixtures are exposed through a same-origin, exact-path, GET-only adapter for `/tasks` and `/tasks/{id}`. It supports `page`, `per_page`, and valid Task `state` filtering; returns truthful 403, 404, and 422 responses; maps due-soon/overdue presentation states to valid `in_progress` Task state; and denies mutations with 405 and an explicit no-save message.
- The adapter passes unrelated and cross-origin fetches to the original fetch implementation unchanged. It makes no real request and grants Task reads only to the synthetic Employee and Department Head contexts.
- Catalog rows 11, 22, 26, 39, 50, 54, 55, 57, and 61 now receive component-shaped synthetic props or an explicit role gate: Correspondence, HR Administration, DTR, Mayor Office, Property, Reports, Search, Work Request Create, and Travel Orders.
- HR Administration has an empty pending-action list and is HR-only. DTR is read-only (`isHrAdmin: false`). Property is read-only (`canManage: false`). Travel Orders is list-only (`canRecordApproved: false`). Reports labels its result as a synthetic preview and states that export is unavailable. Work Request Create remains the existing isolated form presentation with no backend connection or persistence.
- Deterministic source counts remain unchanged: 12 staff, 24 office Work Requests, 12 correspondence, 18 documents/records, 8 personal tasks, 6 calendar events, 4 memoranda, and 3 announcements.
