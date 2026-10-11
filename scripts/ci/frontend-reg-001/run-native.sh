#!/usr/bin/env bash
# RT-CI-001 disposable Laravel lifecycle. Caller must have passed DB preflight.
set -Eeuo pipefail
: "${RTCI_BACKEND_DIR:?}"
: "${RTCI_WORKSPACE_DIR:?}"
: "${RTCI_REPORT_DIR:?}"
: "${QA_DEMO_PASSWORD:?}"
: "${PROTOTYPE_DEMO_PASSWORD:?}"
if [[ "${RUNNER_ENVIRONMENT:-}" != 'github-hosted' || "${APP_ENV:-}" != 'local' || "${DB_DATABASE:-}" != 'talibon_portal_test' ]]; then
  echo 'RT-CI HOLD: unsafe execution environment' >&2
  exit 1
fi
cd "$RTCI_BACKEND_DIR"
server_pid=''
server_pgid=''
server_log="${RUNNER_TEMP:?}/rtci-laravel-server-${GITHUB_RUN_ID:?}.log"
cleanup() {
  local rc=$?
  trap - EXIT INT TERM
  if [[ -n "$server_pgid" ]]; then
    # A dedicated Linux session/process group was created by setsid below.
    # Signal ONLY this owned group; Laravel may spawn a php -S child.
    kill -TERM -- "-$server_pgid" 2>/dev/null || true
    sleep 1
    kill -KILL -- "-$server_pgid" 2>/dev/null || true
  fi
  if [[ -n "$server_pid" ]]; then wait "$server_pid" 2>/dev/null || true; fi
  rm -f -- "$server_log" "$RTCI_BACKEND_DIR/.env" "$RTCI_BACKEND_DIR/public/hot" "$RTCI_BACKEND_DIR/storage/framework/vite.hot"
  exit "$rc"
}
trap cleanup EXIT INT TERM
echo 'RT-CI preparing disposable Laravel checkout; no secrets or database dump will be emitted'
cp .env.example .env
# Fresh checkout has no vendor/autoload.php: Composer must precede all Artisan commands.
composer install --no-interaction --prefer-dist --no-progress --no-audit
php artisan key:generate --force --no-interaction
php artisan optimize:clear
npm ci --no-audit --no-fund
npm run types:check
npm run build
# This database has already passed the exclusive-hosted-container and empty-schema check.
php artisan migrate:fresh --seed --force
php artisan route:list --json > "${RUNNER_TEMP}/rtci-route-list.json"
php artisan test tests/Feature/PrivilegedMfaAuthenticationTest.php tests/Feature/MfaSecurityControlsTest.php tests/Feature/Tasks/IndividualTaskHttpTest.php tests/Feature/Tasks/TaskJsonContractBoundaryTest.php
# RefreshDatabase tests can erase/mutate fixtures; restore on the SAME owned service.
php artisan migrate:fresh --seed --force
npx playwright install --with-deps chromium
rm -f -- public/hot storage/framework/vite.hot
# Dedicated session/process group permits fail-safe descendant cleanup on EXIT/INT/TERM.
setsid php artisan serve --host=127.0.0.1 --port=8000 >"$server_log" 2>&1 &
server_pid=$!
sleep 0.1
server_pgid="$(ps -o pgid= -p "$server_pid" | tr -d '[:space:]')"
if [[ -z "$server_pgid" || "$server_pgid" != "$server_pid" ]]; then
  echo 'RT-CI HOLD: Laravel did not start in a unique owned process group' >&2
  exit 1
fi
healthy=0
for _ in $(seq 1 30); do
  if curl --fail --silent --output /dev/null --max-time 2 http://127.0.0.1:8000/up; then healthy=1; break; fi
  if ! kill -0 "$server_pid" 2>/dev/null; then break; fi
  sleep 1
done
if [[ "$healthy" -ne 1 ]]; then
  echo 'RT-CI HOLD: Laravel localhost readiness failed (private server log withheld)' >&2
  exit 1
fi
node "$RTCI_WORKSPACE_DIR/tests/runtime-acceptance/browser.mjs"
echo 'RT-CI browser suite exited after genuine Laravel/Chromium assertions'
