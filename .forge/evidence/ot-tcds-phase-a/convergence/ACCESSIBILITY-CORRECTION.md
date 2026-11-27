# Local accessibility correction — non-accepting author review

The immutable [de362bfe canonical evidence packet](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/tree/54ea01068cc2b6e27986427d8c1dd8701a27388d/.forge/evidence/ot-tcds-phase-a/published/de362bfe) remains the receipt for that executable candidate only. Its manifest, 84 route observations, 66 interactions and 144 captures have been published and remote bytes verified. Publication did not advance PR72 or trigger a workflow.

## Demonstrated findings and repairs

A further local axe-core 4.14.1 audit exercised actual authenticated Laravel routes under department-head, system-administrator and mayor-approver sessions, with existing MFA. The baseline completed 96 page/studio observations at 320/1024/1440 pixels in light/dark. All routes rendered without page errors or document overflow; 78 observations had one or more accessibility violations. This is not a passing accessibility audit.

The distinct findings were:

- Account summary used an accessible name on an ungrouped div. It now has a semantic group role.
- Quick Jump's shortcut target was 22px high. It now has a 32px minimum height within its existing search field.
- Closely spaced map reference markers obscured one another's targets. The shared renderer now uses 44px markers and groups nearby coordinates into an explicitly named, keyboard-accessible reference list. All original records and coordinate values remain available; no data or official GIS layer is invented. Escape returns focus to the group marker; selecting a record returns focus to the map.
- Dark primary-button hover, legacy planning text and Calendar guidance had insufficient contrast. Repairs use the intended separate brand background and readable ink tokens. Property Lifecycle's gold eyebrow is brighter against its green banner.
- Leaflet attribution relied only on color to identify its link. The themed vendor override now underlines it.

The grouping helper has a regression test for coincident positions, transitive neighbors, exact spacing boundary and preservation of record identities. Follow-up audit captures are kept separately from the baseline. A working-tree audit is never attributed to the clean de362bfe candidate merely because it began from that Git parent.

The frozen local checkpoint `a511900206358aab58df73ad3da7012231766599` additionally exercised the nearby-reference list. Its Leaflet popup could be clipped or obscured by map controls on narrow viewports, so that list now uses the existing native Dialog. It preserves every reference, exposes a descriptive accessible name and restores keyboard focus. A higher-volume Administration fixture also demonstrated low-contrast inactive pagination text and a read-only office list that could scroll without keyboard access; pagination text now remains readable and the list is a named, focusable region. These repairs require a new exact-candidate audit; they do not retroactively pass the a5119002 audit.

## Repeatable local check

At `4f56b5dbf4fb17629d87aaac7f56fef65e1082ce`, all 102 observations had zero automated accessibility violations. The responsive check still correctly failed two Administration observations at 320px. A focused DOM diagnostic traced a 3.6px overflow to the office/security grid sections' implicit minimum content width. Adding `min-w-0` to the existing Section helper passed the focused 320px rerun without hiding or removing content. Final frozen-candidate validation remains required for that subsequent repair.

At `a1f4f66bebd4c59dae2ce282649a4fcd32fde067`, the frozen clean-worktree rerun completed all 102 accessibility observations with zero violations and zero document overflow. A separate disposable PostgreSQL cluster reused that exact verified build and passed all 84 canonical route checks and 66 interactions. Original de362bfe captures and these later captures remain separate. Axe's incomplete/manual-review items are retained, including SVG contrast and empty-table header relationships; an automated pass is not a conformance certificate.

Subsequent source review found adapter restrictions unrelated to backend expansion: the Plan drawer's donor year bounds excluded years accepted by the existing controller, while the PPA donor dropdowns narrowed the existing year and free-text funding contracts. Canonical adapters now supply coverage 2000–2100, PPA years 2020–2100 and free-text funding; preview defaults remain separate. The real Planning CRUD regression now asserts coverage endpoints, a 2035 PPA and a custom synthetic funding source. The mobile PPA register also has a semantic region for its existing accessible name. These changes require their own exact-SHA validation.

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
