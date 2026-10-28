# W02/W03 G2 protected custody foundation R1

**Mission:** `OT-R13-W02W03-G2-PROTECTED-CUSTODY-FOUNDATION-R1`

**Frozen parent:** `cc445500235d1c83ec5ad6e8a125c7edfc2ef5cf`

**Authority:** Engineering Hub #157 START `6469591408`, canonical memory `main@97da66b6152bec05e4288d2f1f4655a8060dfec9`, and proposed custody handoff `6464652326`.

**Status:** synthetic quarantine-only candidate. No production adoption, municipal document authority, protected byte retrieval, merge, deployment, or independent security acceptance.

## Separation of concerns

| Concern | Implemented boundary | Explicitly not implemented |
|---|---|---|
| Legacy documents | Existing `documents` disk, `Document`, links, routes and guards remain unchanged. | No custody object is temporarily created as an ordinary `Document`; no promotion window. |
| Private object generation | Separate `plan_custody` disk, server-selected UUID locator, atomic local create-if-absent, streaming digest/size and independent post-write verification. | Local adapter is not certified object lock, versioning, retention or production immutability. |
| Custody metadata | Separate immutable generation ledger with fixed `QUARANTINED` and `VERIFIED` values. | No published/approved/readable state, PlanEdition binding or generic link. |
| Scanner evidence | Trusted-adapter interface; deny-all default; exact generation digest/size, freshness and evidence identity checks; append-only evidence. | No real scanner, signature authority, engine allow-list or client-assigned CLEAN. CLEAN never authorizes bytes. |
| Custody audit | Generation and scanner events share the ledger transaction; append-only database triggers. | No claim of external durable audit-before-byte or production log retention. |
| Identity/recovery | Actor, office, MFA/session epochs and external fence token are required by a deny-all default interface. | No real identity epoch service, key custody or external monotonic witness. |
| PostgreSQL privileges | G1B ordinary app exclusion plus custody SELECT/INSERT-only extension; owner/migrator separation and repair denial preserved. | No retained role adoption or unrestricted repair. |
| Delivery | No routes, controllers, URLs, symlinks, preview, download or streaming. | G3/G4 remain gated. |

## Storage and integrity contract

The `plan_custody` filesystem is private, has `serve=false`, and is absent from public links. The local executable adapter only accepts a generated locator matching `quarantine/<prefix>/<uuid>.pdf`, creates it with exclusive `xb` semantics, and sets local mode `0600` where supported. It never accepts a client path and refuses an existing locator rather than overwriting it.

Ingest performs two independent passes:

1. stream the source to calculate SHA-256 and byte count, enforce the maximum, and apply bounded `%PDF-`/`%%EOF` quarantine screening;
2. write to a server-selected locator and reopen the stored object to recalculate SHA-256 and byte count.

Declared MIME, size and digest must match. PDF markers are only quarantine screening and are not malware or semantic safety proof. Metadata and the `GENERATION_QUARANTINED` event commit atomically after storage verification. A failed ledger/audit transaction deletes the uncommitted object; failed cleanup throws `OrphanedCustodyObject` with an opaque locator for isolated reconciliation. It does not expose bytes.

Idempotency keys are stored only as SHA-256 hashes. A retry returns the existing generation only when its immutable digest, size, MIME, quarantine state and stored bytes still match. Reusing a key with different content fails closed. The database unique constraint is the final concurrent writer boundary.

## Database invariants

The forward-only PostgreSQL migration creates:

- `plan_custody_generations`;
- `plan_custody_scan_evidence`;
- `plan_custody_events`;
- three SECURITY INVOKER guard functions and append-only/immutability triggers.

Generation UPDATE/DELETE and evidence UPDATE/DELETE raise SQLSTATE `23514`. Scan insertion must exactly pin an existing quarantined generation digest and size. The migration refuses non-PostgreSQL and its rollback throws; it must not be applied to a retained database without a new accountable DBA decision.

## Role policy

The G1B installer excludes all custody tables and sequences from its ordinary legacy app grant loop. It transfers the three custody functions to the NOLOGIN owner, removes PUBLIC/app/custody direct EXECUTE and retains SECURITY INVOKER behavior.

The G2 extension grants the custody login only:

- SELECT and INSERT on the three custody tables;
- USAGE and SELECT on their sequences.

App and repair receive no custody table/sequence rights. Custody receives no UPDATE or DELETE. Generation immutability makes row-lock privileges unnecessary; the scanner trigger uses a plain SELECT.

## Executable development evidence

Observed on a fresh PostgreSQL 16.15 tmpfs container with loopback-only port and no retained mounts:

| Group | Development result |
|---|---|
| New custody Feature suite | 13 tests / 56 assertions PASS |
| Initial 12-test suite plus prior 22 focused Plan tests | 34 tests / 125 assertions PASS; final exact-SHA run must include the added orphan-reconciliation case |
| Exact prior 15-file regression | 157 tests / 1,768 assertions PASS |
| G1B install and verification | PASS |
| G2 role extension and role matrix | PASS after removing an unnecessary `FOR SHARE` privilege dependency |
| Real custody-login Laravel harness | 2 assertions PASS |

Development failures retained as engineering evidence:

1. An initial command stopped before tests because the isolated worktree had no locked Composer dependencies. `composer install` completed from `composer.lock`.
2. The first test command used environment variables without PHP `variables_order=E`, so the repository lease guard correctly rejected all 12 tests before database access. The corrected command used `-d variables_order=EGPCS`.
3. The first immutability test performed multiple expected PostgreSQL failures inside one outer test transaction; later probes saw `25P02`. Each mutation is now isolated in a savepoint, preserving expected `23514` evidence.
4. The first role probe found custody scan INSERT required an unintended stronger privilege because the invoker trigger used `FOR SHARE`. Since generation UPDATE/DELETE is trigger-prohibited, the unnecessary lock was removed rather than broadening custody grants. The fresh rerun passed.

## Threats and owner gates

- Local exclusive create is useful executable evidence, not production object lock/version retention.
- True two-process service concurrency, process crash during the storage-to-ledger interval, real scanner timeout/crash/signature verification, object-store partial reads, key compromise and cross-cluster restore remain separate infrastructure tests or NOT_RUN.
- DBA must approve retained schema, ownership, grants, migration ordering, restore, repair and rollback.
- IT/security must approve immutable backend, scanner trust, keys, secrets, identity epochs, external restore witness, audit durability and incident drills.
- Records/Planning/DPO retain authority over official editions, custody, classification, access, retention and legal hold.
- Kirion-Nox must independently review the exact candidate. Passing author tests are not independent acceptance.
- Full 75-case W02 ledger, atomic check-to-byte and durable audit-before-byte remain NOT_RUN/unresolved.

## Final validation protocol

The committed candidate must be tested from a new attested disposable PG16 container. Run PHP lint/format checks, the custody suite, prior 22 focused Plan tests, exact 157 legacy tests, G1B/G2 role scripts and the custody-login harness. Record exact commands, exit codes, SQLSTATEs, source parity, container identity and teardown. Publish `OT_R13_W02W03_G2_PROTECTED_CUSTODY_IMPLEMENTATION_AND_QA_RECEIPT_R1` to Issue #157 and stop before integration.
