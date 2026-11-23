#!/usr/bin/env bash
# Non-destructive hostile negative tests for M5-CI-01 + M5-CI-02.
# Executes exclusively inside a disposable temporary clone; never mutates real branches.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
VERIFIER="${REPO_ROOT}/scripts/ci/verify-m5-source-integrity.sh"
TARGET_SHA="$(git rev-parse HEAD)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/m5-r3-ci-negatives-XXXXXX")"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

git clone --quiet --no-hardlinks "$REPO_ROOT" "$TMP_DIR/repo"
cd "$TMP_DIR/repo"
git config user.email "m5-negative-test@disposable.invalid"
git config user.name "M5 Disposable Negative Test"

assert_rejects() {
  local label="$1"
  local ref="$2"
  local out
  if out="$(bash "$VERIFIER" "$ref" 2>&1)"; then
    echo "FAIL [$label]: verifier unexpectedly PASSED on hostile ref $ref" >&2
    echo "$out" >&2
    exit 1
  fi
  echo "PASS [$label]: rejected as expected -> $(echo "$out" | tail -n 1)"
}

# POS-1: Unmodified candidate HEAD must pass
bash "$VERIFIER" "$TARGET_SHA" >/dev/null
echo "PASS [POS-1]: clean candidate $TARGET_SHA accepted"

# NEG-1: Pint-compliant same-path semantic tamper in 11 frozen cleanup PHP files
git checkout --quiet -B neg-1-same-path-cleanup "$TARGET_SHA"
sed -i.bak 's/return \$this->allows(\$user, TransactionAccessDecider::MAYOR_DECISION, \$transaction);/return true;/' app/Policies/TransactionPolicy.php && rm -f app/Policies/TransactionPolicy.php.bak
git commit --quiet -am "hostile: pint-compliant semantic tamper in TransactionPolicy"
assert_rejects "NEG-1 same-path Pint-compliant tamper in 11 frozen cleanup files" HEAD

# NEG-2: Pint-compliant same-path semantic tamper in R3 provenance authorization file
git checkout --quiet -B neg-2-same-path-r3 "$TARGET_SHA"
sed -i.bak "s/'reference_sample'/'never_matches'/" app/Services/Planning/PlanningAuthorizationService.php && rm -f app/Services/Planning/PlanningAuthorizationService.php.bak
git commit --quiet -am "hostile: pint-compliant semantic tamper in PlanningAuthorizationService"
assert_rejects "NEG-2 same-path Pint-compliant tamper in R3 provenance guard" HEAD

# NEG-3: Extra/wrong path added after frozen R3 source-fix commit
git checkout --quiet -B neg-3-extra-path "$TARGET_SHA"
printf '<?php\n' > app/Models/RogueUnreviewedModel.php
git add app/Models/RogueUnreviewedModel.php
git commit --quiet -m "hostile: extra unreviewed PHP path"
assert_rejects "NEG-3 extra/wrong path" HEAD

# NEG-4: Bad ancestry (branched directly from R2 final 6cdba4f4, bypassing R3 source-fix)
git checkout --quiet -B neg-4-bad-ancestry 6cdba4f437326d4761110fcccfd38b7939f26a6f
git commit --quiet --allow-empty -m "hostile: wrong ancestry bypassing R3 source-fix"
assert_rejects "NEG-4 bad ancestry" HEAD

# NEG-5: Jane's M5-CI-02 comment-only YAML spoof (all required strings in comments, trivial validate job)
git checkout --quiet -B neg-5-comment-only-yaml-spoof "$TARGET_SHA"
cat > .github/workflows/ot-m3-unified-full-matrix.yml <<'YAML'
name: Spoofed Comment-Only Workflow
on: [push]
# phase: [g2a-roles, roles, broker, focused, full, browser, c02, c01, iam-cross-session, task-cross-session, p0-cross-session]
# php vendor/bin/pint --test "${changed_php[@]}"
# bash scripts/ci/verify-m5-source-integrity.sh HEAD
# needs: [validate]
# test "$OUTCOME" = success
jobs:
  validate:
    runs-on: ubuntu-24.04
    steps:
      - run: echo "trivial spoof"
YAML
git commit --quiet -am "hostile: Jane comment-only YAML spoof"
assert_rejects "NEG-5 Jane comment-only YAML spoof (M5-CI-02)" HEAD

# NEG-6: Removed verifier invocation from jobs.validate
git checkout --quiet -B neg-6-removed-verifier "$TARGET_SHA"
sed -i.bak 's/bash scripts\/ci\/verify-m5-source-integrity\.sh HEAD/echo bypassed-verifier/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: removed verifier invocation"
assert_rejects "NEG-6 removed verifier invocation" HEAD

# NEG-7: Commented-out verifier invocation inside multiline run block (checker no-op)
git checkout --quiet -B neg-7-commented-verifier "$TARGET_SHA"
sed -i.bak 's/bash scripts\/ci\/verify-m5-source-integrity\.sh HEAD/# bash scripts\/ci\/verify-m5-source-integrity.sh HEAD/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: commented out verifier inside run block"
assert_rejects "NEG-7 commented-out verifier no-op inside run block" HEAD

# NEG-8: Disabled validate job via if: false
git checkout --quiet -B neg-8-disabled-validate "$TARGET_SHA"
sed -i.bak 's/runs-on: ubuntu-24\.04/if: false\n    runs-on: ubuntu-24.04/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: disabled validate job"
assert_rejects "NEG-8 disabled validate job (if: false)" HEAD

# NEG-9: Missing matrix phase in workflow
git checkout --quiet -B neg-9-missing-phase "$TARGET_SHA"
sed -i.bak 's/, p0-cross-session//' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: dropped p0-cross-session matrix phase"
assert_rejects "NEG-9 missing matrix phase" HEAD

# NEG-10: Pint bypass via || true
git checkout --quiet -B neg-10-pint-bypass "$TARGET_SHA"
sed -i.bak 's/php vendor\/bin\/pint --test "\${changed_php\[@\]}"/php vendor\/bin\/pint --test "${changed_php[@]}" || true/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: weakened Pint with || true"
assert_rejects "NEG-10 Pint bypass via || true" HEAD

# NEG-11: Weakened/omitted mandatory aggregate gate
git checkout --quiet -B neg-11-weakened-aggregate "$TARGET_SHA"
sed -i.bak 's/test "\$OUTCOME" = success/true/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: weakened mandatory aggregate gate"
assert_rejects "NEG-11 weakened mandatory aggregate gate" HEAD

echo "M5_R3_CI_NEGATIVE_SUITE=ALL_11_HOSTILE_CASES_REJECTED_AND_POS_1_PASS"
