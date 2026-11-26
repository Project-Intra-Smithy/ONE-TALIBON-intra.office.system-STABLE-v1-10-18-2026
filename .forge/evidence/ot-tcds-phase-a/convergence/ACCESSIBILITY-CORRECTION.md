# Local accessibility correction — non-accepting author review

The immutable [de362bfe canonical evidence packet](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/tree/54ea01068cc2b6e27986427d8c1dd8701a27388d/.forge/evidence/ot-tcds-phase-a/published/de362bfe) remains the receipt for that executable candidate only. Its manifest, 84 route observations, 66 interactions and 144 captures have been published and remote bytes verified. Publication did not advance PR72 or trigger a workflow.

## Demonstrated findings and repairs

A further local axe-core 4.14.1 audit exercised actual authenticated Laravel routes under department-head, system-administrator and mayor-approver sessions, with existing MFA. The baseline completed 96 page/studio observations at 320/1024/1440 pixels in light/dark. All routes rendered without page errors or document overflow; 78 observations had one or more accessibility violations. This is not a passing accessibility audit.

The distinct findings were:

- Account summary used an accessible name on an ungrouped div. It now has a semantic group role.
- Quick Jump's shortcut target was 22px high. It now has a 32px minimum height within its existing search field.
- Closely spaced map reference markers obscured one another's targets. The shared renderer now uses 44px markers and groups nearby coordinates into an explicitly named, keyboard-accessible reference list. All original records and coordinate values remain available; no data or official GIS layer is invented. Escape returns focus to the group marker; selecting a record returns focus to the map.
- Dark primary-button hover, legacy planning text and Calendar guidance had insufficient contrast. Repairs use the intended separate brand background and readable ink tokens. Property Lifecycle's gold eyebrow is brighter against its green banner.
- Leaflet attribution relied only on color to identify its link. The themed vendor override now underlines it. Popup surfaces use the same theme tokens.

The grouping helper has a regression test for coincident positions, transitive neighbors, exact spacing boundary and preservation of record identities. Follow-up audit captures are kept separately from the baseline. A working-tree audit is never attributed to the clean de362bfe candidate merely because it began from that Git parent.

## Repeatable local check

`tests/Browser/phase-a-accessibility-runtime.mjs` is a separate opt-in local runtime harness. The existing CI workflows and canonical runtime harness are unchanged. It requires the same explicit disposable PostgreSQL opt-in, database name and actual local PGDATA identity, verifies PostgreSQL 16, builds the canonical entry, creates synthetic actors, serves Laravel on loopback and closes its server afterwards. It does not bypass authentication or MFA.

Install the audit engine only under the ignored QA directory:

```powershell
npm install --prefix storage/app/qa/a11y-tools --no-save --package-lock=false --ignore-scripts --no-audit --no-fund axe-core@4.14.1
```

With the existing disposable runtime environment (`PHASE_A_DISPOSABLE=1`, loopback `DB_HOST`, `DB_DATABASE=talibon_portal_test`, correct temporary cluster port and `PHASE_A_DISPOSABLE_PGDATA`), run:

```powershell
node tests/Browser/phase-a-accessibility-runtime.mjs
```

Each run prints a unique output directory under ignored `storage/app/qa/phase-a-accessibility/`. Its report records source SHA, worktree state, exact build-manifest digest, engine version, individual rule nodes, captures and incomplete/manual-review items. It checks studio Escape/focus restoration and nearby-reference selection as well as automated WCAG rules. Automated checks do not establish full WCAG conformance or independent acceptance.

Hosted execution remains externally blocked by account billing/spending. No workflow or backend scope is changed, and blocked workflows must not be repeatedly retriggered. Both required workflows remain due against the final executable SHA when hosted execution is restored. Phase A stays open.
