#!/usr/bin/env bash
# Non-destructive hostile negative tests for M5-CI-01 + M5-CI-02 (R5).
# Covers:
# - POS-1 (clean R5 candidate), POS-2 (frozen R3 workflow blob), POS-3 (frozen R4 workflow blob)
# - Original 11 hostile cases (NEG-1..NEG-11)
# - All 6 Jane R3 bypasses (ADV-A..ADV-F) + 4 R4 variants (ADV-G..ADV-J)
# - All 3 Jane R4 trigger-key collision attacks (ADV-S, ADV-T, ADV-U) + 4 new alias/tag/object variants (ADV-V..ADV-Y)
# Executes exclusively inside a disposable temporary clone; never mutates real branches.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
VERIFIER="${REPO_ROOT}/scripts/ci/verify-m5-source-integrity.sh"
YAML_VERIFIER="${REPO_ROOT}/scripts/ci/verify-m5-workflow-structure.py"
PINNED_R3_WORKFLOW_BLOB="ac4754df6f859a7fe4a076154044124d0e228956"
FROZEN_R4_WORKFLOW_BLOB="abf67b6a21031e0a9b73aef77bea5115b5c59140"
TARGET_SHA="$(git rev-parse HEAD)"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/m5-r5-ci-negatives-XXXXXX")"
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
  local summary
  summary="$(echo "$out" | grep -m1 '::error' || echo "$out" | tail -n 1)"
  echo "PASS [$label]: rejected as expected -> $summary"
}

# POS-1: Unmodified R5 candidate HEAD must pass
bash "$VERIFIER" "$TARGET_SHA" >/dev/null
echo "PASS [POS-1]: clean R5 candidate $TARGET_SHA accepted"

# POS-2: Independent positive control against real unmodified frozen R3 workflow blob
git cat-file blob "$PINNED_R3_WORKFLOW_BLOB" | "$PYTHON_BIN" "$YAML_VERIFIER" --baseline-blob "$PINNED_R3_WORKFLOW_BLOB" >/dev/null
echo "PASS [POS-2]: real unmodified frozen R3 workflow blob $PINNED_R3_WORKFLOW_BLOB accepted"

# POS-3: Independent positive control against real unmodified frozen R4 workflow blob
git cat-file blob "$FROZEN_R4_WORKFLOW_BLOB" | "$PYTHON_BIN" "$YAML_VERIFIER" --baseline-blob "$PINNED_R3_WORKFLOW_BLOB" >/dev/null
echo "PASS [POS-3]: real unmodified frozen R4 workflow blob $FROZEN_R4_WORKFLOW_BLOB accepted"

# NEG-1..NEG-11 (All 11 original hostile cases preserved)
git checkout --quiet -B neg-1-same-path-cleanup "$TARGET_SHA"
sed -i.bak 's/return \$this->allows(\$user, TransactionAccessDecider::MAYOR_DECISION, \$transaction);/return true;/' app/Policies/TransactionPolicy.php && rm -f app/Policies/TransactionPolicy.php.bak
git commit --quiet -am "hostile: pint-compliant semantic tamper in TransactionPolicy"
assert_rejects "NEG-1 same-path Pint-compliant tamper in 11 frozen cleanup files" HEAD

git checkout --quiet -B neg-2-same-path-r3 "$TARGET_SHA"
sed -i.bak "s/'reference_sample'/'never_matches'/" app/Services/Planning/PlanningAuthorizationService.php && rm -f app/Services/Planning/PlanningAuthorizationService.php.bak
git commit --quiet -am "hostile: pint-compliant semantic tamper in PlanningAuthorizationService"
assert_rejects "NEG-2 same-path Pint-compliant tamper in R3 provenance guard" HEAD

git checkout --quiet -B neg-3-extra-path "$TARGET_SHA"
printf '<?php\n' > app/Models/RogueUnreviewedModel.php
git add app/Models/RogueUnreviewedModel.php
git commit --quiet -m "hostile: extra unreviewed PHP path"
assert_rejects "NEG-3 extra/wrong path" HEAD

git checkout --quiet -B neg-4-bad-ancestry 480da17d02bb58c253d5e65cbbd3be5dcc08df0c
git commit --quiet --allow-empty -m "hostile: wrong ancestry bypassing R4"
assert_rejects "NEG-4 bad ancestry" HEAD

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

git checkout --quiet -B neg-6-removed-verifier "$TARGET_SHA"
sed -i.bak 's/bash scripts\/ci\/verify-m5-source-integrity\.sh HEAD/echo bypassed-verifier/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: removed verifier invocation"
assert_rejects "NEG-6 removed verifier invocation" HEAD

git checkout --quiet -B neg-7-commented-verifier "$TARGET_SHA"
sed -i.bak 's/bash scripts\/ci\/verify-m5-source-integrity\.sh HEAD/# bash scripts\/ci\/verify-m5-source-integrity.sh HEAD/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: commented out verifier inside run block"
assert_rejects "NEG-7 commented-out verifier no-op" HEAD

git checkout --quiet -B neg-8-disabled-validate "$TARGET_SHA"
sed -i.bak 's/runs-on: ubuntu-24\.04/if: false\n    runs-on: ubuntu-24.04/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: disabled validate job"
assert_rejects "NEG-8 disabled validate job (if: false)" HEAD

git checkout --quiet -B neg-9-missing-phase "$TARGET_SHA"
sed -i.bak 's/, p0-cross-session//' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: dropped p0-cross-session matrix phase"
assert_rejects "NEG-9 missing matrix phase" HEAD

git checkout --quiet -B neg-10-pint-bypass "$TARGET_SHA"
sed -i.bak 's/php vendor\/bin\/pint --test "\${changed_php\[@\]}"/php vendor\/bin\/pint --test "${changed_php[@]}" || true/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: weakened Pint with || true"
assert_rejects "NEG-10 Pint bypass via || true" HEAD

git checkout --quiet -B neg-11-weakened-aggregate "$TARGET_SHA"
sed -i.bak 's/test "\$OUTCOME" = success/true/' .github/workflows/ot-m3-unified-full-matrix.yml && rm -f .github/workflows/ot-m3-unified-full-matrix.yml.bak
git commit --quiet -am "hostile: weakened mandatory aggregate gate"
assert_rejects "NEG-11 weakened mandatory aggregate gate" HEAD

# ADV-A..ADV-J (All 6 Jane R3 attacks + 4 R4 variants preserved; read-before-write + non-empty mutation check)
patch_workflow() {
  "$PYTHON_BIN" - "$1" "$2" <<'PY'
import sys
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
old, new = sys.argv[1], sys.argv[2]
src = open(p, encoding="utf-8").read()
assert old in src, f"Pattern not found in workflow: {old!r}"
dst = src.replace(old, new, 1)
assert dst != src and len(dst) > 100
open(p, "w", encoding="utf-8").write(dst)
PY
}

git checkout --quiet -B adv-a-const-false-validate "$TARGET_SHA"
patch_workflow $'  validate:\n' $'  validate:\n    if: ${{ 1 == 2 }}\n'
git commit --quiet -am "hostile ADV-A: constant-false expression on validate"
assert_rejects "ADV-A constant-false if: \${{ 1 == 2 }} on jobs.validate" HEAD

git checkout --quiet -B adv-b-const-false-mandatory "$TARGET_SHA"
patch_workflow $'    needs: [validate]\n    if: always()' $'    needs: [validate]\n    if: ${{ 1 == 2 }}'
git commit --quiet -am "hostile ADV-B: constant-false expression on mandatory"
assert_rejects "ADV-B constant-false if: \${{ 1 == 2 }} on jobs.mandatory" HEAD

git checkout --quiet -B adv-c-unreachable-verifier "$TARGET_SHA"
patch_workflow '          bash scripts/ci/verify-m5-source-integrity.sh HEAD' $'          if false; then\n            bash scripts/ci/verify-m5-source-integrity.sh HEAD\n          fi'
git commit --quiet -am "hostile ADV-C: unreachable source verifier in if false"
assert_rejects "ADV-C unreachable verifier in if false; then" HEAD

git checkout --quiet -B adv-d-unreachable-pint "$TARGET_SHA"
patch_workflow '            php vendor/bin/pint --test "${changed_php[@]}"' $'            if false; then\n              php vendor/bin/pint --test "${changed_php[@]}"\n            fi'
git commit --quiet -am "hostile ADV-D: unreachable Pint in if false"
assert_rejects "ADV-D unreachable Pint in if false; then" HEAD

git checkout --quiet -B adv-e-unreachable-aggregate "$TARGET_SHA"
patch_workflow '          test "$OUTCOME" = success' $'          if false; then\n            test "$OUTCOME" = success\n          fi'
git commit --quiet -am "hostile ADV-E: unreachable aggregate in if false"
assert_rejects "ADV-E unreachable aggregate in if false; then" HEAD

git checkout --quiet -B adv-f-impossible-phase-predicate "$TARGET_SHA"
patch_workflow "if: matrix.phase == 'g2a-roles'" "if: matrix.phase == 'g2a-roles' && matrix.phase == 'full'"
git commit --quiet -am "hostile ADV-F: impossible matrix.phase predicate"
assert_rejects "ADV-F impossible matrix.phase predicate" HEAD

git checkout --quiet -B adv-g-equiv-expr "$TARGET_SHA"
patch_workflow $'  validate:\n' $'  validate:\n    if: ${{ \x27a\x27 == \x27b\x27 }}\n'
git commit --quiet -am "hostile ADV-G: equivalent constant-false string expression"
assert_rejects "ADV-G equivalent constant-false expression" HEAD

git checkout --quiet -B adv-h-early-exit "$TARGET_SHA"
patch_workflow '          bash scripts/ci/verify-m5-source-integrity.sh HEAD' $'          exit 0\n          bash scripts/ci/verify-m5-source-integrity.sh HEAD'
git commit --quiet -am "hostile ADV-H: early exit 0 before verifier"
assert_rejects "ADV-H early shell exit 0 before verifier" HEAD

git checkout --quiet -B adv-i-duplicate-yaml-key "$TARGET_SHA"
cat >> .github/workflows/ot-m3-unified-full-matrix.yml <<'YAML'

  validate:
    runs-on: ubuntu-24.04
    steps:
      - run: echo "duplicate key override"
YAML
git commit --quiet -am "hostile ADV-I: duplicate YAML key override"
assert_rejects "ADV-I duplicate YAML key spoofing" HEAD

git checkout --quiet -B adv-j-continue-on-error "$TARGET_SHA"
patch_workflow $'  mandatory:\n' $'  mandatory:\n    continue-on-error: true\n'
git commit --quiet -am "hostile ADV-J: continue-on-error on mandatory"
assert_rejects "ADV-J continue-on-error: true on jobs.mandatory" HEAD

# ADV-S (Jane R4): Append quoted "on": with unapproved/* branch after legitimate unquoted on:
git checkout --quiet -B adv-s-append-quoted-on "$TARGET_SHA"
cat >> .github/workflows/ot-m3-unified-full-matrix.yml <<'YAML'

"on":
  push:
    branches:
      - unapproved/*
  workflow_dispatch:
YAML
git commit --quiet -am "hostile ADV-S: append quoted on after unquoted on"
assert_rejects 'ADV-S append quoted "on": after unquoted on:' HEAD

# ADV-T (Jane R4): Prepend conflicting quoted "on": BEFORE legitimate unquoted on:
git checkout --quiet -B adv-t-prepend-quoted-on "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read()
prefix = "\"on\":\n  push:\n    branches:\n      - unapproved/*\n  workflow_dispatch:\n\n"
open(p, "w").write(s.replace("on:\n", prefix + "on:\n", 1))
'
git commit --quiet -am "hostile ADV-T: prepend quoted on before unquoted on"
assert_rejects 'ADV-T prepend quoted "on": before unquoted on:' HEAD

# ADV-U (Jane R4): Single-quoted 'on': collision with unauthorized push branch
git checkout --quiet -B adv-u-single-quoted-on "$TARGET_SHA"
cat >> .github/workflows/ot-m3-unified-full-matrix.yml <<'YAML'

'on':
  push:
    branches:
      - rogue-branch
  workflow_dispatch:
YAML
git commit --quiet -am "hostile ADV-U: single-quoted on collision"
assert_rejects "ADV-U single-quoted 'on': collision" HEAD

# ADV-V (New variant): Case-variant ON: trigger collision after on:
git checkout --quiet -B adv-v-case-collision "$TARGET_SHA"
cat >> .github/workflows/ot-m3-unified-full-matrix.yml <<'YAML'

ON:
  push:
    branches:
      - unapproved/*
YAML
git commit --quiet -am "hostile ADV-V: uppercase ON trigger collision"
assert_rejects "ADV-V uppercase ON: semantic trigger collision" HEAD

# ADV-W (New variant): Explicit YAML boolean tag !!bool true: root key alongside on:
git checkout --quiet -B adv-w-explicit-bool-tag "$TARGET_SHA"
cat >> .github/workflows/ot-m3-unified-full-matrix.yml <<'YAML'

!!bool true:
  push:
    branches:
      - unapproved/*
YAML
git commit --quiet -am "hostile ADV-W: explicit !!bool true root key"
assert_rejects "ADV-W explicit !!bool true: non-string root key" HEAD

# ADV-X (New variant): YAML 1.1 boolean alias yes: root key alongside on:
git checkout --quiet -B adv-x-yaml11-yes-alias "$TARGET_SHA"
cat >> .github/workflows/ot-m3-unified-full-matrix.yml <<'YAML'

yes:
  push:
    branches:
      - unapproved/*
YAML
git commit --quiet -am "hostile ADV-X: YAML 1.1 yes root key alias"
assert_rejects "ADV-X YAML 1.1 yes: root key alias" HEAD

# ADV-Y (New variant): Unexpected event key under on: (pull_request)
git checkout --quiet -B adv-y-unexpected-event "$TARGET_SHA"
"$PYTHON_BIN" -c '
p = ".github/workflows/ot-m3-unified-full-matrix.yml"
s = open(p).read().replace("  workflow_dispatch:\n", "  workflow_dispatch:\n  pull_request:\n", 1)
open(p, "w").write(s)
'
git commit --quiet -am "hostile ADV-Y: unexpected pull_request event under on"
assert_rejects "ADV-Y unexpected pull_request event under on:" HEAD

echo "M5_R5_CI_NEGATIVE_SUITE=ALL_28_HOSTILE_CASES_REJECTED_AND_POS_1_2_3_PASS"
