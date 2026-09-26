# ONE TALIBON V1 — MP5 W01 REVIEW DISPOSITION

## Authority

Candidate:

`a31aacc620d8dae448f0fdd1239408c17f74aaf2`

Immutable start:

`ee06d97e896e988527314ebbdacc5cf02625d52e`

Remote/lineage:

`PASS — 5 ahead / 0 behind / exact merge base`

## Reviewer verdict

`SUITABLE WITH RECORDED LIMITATIONS`

Confirmed defects:

`NONE CONFIRMED`

## Source-review result

The reviewer found the notification replay mechanism structurally corrected at source level:

- first actual fetched feed establishes the baseline rather than the initial empty React state;
- notification presentation keys persist across ordinary Inertia layout remounts;
- sessionStorage persists presentation state across direct reloads within the browser-tab session;
- presentation state is namespaced by authenticated numeric user ID;
- user changes clear local feed/live-alert/unseen state;
- bell/history remains backend-feed-driven and is not deleted, hidden, acknowledged, or marked read by toast dedupe;
- the existing 8-second visible polling cadence remains;
- the focused browser proof is exact-SHA/test-environment guarded and covers historical-feed baseline, unrelated navigation, new delivery, no replay, reload, retained history, and runtime error counters.

## Recorded risks

### Storage-unavailable full reload degradation

When sessionStorage is unavailable, the module-level in-memory ledger protects ordinary SPA/Inertia remounts but cannot survive a full browser reload.

The implementation chooses replay-safety on the new baseline, so a recently created notification first observed only after such a reload may appear in bell/history without a live toast. A genuinely new notification arriving after the baseline still alerts.

Classification:

`LIKELY RISK / DEGRADED-MODE LIMITATION`

### Hypothetical same-mounted-layout identity-change race

Toast consumption is owner-gated by `feedOwnerId === userId`, but bell/history rendering itself is not owner-gated.

The current Showcase persona-switch path unmounts authenticated AppLayout and aborts polling, so this is not a confirmed current-path defect.

Classification:

`LIKELY RISK / DEFENSIVE FUTURE-IDENTITY-SWITCH LIMITATION`

## Missing execution evidence

- `npm run types:check`: NOT RUN
- `npm run build`: NOT RUN
- `node tests/Browser/mp5-notification-replay.mjs`: NOT RUN / NOT OBSERVED
- exact-candidate GitHub workflow/status/check evidence: NONE OBSERVED

## Integration-readiness disposition

`SUITABLE ONLY AFTER MISSING EXECUTION EVIDENCE IS OBTAINED`

No bounded implementation rework is currently required.

Acceptance is blocked until exact-candidate TypeScript, build, and focused browser/runtime evidence are obtained.

Reviewer authority returned without implementation, integration, promotion, or deployment.
