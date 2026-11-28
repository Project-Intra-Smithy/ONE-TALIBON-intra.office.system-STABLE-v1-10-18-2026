# Finite R3 ONE TALIBON deployment boundary

Authority Hub197/7223309777; four residuals only. Supported states: stock PostgreSQL16/plpgsql; empty or canonical54-migration legacy installation; same exact independently accepted package registered rerun. No adoption of arbitrary schemas, executable definitions, extension frameworks, shared-role topology or future lineage. Trusted stock runtime binaries/operator, independently accepted package/configuration pins and exclusive maintenance custody remain prerequisites, not universal security claims.

Qualified catalog profiles are explicitly PG16.15 and freshly initialized PG16.16. Other minor versions and PG16.16 binaries over an older, unupdated catalog fail closed. The PG16.15 base includes all system schema, column ACL, type, routine and relation rows. PG16.16 adds exactly the checked, hashed `binary_upgrade_set_next_attribute_versions(pg_lsn[])` security row from its official `REL_16_16` pg_proc.dat (OID4551), independently observed in the hosted guarded fixture. The profile comes from the server version, never target-derived ACLs or executable definitions; every resulting row still compares exactly. No catalog update is performed by this installer.

## Execution before credentials (N79-04)

The external same-byte authenticated launcher verifies all source/vendor/build/policy bytes and rejects symlinks, reparse points, hard links and dotenv files. Absolute canonical PHP and private INI need separate independent SHA256 pins. Only APP_ENV/DEBUG/KEY and explicit DB endpoint/bootstrap/TLS fields are transferred from operator inputs; values are validated. There is no inherited PATH, HOME, Composer, PHP, Laravel cache/storage/base, libpq service/password/certificate or APM environment. PGOPTIONS is refused. The probe and final bootstrap use the same pinned INI and private empty INI scan directory. Known stock extensions are operator-trusted runtime components; unverified code is not loaded from target-provided dependency/configuration paths.

Laravel13.44.1 path resolution was inspected in Application.php, LoadEnvironmentVariables.php, PackageManifest.php and ProviderRepository.php. Base and all five executable cache paths are pinned to the verified package; storage, dotenv/environment path, home/temp and libpq fallback paths are generated inside the independently controlled private bootstrap. Dotenv cannot import an external executable-path override. Composer autoload files and generated package/services caches are package inventory entries. A malicious ambient APP_SERVICES_CACHE, APP_PACKAGES_CACHE, APP_CONFIG_CACHE, APP_ROUTES_CACHE, APP_EVENTS_CACHE, APP_BASE_PATH or LARAVEL_STORAGE_PATH is normalized away before PHP. PHP configuration tampering fails its independent pin before probing. Harmless execution canaries prove no side effect from these paths.

## PG16 catalog inventory (N79-01)

Supported canonical schemas, tables/indexes/sequences/columns/row types, routines, constraints, explicit and internal RI triggers, policies, dependencies, ACL/default ACL/grant options, ownership, managed roles/memberships/SET paths/startup settings and effective permissions are compared to the independently derived policy contract. Built-in pg_catalog/information_schema schema/routine/relation/view-option/view-definition/rewrite-rule/type security is also compared under controlled `search_path=pg_catalog`. allow_system_table_mods must remain off; normal-OID definitions in system schemas are rejected. Trusted stock PG16 binaries and bootstrap-owned built-ins are the implementation trust boundary; hostile root/server-binary replacement is outside it.

The stock language owner/ACL/trust/handler/validator configuration and plpgsql extension owner/namespace/version/configuration are independently derived sections too. Unexpected reserved `pg_` namespaces refuse; only pg_catalog, pg_toast and PostgreSQL's numbered temporary namespace families are recognized. This prevents arbitrary application objects from hiding behind the catalog's reserved-name exclusions.

`SupportedPg16::UNSUPPORTED` enumerates target-local object families that ONE TALIBON does not use. Every family is checked before installer mutation and is included in independent rollback observations as bounded count+semantic digest (never plaintext foreign/subscription options):

| Catalog family | Disposition |
|---|---|
| pg_largeobject_metadata / pg_largeobject | Reject any metadata, owner/ACL or page data. |
| pg_foreign_data_wrapper / server / user_mapping / foreign_table | Reject all wrappers, servers, credentials/mappings and foreign tables. |
| pg_publication / rel / namespace; pg_subscription / rel | Reject target-local publication/subscription membership and connection definitions. |
| pg_replication_slots | Reject target-local logical slots; do not alter unrelated cluster slots. |
| pg_event_trigger, pg_seclabel, target pg_shseclabel | Reject event-trigger execution and security-label authorities. |
| pg_extension / pg_language | Only stock plpgsql extension and internal/c/sql/trusted plpgsql languages; reject extra extensions/languages. |
| pg_transform / am / operator / opclass / opfamily / cast / conversion | Reject custom transformations, access methods, operator/cast execution families. |
| pg_ts_config / dict / parser / template, non-system collations | Reject custom text-search or collation definitions. Platform stock built-in collations remain part of trusted initdb/runtime. |
| pg_type domain/enum/range/multirange | Reject custom type families; canonical row/array types remain in the policy inventory. |
| pg_partitioned_table / pg_inherits | Reject partitioned or inherited relation topology; no arbitrary parent/child adoption. |
| pg_aggregate / pg_statistic_ext | Reject user aggregates and extended statistics definitions. |
| pg_tablespace references | Reject target use of non-default tablespaces, including `pg_database.dattablespace` (requiring `pg_default`) and explicit `pg_class.reltablespace` references; unrelated unused cluster tablespaces are untouched. |
| pg_rewrite / temporary objects | Reject target rewrite rules and preexisting temporary executable/relation state. Migration-owned temporary proof objects are transaction-local and dropped by the canonical migrations. |
| system relation/routine/type normal-OID additions | Reject application definitions hidden in pg_catalog or information_schema. |

Derived/materialized planner/statistical/storage bookkeeping catalogs do not grant additional authority and are not physical equality oracles. Their originating objects/owners/ACLs and definitions are covered or refused above. Shared cluster roles/tablespaces/databases outside this target are not modified; unknown target grants and shared assumable authority are refusals. Snapshot digests are bounded at256records per unsupported family; count>0 already refuses, so the digest is a test rollback witness, not permission to adopt larger object sets.

The canonical contract is now a readable index plus bounded JSON sections with per-part SHA256 and row counts. Hosted qualification independently reconstructs it from a newly initialized exclusive disposable PG16 cluster using the original nine migration SQL bodies and six shared policies, compares normalized complete content and emits an original comparison digest. It does not generate its expected oracle from a persistent installation. Missing/unreadable/tampered sections refuse; reviewers can fetch every indexed part.

## Durable retirement authority (N79-02)

Registry format3 binds target database name/OID, cluster system identifier, endpoint host/port, bootstrap role name/OID, canonical disjoint owner/runtime identity lists with role OIDs, installation UUID and source/tree/package/ledger. These are compared to the independently retained receipt before caller retirement scope is used. Empty/reduced/substituted/reclassified lists or recreated roles are not accepted as new authority. Real retired-role membership/authority drift is checked even when the caller attempts omission. Target-local reconciliation cannot disable/drop unrelated roles or rewrite unrelated database grants; genuine shared authority that cannot be removed safely is a refusal.

## Registered password requirement (N79-03)

The normalized private environment requires libpq SCRAM-only authentication (PGREQUIREAUTH=scram-sha-256, GSS disabled) and has no service/passfile/client-certificate fallback. Actual registered roles are each tested through a correct-credential fresh connection and an incorrect-credential fresh connection; only a genuine password-authentication failure is accepted for the negative. Trust/peer/certificate-only or unverifiable authentication is refused; global HBA is never changed on a real installation and reruns do not rotate passwords. The rehearsal alone temporarily exercises permissive HBA in its new synthetic cluster, restores it, and verifies supplied registered-role credential-file errors, not only bootstrap passwords. Existing SCRAM/logging/TLS/private-file canary coverage is retained. Verifiers remain sensitive and are not printed.

## Qualification scope

Retain all prior303cases plus discriminating unsupported-object initial/registered rollback, independently regenerated contract, exact retired identity continuity, external execution canaries and actual password requirement. Include full Linux/Windows fresh/54-upgrade/registered and protected/canonical exact-successor qualification. No test-count target substitutes for the four invariants. Final source-level review and Nox targeted reacceptance then Maintainer disposition precede any VPS mutation. No snapshots/backups/reset/redundant deployed instance/Kurt/main merge/public rollout. This document does not activate Siris or award operational readiness.
