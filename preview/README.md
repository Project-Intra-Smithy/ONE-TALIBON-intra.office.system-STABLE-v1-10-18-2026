# Phase A presentation workspace

Pinned donor: `Kirjane/one-talibon-isolated-frontend-rewrite@7afabade1fd651c2950f70006b8213ae8b7c61da`.
Canonical starting candidate: `b23fa465d2e2a49aad3ef02419b041abe2bb9d2c`.

Run `npm run build:preview`, then `npx vite preview --config preview/vite.config.ts`.
The preview serves on loopback port 4174, separately from Laravel. All identities,
records, counts, permissions and role switches here are synthetic evaluation data.
HRIS and messaging designs are held reference interfaces, not enabled operations.

The preview uses an explicit alternate Inertia adapter and output directory.
Unmatched fetches fail with 503; browser CSP denies network connections and native
form submission. Fixture handlers simulate supported actions locally. Personal Task create/start/complete use per-role in-memory sample state, reset on reload, and explicit preview receipts. The preview CSRF sentinel has no server validity. No real
record is saved. No external map tiles are requested. Map overlays are samples,
not official GIS data. Bundled map plates retain donor provenance and require
official validation before any operational use.

The operational Vite build rejects imports from preview or standalone directories.
This staged source snapshot is an intermediate integration workspace. It is not
the completed shared presentation architecture: reconciled components must be
shared as each operational adapter is reviewed. Do not declare W1–W6 complete
from the existence of these files or a successful preview build.

Inventory: `.forge/evidence/ot-tcds-phase-a/donor-disposition.json` and
`page-coverage.json`. Browser coverage is recorded separately from staged source.
