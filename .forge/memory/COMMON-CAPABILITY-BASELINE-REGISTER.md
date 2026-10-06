# KIRION FORGE MEMORY — COMMON CAPABILITY BASELINE REGISTER

## Authority snapshot

Backend authority:

`main@4bac88d22e1fb3f808c024888845503922c41683`

Validated executable anchor:

`395438674b4d2f00659eba616db760b339bb390a`

This register defines the starting condition for the COMMON SYSTEM PROGRAM.

State vocabulary:

- `ACCEPTED`
- `STRONG FOUNDATION`
- `FOUNDATION`
- `PARTIAL`
- `MISSING`
- `INPUT-GATED`
- `DISCOVERY/SPECIALIZED`
- `EXCLUDED`

Action vocabulary:

- `PRESERVE`
- `BUILD`
- `EXTEND`
- `MATURE`
- `INTEGRATE`
- `REGRESS`
- `BLOCK`
- `DO NOT PROMOTE`

---

| Capability | Repo-backed evidence | Current state | Program action | Target |
|---|---|---|---|---|
| Authentication | AuthenticatedSessionController, auth routes | ACCEPTED FOUNDATION | PRESERVE + REGRESS | P6 final regression |
| Active-account enforcement | RequireActiveAccount | STRONG FOUNDATION | PRESERVE + REGRESS | P6 |
| MFA | Mfa controllers/middleware/services | ACCEPTED FOUNDATION | PRESERVE + REGRESS | P6 |
| Organization / Departments | Department model/controllers/workspaces | STRONG FOUNDATION | PRESERVE; authoritative roster later | Cross-cutting |
| Employees / Directory | Employee/User relationships, directory/profile | STRONG FOUNDATION | PRESERVE; authoritative roster later | Cross-cutting |
| Work Requests | WorkflowTransaction + policy/services/events/routes/tests | STRONG / CENTRAL | PRESERVE + NON-DESTRUCTIVE INTEGRATION | P1/A03 |
| Current My Work | WorkQueueExperienceResolver + WorkQueueQuery | REAL / TRANSACTION-BACKED | EXTEND COMPATIBLY | P1/A02 |
| First-Class generic Task | no canonical generic Task model/controller/route found | MISSING | BUILD | P1/A01 |
| True Unified My Work | no Task+WorkRequest authoritative aggregator possible yet | MISSING | BUILD AFTER TASK CONTRACT | P1/A02 |
| Correspondence | lifecycle/routing/access/reference/events/workspace | STRONG FOUNDATION | MATURE | P3/C01 |
| Documents | Document/DocumentLink/access/attachment/evidence | FOUNDATION | MATURE | P3/C02 |
| Records | Records controller/query/presenter/history/search | STRONG FOUNDATION | MATURE | P3/C03 |
| Cross-domain references | domain links exist in places; no fully locked common convention | PARTIAL | MINIMAL COMMON CONTRACT | P3/C04 + cross-cutting |
| Portal/Global Search | PortalSearchController + Records search | PARTIAL COMMON SEARCH | EXTEND ACCEPTED DOMAINS ONLY | P4 |
| Memoranda | create/show/acknowledge | FOUNDATION | MATURE WHEN AUTHORITY EXISTS | P3/adjacent |
| Notifications | PlatformNotification/service/feed/read/ack | STRONG FOUNDATION | INTEGRATE / MATURE POLICY | P2/B01 |
| Calendar | CalendarEvent + CalendarService/workspace | AUTHORITATIVE FOUNDATION | PRESERVE + INTEGRATE | P2/B02 |
| Messaging | Message + canonical controllers/request/resource + accepted browser/runtime evidence | ACCEPTED | PRESERVE / BOUNDED INTEGRATION | P2/B03 |
| Meetings | reference/front surface; no equally authoritative lifecycle | INPUT-GATED | BLOCK FROM COMMON COMPLETION | Track W |
| Announcements | reference/front surface; no authoritative publishing lifecycle | INPUT-GATED | BLOCK FROM COMMON COMPLETION | Track W |
| Dashboards | personal/office/executive/admin query services | STRONG FOUNDATION | INTEGRATE ACCEPTED DOMAINS | P5 |
| Reports/Exports | report catalog/service/export/domain queries | FOUNDATION | MATURE / INTEGRATE | P5 |
| Audit | AuditLog/AuditLogger/workflow listeners | STRONG FOUNDATION | EXTEND + REGRESS | P5/P6 |
| Authorization | policies/capabilities/guards/route patterns | STRONG DESIGN / PARTIAL FINAL MATRIX | PER-SERIES + FINAL RECONCILIATION | P1-P6 |
| Procurement | explicit reference surface; no authoritative full lifecycle | DISCOVERY/SPECIALIZED | DO NOT BUILD YET | Track W |
| Project Monitoring | reference/strategic; official lifecycle/KPI unresolved | DISCOVERY/SPECIALIZED | DO NOT BUILD YET | Track W |
| Full HRIS | historical/specialized code exists | EXCLUDED IMMEDIATE COMMON SCOPE | DO NOT PROMOTE | separate authority |
| Property | substantial historical/specialized code | SPECIALIZED / DEFERRED | DO NOT AUTO-PROMOTE | separate authority |
| Legislative | substantial historical/specialized code | SPECIALIZED / DEFERRED | DO NOT AUTO-PROMOTE | separate authority |
| Travel Order | substantial historical/specialized code | SPECIALIZED / DEFERRED | DO NOT AUTO-PROMOTE | separate authority |

---

# Critical interpretation notes

## Current "My Tasks" labels are not proof of a Task domain

`WorkQueueExperienceResolver` contains labels such as `My Tasks`.

`WorkQueueQuery` is still based on `WorkflowTransaction`.

Therefore:

`UI LABEL != DOMAIN AUTHORITY`

A01 remains required.

## Existing code does not equal common-system authority

A model/route/page can exist historically without being promoted into the locked common program.

This applies especially to:

- Full HRIS;
- Property;
- Legislative;
- Travel Order;
- Procurement/reference;
- Project Monitoring/reference.

## Existing strong foundations should not be rebuilt

Unless a concrete defect/contract need requires otherwise, do not rebuild:

- Work Requests;
- Messaging;
- Auth/MFA;
- Calendar persistence;
- notification persistence;
- Records search foundation;
- dashboard shell/query foundations;
- report/export foundation;
- audit foundation.

The common program should move from strongest existing foundation toward missing/partial common capability.
