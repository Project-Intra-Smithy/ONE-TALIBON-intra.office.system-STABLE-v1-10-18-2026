# Final bounded financial correction — exact-source receipt

Consolidated executable: `ad1d6d60e31e06a49c7eb15fdfbc192dc776179d`, [draft PR78](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/78). Reviewed PR77 `c979de739120fff357e6f2bdbd79afe9c67ab402` is preserved. Authority: Engineer KIRCH; Codex sole writer, retained pinned OperationForge doctrine and Ponytail full. [Maintainer finding](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/77#pullrequestreview-6086736521), [paired continuation](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7216154565), memory091da869/crosslink7216166990.

## Corrected financial semantics

PS100000 with MOOE/CO unknown now persists appropriation null, presents Not supplied and exports blank unknown cells. An initially omitted appropriation is derived only with all three components known, including explicit zeroes:0.10+0.20+0.00=0.30 exactly. An expressly supplied total or zero remains recorded; omitted updates retain the existing total, including an unknown total. No existing data is rewritten. No partial subtotal is shown or stored as total appropriation.

Money helpers use existing BigDecimal and BigInt, preserving cents and maximum precision. Monetary form inputs now step0.01: the new real browser regression exposed the previous step10000 native validation block. Eight persisted/presentation/CSV cases discriminate partial unknowns, explicit zeroes/totals, all-known arithmetic and preservation. All-known overflow remains rejected atomically; a partial unknown does not manufacture an overflowing total.

The existing office-authorization test now supplies PS0 explicitly to establish its expected complete total; every original assertion is preserved. The source guard enforces exactly that one-line fixture change. Original CI workflows, authentication/authorization/retention controls, dependencies and schemas are unchanged.

## Exact-successor hosted qualification — PASS14/14

[Protected PG16 run45985224932](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/45985224932): completed/success, attempt1, exact ad1d6d60, all eleven protected partitions plus aggregate. Full914tests/12,836assertions; Planning45tests/777assertions plus existing focused278/4,715, observed in original retained logs.

[Presentation/canonical run45985231932](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/45985231932): completed/success, attempt1, exact same executable, both jobs PASS. This is mandatory existing workflow execution, no new preview walkthrough or workforce activation.

PG16 original13ZIP digests matched GitHub metadata; original logs and ZIPs retained privately. Presentation original-byte retention is in progress and will be reconciled separately; terminal run success is independently retrieved metadata, not a claim of completed byte custody.

First d537d5a9 attempt: [PG16](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/45984518879) rejected the old incomplete fixture; [canonical](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/45984526109) exposed cent input step. Its new financial assertions passed. Failed logs and local failed captures retained; no failed or predecessor receipt is inherited as final PASS.

## Complete clean local canonical runtime — PASS

Guarded task-owned synthetic PG16, loopback55623; real authenticated Laravel/Inertia entry, employee and Department Head actors and appropriate MFA. Clean exact source worktree. 96route observations/79interactions, all route responses200, zero recorded runtime errors or overflow;168rawPNG captures. Actual PPA creation checks partial unknowns; edit checks exact0.30 component display and explicit appropriation0.00 persisted through later unrelated changes. Both frontend typechecks and129contracts also pass on this source.

Build manifest SHA-256: `966b423cbb8d50991679071b1d62cd9353f298564c2fefebaa4a3ff0630d5e10`.

[Receipt and interactions](results.json), [build manifest](build-manifest.json), [runtime log](local-runtime.log), [per-file SHA-256 inventory](capture-inventory.json), [complete raw capture ZIP](canonical-raw-captures.zip). ZIP includes all170 original output files plus inventory, every entry hash verified. ZIP SHA-256: `8234cd5b9f108fced19d55cef9e961c18c9eb549a9d8fa5e6895ba29e523e969`.

## Review and release boundaries

Bounded author self-review inspected both helper callers, server create/update, exact model presentation, register/dossier/rollup and CSV. No additional source correction identified after successor qualification. This is author validation, not independent acceptance.

Actual in-chat browser inventory was retried and reports browser access unavailable. Targeted independent Nox successor disposition (the original four corrections plus this financial correction) remains pending; no new general audit or substitute independent PASS claimed. Private original Nox R1 report remains unchanged. Consolidated source returns to Maintainer for final technical disposition.

Maintainer acceptance, Siris whole-system QA, integration and release remain held. Official facts, accountable actual historical reconciliation, backup/recovery and overriding legal confidentiality obligations remain external. No main merge, deployment, production DB modification, invented municipal authority, Messaging/full HRIS activation or premature Phase A closure. Canonical-main memory propagation remains held by explicit no-main-merge authority; this evidence-only branch is not canonical-main sync or package CLOSE.
