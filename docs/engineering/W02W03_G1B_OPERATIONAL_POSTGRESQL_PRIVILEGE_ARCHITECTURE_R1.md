# W02/W03 G1B operational PostgreSQL privilege architecture R1

**Status:** disposable implementation candidate; not an approved production policy.

**Parent:** `9008c9bbe57139a13b59c08ab3d988a3f46375c7`.

**Scope:** SQL and manual validation only. No runtime, migration, route, storage, or authorization source is changed.

## Role boundary

| Role | Login | Boundary |
|---|---:|---|
| `kirion_g1b_owner` | no | Owns all current public Laravel tables/sequences plus the five SECURITY INVOKER Plan trigger functions; has schema CREATE. The wider object scope is required for future migrations that alter legacy tables. |
| `kirion_g1b_migrator` | yes | NOINHERIT member of owner; DDL requires an explicit audited `SET ROLE kirion_g1b_owner`. |
| `kirion_g1b_app` | yes | Current legacy table DML, sequences, ordinary document columns, and read-only Plan/provenance projections. No provenance column, binding/receipt write, function EXECUTE, schema CREATE, or owner membership. |
| `kirion_g1b_custody` | yes | Reads protected graph; may update only `documents.security_domain`, insert append-only receipts/bindings, and use only the binding sequence. No storage mutation, generic links, delete/update binding, or direct function EXECUTE. |
| `kirion_g1b_repair` | no | Schema USAGE only. Any future break-glass mechanism remains an accountable DBA/security decision. |

The five functions remain SECURITY INVOKER. Direct PUBLIC/app/custody EXECUTE is revoked, but installed triggers still run in the invoking statement and require the caller's table dependencies. `CREATE OR REPLACE` remains owner-only and preserves owner/ACL. Owner-specific global function defaults revoke PUBLIC EXECUTE for newly created functions. The NOLOGIN owner holds the full application schema because Laravel migrations alter legacy tables; ordinary and custody logins receive only explicit grants and have no owner membership.

## Source-backed operation inventory

| Contract | Observed database operations | Candidate authority |
|---|---|---|
| Users, password reset, MFA, sessions, integration identities | SELECT/INSERT/UPDATE/DELETE on legacy identity tables; sequence use where applicable | app |
| Departments and employees | CRUD and sequence use | app |
| Transactions and transaction events | CRUD, append events, reporting SELECT, sequences | app |
| Correspondence records/events/counters and attachments | CRUD/event append, document/link CRUD, sequences | app |
| Travel orders, employee join, events and evidence | CRUD/event append, document/link CRUD, sequences | app |
| Audit logs, Records, reports, CSV/archive queries | audit INSERT and projection SELECT; current legacy maintenance DML | app |
| Ordinary documents | SELECT; INSERT/UPDATE explicit legacy metadata columns; DELETE; document sequence | app |
| Generic links | legacy CRUD, while database trigger rejects Plan morphs and links to sealed documents | app |
| Plan family/edition and provenance projection | SELECT only | app/custody |
| Seal `EVER_PLAN` and append receipt | one-column document UPDATE; receipt is trigger-inserted/append-only | custody |
| Quarantined typed association | INSERT only plus binding sequence | custody |
| DDL/object replacement | explicit SET ROLE, owner attribution | migrator→owner |
| Repair/downgrade/deletion | denied pending a controlled mechanism | unresolved DBA/security owner gate |

The legacy grant loop is deliberately an inventory of the schema at installation time, not a future-table default grant. New tables require review. `documents` is excluded from that loop and uses column grants so ordinary application credentials cannot set `security_domain`. Protected tables are also excluded. This describes current executable behavior and grants no municipal documentary authority.

## Execution

After a separately verified bootstrap migration on a new PostgreSQL 16 tmpfs container:

```text
psql ... -v KIRION_G1B_DISPOSABLE_LEASE=EXCLUSIVE_PG16_TMPFS_QA_ONLY \
  -v G1B_MIGRATOR_PASSWORD=... -v G1B_APP_PASSWORD=... -v G1B_CUSTODY_PASSWORD=... \
  -f tests/Manual/sql/G1B_DISPOSABLE_PG16_ROLE_INSTALL_R1.sql
psql ... -f tests/Manual/sql/G1B_DISPOSABLE_PG16_ROLE_VERIFY_R1.sql
DB_USERNAME=kirion_g1b_app DB_PASSWORD=... php tests/Manual/G1BOperationalLaravelCompatibility.php
```

The verifier uses real role switching, positive DML, denied DDL/provenance/repair probes, owner replacement, default ACL checks, sequence-backed inserts, sealing, and typed binding insertion. Synthetic fixtures and probe objects roll back. The installed policy persists only until the disposable container is destroyed.

During the development-container run, the first verifier revision incorrectly passed the pseudo-role name `PUBLIC` to `has_function_privilege`, producing PostgreSQL error `42704` (`role "PUBLIC" does not exist`). The check was corrected to inspect the effective ACL with `aclexplode`; the affected transaction rolled back before any fixture persisted. A second run exposed that a schema-qualified default-privilege revoke does not override PostgreSQL's global built-in PUBLIC function EXECUTE default. The installer now uses the creator's global function default (`ALTER DEFAULT PRIVILEGES FOR ROLE ... REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC`). Final acceptance must use a fresh container and the corrected exact commit.

The first manual PHP invocation stopped at parse time because its generated namespace imports contained doubled separators. No database statement ran. The imports were corrected and PHP lint is a required precondition in the final run.

## Accountable decisions and recovery limits

| Decision | Accountable owner | G1B disposition |
|---|---|---|
| DBA-01 object/owner scope, role-creation authority and CONNECT policy | DBA | OPEN; synthetic candidate only |
| DBA-02 deployment ordering, ownership transfer, grant revocation, locks and rollback | DBA | OPEN; retained execution prohibited |
| DBA-03 controlled repair/break-glass workflow and dual authorization | DBA + Security | OPEN; repair remains NOLOGIN/default-denied |
| IT-01 secret delivery, rotation, pool separation and `SET ROLE` reset/audit | IT | OPEN; disposable credential probe only |
| IT-02 TLS/certificate requirements and incident revocation | IT | OPEN |
| REC-01 `pg_dump`/restore of owners, memberships, ACL/default ACL and extensions | DBA + IT | **NOT_RUN** cross-cluster |
| REC-02 production rotation plus connection-pool draining | IT | **NOT_RUN** |
| DOC-01 official Plan edition/custody/classification/retention/legal hold/destruction | Records + Planning + DPO | OPEN; no authority inferred |
| SEC-01 escalation, NOINHERIT, invoker-trigger dependencies, grant breadth and repair denial | Kirion-Nox | Independent review required |

Credential rotation is executable by the disposable validation operator using `ALTER ROLE ... PASSWORD`, followed over the loopback published port by old-secret rejection and new-secret acceptance. This does not resolve IT-01/REC-02.

## Next separable G2 proposal

Build a separately authorized synthetic custody design around immutable private object generations, checksums, malware scan state, quarantined typed bindings, custody audit, isolated keys, actor/office/MFA revocation, and an external monotonic restore fence. PDF publication/streaming remains disabled; the check-to-byte race and durable audit-before-byte requirement remain unresolved. The 75-case security ledger remains **NOT_RUN**.
