# Final system integration record

Mission: `OT-FINAL-SYSTEM-BUILD-MAIN-UAT-R1`

## Frozen inputs

- Secure Laravel/Inertia application base: `2d39f7ba0f764769130a4e0066a0d0e5163b4eb0`
- Complete frontend candidate: `eb0875822afe697a03c4d6781692133483710f51`
- Destination initial main: `3fb1091443f0b0d67409c6bde2f8c88ac57a3ec0`

Both imported candidates and the destination initial commit are retained as parents in the integration history. No source repository branch was modified.

## Reconciliation decisions

The prior exact parity inventory reported 36 shared paths with different bytes and 49 frontend-only paths. They were reconciled by contract rather than copied wholesale:

- **Dashboard and shell:** retain the backend-composed Dashboard, server-provided capabilities, workspace launcher, notification polling, municipal branding, sidebar authority filtering, responsive CSS corrections and accepted Task mutation panel. Port the frontend candidate's compact mobile context label without removing the launcher.
- **Tasks and Work Requests:** retain one backend-bound personal Task mutation implementation and its owner/authorization semantics. Do not introduce the frontend-only parallel mutation controls.
- **Authentication and MFA:** retain the newer PR99 Login/MFA composition and its Laravel session, CSRF, error-association and redirect contracts.
- **Documents, Correspondence, Calendar, Transactions and Common Core:** retain the backend-composed consumers and canonical route/payload contracts. Frontend-only preview, fixture and synthetic-response modules are not production runtime dependencies.
- **Messaging:** retain the server middleware restriction and backend navigation-readiness list. The frontend candidate's broader `/messages` readiness entry is intentionally rejected.
- **Styles and accessibility:** retain the backend's PR92 mobile-width corrections, 44-pixel controls, focus behavior, appearance controls and municipal brand implementation. Adopt only the compact mobile header text that does not alter authorization or payloads.

## Required release gates

Mainline promotion and UAT replacement require locked dependency installation, TypeScript, production build, PHP/Laravel, PostgreSQL-backed security and workflow tests, and genuine authenticated Chromium acceptance on the exact resulting commit. A failure in a release-critical gate blocks promotion and deployment.
