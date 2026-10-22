# Beta Writer 02 — optional Google OAuth/OIDC binding

Owner: https://github.com/Project-Intra-Smithy/engineering-hub/issues/138

## Boundaries
No public user or employee creation, no Gmail/domain-based role/office assignment, no email-only account matching, no Google Drive or Calendar permissions, no OAuth bearer/ID/refresh token persistence or audit. The Google callback and linking routes are **not mounted** on this branch. Password/MFA login and existing logout are unchanged. Google proves external identity only; municipal access requires a live approved User + Employee + active Department.

## Provider/dependency setup (Maintainer action, NOT performed)
- Official `laravel/socialite ^5.31` supports Laravel 13. Source `composer.json` is updated, but `composer.lock` is **NOT** regenerated on this writer branch; it MUST be updated together using Composer in a disposable checkout before merge. Do not deploy with mismatched manifest/lock; do not run composer install or hosted CI here.
- New `config/services.php` supplies Socialite's `google.client_id`, `google.client_secret`, `google.redirect` using `GOOGLE_OIDC_CLIENT_ID`, `GOOGLE_OIDC_CLIENT_SECRET`, `GOOGLE_OIDC_REDIRECT_URI` environment variables. `GOOGLE_OIDC_ENABLED=false` by default in `config/google_oidc.php`. HTTPS redirect required even in beta.
- Separate OAuth client/secrets per environment. Register exact Google Console Authorized Redirect URI, not wildcard. Only `openid email profile` is requested using official Google Socialite provider. No paid Google Workspace identity service needed for OAuth client alone.
- Socialite stateful OAuth code flow checks CSRF state. Do NOT call `stateless()`. Own short-lived, single-use flow marker binds `signin` or `link` and local user id to the browser session. Socialite normally fetches Google UserInfo by access token; this code consumes verified-email and subject from its trusted response, not a locally parsed unsigned ID token. **OIDC nonce/ID-token cryptographic validation is not claimed as an independently implemented feature.** Maintainer security review must decide whether additional nonce/PKCE/ID token processing is required before public mount.

## Exact routes reserved for Maintainer — no writer route changes
1. `GET /auth/google/redirect` -> `GoogleOidcController@redirect` with `web, guest, throttle:10,1`, name `auth.google.redirect`.
2. `GET /auth/google/callback` -> `GoogleOidcController@callback` with `web, throttle:10,1`, name `auth.google.callback`; uses same browser session and Google-registered HTTPS redirect URI. DO NOT attach `guest` because it also handles an assured-account link.
3. `POST /auth/google/link` -> `GoogleOidcController@link` with `web (CSRF), auth, active, mfa.assured, throttle:10,1`, name `auth.google.link`. The service **also** requires recent actual MFA proof (even when a role normally bypasses privileged MFA) and currently valid employment; do not use unverified activation token or administrator-inferred permission.
These must remain unmounted until the invitation source/activation account ownership and Socialite dependency lock are verified and independently reviewed. No `routes/web.php` edit is authorized here.

## Identity binding and lifecycle
Migration `google_identity_bindings`: UNIQUE `google_subject` and UNIQUE `user_id` (one account per subject, one Google binding per User), referencing existing User and linking user, original verified email, link and optional revocation timestamps. No public link endpoint without local authenticated MFA-assured session. Initial binding requires same verified email as existing User **in addition to** live local MFA identity. Revoked bindings are not automatically reclaimed or reassigned; remediation requires a separate approved service. The provider's `sub` is the only login lookup key; email changes cause safe denial.
On successful preauthorized sign-in: `Auth::guard('web')->login($user, false)`, session regeneration, `AuthenticationAssurance::clear`, then redirect to MFA enrollment/challenge if required (otherwise dashboard). Existing logout destroys session and assurance, no Google provider token is stored. Denied/succeeded authentication uses existing AuditLogger with generic summaries and without Google PII/tokens.

## Required synthetic acceptance before mount
- Invalid/missing OAuth state (real Socialite InvalidStateException), callback missing code/error, expired/reused flow marker, unauthorized linking without recent MFA/active employment/department, missing/false verified-email and missing `sub`.
- Identity subject collision and already-linked local User, revoked binding, unlinked subject, Google email mismatch, inactive/deactivated user, separated/disabled employee and revoked department.
- Positive synthetic preauthorized bound-subject login: existing User only, session rotates, MFA proof clears, privileged user is routed to MFA, no automatic admin role, no bearer persistence, existing password login stays usable.
- PostgreSQL two-worker concurrent linking/duplicate key, unique foreign-key constraints, audit denial persistence outside rolled-back transactions, rollback on audit failure. Check no external APIs requested besides Google OAuth+UserInfo.

## Status and caveats
Do not claim fully operable sign-in until real Composer lock regeneration, route integration by Maintainer, completed approved activation/matching source, synthetic Laravel/PostgreSQL suite and independent security acceptance. No live Google credentials used. No deployment, main merge, production secret or hosted CI permitted.
