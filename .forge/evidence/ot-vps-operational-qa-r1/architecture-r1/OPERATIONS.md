# Single-node operations runbook

Run through the existing authenticated key-based SSH path. Do not replace authorized keys or enable password login to recover a deployment. Keep one working SSH session while validating another. Before SSH changes run `sshd -t`, inspect effective policy, reload only after success, then test a new key session. Hostinger console access/recovery custody should be verified before a future kernel reboot; this task did not establish that separate access.

## Normal checks

```sh
docker compose -p devtestportal -f /opt/devtestportal/infra/compose.yaml ps
systemctl status one-talibon-health.timer one-talibon-health.service
journalctl -u one-talibon-health.service --since '-30 minutes' --no-pager
cat /var/lib/one-talibon/health.json
ufw status verbose
ss -lntup
chronyc tracking
df -h / /var/lib/docker
docker system df
```

Do not print `docker inspect .Config.Env`, private env files, APP_KEY, password/MFA material, raw installer inputs, SQL verifiers or authenticated browser storage to logs/GitHub. The monitor reads Docker state without exporting env and suppresses raw database diagnostics. Caddy access logging is not enabled to capture credential-bearing query strings. Application business audit tables are not log-rotation targets. Monitoring is lightweight local reporting, not a promise that a human receives a page; approve/test an external on-call destination before production.

Thresholds: root filesystem>85% used or<20GiB free, MemAvailable<2GiB, service stopped/unhealthy, unexpected public app/DB port, failed TLS/login/runtime-DB-TLS, DB certificate renewal due within30days. Local critical journal entries plus service failure state are the current alert route. Inspect immediately; pause synthetic bulk operations before pressure affects private storage. Never run blanket Docker volume/system pruning. Inventory exact unused build artifacts and get a bounded cleanup decision where protected custody is uncertain. Preserve DB/document/broker/retained volumes and existing audit records.

## Maintenance and incidents

Acquire `/run/lock/one-talibon-operations.lock` with nonblocking flock for the whole mutation window. Coordinate automatic updates, allowlist changes, deployment and operator actions so there is one executor. Private QA ingress is not a substitute for a maintenance response during a DB/runtime change. Validate Caddy using its actual stable mounted file, reload, and check allow/deny/TLS behavior. A release symlink does not retarget an existing Docker file bind mount; the stable infrastructure path avoids the historical stale mount.

For a planned brief service change: stop the health timer for the named window, serve private maintenance503, validate Compose without dumping resolved secrets, apply only the intended service with `up -d --no-deps`, verify actual health, restore normal routing, then restart/check the timer. Retain the failed health/restart evidence in the journal. Do not hide failures by marking a check PASS. Docker API stop/kill can suppress restart policy; test genuine process failure separately. Do not repeatedly kill the database to demonstrate availability.

For a failed release before installer commit: keep maintenance, capture redacted phase/code and use the installer's transaction rollback; verify the old54 ledger/security/preservation state before old compatible traffic resumes. After committed migration, never switch back to an incompatible old app/schema. Remain in maintenance and use a supported forward repair or separately accepted recovery procedure. No backup-based rollback is available for this QA mission.

If TLS/DB settings fail during configuration-only cutover, reuse the same pinned image and same existing PGDATA with the prior supported service configuration; do not initialize or replace the volume. Do not restore trust/plaintext as a permanent workaround. The tested change preserved all actual data and restrictive defaults; future changes require their own pre/post checks.

Patch policy: retain daily unattended security updates; inventory advisory relevance and image digests before changes. Rebuild immutable images from approved bases/locks rather than apt-upgrading a running service. Schedule the currently pending host reboot with owner/out-of-band access and health/restart checks. No arbitrary distribution/major PG update. Pin a qualified16.15/16.16 server/catalog profile; do not update binaries over an incompatible catalog and call it qualified.

Certificate rotation: private CA key is root-only under the operator directory and never in an app/proxy image or env. Server key is uid999/0600; CA trust is root-owned/read-only. Issue a bounded-validity server certificate covering `db`, required private aliases and local test endpoint. Validate chain/expiry/hostname, update the read-only mount, reload/restart the intended service through maintenance, and prove verify-full plus wrong-password/plaintext denial. Preserve secrets; no automatic CA/APP_KEY replacement. Monitor renewal at30days.
