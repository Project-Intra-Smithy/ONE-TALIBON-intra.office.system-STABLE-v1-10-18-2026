# ONE TALIBON — OW1 Onboarding & Guided Tour

## Purpose

OW1 adds a first-browser onboarding and persona-aware workspace tour for the ONE TALIBON evaluation prototype. It is a presentation layer only. It does not create authorization, workflow, database, telemetry, deployment, or account-preference behavior.

## Entry and orchestration

The common authenticated shell owns onboarding through:

`resources/js/layouts/AppLayout.tsx`

The shell renders one `FirstRunGate` using the existing Showcase session presentation persona. Tour selection is keyed only by `showcaseSession.persona.key`; labels, office names, emails, and user IDs are not used to infer a persona.

## Browser-local storage semantics

Version 1 uses:

- `talibon.onboarding.intro.v1`
- `talibon.onboarding.tour.v1.executive`
- `talibon.onboarding.tour.v1.engineering_head`
- `talibon.onboarding.tour.v1.budget_head`
- `talibon.onboarding.tour.v1.hr`
- `talibon.onboarding.tour.v1.legislative`
- `talibon.onboarding.tour.v1.employee`
- `talibon.onboarding.tour.v1.system_admin`

Introduction completion is independent from persona-tour completion.

Storage is intentionally browser/profile-local rather than account-wide. The storage abstraction attempts `localStorage`, falls back to `sessionStorage`, and retains in-memory state for the mounted application if browser storage throws. Storage failure must never block access to the workspace.

## First-run behavior

A browser with no completed introduction receives the question:

`Is this your first time exploring ONE TALIBON?`

Choosing the introduction opens a five-screen municipal wizard covering:

1. ONE TALIBON and the current Showcase workspace;
2. the connected municipal-work concept;
3. the required evaluation-prototype and interface notice;
4. repository-backed presentation credits;
5. guided-tour or self-exploration choice.

Choosing to enter directly completes only the global introduction and leaves the persona tour incomplete.

## Persona behavior

After global introduction completion, a persona whose versioned tour has not been completed may receive a small workspace-tour offer. The full introduction, disclaimer, and credits are not automatically replayed on persona change.

Current persona catalogs:

- `executive`
- `engineering_head`
- `budget_head`
- `employee`
- `hr`
- `legislative`
- `system_admin`

Tours explain structure and purpose rather than enumerating every page or claiming unavailable authority.

## Replay mechanism

The authenticated sidebar footer exposes an accessible `Guided tour` action during Showcase sessions.

The Guide provides:

- Replay this workspace tour
- About this prototype
- Development credits

Opening Guide does not erase completion state.

## Prototype notice authority

The onboarding notice describes ONE TALIBON as an evaluation prototype whose interface remains in an initial design and validation phase. Sample/demo content is explicitly distinguished from final official municipal reporting and production operational data.

This wording is presentation authority for OW1. Do not replace it with production-readiness claims or labels such as unfinished, beta, mockup-only, or not-ready.

## Credits authority

Presentation credits are configured in:

`resources/js/components/onboarding/tourCatalog.ts`

The stakeholder-facing roster and role titles are governed by the explicit Technical Authority approval recorded for OW1-CREDITS-R1. Credits remain data/config driven so approved names, roles, specialization, organization ownership, and collaboration copy can be maintained without rewriting onboarding mechanics.

README repository-state metadata is not used as runtime onboarding state.

## Stable target convention

Tour targets use `data-tour` values rather than visible text.

Navigation targets:

`nav:<portal destination key>`

Shell targets currently include:

- `shell:notifications`
- `shell:workspace-switcher`

Missing or responsive-hidden targets degrade to an informational coach card. Missing targets never throw, redirect-loop, or block tour progression.

## Mobile and desktop behavior

At narrow/mobile widths the coach UI is a bottom sheet with safe-area padding. The tour does not create a second navigation drawer. Navigation targets hidden by the mobile shell use the missing-target fallback.

Desktop uses a spotlight when a stable target is visible and positions the coach card beside the target when practical.

## Accessibility

Modal onboarding surfaces provide dialog semantics, focus entry, Tab containment, Escape handling, focus restoration, keyboard-sized controls, and a temporarily inert workspace shell.

Tour progress is screen-reader readable.

CSS motion transitions honor `prefers-reduced-motion`.

## Automated proof

Focused browser proof:

`node tests/Browser/ow1-onboarding-tour.mjs`

Expected runtime environment follows the existing Showcase browser harness: seeded Showcase personas, production frontend assets, and a local Laravel runtime.

The script covers first-run YES/NO, persistence, persona-specific completion, replay, storage failure, representative mobile/desktop viewports, focus containment, reduced motion, and protected route smoke.

## Limitations

- Completion state belongs to the current browser/profile, not the user account.
- Clearing browser storage intentionally causes onboarding to become first-run again.
- Mobile tours may use informational fallback for navigation items that are not mounted until the existing navigation drawer opens.
- Tour copy describes current prototype structure; it does not grant permissions or replace server-side authorization.
- OW1 does not modify live deployment state.

## Incrementing the onboarding version

Increment `v1` only when onboarding semantics or tour content changes materially enough that previously completed users should be offered the revised experience.

When incrementing:

1. change both introduction and persona-tour key versions together unless there is a deliberate reason not to;
2. preserve old keys rather than destructively rewriting browser storage;
3. update this document;
4. rerun the focused OW1 browser proof.
