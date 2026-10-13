# KIRION FORGE — ACCELERATED P1–P7 MODULAR DELIVERY / LGU DECISION REGISTRY

**Technical direction (2026-10-13):** accelerate actual implementation, minimize cross-repository coordination, use the existing intelligence #104, and defer expensive validation *without equating NOT_RUN with PASS*. **Authority:** Kirch as engineering owner. This record does **not** change the [frozen Common System Program](../memory/COMMON-SYSTEM-PROGRAM-LOCK.md), grant municipal permissions, authorize production, or declare a phase accepted.

## Governing delivery rules

- **Code first, preserve accountability.** Existing Laravel/Inertia/React canonical repository is the implementation/integration target. Draft branch + exact SHA + changed-file evidence before technical acceptance. Use minimal React contract harnesses only where needed.
- **One combined P1 candidate:** [PR69](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/69), not reassembling #93/#94 from scratch. [PR67](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/67) is the original #95 source. Main and production remain unmodified by draft source.
- **Four distinct statuses:** `SOURCE_IMPLEMENTED`, `BUILD_VALIDATED`, `RUNTIME_SECURITY_VALIDATED`, `ENGINEERING_ACCEPTED`. Never skip the last two by renaming a draft. Already bounded #93/#94 PASS does not automatically certify modified integrated source.
- **Modular source contracts:** Task and Work Request remain distinct. Cross-domain features resolve `source_kind + source_id` via an authorized source adapter. Lifecycle, ownership, disclosure and history always remain in the source domain.
- **Authorization:** deny by default for unapproved actor/resource combinations; no implicit privileged exception, read/query bypass or frontend-only enforcement. Any LGU-permitted exception requires recorded owner, exact rule, purpose, effective date, and separate implementation.
- **Parallel implementation:** P2/P3 can overlap after stable accepted consumed contracts; P4/P5 partly overlap on accepted domains. P6 performs final cross-domain reconciliation, not postponed security repairs.
- **Credentials:** never put local demo/test passwords in tracked application source, GitHub Actions, acceptance receipts or municipal production configuration.

## Locked phase map and build priority

| Phase | Implementation target (reuse existing components) | Release condition |
|---|---|---|
| **P1 A01–A04** | Task, Unified My Work, Common References, activity, secure Work Request boundary, minimum native Task lifecycle harness | #95 tests/review, exact combined Laravel/PostgreSQL/browser/compatibility evidence, P1-H technical acceptance |
| **P2 B01–B04** | Notification/outbox event references, calendar work-context linkage, existing messaging preservation | Stable authorized Task/Work Request contract, no external notification by assumption, runtime integration |
| **P3 C01–C05** | Mature existing Correspondence/Document/Record links separately | Approved lifecycle/retention/classification; file ACL and evidence linkage tests |
| **P4 D01–D04** | Whitelisted cross-domain SearchAdapter with per-source authorization and bounded cursor | No unaccepted source indexed/published; negative leakage/performance evidence |
| **P5 E01–E06** | Existing personal/office/executive projections, reports and audit adapters | Authorized visibility and approved metrics; accurate counts/exports, actor scoping |
| **P6 F01–F06** | Canonical capability matrix and cross-domain negative regression | Employment/role revocation, source/file/search leakage, MFA/session/audit tested |
| **P7 G01–G04** | Final reproducible exact release manifest, migration, CI/QA, known-state freeze | Exact accepted SHA, no unacknowledged critical gates, human acceptance |

Existing Calendar, Messaging, Documents, Records, Search and dashboards in the canonical repo **are not automatically new-series integrations or accepted**. Prior code should be reused, not reconstructed.

## Replaceable module boundaries (engineering defaults, not municipal policy)

- **ActorEligibility / PolicyDecision:** resolve user+employment+department fresh; per-request resource ACL; privileged roles still require eligibility; publish no guessed service-principal exception.
- **CommonSourceReference:** source kind, stable opaque ID, visibility path, optional navigation; passive reference never authorizes source lifecycle or attachment.
- **CoordinationEvent / NotificationAdapter:** provenance, actor, source, event ID/time, authorized recipient resolver; channel may be disabled without losing core events.
- **CalendarLink / MessageContext:** source-aware reference, minimal metadata, reauthorize at every read; avoid copying confidential task titles into globally visible destinations.
- **DocumentEvidenceAdapter:** source+document authorization must both succeed; preserve record retention and source history.
- **SearchAdapter:** source-owned scope, redacted allowed projection, deterministic pagination, bounded query; no global raw-table union.
- **WorkspaceProjection:** read-only authorized aggregation; official LGU KPIs are omitted or explicitly marked unapproved, not inferred.
- **PolicyResolver inputs:** future LGU-approved exceptions become versioned entries, not ad hoc role checks or permission bypass scattered across controllers.

## LGU discovery register — unresolved; do not substitute research for approval

| ID | LGU-specific rule requiring authorized decision | Conservative engineering default |
|---|---|---|
| `LGU-01` | Employment separation/inactive office exception for administrators/Mayor | Deny protected Work Request access, no implicit exception |
| `LGU-02` | Service/nonemployee principals, sponsors and expiry | No service Work Request entitlement |
| `LGU-03` | Official Task issuance, delegation, acceptance, transfers | Preserve personal C1 only until authority confirmed |
| `LGU-04` | Executive cross-office access and confidential data | No additional executive visibility |
| `LGU-05` | Mixed HR/legislative screens: whole-page denial vs scoped Work Request suppression | Suppress restricted Work Request-derived fields without rewriting independent HR rules |
| `LGU-06` | Aggregate counts, departmental directories, metadata classification | Hide protected Work Request metadata from ineligible principals |
| `LGU-07` | Office transfer, delegated scope, bookmarks, retention of historical permissions | Revoke old-office access unless an explicit valid grant exists |
| `LGU-08` | Official correspondence/work approval chain, signatories and SLA | Keep existing technical lifecycle; no invented statutory workflow |
| `LGU-09` | Records retention, disclosure, classification, legal hold and disposal | Do not auto-publish or auto-delete |
| `LGU-10` | Calendar attendees, notification recipients/channels, messaging visibility | Private/minimal, no external broadcast |
| `LGU-11` | Search indexable fields and cross-domain disclosures | Whitelist only accepted authorized sources |
| `LGU-12` | Official KPIs/report recipients/export powers | No official KPI claim until approved |
| `LGU-13` | Account lockout, MFA/privileged exemptions, offboarding SLA | No unapproved exemption; enforce source-level access checks |

**Required decision evidence:** decision ID, LGU official/process owner, written approved rule, effective date, affected roles/offices/routes/data, justification/evidence URL, version and superseding decision. Flag these as `LGU_DECISION_REQUIRED` rather than silently promoting a conservative design default into a Talibon administrative rule.

## Industry references / limits

1. [OWASP Developer Guide: Enforce Access Controls](https://devguide.owasp.org/en/04-design/02-web-app-checklist/07-access-controls/): deny by default, least privilege, enforcement and authorization testing.
2. [OWASP ASVS 5.0: Authorization](https://github.com/OWASP/ASVS/blob/master/5.0/en/0x17-V8-Authorization.md): document function-level and data-level access by actor and resource attributes.
3. [NIST SP 800-53 Rev. 5 AC-2/AC-3](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final): account management and enforcement controls.

These establish engineering patterns, **not** official Talibon HR/legal/records policy, disclosure entitlements, exact timing, or municipal authority. The merged [intelligence #105 materials](https://github.com/Project-Intra-Smithy/engineering-hub/tree/main/research/2026-10-12-nox-single) remain the local security/design evidence baseline.

## Next real gates

P1 PR69: compile PHP/TS and Vite, run security-negative tests and PostgreSQL in a proven disposable cluster, validate Laravel/Inertia lifecycle, inspect direct-leak Work Request consumers, independent review, then Kirch exact-candidate P1-H acceptance. P2–P6 may receive separate **draft source** work concurrently on stable inputs, but **P7 ENGINEERING_ACCEPTED** cannot be reported absent actual integration and QA.

`AGGRESSIVE_SOURCE_BUILD / LGU_DECISIONS_TAGGED / INDUSTRY_DEFAULTS_DOCUMENTED / NOT_A_RELEASE_WAIVER`
