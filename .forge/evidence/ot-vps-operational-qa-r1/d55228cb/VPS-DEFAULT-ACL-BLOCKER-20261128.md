# OT-VPS-OPERATIONAL-QA-R1 — target default-ACL blocker

Codex, sole authorized VPS executor; accountable Engineer KIRCH. Observed 2026-11-28, receipt at 19:56 PHT. Mission OPEN/BLOCKED, not deployed or READY_FOR_SIRIS_QA.

## Resolved classification and preserved authority

Complete [owner order7238816306](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7238816306) and [paired memory7238820587](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7238820587) read directly from authenticated GitHub. Existing evidence branch fast-forwarded to f9c4f225673c393c96403a727c6aff6a732f3620 and mission memory read back. Classification HOLD is RESOLVED by Engineer owner attestation for the inspected existing development/test dataset. No independent provenance claim or renewed classification question.

Final disposition7238673732 and Nox APPROVED6097530717 remain intact. Executable checkout clean at d55228cba9fca025a5b8bcf9494df5da879b7995, accepted tree703f093c6be9d9ff16be4dd14c960d6ab6726a0b. Live main f5a74a7b648855be94809cac5ec56b60837cbf8c unchanged. OperationForge0e8765de6e0e87ea9b4503714f08fa650e1a79c6 verified and bootstrap read; Ponytail full retained. No agents, new engineering qualification or security review.

## Private administrator identification and cleanup preflight

Read-only queries selected a unique active system_admin by Kirjane username identity, not by assuming ID1. Exact normalized owner-alias comparison passed. Matching account has ID1, employee1, office2; linked employee and office are active. The other system_admin is deactivated and does not match. Username, contact identifier, password, MFA/recovery values and APP_KEY not published or changed. Initial exact lowercase bare-name comparison did not match; normalized full owner alias did. No attempted mutation depended on the failed bare-name assumption.

Exactly14 other existing application user rows are cleanup candidates. Foreign-key inventory was read: restrictive references include transaction creators/events, memorandum issuers and other evidence authors; nullable/cascade references also exist. This inventory is not a per-user dependency clearance. Supported StaffActivationService checks real authenticated session/MFA and ordinary-role eligibility; no fake Request/session or direct model deletion substituted for it. No physical account-delete endpoint was established. Cleanup is deferred to the supported deployed lifecycle after target compatibility is resolved. Removed0, newly deactivated/suspended0 in this continuation; existing inactive statuses unchanged. No account cleanup completion or sole-active-admin postcondition claimed. Actual password+HTTPS+MFA authentication remains NOT_RUN, distinct from identity selection. No administrator reset/recreation requested.

## Exact observed target incompatibility

Strict BatchMode/StrictHostKeyChecking SSH to existing srv2146360 succeeded. Existing current release still bf097d746836ef25a5988bfb081d22bb80122660; three existing containers retained, PG16.15. Existing runtime DB identity ot_devtest_runtime, while offline cluster administrator is one_talibon_app (OID10). Target one_talibon_iam_20261110235520 has54 migrations and no deployment_control namespace. No other client backend was present at the sampled observation; this does not attest a later maintenance window.

SELECT-only SQL inside BEGIN READ ONLY/COMMIT observed:

| Default-ACL owner | Scope | Object family | ACL |
|---|---|---|---|
| one_talibon_app | global within target DB (namespace0) | routines (`f`) | owner EXECUTE only; no PUBLIC |
| ot_devtest_owner | global within target DB (namespace0) | routines (`f`) | owner EXECUTE only; no PUBLIC |

These are restrictive defaults, not an alleged vulnerability. Accepted PR82 [PersistentSecurity.php lines64–65](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/blob/d55228cba9fca025a5b8bcf9494df5da879b7995/app/Deployment/PersistentSecurity.php#L64) rejects every initial unregistered target with any default-ACL row:

```sql
SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='deployment_control')
    OR EXISTS(SELECT 1 FROM pg_default_acl) AS unsafe;
```

Actual constituent results: registry namespace FALSE, default ACL existence TRUE; default ACL count2, both global routine rows. Therefore the exact initial-install guard condition is satisfied and emits `Unregistered control schema or default privilege drift.` if reached. No live installer attempt/refusal claimed; remaining secure-transport/logging gates have not passed. Source guard and actual catalog evidence, not an inherited historical blocker, establish UNSUPPORTED_UNREGISTERED_DEFAULT_ACL_STATE.

The accepted initial path has no demonstrated adoption/normalization mechanism for these existing defaults. Making these rows disappear by restoring stock PUBLIC routine EXECUTE would broaden default grants. Direct pg_default_acl deletion or guard bypass is unsupported. Neither performed. The governing stop on unsupported topology applies before migration/role/account mutation. This does not revoke engineering acceptance or authorize a general security review.

Other remaining prerequisites: DB TLS off; local/loopback HBA trust; DB socket directory mode3775 owned999:999, not accepted private socket ownership/mode from current app context; bootstrap log_min_error_statement=error and log_parameter_max_length=-1, not accepted panic/0. No global HBA/monitoring changes or source/runtime hooks introduced to bypass these. Secure supported bootstrap, catalog equivalence, maintenance and cutover still need completion after target disposition. Existing app/storage volumes and unrelated processes untouched.

## Trusted artifact recovery

Recovered original local package C:/Users/arane/AppData/Local/Temp/ot-trusted-package-srp5rp5x/build, not rebuilt. Manifest SHA256123be90e782061f2a29226890d4451da4a7c3c274d388f6937fb5e75ba46e19b and launcher SHA256800849047fe4ea4cd5cf26f1308fe7aa42046642dba1ad82d6b081a724e1bef1 match independent Nox6097530717 pins. Separate local isolated Python check verified manifest source/tree, exact complete10336-file inventory and SHA256 of every file, plus launcher bytes: PASS. No package authority generated from target files. This proves recovered Windows qualification artifact integrity only; Linux deploy/runtime suitability, trusted VPS PHP/INI pins and supported launcher invocation remain unverified. No artifact transferred or installer invoked on VPS.

## Disposition and next owner

[Issued checkpoint7238880766](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7238880766) is paired by this receipt plus mission memory/register. The comment's full-inventory check was underway when drafted; final result above is now PASS.

NEXT Maintainer/Engineer: resolve specifically the two restrictive routine-default ACL rows through an authorized supported target-preparation path, or acknowledge accepted installer cannot adopt the actual unregistered target as-is. No blanket grant restoration, manual catalog manipulation, audit destruction, source modification or new general qualification requested/authorized by this receipt. Codex resumes remaining target checks and accepted installation after exact disposition, then supported14-account cleanup preserving original Kirjane, actual access verification, and separately labeled synthetic QA fixture stage.

No VPS mutations, migrations, role/grant changes, fixture/account edits, restarts, password/MFA/APP_KEY changes, backups/snapshots/dumps/reset, extra running instances, source changes, main merge/public rollout or unrelated service modifications. Ordinary SSH/queries may generate access logs. No administrator credential fingerprint comparison or authenticated smoke PASS claimed. Evaluator access NOT_PREPARED; operational readiness BLOCKED; Siris NOT_ACTIVATED. No mission CLOSE.
