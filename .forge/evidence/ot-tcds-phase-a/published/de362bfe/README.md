# Exact-candidate local canonical runtime receipt

Executable candidate: **`de362bfeddbb2b1ac3e738d1f99d4f64b536c90c`** ([PR72](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/72)).

This evidence branch adds evidence only on top of that candidate. Its publication commit is not a new executable candidate. The main implementation branch, source and CI definitions are unchanged by this publication.

## Observed result

- Completed: **true**. Source worktree dirty: **false**.
- **84** authenticated canonical Laravel route checks, **66** interaction results, **144** original PNG captures.
- Employee and MPDO department-head sessions; widths **1440 / 768 / 390**; **light / dark**.
- All observed routes returned HTTP 200; no recorded page errors or document overflow. Dialog checks verified viewport containment and named controls.
- Real personal Task create/start/complete preserved instructions and target date; another account received masked 404.
- Real development-plan, PPA and planning-map create/edit/delete cycles passed using synthetic records on a separately initialized disposable PostgreSQL 16 cluster. Immutable plan code, confirmation/scroll restoration and staff-management navigation passed.
- The runtime asserted no external requests for both actors. No fixture/synthetic preview entry was used for these canonical routes.

## Raw evidence

- [Complete runtime receipt](canonical-runtime-results.json), including all route and interaction observations.
- [Interaction results](interaction-results.json), copied without reclassifying their scope.
- [Exact build manifest](build-manifest.json).
- [Capture inventory](capture-inventory.json): per-file SHA-256, byte count, PNG dimensions and observed modification time.
- [All 144 raw captures](captures/). Unmodified PNG bytes total **64,056,857**.
- [SHA256SUMS](SHA256SUMS) covers the runtime receipt, manifest, interaction results, inventory and every capture.

Build-manifest SHA-256:

`3760cfb8e0495c8b382972528fc317d6ace4b032655616fe40c7be2af40a315c`

Capture-inventory SHA-256:

`2b2490a8664b2fa1d31589e4628f2ff8bb1ee81c342e1c6877d9e1b898631a68`

SHA256SUMS file SHA-256:

`0c8e6e77ad79d3d295bab6e9d28fa598516cab5404a3e75919d09466b091de94`

Run `node verify-packet.mjs` from this directory to verify all covered bytes and receipt invariants. Attribution comes from the completed clean-worktree receipt and deterministic filenames produced by the exact candidate's browser script. Captures were hashed at publication; this is not a claim that the original runtime emitted per-capture hashes. Thirty unrelated older PNGs in the local working directory were excluded. No screenshots were rerendered for publication.

## Evidence discrepancy resolved

The candidate's committed corrective checkpoint was written before the final frozen-candidate local run. Its statement that the final run remained pending described that earlier point in time. The raw completed receipt above supersedes that pending local-validation statement for **de362bfe only**. It does not make earlier failed attempts disappear and does not attribute their captures to this run.

The 66 interaction observations include six non-capture results (Task cycle, cross-account denial, three Planning CRUD cycles and staff navigation); the other 60 observations have dialog captures. The 84 route captures plus those 60 dialog captures account for all 144 PNGs.

## Boundaries and remaining validation

This is local author evidence and same-context, non-accepting review. It is not an independent QA decision or Phase A closure. It does not establish runtime coverage for every other canonical application route or a complete accessibility/security certification.

Hosted execution remains externally blocked for this exact candidate:

- [Presentation/canonical runtime run 45686219948](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/45686219948).
- [Protected backend run 45686220032](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/45686220032).

GitHub check annotations `139459406302` and `139459405891` state that jobs did not start because account payments failed or the spending limit requires an increase. No blocked workflow was retriggered for this publication. Existing workflow filters do not match this evidence-only branch; no CI definition or guard was edited.

Once hosted execution is restored, both required workflows must run against the final executable SHA. The protected backend, security and release holds, no-merge/no-deployment boundary and deferred backend contract requirements remain in force.
