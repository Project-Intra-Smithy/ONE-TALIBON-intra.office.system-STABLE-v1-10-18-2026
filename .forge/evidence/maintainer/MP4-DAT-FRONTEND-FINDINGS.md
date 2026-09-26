# MP4 DAT — FRONTEND FINDINGS RECORD

## Status

`OBSERVED / TECHNICAL-AUTHORITY FIELD TEST`

Date:

`2026-09-26`

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Observed source state:

`main@615529ce6663933dd3eeee4d504d14d1f21b626d`

This record captures the post-rehearsal frontend findings that authorize MP5 planning. It is not UAT, deployment evidence, production acceptance, or a formal benchmark.

## Observed positives

- Messages was manually exercised and judged to be working well enough to protect from gratuitous redesign.
- General navigation across the representative portal surfaces remained usable.
- The Technical Authority observed materially improved perceived runtime speed compared with the earlier experience.

The speed statement is qualitative field evidence. No controlled before/after benchmark was recorded.

## Confirmed frontend issue

### Repeated transaction notification alert

During navigation across unrelated pages, the same transaction-approved alert could appear repeatedly.

Current `AppLayout.tsx` keeps notification keys only in component-local refs and, on notification initialization, may surface a recently-created transaction notification as a live alert.

MP5 W01 must inspect the actual mount/navigation lifecycle and repair delivery semantics so historical/recent feed state is not repeatedly presented as a newly delivered alert.

The repair must preserve actual new-notification delivery and notification history.

## Density findings

### Department Workspace

The first frame is dominated by large metric cards, including zero-value cards.

Desired correction:

- compress metrics;
- preserve warning emphasis only when meaningful;
- bring workload/actionable content higher;
- keep all current server-owned meaning.

### Employee Directory

The three summary counts consume disproportionate space relative to the actual directory.

Desired correction:

- compact summary strip;
- prioritize search/results;
- preserve work-context-only privacy boundary.

### Local Special Bodies

The formal name and card-heavy presentation are difficult to scan for non-specialists.

Desired correction:

- present as **Councils, Boards & Committees**;
- keep formal local-special-body meaning in explanatory copy;
- reduce card height/chrome.

### Legislative Records

The page structure is comparatively strong, but the label is not immediately understandable to every user.

Desired correction:

- present as **Ordinances & Issuances**;
- preserve the existing register, record-type semantics, filtering, and route.

### Municipal Systems

The page reads as a set of system cards instead of a compact internal directory.

Desired correction:

- present as **Systems Directory**;
- compact summary counters and records;
- preserve ownership/status/scope/integration context.

## Later-batch findings

The DAT also raised clarity/density questions around:

- My Work / transaction creation;
- transaction detail whitespace;
- Correspondence terminology;
- Memoranda versus Announcements;
- Announcements hierarchy;
- state/recency scanability.

These are intentionally not all placed into Batch 1.

## Calendar / Meetings question

A meeting visible in the Meetings register was not obviously visible in the Calendar screenshot for the same week.

Classification:

`NEEDS CONTRACT VERIFICATION`

No projection/synchronization repair is authorized by this observation alone.

## Protected boundaries

Do not use this DAT record as authority to:

- reopen backend hardening;
- widen permissions;
- change workflow/domain semantics;
- redesign Messages;
- change schema/migrations;
- claim performance benchmark PASS;
- claim UAT/deployment/production readiness.

## Next authority

See:

`docs/MP5_POST_DAT_FRONTEND_CORRECTION_PLAN.md`
