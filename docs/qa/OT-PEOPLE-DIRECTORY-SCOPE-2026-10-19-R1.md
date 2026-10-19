# ONE TALIBON — ACTIVE PEOPLE SCOPE DECISION (2026-10-19)

**Technical Authority:** Kirch Ivan Balite. Explicit in-chat correction supersedes R4 Full HRIS route restoration.

## Approved now
- Active personnel directory and limited directory profiles: identity, work email, role/position, office.
- Online/offline presence: authenticated, active, MFA-assured portal heartbeat, refreshed only when visible. Three-minute expiry. Offline if no heartbeat, expired activity, disabled account, or no portal account. Presence is **not** physical attendance.
- Employee-self recorded attendance feed, using existing attendance_logs. No inferred absence, lateness, biometric hardware connection or payroll data.

## Deferred, code/data preserved but runtime routes de-exposed
Full HRIS dashboard, payroll, leave credits/incentives/applications, DTR payroll-linked processes, medical/health vault, development/performance, onboarding, offboarding and lifecycle actions. Their controllers, services, migrations, seeders and former React components remain in history/source; no destructive migrations.

The old /employees/{employee} comprehensive HR record is replaced in active routing by a public-within-auth directory-only projection. Private HR profile controller/page remain in source but are unrouted.

**No alternative direct URL may bypass this policy.** Navigation hiding alone is insufficient.

## Validation and legacy suite truth
R4 DeferredAndSpecialized 80/80 PASS applied to the now-deferred Full HRIS scope before this correction; those HTTP expectations are no longer valid release criteria. Existing historical specialized tests may FAIL by design while they still require deferred routes. Do not fudge acceptance by changing status expectations or removing negative coverage. Separate historical domain tests from active-surface acceptance transparently. Validate current people-scope tests, the full relevant Feature suite, migrations, CSRF/MFA/presence/attendance, current web routes and genuine authenticated Chromium. Explicitly report any legacy-suite conflicts as DEFERRED_CONTRACT, not PASS.

**No main merge, UAT replacement, production deployment, Messaging activation or hosted CI is authorized by this correction.**
