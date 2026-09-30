# S1-W04C WAVE B PAIR 1 — INTEGRATION EXECUTION LOCK

Date: 2026-09-30
Repository: Kirch-Nairu/Talibon-Sales-Prototype
Technical Authority: Kirch Ivan Balite
Governing lane: S1-W04C — FUTURE SYSTEM FULL-PROTOTYPE SURFACES

## 1. PURPOSE

This directive records the exact conflict-safe execution order for integrating the visually locked Wave B Pair 1 archetypes into the governing W04C candidate.

It exists so the immediate next steps are recoverable from Git without relying on conversational memory.

## 2. LOCKED INPUTS

Governing W04C canonical source at issuance:

`KIRCH-TALIBON-S1-W04C-FUTURE-SYSTEM-PROTOTYPE-SURFACES@6a4b476d508751fc75dc94cf6b19c39be0810f3a`

Locked FUT-02 Budget candidate:

`KIRCH-TALIBON-S1-W04C-WAVEB-BUDGET@0320f70757da472463cd359a54c50241cfb24916`

Locked FUT-07 Citizen Action candidate:

`KIRCH-TALIBON-S1-W04C-WAVEB-CITIZEN-ACTION@35b6ad70dc94f460bfe7babdb9c7405f90c3df50`

Both FUT-02 and FUT-07 are visually locked.

## 3. NO WHOLE-BRANCH MERGE RULE

Do not merge Budget into Citizen.
Do not merge Citizen into Budget.
Do not merge either worker branch wholesale into the canonical W04C branch.
Do not rebase either worker branch onto canonical.

Reason: both worker histories contain shared Future Integration plumbing from the earlier archetype phase. Whole-branch integration would reopen avoidable shared-file collisions.

Integration is payload-based and sequential.

## 4. CANONICAL INTEGRATION SPINE

All integration work starts only from:

`KIRCH-TALIBON-S1-W04C-FUTURE-SYSTEM-PROTOTYPE-SURFACES`

Before mutation, independently re-verify that its live HEAD still equals the expected source SHA for the integration turn.

If canonical moved, STOP and reconcile before integrating.

Do not merge current `main` into this lane merely because `main` moved independently.

## 5. INTEGRATION ORDER

Perform exactly in this order:

1. import locked FUT-02 Budget dedicated payload;
2. import locked FUT-07 Citizen Action dedicated payload;
3. import the accepted selected-system shell correction from the Citizen lane;
4. perform one controlled dispatcher edit;
5. run production build where available;
6. run browser smoke/regression on FUT-02, FUT-03 and FUT-07;
7. declare a new canonical W04C SHA only after validation.

Do not start the next archetype pair before step 7 succeeds.

## 6. FUT-02 BUDGET PAYLOAD

Import from:

`0320f70757da472463cd359a54c50241cfb24916`

Dedicated files:

- `resources/js/components/municipal-systems/BudgetMonitoringWorkspace.tsx`
- `resources/js/data/municipal/budgetMonitoringData.ts`

Do not import the Budget worker's historical copy of:

- `resources/js/components/municipal-systems/FutureIntegrationDetail.tsx`

Budget is already visually locked as the Financial Monitoring archetype.

Do not redesign it during integration.

## 7. FUT-07 CITIZEN ACTION PAYLOAD

Import from:

`35b6ad70dc94f460bfe7babdb9c7405f90c3df50`

Dedicated files:

- `resources/js/components/municipal-systems/CitizenActionWorkspace.tsx`
- `resources/js/data/municipal/citizenActionData.ts`

Citizen Action is already visually locked as the Service Desk / Inbox archetype.

Do not redesign it during integration.

## 8. SELECTED-SYSTEM SHELL CORRECTION

Import the accepted selected-system shell behavior from the locked Citizen lane in:

- `resources/js/pages/MunicipalSystems/Index.tsx`

Required behavior:

- when no system is selected, the broad Future Integrations catalog header/tabs are visible;
- when a system is selected, that workspace becomes the primary page;
- the broad catalog header must not remain stacked above the selected product workspace;
- the selected workspace uses its compact in-product return control.

This is a shared shell correction, not Citizen-specific styling.

## 9. SINGLE DISPATCHER EDIT

After dedicated payloads and shell behavior are present, edit exactly once:

`resources/js/components/municipal-systems/FutureIntegrationDetail.tsx`

The final dispatcher must preserve all explicit dedicated routes:

- FUT-02 → BudgetMonitoringWorkspace
- FUT-03 → GISWorkspace
- FUT-07 → CitizenActionWorkspace
- all other currently un-specialized FUT systems → FutureSystemPrototype until their bounded lanes replace them

Use the actual locked component signatures at integration time.

Do not copy a stale worker version blindly.

## 10. SHARED-FILE OWNERSHIP FROM THIS POINT FORWARD

Future archetype workers own only their bounded product payload by default:

- dedicated workspace component;
- dedicated data file;
- narrowly authorized module-specific helper files where explicitly approved.

Maintainer/integration owns:

- `FutureIntegrationDetail.tsx`;
- `MunicipalSystems/Index.tsx`;
- shared shell behavior;
- shared modal primitives;
- navigation/shared routing;
- canonical integration commits.

A worker must STOP rather than silently expand into those shared files unless a handoff explicitly authorizes it.

## 11. COMPACT HEADER DENSITY STANDARD

All integrated and future FUT workspaces remain subject to:

`.forge/directives/S1-W04C-COMPACT-WORKSPACE-HEADER-DENSITY-LOCK-2026-09-30.md`

Operational rule:

- use horizontal space before vertical space;
- no giant hero headers;
- no redundant stacked catalog header above selected workspaces;
- title/context remains compact;
- right-side header space should carry useful environment/FY/compact operational context where appropriate;
- tabs and the actual work surface should appear quickly.

Do not reopen already locked Budget or Citizen solely to chase cosmetic consistency unless an integration regression appears.

## 12. VALIDATION GATE

After integration:

Run, where a runnable checkout is available:

`npm run build`

Then clear/runtime-refresh as required by the current Laravel showcase environment.

Browser smoke must verify at minimum:

### FUT-02 Budget
- still reads immediately as financial monitoring;
- financial summary, utilization, attention and budget register remain intact;
- no broad Future Integrations catalog header above the selected workspace.

### FUT-03 GIS
- dedicated GIS workspace still dispatches correctly;
- map-first/fallback architecture remains intact.

### FUT-07 Citizen Action
- still reads immediately as service desk/inbox;
- compact header counters remain;
- Queue / Priority Inbox / Desk Snapshot composition remains intact;
- no redundant state strip returns;
- no broad Future Integrations catalog header above the selected workspace.

### Directory / shell
- Future Integrations directory remains navigable when no product is selected;
- back/return flow works;
- no product is accidentally routed to another product's workspace.

No NOT-RUN validation may be represented as PASS.

## 13. NEW CANONICAL LOCK

Only after source review + build + browser smoke succeeds, record:

`NEW_W04C_CANONICAL_SHA = <validated integrated result>`

That SHA becomes the sole source for the next Wave B pair.

Do not branch FUT-10 or FUT-05 from Budget, Citizen, old Wave A, or pre-integration canonical state.

## 14. NEXT PAIR START CONDITION

Only after a new validated integrated W04C SHA exists may Pair 2 begin:

- FUT-10 — Asset & Property Management
- FUT-05 — Building Permit Workflow

Both must branch from the same exact new canonical SHA.

Maximum active archetype workers remains 2.

## 15. NEXT-PAIR OWNERSHIP RULE

Pair 2 workers must not independently edit the central dispatcher or selected-system shell.

Default worker ownership:

- dedicated workspace;
- dedicated data;
- approved local helper files only.

Maintainer performs central dispatcher wiring after both returns.

This rule is mandatory to prevent the branch-conflict pattern discovered during Pair 1.

## 16. SHOWCASE DISCIPLINE

Current priority remains visual-first and fast.

Do not reopen locked products for aesthetic experimentation.
Do not invent additional architecture when an accepted archetype already exists.
Do not add new workers while Pair 1 integration is incomplete.

Required immediate sequence:

`LOCKED BUDGET + LOCKED CITIZEN`

→ `CONTROLLED PAIR 1 INTEGRATION`

→ `BUILD + BROWSER SMOKE`

→ `NEW CANONICAL SHA`

→ `PAIR 2 FROM THAT EXACT SHA`

## 17. GOVERNING SUMMARY

**Import dedicated payloads. Do not merge worker branches wholesale.**

**Shared shell and dispatcher have one central owner.**

**No new FUT branch before the integrated canonical SHA exists.**

**Locked products stay locked unless integration breaks them.**
