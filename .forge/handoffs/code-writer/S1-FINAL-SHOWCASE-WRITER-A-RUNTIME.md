# KIRION FORGE: CODE WRITER — S1 FINAL SHOWCASE WRITER A
## RUNTIME / DEPLOYMENT HARDENING

ROLE: KIRION FORGE: CODE WRITER

LANE: A — RUNTIME / DEPLOYMENT

Human Technical Authority: Kirch Ivan Balite

## SOURCE

Start only from the exact SHA supplied by the sprint Maintainer after Gate G0.

Required base branch family:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-INTEGRATED`

Do not guess the SHA. Re-resolve it before branch creation and return it verbatim.

Create one lane branch only:

`KIRCH-TALIBON-S1-FINAL-SHOWCASE-RUNTIME-FINAL`

No merge to `main`. No promotion. No deployment. No rebase/reset/force-push.

## INHERITED RUNTIME IMPLEMENTATION

The sprint base inherits the bounded runtime implementation originally created at:

`3c12eadbda652ea7ab50047a68509fb1fb348a22`

It consists of:

- `scripts/showcase-common.ps1`
- `scripts/showcase-prepare.ps1`
- `scripts/showcase-start.ps1`
- `scripts/showcase-stop.ps1`
- `scripts/showcase-status.ps1`
- `scripts/showcase-proxy.mjs`
- `scripts/showcase-load.mjs`

Default runtime:

- proxy/public: `0.0.0.0:18000`
- workers: 4
- worker ports: `127.0.0.1:18101..18104`
- database: `talibon_showcase_s1`
- `APP_ENV=showcase`
- `APP_DEBUG=false`
- `SHOWCASE_MODE=true`
- file sessions/cache
- sync queue

## GOAL

Turn the existing runtime lane into a proven, deterministic Windows showcase runner for approximately 30 light concurrent stakeholder sessions.

This is not a business-logic/backend-refactor lane.

## REQUIRED AUDIT FIRST

Before mutation, inspect all seven runtime files and specifically verify:

1. configuration caching and `APP_URL` / public-origin behavior;
2. forwarded-host/protocol behavior under direct LAN HTTP and Cloudflare HTTPS;
3. worker health and rollback behavior;
4. proxy worker selection/failure/recovery behavior;
5. runtime state-file ownership;
6. stop behavior when a recorded PID is live but no longer matches expected process identity;
7. stale state after abnormal termination;
8. port collision behavior;
9. log paths and useful error reporting;
10. 30-client load behavior and whether the load is genuinely authenticated.

Return a short audit note in the commit or writer result before claiming PASS.

## REQUIRED REPAIRS

### A. Public origin / cached config

Ensure preparation/startup cannot silently cache a stale localhost or unrelated `.env` public origin that breaks generated URLs/redirects when stakeholders use:

- `http://<LAN-IP>:18000`
- later Cloudflare HTTPS origin

Do not couple runtime to a single current Wi-Fi address.

Preferred pattern: explicit optional public-origin parameter/environment consumed before `php artisan optimize`, with safe default behavior and clear status output.

### B. Forwarded protocol

Current proxy behavior must not blindly force `X-Forwarded-Proto: http` when the incoming request arrived through a trusted HTTPS reverse proxy.

Preserve/sanitize the incoming forwarded protocol appropriately for the showcase path while keeping direct LAN HTTP correct.

Do not create an open proxy or accept arbitrary upstream targets.

### C. Stop-state safety

If a recorded PID is still alive but identity no longer matches the expected proxy/worker command, do not terminate it and do not discard the only state record as if shutdown completed successfully.

Report degraded/manual-attention state safely.

### D. Authenticated load support

The existing load tool's anonymous redirects are transport evidence only.

Add a bounded way to exercise authenticated sessions without hard-coding secrets into the repository.

Acceptable approaches include:

- cookie/session inputs supplied at runtime;
- a runtime-only session list file excluded from Git;
- another safe mechanism that uses existing showcase entry/session gateway without bypassing authorization.

Do not add a backdoor or auth bypass.

Final integration rehearsal will use the curated office accounts created by Writer B.

## OWNED FILES

Primary ownership:

- `scripts/showcase-common.ps1`
- `scripts/showcase-prepare.ps1`
- `scripts/showcase-start.ps1`
- `scripts/showcase-stop.ps1`
- `scripts/showcase-status.ps1`
- `scripts/showcase-proxy.mjs`
- `scripts/showcase-load.mjs`

You may add one small runtime helper/script or focused runtime test if required.

## FROZEN

DO NOT TOUCH:

- transaction/work-request PHP/React;
- Memoranda PHP/React;
- `config/showcase.php`;
- `WorkforceDemoSeeder.php`;
- `WorkspaceDialog.tsx`;
- public homepage;
- theme/appearance product code;
- FUT workspaces;
- Municipal Systems hub;
- navigation/tour behavior;
- `main`.

## VALIDATION — SOURCE

At minimum:

- `node --check scripts/showcase-proxy.mjs`
- `node --check scripts/showcase-load.mjs`
- PowerShell parse/execution sanity on Windows
- `npm run types:check` only if your changes unexpectedly touch TS (they should not)

## VALIDATION — WINDOWS SHOWCASE HOST

Against the exact candidate SHA:

1. ensure DB is `talibon_showcase_s1`;
2. run `scripts/showcase-prepare.ps1`;
3. run `scripts/showcase-start.ps1 -Workers 4 -Port 18000`;
4. run `scripts/showcase-status.ps1`;
5. verify `/up` on all workers;
6. verify `/up` through proxy;
7. verify LAN URL from another device;
8. run 30-client load;
9. run authenticated load using provided runtime credentials/sessions;
10. run `showcase-stop.ps1`;
11. verify only recorded processes stopped;
12. start again without build/migration/seed;
13. status HEALTHY again.

If 4 workers are healthy but measured p95 is poor, test 6 workers before proposing architecture changes.

## ACCEPTANCE

Hard failures:

- unexpected 5xx;
- timeouts/network errors during bounded rehearsal;
- proxy or worker crash;
- cross-session identity corruption;
- restart requiring build/migration/seed;
- unsafe process killing;
- LAN/public-origin redirect breakage.

Preferred p95 < 1.5 seconds.
Bounded ceiling < 3 seconds.

## RETURN

Return exactly:

BRANCH
STARTING SHA
FINAL SHA
COMMITS
EXACT CHANGED FILES

AUDIT FINDINGS
PUBLIC ORIGIN RESULT
FORWARDED PROTOCOL RESULT
STOP/STATE RESULT
WORKER COUNT
WORKER PORTS
WORKER HEALTH
PROXY HEALTH
LAN RESULT
AUTH LOAD METHOD

LOAD RESULT:
requests
successes
4xx
5xx
timeouts
network errors
p50
p95
max

STOP TEST
RESTART TEST
KNOWN LIMITATIONS

NO MAIN MUTATION
NO MERGE
NO PROMOTION
NO DEPLOYMENT

STOP.