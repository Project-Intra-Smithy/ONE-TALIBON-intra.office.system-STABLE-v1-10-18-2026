#!/usr/bin/env bash
# Non-destructive hostile negative tests for M5-CI-01 source-integrity verifier.
# Executes exclusively inside a disposable temporary clone; never mutates real branches.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
VERIFIER="${REPO_ROOT}/scripts/ci/verify-m5-source-integrity.sh"
TARGET_SHA="$(git rev-parse HEAD)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/m5-ci-negatives-XXXXXX")"
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

# NEG-1: Pint-compliant same-path semantic tampering in one of the 11 frozen cleanup PHP files
git checkout --quiet -B neg-1-same-path-cleanup "$TARGET_SHA"
sed -i.bak 's/return \$this->allows(\$user, TransactionAccessDecider::MAYOR_DECISION, \$transaction);/return true;/' app/Policies/TransactionPolicy.php && rm -f app/Policies/TransactionPolicy.php.bak
git commit --quiet -am "hostile: pint-compliant semantic tamper in TransactionPolicy"
assert_rejects "NEG-1 same-path Pint-compliant tamper in 11 frozen cleanup files" HEAD

# NEG-2: Pint-compliant same-path semantic tampering in one of the 6 planning-correction files
git checkout --quiet -B neg-2-same-path-planning "$TARGET_SHA"
sed -i.bak 's/explicitOptIn = false/explicitOptIn = true/' app/Services/Planning/PlanningSuiteInitializer.php && rm -f app/Services/Planning/PlanningSuiteInitializer.php.bak
git commit --quiet -am "hostile: pint-compliant semantic tamper in PlanningSuiteInitializer"
assert_rejects "NEG-2 same-path Pint-compliant tamper in 6 planning-correction files" HEAD

# NEG-3: Extra/wrong path added after frozen source-fix commit
git checkout --quiet -B neg-3-extra-path "$TARGET_SHA"
printf '<?php\n' > app/Models/RogueUnreviewedModel.php
git add app/Models/RogueUnreviewedModel.php
git commit --quiet -m "hostile: extra unreviewed PHP path"
assert_rejects "NEG-3 extra/wrong path" HEAD

# NEG-4: Bad ancestry (branched directly from 0c79eba1, bypassing frozen source-fix commit)
git checkout --quiet -B neg-4-bad-ancestry 0c79eba15a470de0c47522c4353cd4c20d5eecc2
git commit --quiet --allow-empty -m "hostile: wrong ancestry bypassing source-fix"
assert_rejects "NEG-4 bad ancestry" HEAD

# NEG-5: Missing/weakened Pint execution in workflow
git checkout --quiet -B neg-5-missing-pint "$TARGET_SHA"
sed -i.bak 's/php vendor\/bin\/pint --test/echo skipped-pint/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: removed fail-closed Pint gate"
assert_rejects "NEG-5 missing fail-closed Pint gate" HEAD

# NEG-6: Missing matrix phase in workflow
git checkout --quiet -B neg-6-missing-phase "$TARGET_SHA"
sed -i.bak 's/, p0-cross-session//' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: dropped p0-cross-session matrix phase"
assert_rejects "NEG-6 missing matrix phase" HEAD

# NEG-7: Missing mandatory aggregate gate assertion in workflow
git checkout --quiet -B neg-7-missing-aggregate "$TARGET_SHA"
sed -i.bak 's/test "\$OUTCOME" = success/true/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: weakened mandatory aggregate gate"
assert_rejects "NEG-7 weakened mandatory aggregate gate" HEAD

echo "M5_CI_NEGATIVE_SUITE=ALL_7_HOSTILE_CASES_REJECTED_AND_POS_1_PASS"
