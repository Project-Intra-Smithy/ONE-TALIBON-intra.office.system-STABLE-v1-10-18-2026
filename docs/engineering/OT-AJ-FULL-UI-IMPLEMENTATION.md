# UI implementation checkpoint — 26 October 2026

Owner AJ, Codex-assisted. START_SYNCED: canonical memory `825c814d2995a58a997123cbf5ada04646b05827`, issue #17 comment `6411666979`. This supersedes the proposal's historical HOLD for the approved presentation reconciliation.

## Dashboard batch

Summary-first DOM order, wide sections, expanded existing recent-work metadata, readable count bars, themed surfaces, wrapping jump links and larger quick links. Actual metrics, role guards, destinations and task components are preserved. PR15 is unchanged; this branch does not import its protected shell/task changes or claim them integrated.

Validation: TypeScript PASS; frontend contracts 100/100 PASS; existing UX 9/9 PASS; Dashboard responsive tests 10/10 PASS (40 role/width/theme combinations). Vite production build PASS through browser test hooks. One obsolete compact-layout source assertion updated; behavioral assertions retained. React review: no new hooks, fetching, state or permissions.

Evidence: `storage/app/qa/full-ui/`; representative screenshots and logs in `docs/evidence/full-ui/`. Browser tests use the real application entry with synthetic HTTP props, not authenticated Laravel evidence. Matrix checks section order/width, overflow, metric font size, keyboard focus and JavaScript errors. Mobile light and desktop dark visual inspection caught jump clipping and quick-link density, both repaired and retested.

Authenticated backend acceptance, independent CI/QA, exhaustive contrast and every content/state combination remain unawarded. No merge, deployment or CLOSE. Next: Calendar, then Document Center.

## Priority update: Receiving Office

User's issues-first directive authorizes the Transactions/Create receiving-office control and a new page-consumed OfficeCombobox. Supplied department IDs/names remain authoritative; no backend changes. Case-insensitive partial name/short-name filtering, arrow keys, Enter, Escape, selected-office text, empty results and scrollable 44px options. Existing form submission and assigned-person reset preserved.

TypeScript PASS, contracts 100/100 PASS, focused browser 10/10 PASS across all requested widths/themes, including actual intercepted multipart target ID and assignee reset. Browser build PASS. Calendar edits retained separately. Synthetic evidence only; no human acceptance.

## Notification presentation and precise backend dependency

ActivityRail preserves server titles/messages and authorized URLs, adding separate title, description, timestamp, record-link and supported unread/action labels. Platform notifications with read_url are unread by NotificationFeedQuery's whereNull(read_at) projection; fallback events are not labeled unread. No automatic read/acknowledgement mutation added.

Source inspected: app/Services/NotificationFeedQuery.php, app/Domain/Workflow/Listeners/NotifyWorkflowTransactionMutation.php and resources/js/types.ts. Listener decisionTitle already produces Transaction approved/disapproved/completed. Routing produces Transaction routed to your office; initial receipt produces New transaction received. Fallback deliberately coalesces submitted/forward/send_to_mayor/return_origin/request_information into received messages and excludes terminal transactions. The feed has no structured actor, responsible office, reference, action code or current workflow status. Full action-specific titles and separately aligned actor/reference/status require a backend-owned, authorization-reviewed projection change in NotificationFeedQuery and producer payloads plus LiveNotification contract approval. This batch neither parses human message text nor invents missing fields.

TypeScript, 100 contracts, production browser build and 10 notification browser cases PASS (five widths, two themes). Synthetic events verify exact title/message/link preservation, supported unread distinction and missing timestamp fallback. Screenshot review also corrected the receiving-office test's synthetic POST response to valid Inertia transport; its earlier screenshot contained a test transport error overlay, not a product error. Regenerated evidence supersedes it.

## Calendar batch

Preserved the interrupted Calendar edits. Page-scoped spacing, 44px controls, 14px minimum secondary text, wrapped event labels, width-aware existing month agenda/grid and stacked week days at narrow widths. No changes to range/event logic, forms, scheduling or navigation contracts. Dark event contrast corrected after screenshot review. Calendar 10/10 matrix tests PASS: 40 width/theme/view combinations, long titles, focus return, touch controls and overflow. Existing UX rerun sequentially 9/9 PASS; the earlier simultaneous-build asset error is superseded. TypeScript/contracts PASS and production build PASS through browser hooks. No independent QA acceptance.

## Document Center batch

Consumer-only stylesheet and root classes; current Records/Files mode now has aria-current. Search-first toolbar, larger typography/targets, wide rows, inline full metadata, untruncated file names and themed file scope controls. All record/filter/pagination/download logic remains unchanged, including #136-related contracts. No new folder, preview renderer, bulk operation or context-menu capability invented.

10/10 browser matrix PASS (20 records/files width/theme combinations), existing UX 9/9 PASS. Tests verify record selection/deselection, actual GET search keys, unchanged download href, touch target heights and viewport overflow. Screenshot review repaired the historical metadata scroll cap; all fields remain readable. Build passes through browser hooks. Synthetic HTTP evidence does not certify real protected downloads.
