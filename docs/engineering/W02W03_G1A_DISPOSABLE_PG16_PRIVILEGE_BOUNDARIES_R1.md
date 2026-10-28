# KIRION FORGE — G1A PostgreSQL Role Boundary Exercise R1

**Mission:** `OT-R13-W02W03-G1A-DISPOSABLE-PG16-PRIVILEGE-BOUNDARY-R1`  
**Source parent:** `9f6fd7361ee078745b2edcb9688704654d1a2ae2`. **Owner:** Kirch-Nairu, single integrator. **Independent security reviewer:** Kirion-Nox. **Authorities:** Engineering Hub #157, W02 R4/R4-07 #156, municipal Plans authority #155/#83.

## Why this was implemented
Codex's [exact-SHA G2F receipt](https://github.com/Project-Intra-Smithy/engineering-hub/issues/157#issuecomment-6459577934) reports **179 tests / 1,841 assertions PASS**, ordinary provenance queries 4→3, and 100 synthetic checks 400→300 queries (~600 ms). It leaves G1 PostgreSQL object ownership, `PUBLIC EXECUTE`, migrations vs ordinary app role boundaries and privileged repair unresolved. The Plan migration defines five named `kirion_plan_*` zero-argument PL/pgSQL trigger functions with default SECURITY INVOKER; PostgreSQL's default function privileges may grant PUBLIC EXECUTE. G2C uses CREATE OR REPLACE, which preserves existing function owner/ACL and does not make privilege design unnecessary.

## New executable artifact
`tests/Manual/sql/G1_DISPOSABLE_PG16_ROLE_LATTICE_R1.sql` is deliberately **outside application migrations and default test discovery**. It is a rollback-only psql exercise requiring independent disposable PG16 attestation, `talibon_portal_test`, an explicit psql lease variable, an ephemeral cluster superuser, exact five functions, and no colliding synthetic role names. It:
1. Emits actual current trigger function owners, SECURITY DEFINER flags, ACLs, and effective PUBLIC EXECUTE before any simulated changes.
2. Creates four NOLOGIN, no-superuser, no-createdb, no-createrole, no-bypassrls **temporary in-transaction** roles: migration owner, ordinary app, protected custody, controlled repair.
3. Revokes schema PUBLIC CREATE and PUBLIC EXECUTE on the five Plan trigger functions **within the transaction only**.
4. Demonstrates application SELECT on relevant document/Plan tables but no protected Plan mutation, narrowly simulated custody column UPDATE and binding/receipt INSERT, and no repair DML authorization.
5. Asserts prohibited grants are absent and tests real UPDATE/DELETE denials under SET LOCAL ROLE, a permitted custody zero-row column update, and a permitted ordinary read.
6. Rolls everything back and checks all four synthetic roles are absent afterward.

The read-only ordinary role is a **boundary demonstration, NOT a deployable app permission matrix**. Current legacy attachments, workflow documents, storage linkage, report and archive mutations require an independently audited operational grant map. This package changes **no** existing Laravel source, migrations, trigger functions, persistent database roles, service credentials, or PDF gateway.

## Independent DBA approval register
| ID | Owner | Decision required |
|---|---|---|
| G1-DBA-01 | DBA/IT | Actual migration owner, connection role, membership graph and ownership transfer policy |
| G1-DBA-02 | DBA/Nox | Explicit trigger function EXECUTE/default privilege policy and create/replace ownership semantics |
| G1-DBA-03 | DBA/Records | Approved custody write pathway, per-column/table grants, trigger invoker dependencies, no generic link bypass |
| G1-DBA-04 | DBA/Records/Nox | Signed privileged repair/break-glass mechanism, immutable EVER_PLAN origin preserved |
| G1-IT-01 | Identity/IT | Authoritative office/MFA/revocation epochs and bounded fail-closed outage timeout |
| G1-STO-01 | IT/Records/DPO | Private immutable scanned object generations, pre-byte durable audit and external monotonic restore fence |
| G1-LGU-01 | Records/Planning/DPO | Approved official editions/master evidence, classifications, actor/operation policy |

No approval is inferred from synthetic source or from passing G2F tests.

## Exact required execution
Only on a separately verified **new disposable PostgreSQL 16** cluster with empty non-system schema before synthetic migrations, loopback socket, tmpfs, no retained host mounts and no municipal/demo/staging/prod data. Migrate exact source on `talibon_portal_test`, then use the throwaway cluster superuser:

```powershell
psql -X -v ON_ERROR_STOP=1 `
  -v KIRION_G1_DISPOSABLE_ROLE_LEASE=EXCLUSIVE_PG16_THROWAWAY_QA_ONLY `
  -h 127.0.0.1 -p <verified-loopback-port> -U <throwaway-superuser> `
  -d talibon_portal_test `
  -f tests/Manual/sql/G1_DISPOSABLE_PG16_ROLE_LATTICE_R1.sql
```

Capture exact source SHA, command/exit, BEGIN→ROLLBACK transcript, owner/ACL inventory, role-context denials, no role residue, database/container lease and teardown. Do not use a retained DB, even if named talibon_portal_test. Lease marker alone is never proof of safe cluster isolation.

## Limits / release gates
**SQL execution NOT_RUN in source authoring environment** (no psql, Docker, verified disposable DB). SQL source is not represented as executable PASS. If a SQL semantic error appears, correct minimally on an authorized isolated candidate and reexecute; never weaken a real privilege denial to pass.

A trigger function's PUBLIC EXECUTE deserves review but is not proof of an exploitable vulnerability; PostgreSQL CREATE TRIGGER and existing-trigger runtime behavior need separate tests. The package does not solve check-to-byte TOCTOU, old-backup restore downgrade, 4.1-second connection failure timeout, immutable custody, actor-epoch enforcement, R4-07 projections or all 75 formal W02 cases. Independent Kirion-Nox acceptance and external DBA/IT/LGU owner signoffs remain mandatory. G3/G4 activation, release and W01–W08 worker restart remain unauthorized.

**Disposition:** `G1A_EXECUTABLE_PG_ROLE_BOUNDARY_SOURCE_CANDIDATE / PG16_NOT_RUN / OWNER_GATES_OPEN / NO_MERGE_NO_DEPLOY`.
