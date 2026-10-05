# KIRION FORGE: CODE WRITER — P06-W01 AUTH / SHOWCASE RETIREMENT

## Authority

Series: `P SERIES — CANONICAL BASELINE HARDENING`

Slice: `P06 — CROSS-LAYER CONTRACT RECONCILIATION`

Work package: `P06-W01 — AUTH / SHOWCASE RETIREMENT`

Technical Authority: **Kirch Ivan Balite**

Repository: `Kirch-Nairu/Talibon-Sales-Prototype`

Authorized branch ONLY:

`KIRCH-TALIBON-P06-W01-AUTH-SHOWCASE-RETIREMENT`

Exact common source SHA:

`6dc0b599f3b4b79d9dee45091ad2379de235b21c`

This source is the Maintainer-controlled convergence of accepted P03 backend canonicalization and accepted P04 frontend canonicalization.

Do not change branch strategy. Do not merge `main`. Do not promote or deploy.

---

## Mission

Remove the active Showcase subsystem from the canonical ONE TALIBON runtime and restore a normal production-shaped authentication/MFA contract without deleting historical Forge evidence.

The current shared source still contains a runtime Showcase service/provider, guest showcase-session routes, persona configuration, shared `showcaseSession` frontend props, a WorkspaceSwitcher, persona-aware onboarding behavior, and a Showcase-session exception inside MFA assurance.

That transitional system was useful for prototype/showcase validation but is not part of the canonical production product contract.

This work package must retire that runtime behavior completely and safely.

---

## Product / PDF authority

The governing implementation plan says the application is being transitioned from prototype/showcase maturity into an authoritative, validated municipal system; prototype/showcase success is not production acceptance. Authentication, account status, MFA, authorization and auditability are immediate shared-core capabilities.

Therefore:

- real authenticated users and real role/permission contracts are canonical;
- MFA assurance remains a real security boundary;
- a showcase session must not bypass that boundary;
- development/testing conveniences may exist only as clearly non-production test infrastructure;
- historical `.forge/**` evidence may retain the word `showcase` because it is provenance, not runtime product authority.

---

## Primary target contract

### Before

`guest -> /showcase/session -> persona-backed session -> MFA assurance bypass -> persona-dependent frontend experience`

### Required after

`guest -> /login -> authenticated active user -> MFA subject/assurance -> role/permission/experience contract -> application`

No production runtime session switcher.

No production persona login shortcut.

No Showcase-specific MFA bypass.

No active frontend product dependency on `showcaseSession`.

---

## Required investigation before mutation

Search the exact common source for all active references to at least:

- `ShowcaseSession`
- `ShowcaseSessionController`
- `ShowcaseServiceProvider`
- `SHOWCASE_MODE`
- `showcase.session`
- `/showcase/`
- `showcaseSession`
- `WorkspaceSwitcher`
- `components/showcase`
- persona keys / persona offer
- `PROTOTYPE_DEMO_PASSWORD` where tied to runtime showcase behavior
- any MFA bypass conditional tied to Showcase state

Classify each occurrence as:

- `REMOVE — ACTIVE RUNTIME`
- `REFACTOR — SHARED PRODUCT CONTRACT`
- `KEEP — TEST-ONLY`
- `KEEP — HISTORICAL FORGE EVIDENCE`
- `P08 FOLLOW-UP — CI HARNESS ONLY`

Do not blindly global-replace strings.

---

## Owned source

This work package may modify only the bounded auth/showcase surfaces required for retirement, including where present:

- `app/Http/Controllers/ShowcaseSessionController.php`
- `app/Services/ShowcaseSession.php`
- `app/Providers/ShowcaseServiceProvider.php`
- `bootstrap/providers.php`
- `app/Http/Middleware/RequireMfaAssurance.php`
- `app/Http/Middleware/HandleInertiaRequests.php`
- `app/Http/Controllers/Auth/AuthenticatedSessionController.php`
- directly dependent auth/session services only when necessary
- `config/showcase.php`
- `resources/js/components/showcase/**`
- `resources/js/components/shell/SidebarFooter.tsx`
- `resources/js/components/onboarding/**` only where Showcase/persona coupling must be removed
- `resources/js/layouts/AppLayout.tsx` only where Showcase/session props are consumed
- `resources/js/types.ts` only where Showcase shared props/types are removed
- directly affected Feature/browser tests that prove the retired contract

If a required file falls outside this bounded list, stop and record it instead of expanding scope silently.

---

## Frozen / prohibited scope

Do NOT modify:

- Messaging implementation or naming (`PrototypeMessaging`, message routes/models/controllers) — W02 owns this;
- Procurement / Project Monitoring business semantics;
- Full HRIS;
- department-specific routing, approval, signature, SLA or KPI rules;
- `.github/**` workflows in this writer lane;
- Docker/runtime deployment topology;
- repository separation;
- `main`;
- dependency versions unless a direct compilation blocker is proven and Maintainer authority is obtained.

Do not redesign the product shell.

Do not invent a new authentication architecture.

Do not weaken MFA.

---

## Required implementation outcomes

### A. Retire Showcase runtime endpoints

The canonical application must no longer register production routes such as:

- `/showcase/session`
- `/showcase/switch`
- `showcase.session.store`
- `showcase.session.switch`

Remove the provider/controller/service registration chain when no longer required.

### B. Remove Showcase MFA bypass

`RequireMfaAssurance` must no longer allow a request through because a Showcase session is active.

MFA behavior must continue to depend on the existing `AuthenticationAssurance` contract and authenticated user state.

### C. Remove Showcase runtime shared props

`HandleInertiaRequests` and shared frontend types must not publish/require a `showcaseSession` product contract after retirement.

### D. Remove Workspace/persona switching from active UI

Remove the WorkspaceSwitcher and any active UI that exists solely to switch Showcase personas.

### E. Preserve useful onboarding only when product-generic

If onboarding/tour behavior is genuinely generic and does not require fake personas, preserve it.

If a flow depends on Showcase persona keys or fake/demo users, de-couple or remove that portion rather than inventing a new role inference system.

### F. Test fixture discipline

Tests may still create users, seed controlled data, and disable middleware explicitly inside test code where the test's purpose requires it.

Do not rebuild a hidden production Showcase subsystem under a different name.

### G. CI harness follow-up map

Do not edit `.github/**` here.

Record every P08 workflow item that still references retired Showcase concepts, such as:

- `SHOWCASE_MODE`
- `PROTOTYPE_DEMO_PASSWORD`
- step names like `Showcase and MFA security tests`
- browser scripts whose filenames/assumptions are historical Showcase harnesses

P08 will update the validation harness after the integrated P07 source is fixed.

---

## Required tests / proof

Run only narrow self-validation necessary for this candidate.

At minimum provide evidence for:

1. no registered Showcase session routes;
2. normal login route remains registered;
3. protected application routes still require `auth`, `active`, and `mfa.assured` where currently required;
4. an active authenticated user without MFA assurance is still redirected/challenged according to existing assurance rules;
5. no Showcase session can bypass MFA because no such runtime contract remains;
6. frontend typecheck/build succeeds if practical in writer environment;
7. targeted Feature tests around authentication/MFA/shared props pass;
8. repository search proves no active runtime import/use of `ShowcaseSession`, `showcaseSession`, or `WorkspaceSwitcher` outside historical evidence / explicitly deferred CI harness.

Do not claim broad CI PASS.

---

## Stop conditions

STOP and return to Maintainer if:

- retirement requires changing accepted Messaging behavior;
- standard login/MFA behavior cannot remain intact without a new security design;
- a production user/role model is missing and would require invented LGU data;
- current onboarding cannot be preserved without fabricating persona semantics;
- `.github/**` must change to make product source compile;
- scope expands into unrelated navigation, HRIS, Procurement, Project Monitoring or deployment.

---

## Return contract

Return exactly:

1. final candidate SHA;
2. changed-file inventory vs `6dc0b599f3b4b79d9dee45091ad2379de235b21c`;
3. every active Showcase runtime element removed;
4. every historical/test-only Showcase occurrence intentionally retained and why;
5. MFA/security behavior preserved;
6. onboarding/product behavior preserved or deliberately removed;
7. tests actually run and actual results;
8. P08 CI-harness cleanup items;
9. unresolved cross-layer issues;
10. confirmation Messaging, main, Docker, deployment and repository separation were untouched.

Do not merge.
Do not promote.
Do not deploy.

Proceed.