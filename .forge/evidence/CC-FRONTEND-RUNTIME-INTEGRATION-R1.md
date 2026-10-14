# CC-FRONTEND-RUNTIME-INTEGRATION-R1 — source tuple and execution evidence

## Immutable input tuple

- Official frontend source: `Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE@6c385ee85f3fec4325182791554b66a861cfd9f3`
- Backend runtime source: `Project-Intra-Smithy/Talibon-Sales-Prototype@d99285f96b0bbcfd4156139c4fc01e3db62ed26b` (PR #81, unmerged staging)
- Backend PR #84: `cc30fb732dedb945eff4291b11a4564b8dc30902` **NOT INCLUDED**. Separate correction candidate; runtime compatibility against #81 does not constitute a security acceptance of #81.
- Official implementation branch: `forge/lucien-cc-frontend-runtime-integration-r1` (created from exact frontend source above).

## Changes owned in the frontend repository

1. Authenticated individual Task `POST /tasks`, `POST /tasks/{id}/start`, and `POST /tasks/{id}/complete` consumers using same-origin JSON and Laravel CSRF headers.
2. Personal Task create/read/lifecycle panel presented on Dashboard and alongside existing Work Requests in My Work, preserving independent server-domain states.
3. P2 /messages React workspace, fixed-channel presentation and live feed client selectively imported from the pinned backend source, together with actual backend-compatible display components.
4. P2 Announcements and Meetings authority-pending pages selectively imported, without fictitious published records.
5. P3 /documents center page, archive/register/metadata presentation, styles and exact dependencies selectively imported from backend candidate.
6. Path support for /messages and /documents in the frontend local Inertia page gate.

All new P2/P3 source paths originate from backend PR #81 at the pinned SHA; no mutation to canonical backend repository was made by this frontend branch. Existing frontend Auth/Login, Calendar/Index, Correspondence and Transactions screens use backend Inertia props rather than invented operational data.

## Contract boundaries

- `Task != Work Request != Correspondence`. Lifecycle actions use only the backend's pre-existing Task endpoints and do not send actor/department identifiers or client-selected state.
- Server authorization remains authoritative. A 401/403/419 Task response must clear cached protected Task state; 404 is treated as inaccessible/unknown; 422/429/409 must not claim success.
- No new municipal workflow policy, backend route, migration, data fixture, synthetic dashboard, or authentication exception.
- `/messages` uses the existing P2 fixed-channel feed, not a new messaging engine.
- `/documents` consumes authorized Document Center props; all archive/download decisions remain server-side.
- `/announcements` and `/meetings` intentionally surface pending LGU authority rather than simulated operational records.

## Evidence/acceptance matrix

| Gate | Status |
|---|---|
| Official frontend branch/commits | GitHub commit evidence |
| Frontend TypeScript and production build | Pending exact-head CI result |
| Frontend Node tests | Pending exact-head CI result |
| Frontend Playwright fixture verification | Pending exact-head CI result; fixtures are **not** Laravel acceptance |
| Isolated Laravel + PostgreSQL 16 assembly | NOT RUN / requires a fully provisioned isolated runtime with access to both private repositories |
| Login → Dashboard → Create → Reload → Start → Complete → Logout | NOT RUN on real backend |
| Two-account authorized/denied verification | NOT RUN on real backend |
| P2 messaging/notification/calendar real responses | NOT RUN on real backend |
| P3 correspondence/document archive and download | NOT RUN on real backend |
| Genuine Laravel/Chromium screenshots | NONE; do not substitute fixture captures |

## Follow-through for isolated integration

1. Checkout exactly backend PR81 SHA above in a disposable, non-production PostgreSQL-backed environment.
2. Compile the frontend branch's owned UI files with their existing direct dependencies; compare all overwritten paths by SHA and review imports before overlay. Do not overlay the entire frontend repository over backend routes/controllers/domain code.
3. Resolve any assembly mismatches as bounded frontend compatibility commits only. Do not weaken backend access policy to satisfy a UI.
4. Execute real Laravel route/response validation and two authenticated browser accounts. Capture source SHA, request/response status, database persistence and screenshots with no credentials.
5. Apply the PR84 security-correction gate separately before interpreting the integrated candidate as security-ready.
6. Keep this frontend PR draft pending exact-runtime acceptance, independent review, and Kirch's release authorization.
