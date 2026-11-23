#!/usr/bin/env bash
# Fail-closed M5 source-integrity & workflow-structure verifier.
# Usage: bash scripts/ci/verify-m5-source-integrity.sh [TARGET_REF]
# Note: An independent reviewer should inspect and run this script from a
# reviewer-controlled copy against any candidate SHA; a candidate-editable
# workflow alone is never a self-certifying trust anchor.
set -euo pipefail

TARGET_REF="${1:-HEAD}"
TARGET_SHA="$(git rev-parse "${TARGET_REF}^{commit}")"

PR62_SHA="93ab5b64c4bf1621a918278e6d83c250a16bc86e"
M4_SHA="796afd3f26a5f196f02cdc2e0cf6760d880463ea"
M3_VALIDATED_SHA="070029e7d1165ce809a7a3d148d4ed511d59a5bd"
FROZEN_CLEANUP_SHA="0c79eba15a470de0c47522c4353cd4c20d5eecc2"
FROZEN_SOURCE_FIX_SHA="28c532fec420ea802941b1f209750dcc3c43271d"
FROZEN_SOURCE_FIX_TREE="6a02de72307c59e2768d0adf68c59b3a958b7c87"

fail() {
  echo "::error title=M5 Source Integrity Violation::$1" >&2
  exit 1
}

# 1. Exact immutable ancestry chain
test "$(git merge-base "$PR62_SHA" "$M4_SHA")" = "$PR62_SHA" || fail "Broken PR62 -> M4 ancestry"
test "$(git merge-base "$M4_SHA" "$M3_VALIDATED_SHA")" = "$M4_SHA" || fail "Broken M4 -> M3 ancestry"
test "$(git merge-base "$M3_VALIDATED_SHA" "$FROZEN_CLEANUP_SHA")" = "$M3_VALIDATED_SHA" || fail "Broken M3 -> 0c79 cleanup ancestry"
test "$(git merge-base "$FROZEN_CLEANUP_SHA" "$FROZEN_SOURCE_FIX_SHA")" = "$FROZEN_CLEANUP_SHA" || fail "Broken 0c79 -> source-fix ancestry"
test "$(git merge-base "$FROZEN_SOURCE_FIX_SHA" "$TARGET_SHA")" = "$FROZEN_SOURCE_FIX_SHA" || fail "TARGET_REF $TARGET_SHA is not a descendant of frozen source-fix commit $FROZEN_SOURCE_FIX_SHA"

# 2. Exact tree SHA of the frozen source-fix commit
ACTUAL_SOURCE_TREE="$(git rev-parse "${FROZEN_SOURCE_FIX_SHA}^{tree}")"
test "$ACTUAL_SOURCE_TREE" = "$FROZEN_SOURCE_FIX_TREE" || fail "Source-fix tree mismatch: got $ACTUAL_SOURCE_TREE expected $FROZEN_SOURCE_FIX_TREE"

# 3. Exact blob equality on all 11 unaffected 0c79 Pint-cleanup PHP files
UNAFFECTED_11=(
  "app/Domain/Authorization/AuthorizationContext.php"
  "app/Domain/Workflow/Authorization/TransactionAuthorizationContextFactory.php"
  "app/Domain/Workflow/Listeners/NotifyWorkflowTransactionMutation.php"
  "app/Http/Controllers/Planning/PlanningAttachmentController.php"
  "app/Http/Controllers/TransactionController.php"
  "app/Policies/TransactionPolicy.php"
  "app/Services/Custody/WorkRequestCloseDocumentPdf.php"
  "app/Services/TransactionEvidenceService.php"
  "app/Services/TransactionLiveQuery.php"
  "tests/Feature/OPS009C01N03SimultaneousCloseTest.php"
  "tests/Feature/OPS009C02CustodyCloseTest.php"
)
for path in "${UNAFFECTED_11[@]}"; do
  expected_blob="$(git rev-parse "${FROZEN_CLEANUP_SHA}:${path}")"
  actual_blob="$(git rev-parse "${TARGET_SHA}:${path}")"
  test "$actual_blob" = "$expected_blob" || fail "Unaffected cleanup file modified: $path (got $actual_blob expected $expected_blob)"
done

# 4. Exact 6-file delta in frozen source-fix commit + pinned blob equality at TARGET_SHA
declare -A PINNED_PLANNING_BLOBS=(
  ["app/Http/Controllers/Planning/DevelopmentPlanController.php"]="51db88b61d503863dc148b996bf850fbc8041d65"
  ["app/Http/Controllers/Planning/PlanningMapController.php"]="c3f721c7ca316d22ef84adcda07a3b7136dda60e"
  ["app/Http/Controllers/Planning/PpaController.php"]="2437781b15c7a77b4179f143db836c9b4ea4462c"
  ["app/Services/Planning/PlanningSuiteInitializer.php"]="26fbfcc615e14093695266acdd938980241a7a4e"
  ["database/seeders/PlanningReferenceSampleSeeder.php"]="4c840d4c0ba636729bf99030f70f0255dbaf30d2"
  ["tests/Feature/Planning/LocalDevelopmentPlanningSuiteTest.php"]="2237cf930d568ca273f9b6db8e3d4b37a6a2bf4f"
)
mapfile -t source_fix_paths < <(git diff --name-only "$FROZEN_CLEANUP_SHA".."$FROZEN_SOURCE_FIX_SHA")
test "${#source_fix_paths[@]}" -eq 6 || fail "Expected exactly 6 paths in source-fix commit, got ${#source_fix_paths[@]}"
for path in "${source_fix_paths[@]}"; do
  [[ -n "${PINNED_PLANNING_BLOBS[$path]+x}" ]] || fail "Unexpected path in source-fix commit: $path"
  actual_blob="$(git rev-parse "${TARGET_SHA}:${path}")"
  test "$actual_blob" = "${PINNED_PLANNING_BLOBS[$path]}" || fail "Pinned planning-correction blob mismatch for $path (got $actual_blob expected ${PINNED_PLANNING_BLOBS[$path]})"
done

# 5. Zero non-CI source modifications after frozen source-fix commit
mapfile -t post_source_paths < <(git diff --name-only "$FROZEN_SOURCE_FIX_SHA".."$TARGET_SHA")
for path in "${post_source_paths[@]}"; do
  case "$path" in
    .github/workflows/ot-m3-unified-full-matrix.yml) ;;
    scripts/ci/verify-m5-source-integrity.sh) ;;
    scripts/ci/test-m5-source-integrity-negatives.sh) ;;
    *) fail "Unauthorized post-source-fix modification (same-path or extra-path tampering rejected): $path" ;;
  esac
done

# 6. Verify workflow structural invariants at TARGET_SHA (fail-closed Pint + all 11 phases + aggregate gate)
WORKFLOW_CONTENT="$(git show "${TARGET_SHA}:.github/workflows/ot-m3-unified-full-matrix.yml")"
grep -Fq 'php vendor/bin/pint --test "${changed_php[@]}"' <<< "$WORKFLOW_CONTENT" || fail "Workflow missing fail-closed Pint check"
if grep -Fq 'if ! php vendor/bin/pint' <<< "$WORKFLOW_CONTENT"; then
  fail "Workflow contains non-fail-closed Pint warning bypass"
fi
for phase in g2a-roles roles broker focused full browser c02 c01 iam-cross-session task-cross-session p0-cross-session; do
  grep -Eq "phase:.*${phase}" <<< "$WORKFLOW_CONTENT" || fail "Workflow missing required matrix phase: $phase"
done
grep -Fq 'needs: [validate]' <<< "$WORKFLOW_CONTENT" || fail "Workflow missing mandatory aggregate gate dependency"
grep -Fq 'test "$OUTCOME" = success' <<< "$WORKFLOW_CONTENT" || fail "Workflow missing mandatory aggregate gate success assertion"

echo "FROZEN_PR62_ANCESTOR=$PR62_SHA"
echo "FROZEN_M4_SOURCE=$M4_SHA"
echo "FROZEN_M3_VALIDATED_SOURCE=$M3_VALIDATED_SHA"
echo "FROZEN_CLEANUP_SOURCE=$FROZEN_CLEANUP_SHA"
echo "FROZEN_SOURCE_FIX_SHA=$FROZEN_SOURCE_FIX_SHA"
echo "FROZEN_SOURCE_FIX_TREE=$FROZEN_SOURCE_FIX_TREE"
echo "TARGET_VERIFIED_SHA=$TARGET_SHA"
echo "M5_SOURCE_INTEGRITY=PINNED_BLOB_AND_TREE_PASS"
