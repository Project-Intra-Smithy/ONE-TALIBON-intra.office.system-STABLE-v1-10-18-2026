# A01-C1 — Individual Task HTTP contract (release candidate)

**Status: CANDIDATE / NOT RELEASED.** Bounded to personal Tasks; awaits exact-SHA Kurt CI, independent source review, a browser/session/CSRF smoke check, Kirch acceptance, and a separately authorized merge. A01-C1 is a checkpoint inside A01, not a new Series.

**Source baseline:** `e49e9b2dafc4cac8869b5099270429d9abf8730e` (after [Forge release-records PR #33](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/33)); accepted W03 implementation at `0573680696c8bd6fb421d625b5e7dc2c37cb1905`, [PR #31](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/pull/31), [46 tests / 378 assertions postmerge CI](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/actions/runs/37889890224). **Replace this baseline with the final exact integrated SHA only after acceptance/merge.**

## Transport and security

- **Same-origin browser session only** at root `/tasks`, **not** `/api/v1`; there is no API token / machine-client Task contract.
- All Task URLs are JSON-only, regardless of a missing/mismatched `Accept` header. Clients **SHOULD** send `Accept: application/json`, `Content-Type: application/json` on writes, and **MUST NOT** send Inertia-specific headers to Task fetches.
- Laravel **web** middleware is retained: browser session cookie and CSRF on POST. Send `credentials: 'same-origin'`; acquire the CSRF token through the existing authenticated web shell, submit the token in `X-CSRF-TOKEN` or `X-XSRF-TOKEN` per Laravel's CSRF contract. **No CSRF exemptions.** Session expiry/CSRF mismatch returns **419 JSON**; integration browser verification is a remaining gate (feature tests under `APP_ENV=testing` do not prove production CSRF enforcement).
- Auth and current active-account checks apply. Roles requiring MFA must complete it first. MFA-pending Task requests return **403 JSON** `{ "message": "...", "code": "MFA_REQUIRED", "next_url": "/security/mfa/..." }`, not a redirect; `next_url` is server-provided, not client-authoritative. Deactivated sessions return **401 JSON** with `code: "ACCOUNT_INACTIVE"`. Unauthenticated requests return **401 JSON**.
- Authorized actor is the **session user** with an active linked employee and department. User-supplied creator, assignee, state, office, source and timestamps are forbidden. Non-owner and inaccessible/legacy/official Task IDs both return **404**. No role (including Mayor/head) gains personal-task cross-owner access.
- Throttle: `60` requests / minute on this route group (429 may occur). Error responses carry `X-Request-ID` where request-ID middleware handles them.

## Endpoints

| Method | URL | Request | Success | Meaning |
| --- | --- | --- | --- | --- |
| GET | `/tasks` | Query: `page`, `per_page`, `state` only | 200 | Current actor's individual, unassigned, owned Tasks, ID descending |
| POST | `/tasks` | JSON: `title`, `instructions`, `due_at` only | 201 | Create individual Task in `open`; creator/department inferred server-side |
| GET | `/tasks/{id}` | No query fields | 200 | Detail for owned accessible Task |
| POST | `/tasks/{id}/start` | Empty JSON object/body | 200 | Owner's `open → in_progress` |
| POST | `/tasks/{id}/complete` | Empty JSON object/body | 200 | Owner's `in_progress → completed` |

`{id}` must be numeric. No PUT/PATCH/DELETE or assign, issue, delegate, cancel, reopen or bulk Task endpoints. Unknown query/body fields return **422** with key `request`.

## Request and response fields

Create: `title` required nonblank string, max **255** characters; `instructions` optional nullable string, max **10,000**; `due_at` optional nullable ISO 8601 with seconds and explicit timezone offset (`YYYY-MM-DDTHH:MM:SS+08:00`). No client-created state, office, source or actor fields.

Each Task is presented in a top-level `data` object, or `data` array in list responses:

| Field | Type / contract |
| --- | --- |
| `id` | integer |
| `kind` | literal `individual` |
| `title` | string |
| `instructions` | string or null |
| `state` | `open`, `in_progress`, `completed` |
| `owning_department_id` | integer or null; creation-time snapshot, **not** an authorization grant |
| `due_at`, `completed_at`, `created_at`, `updated_at` | ISO 8601 timestamp with timezone, or null |

List query: `page` integer **1–10,000**, default 1; `per_page` integer **1–50**, default 20; optional `state` in the three allowed values. List `meta`: `page`, `per_page`, `total`, `last_page`. No total pages fabricated by the frontend. Individual Tasks remain linked to creator even after employee department transfer, within this narrow personal policy.

## Errors and lifecycle

- **401:** unauthenticated or deactivated session (deactivated also has `ACCOUNT_INACTIVE` code).
- **403:** authenticated but inactive/unlinked employee/department, or MFA required (`MFA_REQUIRED` code and `next_url`).
- **404:** unknown/inaccessible/off-kind/assigned Task ID, including transition attempts; never use `403` to reveal ownership.
- **419:** session/CSRF token mismatch, native JSON; reauthenticate/refresh token, **do not blindly replay a mutation**.
- **422:** validation (Laravel `message` + `errors`, including keys `request`, `title`, `instructions`, `due_at`, `state`, `page`, `per_page`); invalid or terminal transitions also 422. No silent coercion to new lifecycle states.
- **429:** rate limit. **500/503:** server errors; `X-Request-ID` for incident correlation where available. Do not expose exceptions to end users.

All writes use W02 TaskCoreService atomic transactions and server-derived actor, state and timestamps. On concurrent `start`, only one can commit; no optimistic client state write contract is offered.

## Source references / compatibility / rollout

No `source_domain` / `source_id` input or response field is released in C1. The passive source-reference concept exists in the underlying Task model, but C1 may **not** mutate or link Work Request/Correspondence, or infer cross-domain rights. Existing W01 legacy Tasks and W02 internal service calls are not retroactively surfaced. This contract makes no database migration or existing frontend deprecation claim.

**Open gates:** independent production-like CSRF/browser smoke, exact-candidate CI and code review, final contract checksum/SHA, Kirch release decision. Until all pass, AJ/Jhayr must treat this document as **candidate only**. Formal A01-CI01, independent QA01 and production activation remain separate.
