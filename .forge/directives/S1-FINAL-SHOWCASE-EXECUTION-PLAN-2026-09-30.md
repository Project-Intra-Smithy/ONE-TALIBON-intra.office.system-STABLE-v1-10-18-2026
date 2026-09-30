# KIRION FORGE — S1 FINAL SHOWCASE EXECUTION PLAN

Date: 2026-09-30
Showcase: 15:00 +08
Technical Authority: Kirch Ivan Balite

## Canonical source line

Do not use current `main` as the showcase integration base.

Canonical product/runtime base for this plan:

`KIRCH-TALIBON-S1-SHOWCASE-RUNTIME-HARDENING@3c12eadbda652ea7ab50047a68509fb1fb348a22`

This branch is a direct one-commit descendant of:

`KIRCH-TALIBON-S1-SHOWCASE-WELCOME-CREDITS@798ba88d545d3d016689686904063f97c2616929`

and contains the accepted integrated showcase product line plus the new isolated runtime orchestration scripts.

Do NOT merge `main` into this line.
Do NOT merge `AJ-TALIBON-PUBLIC-HOMEPAGE-GREEN-REFINEMENT` wholesale.
Do NOT merge `EliminateDarkMode` wholesale.
Both donor lines are divergent and must be consumed selectively.

---

# MAJOR

## M0 — Runtime / deployment validation and repair — P0

Current runtime writer result:

`KIRCH-TALIBON-S1-SHOWCASE-RUNTIME-HARDENING@3c12eadbda652ea7ab50047a68509fb1fb348a22`

Seven runtime files were added only; application/domain source was not modified.

Required before any further integration:

1. run `showcase-prepare.ps1` on the Windows presentation machine;
2. run `showcase-start.ps1 -Workers 4 -Port 18000`;
3. verify all four Laravel workers `/up`;
4. verify the Node proxy on `0.0.0.0:18000`;
5. run `showcase-status.ps1`;
6. run `showcase-load.mjs --clients 30`;
7. perform stop/start recovery without rebuilding, migrating, seeding, pulling Git, or clearing caches.

Runtime repair points to inspect immediately:

- configuration caching / `APP_URL` behavior after `php artisan optimize`;
- preserve or correctly derive `X-Forwarded-Proto` for Cloudflare HTTPS instead of blindly forcing `http`;
- `showcase-stop.ps1` must not delete runtime state if a recorded live process remains unmatched/un-stopped;
- optionally retry one failed idempotent GET/HEAD against another healthy worker before returning a transient 503;
- current load tool is transport-oriented and unauthenticated; add or run authenticated session rehearsal separately.

Acceptance:

- 0 unexpected 5xx;
- 0 timeouts;
- 0 network errors;
- 0 proxy crashes;
- 0 worker crashes;
- preferred p95 < 1500 ms;
- hard showcase ceiling p95 < 3000 ms.

If 4 workers do not pass, retest with 6 using configuration only. Do not redesign application backend.

## M1 — Create Work Request product rework — P0 product requirement

Target route:

`/transactions/create`

Treat Create Work Request as a digital municipal routing slip.

Normal employee visible form, in this order:

1. Request Category
2. Request Type — dynamic from category
3. Action Required
4. Receiving Office
5. Assigned Person — dynamic from Receiving Office
6. Priority
7. Deadline / Target Completion
8. Subject
9. Description
10. Attachment
11. Submit

Do not expose the full 15-field expert form by default.

Use a central server-backed work-request taxonomy/config so React and validation do not drift.

Required category families include Document / Communication, Planning & Development, Zoning / Land Use, Engineering / Infrastructure, Procurement, Budget / Finance, HR / Personnel, General Services / Logistics, ICT / Digital Systems, Project Monitoring, Inspection / Field Validation, Permits / Clearances, Legal / Sanggunian Action, Meetings / Events, Data / Research / Reports, Economic Enterprise, Environment / DRRM, Agriculture / Fisheries, Tourism / Investment Promotion, and Other.

Dynamic subtype examples are mandatory for at least Planning & Development, Zoning / Land Use, Procurement, and ICT / Digital Systems as specified by Technical Authority.

Preserve existing transaction workflow authority, evidence uploads, routing history, status, audit, notification and authorization boundaries.

Avoid unnecessary schema expansion. Prefer:

- `transaction_type` for the selected request subtype;
- category derived from the central subtype map;
- action-required recorded as structured creation context / event metadata or the smallest additive field required;
- `assigned_employee_id` set at creation only after server verification that the employee is active and belongs to the selected receiving office;
- existing `due_at`, `priority`, title, description and evidence infrastructure.

Reference number presentation should move toward:

`WR-YYYY-OFFICE-SEQUENCE`

but collision safety is more important than cosmetic four-digit sequencing. An ID-backed sequence is acceptable for the showcase.

No authorization regression: ordinary employee creates; receiving-office assignment must not grant new authority.

## M2 — All listed LGU office roles become loginable showcase identities — P0 showcase requirement

Create one curated loginable showcase identity for every office/role entry supplied by Technical Authority while preserving the existing authorization model.

Do NOT create dozens of new authorization role strings.

Map office personas onto existing application roles/experiences such as:

- mayor/executive -> `mayor_approver`;
- department office head -> `department_head` where appropriate;
- HRMO -> existing HR authority;
- legislative offices -> existing legislative authority;
- normal office roles -> `employee` or the narrowest existing role;
- system administration remains separate.

Keep total synthetic workforce near the existing 350-person target. Curated login accounts replace part of the generated employee population; they do not increase the workforce without reason.

Requirements:

- deterministic unique email per office;
- active employee record in the correct Department;
- shared private demo password from `PROTOTYPE_DEMO_PASSWORD`;
- all curated accounts selectable from Showcase workspace entry without a giant unusable wall;
- search/filter or grouped office selector;
- no identity collision;
- no role-string authorization shortcuts.

Replace hard-coded `7` persona assumptions in startup/tests/scripts with a central capacity/persona count derived from config.

## M3 — Final showcase integration + authenticated load rehearsal — P0

After M0/M1/M2 and presentation donor work are accepted, create one final integration branch from the runtime-hardened line.

Never integrate from `main`.

Required final gates:

- exact changed-path reconciliation;
- `npm run types:check`;
- `npm run build`;
- Laravel optimize under showcase environment;
- database/migration readiness;
- runtime start with 4 workers;
- all curated accounts loginable;
- 30 independent authenticated sessions distributed across distinct office personas where possible;
- dashboard / transactions / memoranda / records / calendar / municipal systems read flows;
- small controlled messaging cohort only;
- synchronized dashboard burst;
- stop/start recovery;
- Cloudflare Quick Tunnel to `http://127.0.0.1:18000`;
- external phone/laptop smoke;
- final dress rehearsal.

---

# MEDIUM

## D1 — Memorandum attachments

Add file attachment to `/memoranda/create` by reusing the existing protected `DocumentAttachmentService` / `DocumentLink` architecture.

Do not create public upload URLs.

Requirements:

- PDF, DOCX, JPEG, PNG, WebP under existing document policy;
- protected storage;
- content/MIME validation and checksum remain centralized;
- memo attachment linked to authoritative Memorandum parent;
- publication and attachment write must be transaction-safe, with file cleanup on failure;
- authorized recipients and issuance inspectors can see/download the attachment only through parent reauthorization;
- attachment listed on Memorandum detail;
- publisher can publish a memo without an attachment.

## D2 — AJ/Kikiam homepage donor — selective transplant only

Donor:

`AJ-TALIBON-PUBLIC-HOMEPAGE-GREEN-REFINEMENT@f89996823cb7e6bb5f188897586682a0dd141b52`

Use the donor visual design and public-only components/assets, but do not merge the donor branch wholesale.

Mandatory corrections during transplant:

- keep current showcase internal product line untouched;
- use `Talibon Intra-Office Portal` / `ONE TALIBON` / LGU wording consistently;
- remove unsupported broad HRIS/leave/attendance claims from the public capability copy unless the current product authority explicitly supports them;
- do not let shared `MunicipalBrand` donor changes regress authenticated naming;
- make the hero/critical imagery local for venue reliability rather than depending on an external municipal website origin;
- preserve the no-internal-data public boundary;
- preserve Employee Login path.

## D3 — Eliminate Dark Mode — reimplement intent, do not cherry-pick branch wholesale

Donor branch:

`EliminateDarkMode@4539302043b035e51fa068da2adb3963f191314f`

That commit is broad and divergent. Do not cherry-pick it wholesale.

Implement a bounded light-only policy on the final showcase line:

- force resolved appearance to light;
- remove/hide appearance controls from public, login and authenticated shell;
- prevent `.dark` from being applied at boot;
- retain existing dark utility classes in components if removing them would create a huge risky diff; they are inert when no dark root is applied;
- do not mass-edit hundreds of product components solely to delete dormant `dark:` classes before the showcase.

## D4 — LGU wording normalization

Presentation language law:

- `ONE TALIBON`
- `Talibon Intra-Office Portal`
- `Municipality of Talibon, Bohol`
- `LGU` may be used as municipal/government context, not as a competing product name.

Normalize visible first-impression surfaces: homepage, login, welcome, shell identity, Work Request, Memoranda, System Administration and demo selector.

---

# LIGHT

## L1 — Work Request presentation polish

- human-readable category/type labels;
- concise helper text;
- grouped Receiving Office selector;
- selected-office employee count/state;
- disabled Assigned Person until office selected;
- clear empty-state if an office has no active assignable employees;
- priority labels: Normal, Priority, Urgent, Very Urgent / Immediate;
- deadline presets that resolve to an actual date/time server-side.

## L2 — Showcase account UX polish

- office grouping: Executive / Oversight / Departments / Economic Enterprise / Legislative / Citizen Service / Institution;
- search by office, position or code;
- keep the existing presenter-friendly featured roles at the top;
- show office code and position clearly;
- do not expose passwords in UI.

## L3 — Final operator runbook

Record one page containing:

- final SHA;
- DB `talibon_showcase_s1`;
- proxy port 18000;
- worker count and ports;
- LAN URL;
- Cloudflare command/URL;
- prepare/start/status/stop commands;
- recovery procedure;
- demo password source variable name, not the secret value;
- known limitations.

---

# Parallel execution — maximum 2 writers

## Wave A — immediately

Worker A: runtime validation/repair only (M0).

Worker B: Work Request + Memorandum attachment implementation (M1 + D1) from the exact runtime-hardened base or from the repaired M0 SHA once a repair commit is required.

If M0 changes source, Worker B must not be integrated until its base relationship is reconciled.

## Wave B

Worker A: all-office showcase identities/personas (M2).

Worker B: public homepage selective donor + light-only policy + LGU wording (D2 + D3 + D4).

No file overlap is allowed without Maintainer reconciliation.

## Wave C

Single integration writer only:

- integrate accepted product branch;
- integrate accepted persona branch;
- integrate accepted presentation branch;
- preserve runtime scripts;
- run final type/build/runtime/database gates.

Second session is read-only review/load rehearsal only.

---

# Cut order if time slips

Never cut:

1. runtime validation and recovery;
2. Create Work Request correctness;
3. loginable office personas required for stakeholder simulation;
4. build/typecheck;
5. authenticated multi-session rehearsal;
6. external tunnel smoke.

Cut first:

1. cosmetic Work Request helper text;
2. optional expert/advanced request metadata fields;
3. non-critical homepage decorative sections;
4. mass deletion of dormant dark utility classes;
5. branding/CMS work.

---

# Final claim boundary

This plan targets a reliable controlled stakeholder showcase, not production deployment certification.

The Windows multi-worker `php artisan serve` + Node proxy arrangement is a bounded showcase runtime. A later production deployment should use a production HTTP/FastCGI/FrankenPHP/Nginx-class serving architecture and formal CI/CD.
