#!/usr/bin/env bash
# Non-destructive hostile negative tests for M5-CI-01 + M5-CI-02 (R4).
# Covers:
# - POS-1 (clean R4 candidate) & POS-2 (real unmodified frozen R3 workflow blob)
# - Original 11 hostile cases (NEG-1..NEG-11)
# - All 6 Jane R3 bypasses (ADV-A..ADV-F)
# - 4 additional adversarial variants (ADV-G..ADV-J)
# Executes exclusively inside a disposable temporary clone; never mutates real branches.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
VERIFIER="${REPO_ROOT}/scripts/ci/verify-m5-source-integrity.sh"
YAML_VERIFIER="${REPO_ROOT}/scripts/ci/verify-m5-workflow-structure.py"
PINNED_R3_WORKFLOW_BLOB="ac4754df6f859a7fe4a076154044124d0e228956"
TARGET_SHA="$(git rev-parse HEAD)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/m5-r4-ci-negatives-XXXXXX")"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

PYTHON_BIN=""
for cand in python3 python; do
  if command -v "$cand" >/dev/null 2>&1 && "$cand" -c "import yaml" >/dev/null 2>&1; then
    PYTHON_BIN="$cand"
    break
  fi
done
test -n "$PYTHON_BIN"

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

# POS-1: Unmodified R4 candidate HEAD must pass
bash "$VERIFIER" "$TARGET_SHA" >/dev/null
echo "PASS [POS-1]: clean R4 candidate $TARGET_SHA accepted"

# POS-2: Independent positive control against real unmodified frozen R3 workflow blob
git cat-file blob "$PINNED_R3_WORKFLOW_BLOB" | "$PYTHON_BIN" "$YAML_VERIFIER" --baseline-blob "$PINNED_R3_WORKFLOW_BLOB" >/dev/null
echo "PASS [POS-2]: real unmodified frozen R3 workflow blob $PINNED_R3_WORKFLOW_BLOB accepted"

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

# NEG-4: Bad ancestry (branched directly from R2 final 6cdba4f4, bypassing R3)
git checkout --quiet -B neg-4-bad-ancestry 6cdba4f437326d4761110fcccfd38b7939f26a6f
git commit --quiet --allow-empty -m "hostile: wrong ancestry bypassing R3"
assert_rejects "NEG-4 bad ancestry" HEAD

# NEG-5: Jane's original comment-only YAML spoof
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
assert_rejects "NEG-5 Jane comment-only YAML spoof" HEAD

# NEG-6: Removed verifier invocation from jobs.validate
git checkout --quiet -B neg-6-removed-verifier "$TARGET_SHA"
sed -i.bak 's/bash scripts\/ci\/verify-m5-source-integrity\.sh HEAD/echo bypassed-verifier/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: removed verifier invocation"
assert_rejects "NEG-6 removed verifier invocation" HEAD

# NEG-7: Commented-out verifier invocation inside multiline run block (checker no-op)
git checkout --quiet -B neg-7-commented-verifier "$TARGET_SHA"
sed -i.bak 's/bash scripts\/ci\/verify-m5-source-integrity\.sh HEAD/# bash scripts\/ci\/verify-m5-source-integrity.sh HEAD/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: commented out verifier inside run block"
assert_rejects "NEG-7 commented-out verifier no-op" HEAD

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

# NEG-11: Weakened mandatory aggregate gate
git checkout --quiet -B neg-11-weakened-aggregate "$TARGET_SHA"
sed -i.bak 's/test "\$OUTCOME" = success/true/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: weakened mandatory aggregate gate"
assert_rejects "NEG-11 weakened mandatory aggregate gate" HEAD

# ADV-A (Jane R3): Constant-false GitHub expression if: ${{ 1 == 2 }} on jobs.validate
git checkout --quiet -B adv-a-const-false-validate "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read().replace("  validate:\n", "  validate:\n    if: ${{ 1 == 2 }}\n", 1)
open(p, "w").write(s)
'
git commit --quiet -am "hostile ADV-A: constant-false expression on validate"
assert_rejects "ADV-A constant-false if: \${{ 1 == 2 }} on jobs.validate" HEAD

# ADV-B (Jane R3): Constant-false GitHub expression if: ${{ 1 == 2 }} on jobs.mandatory
git checkout --quiet -B adv-b-const-false-mandatory "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read().replace("  mandatory:\n    name: Traceability Core aggregate gate\n    runs-on: ubuntu-24.04\n    needs: [validate]\n    if: always()", "  mandatory:\n    name: Traceability Core aggregate gate\n    runs-on: ubuntu-24.04\n    needs: [validate]\n    if: ${{ 1 == 2 }}", 1)
open(p, "w").write(s)
'
git commit --quiet -am "hostile ADV-B: constant-false expression on mandatory"
assert_rejects "ADV-B constant-false if: \${{ 1 == 2 }} on jobs.mandatory" HEAD

# ADV-C (Jane R3): Unreachable source verifier inside if false; then ... fi
git checkout --quiet -B adv-c-unreachable-verifier "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read().replace("          bash scripts/ci/verify-m5-source-integrity.sh HEAD", "          if false; then\n            bash scripts/ci/verify-m5-source-integrity.sh HEAD\n          fi", 1)
open(p, "w").write(s)
'
git commit --quiet -am "hostile ADV-C: unreachable source verifier in if false"
assert_rejects "ADV-C unreachable verifier in if false; then" HEAD

# ADV-D (Jane R3): Unreachable Pint inside if false; then ... fi
git checkout --quiet -B adv-d-unreachable-pint "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read().replace("            php vendor/bin/pint --test \"${changed_php[@]}\"", "            if false; then\n              php vendor/bin/pint --test \"${changed_php[@]}\"\n            fi", 1)
open(p, "w").write(s)
'
git commit --quiet -am "hostile ADV-D: unreachable Pint in if false"
assert_rejects "ADV-D unreachable Pint in if false; then" HEAD

# ADV-E (Jane R3): Unreachable aggregate gate inside if false; then ... fi
git checkout --quiet -B adv-e-unreachable-aggregate "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read().replace("          test \"$OUTCOME\" = success", "          if false; then\n            test \"$OUTCOME\" = success\n          fi", 1)
open(p, "w").write(s)
'
git commit --quiet -am "hostile ADV-E: unreachable aggregate in if false"
assert_rejects "ADV-E unreachable aggregate in if false; then" HEAD

# ADV-F (Jane R3): Impossible matrix.phase predicate disabling protected test step
git checkout --quiet -B adv-f-impossible-phase-predicate "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read().replace("if: matrix.phase == '\''g2a-roles'\''", "if: matrix.phase == '\''g2a-roles'\'' && matrix.phase == '\''full'\''", 1)
open(p, "w").write(s)
'
git commit --quiet -am "hostile ADV-F: impossible matrix.phase predicate"
assert_rejects "ADV-F impossible matrix.phase predicate" HEAD

# ADV-G (New variant): Equivalent constant-false string expression ${{ 'a' == 'b' }}
git checkout --quiet -B adv-g-equiv-expr "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read().replace("  validate:\n", "  validate:\n    if: ${{ '\''a'\'' == '\''b'\'' }}\n", 1)
open(p, "w").write(s)
'
git commit --quiet -am "hostile ADV-G: equivalent constant-false string expression"
assert_rejects "ADV-G equivalent constant-false expression" HEAD

# ADV-H (New variant): Early shell exit 0 placed before verifier command
git checkout --quiet -B adv-h-early-exit "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read().replace("          bash scripts/ci/verify-m5-source-integrity.sh HEAD", "          exit 0\n          bash scripts/ci/verify-m5-source-integrity.sh HEAD", 1)
open(p, "w").write(s)
'
git commit --quiet -am "hostile ADV-H: early exit 0 before verifier"
assert_rejects "ADV-H early shell exit 0 before verifier" HEAD

# ADV-I (New variant): Duplicate YAML key spoofing jobs.validate
git checkout --quiet -B adv-i-duplicate-yaml-key "$TARGET_SHA"
cat >> .github/workflows/ot-m3-unified-full-matrix.yml <<'YAML'

  validate:
    runs-on: ubuntu-24.04
    steps:
      - run: echo "duplicate key override"
YAML
git commit --quiet -am "hostile ADV-I: duplicate YAML key override"
assert_rejects "ADV-I duplicate YAML key spoofing" HEAD

# ADV-J (New variant): continue-on-error: true added to jobs.mandatory
git checkout --quiet -B adv-j-continue-on-error "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read().replace("  mandatory:\n", "  mandatory:\n    continue-on-error: true\n", 1)
open(p, "w").write(s)
'
git commit --quiet -am "hostile ADV-J: continue-on-error on mandatory"
assert_rejects "ADV-J continue-on-error: true on jobs.mandatory" HEAD

echo "M5_R4_CI_NEGATIVE_SUITE=ALL_21_HOSTILE_CASES_REJECTED_AND_POS_1_2_PASS"
