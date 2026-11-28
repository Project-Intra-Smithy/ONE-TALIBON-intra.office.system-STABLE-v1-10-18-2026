# OT-VPS-OPERATIONAL-QA-R1 — fresh target preflight BLOCKED

Observed by Codex, sole authorized VPS executor, 2026-11-28 PHT; receipt recorded at 11:45 UTC (19:45 PHT). Accountable Engineer KIRCH. This is an operational blocker receipt, not mission CLOSE or independent QA.

## Verified authority and custody

- Complete [final order7238673732](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7238673732), [paired memory7238678119](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7238678119), and complete Nox APPROVED review6097530717 read directly from authenticated GitHub. Review author Kirion-Nox/339503629, accepted candidate d55228cba9fca025a5b8bcf9494df5da879b7995.
- Existing R4 evidence branch fast-forwarded from5059bdb1 to paired29af1338a53c0f07e51f03343d848a4fe300c833; both memory paths read back. Original orders7218454111/7218647858 and prior blocked receipt7ad5be1b recovered. Scope registers196/194/191/128/83/164 read; no new policy/official roster inferred.
- Clean local executable checkout C:/dev/TAL/ot-persistent-deployment-r4 at accepted SHA; Git tree703f093c6be9d9ff16be4dd14c960d6ab6726a0b. Live main f5a74a7b648855be94809cac5ec56b60837cbf8c. Neither modified.
- OperationForge local clean HEAD0e8765de6e0e87ea9b4503714f08fa650e1a79c6; bootstrap/constitution/writer doctrine read. Ponytail full loaded. No agents or Kurt; no requalification/security review restarted. Codex performs only original operational scope; no acceptance role claimed.
- Accepted PERSISTENT-PG16.md and PG16-SUPPORTED-BOUNDARY.md read. Accepted source qualification remains intact. Historical lack of a persistent installer is superseded by accepted PR82 and is not the present blocker.
- [Issued operational checkpoint7238765557](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7238765557).

## Actual read-only observations

Strict BatchMode/StrictHostKeyChecking SSH with existing authorized deployment key succeeded. No key material printed. Host srv2146360; current symlink /opt/devtestportal/current resolves /opt/devtestportal/releases/bf097d746836ef25a5988bfb081d22bb80122660. This is observed directory/image identity, not full deployed source attestation.

Existing devtestportal-app-1 image devtestportal-iam:bf097d746836, devtestportal-db-1 postgres:16-bookworm and devtestportal-caddy-1 caddy:2.10-alpine remain up; DB healthy. App storage remains devtestportal_iam_storage mounted at /var/www/html/storage. Private existing credential file has root:root0600 permissions; contents not opened. HTTPS GET /login returned200 with TLS verification0; no authenticated journey performed. Caddy publishes80/443. Restricted evaluator ingress has not been established or attested.

psql -X -v ON_ERROR_STOP=1 executed SELECT statements inside BEGIN READ ONLY/COMMIT using existing local administrator identity. First attempted stock postgres role does not exist; this caused connection refusal only, after which observed POSTGRES_USER one_talibon_app was used. No credentials were read or passed to SQL.

Actual DB one_talibon_iam_20261110235520, PostgreSQL16.15 Debian, cluster system identifier7706624208228905003. Ledger54, latest2026_11_20_000200_enforce_iam_identity_integrity. Only non-system namespace public, owned ot_devtest_owner; only plpgsql extension1.0. Ledger count/latest is observed, not proof of exact canonical legacy schema equality.

Cluster roles: one_talibon_app LOGIN/SUPERUSER/CREATEDB/CREATEROLE/BYPASSRLS; ot_devtest_owner NOLOGIN without elevated attributes; ot_devtest_runtime LOGIN without elevated attributes. No non-system role memberships observed. App environment DB_USERNAME=ot_devtest_runtime, DB_HOST=db, APP_ENV=staging. Privileged role owns active, retained one_talibon_devtest and postgres databases. No cluster-wide role changes authorized or attempted. No managed kirion_g1b/n03 roles yet. Other active target sessions0 at one observation; this does not establish exclusive maintenance custody for a later cutover.

Existing data counts, unchanged from prior receipt:

| Entity | Count |
|---|---:|
| users |15|
| employees |15|
| departments |35|
| transactions |5|
| tasks |10|
| memoranda |1|
| calendar_events |5|
| documents |5|
| platform_notifications |5|
| audit_logs |284|

## Exact stop condition: NONPRODUCTION_DATA_CLASSIFICATION_UNVERIFIED

Active user IDs1(system_admin) and13(mayor_staff) each have exactly one employee link and a non-null department link, password present, encrypted MFA material present and MFA confirmation present. Their names and email identifiers are not demonstrably synthetic. No names, emails, password hashes, encrypted MFA, APP_KEY values or secret fingerprints are included here. Exactly13 of15 employee names match a test/demo/QA/synthetic string; two do not. All15 employees have user links. Sensitive date-of-birth/address/GSIS/TIN fields checked were null; that bounded observation does not prove all fields or linked records synthetic. Test-like labels and reserved domains are heuristics only, not classification authority.

The Engineer's original statement that no production data exists remains REPORTED. Final order specifically requires resolving previously unclassified administrator/executive identities and stops affected mutation on real/unknown data. Current aggregate counts and heuristic labels cannot satisfy that requirement. Therefore installer invocation, cutover and fixture/account writes stopped before mutation. No assertion that these identities are real municipal staff is made; provenance is UNKNOWN. No private HR/credentials workbook was opened to try to resolve this.

NEXT Engineer KIRCH/authorized data custodian: provide authoritative private provenance/classification for existing IDs1/13 and related retained records, distinguishing protected owner/operator identities from synthetic fixtures or actual municipal records. Record only redacted classification and custodian decision in governance. Do not send passwords, MFA secrets or private personnel details to GitHub. If real data exists, a safe authorized path is required before affected mutation. No new application engineering or security-review cycle is requested.

## Remaining prerequisites, not additional source findings

DB ssl=off; local/loopback HBA uses trust, Docker host traffic SCRAM. Default observed bootstrap log_min_error_statement=error and log_parameter_max_length=-1 do not meet accepted credential boundary panic/0. Other sampled duration/debug/preload settings were quiet/empty. No monitoring/HBA/global settings changed. A verified secure transport and already-safe bootstrap session remain to be established using supported mechanisms after classification. Do not infer that blanket HBA changes, monitoring weakening or plaintext Docker TCP would be acceptable. No live installer refusal induced.

Full supported catalog/schema/owner/runtime retirement, private socket/TLS, maintenance/cutover, package/PHP/INI trust and broker/storage/runtime checks remain incomplete. Original Nox evidence supplies package/launcher evidence, but no actual VPS package has been authenticated or invoked in this preflight. No target-derived canonical contract generated; no target files self-blessed. No package readiness PASS claimed.

## Preservation and return

No deployment/configuration/DDL/DML/grants/role changes/restarts/fixture insertions, password/MFA/account/APP_KEY changes, backups/snapshots/dumps/resets, alternate running instances, source modification, main merge/public rollout, or unrelated service changes by this executor. All host operations were read-only commands/SQL or ordinary HTTPS access (which may produce ordinary access logs/session state). Existing application/DB/storage retained. Before/after secret fingerprint comparison and genuine preserved-administrator login were NOT_RUN; preservation PASS is not claimed merely from no mutations.

Accepted-source deployment identity, least-privilege postconditions, additive fixture case IDs, authenticated HTTPS/MFA multi-role smoke, private evaluator access and operational readiness: NOT_RUN/BLOCKED. Siris196 remains queued for separate Engineer activation after actual readiness. No shared/default evaluator passwords created. Mission OPEN/BLOCKED; engineering acceptance preserved. Return orchestration to Engineer/Maintainer for classification, then Codex resumes remaining actual preflight and original mission without repeating accepted qualification.
