# CC-FRONTEND-RUNTIME-INTEGRATION-R1 — source tuple and evidence

## Source tuple (pinned)
- Official frontend source: `Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE@6c385ee85f3fec4325182791554b66a861cfd9f3`.
- Backend runtime source: `Project-Intra-Smithy/Talibon-Sales-Prototype@d99285f96b0bbcfd4156139c4fc01e3db62ed26b`, backend PR #81 (DRAFT/UNMERGED).
- Backend PR #84: separate unmerged security correction. **Not applied** to the integration runtime source. Its moving head is not silently substituted.
- Implementation branch: `forge/lucien-cc-frontend-runtime-integration-r1`, created from pinned frontend main; frontend draft PR #35.

## Frontend modules
- Existing authenticated login/logout with Laravel session and MFA assurance; no auth changes.
- Personal Task creation, listing, detail, start and completion through server-owned same-origin Task JSON endpoints; integrated in Dashboard and My Work alongside Work Requests.
- Existing Work Request Inertia, notification feed and Calendar clients retained.
- P2 live messaging UI, fixed-channel message feed client and dependencies selectively copied from the pinned backend source; Announcements/Meetings explicitly authority-pending.
- P3 Document Center, archive and authorized record navigation selectively copied from pinned backend source, with frontend-only navigation imports corrected.
- No fabricated municipal records, backend domain/routing or database changes.

## Acceptance truth
- Exact frontend commit and PR: resolve live branch HEAD, do not infer source SHA from this document.
- Frontend CI: inspect the GitHub Actions run for the **exact final SHA**; local mounted tests use intercepted HTTP and Vite fixture screens, not a Laravel session.
- PostgreSQL16 task persistence: **NOT RUN** under this execution surface.
- Real Laravel + Inertia + Chromium login → dashboard → create → reload → start → complete → logout: **NOT RUN**.
- Cross-account authorized/denied UI and retained-session revocation: **NOT RUN**.
- Real P2 notification/calendar/messaging and P3 documents/correspondence: **NOT RUN**.
- Genuine Laravel session screenshots: **NONE**.
- PR #84 security correction must be reviewed and separately integrated before claiming P0 correspondence safety acceptance.

## Isolated runtime verification instructions
1. Assemble in a disposable PHP/Laravel + PostgreSQL16 environment from backend exact commit above. Record frontend exact HEAD and relevant Git blob hashes before selective UI overlay; do not overlay the entire frontend repository.
2. Preserve backend routes, middleware, authorization, policies, migrations and workflow rules. Resolve only genuine frontend compatibility defects under a reviewed Lucien commit.
3. Seed two disposable permitted/denied technical identities in dev only through existing safe fixtures. No production credentials or bypasses.
4. Compile assets; verify real Inertia props and all mounted page names exist. Execute Task lifecycle with HTTP statuses, DB row/event evidence and a Chromium trace through reload/logout.
5. Verify authorization and revocation for Task, Work Requests, P2 coordination and P3 document archive/download, including masked 404/403/419 and responsive views.
6. Publish sanitized browser screenshots and exact-source results. Do not merge, deploy or advance PR #84 without independent security review and Kirch authorization.
