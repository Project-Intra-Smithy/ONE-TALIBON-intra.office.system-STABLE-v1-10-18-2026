#!/usr/bin/env bash
# Fail-closed M5 R5 source-integrity & strict-YAML-1.2 closed-AST workflow verifier.
# Usage: bash scripts/ci/verify-m5-source-integrity.sh [TARGET_REF]
# Note: An independent reviewer must inspect and run this script + the companion
# Python YAML 1.2 verifier from a reviewer-controlled copy against any candidate SHA;
# a candidate-editable workflow alone is never a self-certifying trust anchor.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_REF="${1:-HEAD}"
TARGET_SHA="$(git rev-parse "${TARGET_REF}^{commit}")"

PR62_SHA="93ab5b64c4bf1621a918278e6d83c250a16bc86e"
M4_SHA="796afd3f26a5f196f02cdc2e0cf6760d880463ea"
M3_VALIDATED_SHA="070029e7d1165ce809a7a3d148d4ed511d59a5bd"
FROZEN_CLEANUP_SHA="0c79eba15a470de0c47522c4353cd4c20d5eecc2"
FROZEN_R2_SOURCE_FIX_SHA="28c532fec420ea802941b1f209750dcc3c43271d"
FROZEN_R2_SOURCE_FIX_TREE="6a02de72307c59e2768d0adf68c59b3a958b7c87"
FROZEN_R2_FINAL_SHA="6cdba4f437326d4761110fcccfd38b7939f26a6f"
FROZEN_R3_SOURCE_FIX_SHA="ac606cb7a98f6fff5ae4f761e390e5836af953eb"
FROZEN_R3_SOURCE_FIX_TREE="5c8ed052b7d660539f15d553ad5eb39ead87850c"
FROZEN_R3_FINAL_SHA="480da17d02bb58c253d5e65cbbd3be5dcc08df0c"
FROZEN_R4_FINAL_SHA="3a51759346e094dfe57c97bf5575bf200c194f23"
FROZEN_R5_FINAL_SHA="9869b2a23f66e0d5e4b791615a371ea49e890001"
CANONICAL_MAIN_RECONCILED_SHA="71876d3e8f7185e11504e7d5c3546be8c14b2957"
FROZEN_TCDS_COMPLETION_SOURCE_SHA="5f93b7b328d8e32badb35ede2b5fb2498c3a19a1"
FROZEN_TCDS_COMPLETION_SOURCE_TREE="5c37185ab9360b13c75597c37fbf2a36f5706b4e"
PINNED_R3_WORKFLOW_BLOB="ac4754df6f859a7fe4a076154044124d0e228956"

fail() {
  echo "::error title=M5 Source Integrity Violation::$1" >&2
  exit 1
}

# 1. Exact immutable ancestry chain (PR62 -> M4 -> M3 -> 0c79 -> R2 -> R3 -> R4 -> R5 + main -> TCDS completion -> TARGET_SHA)
test "$(git merge-base "$PR62_SHA" "$M4_SHA")" = "$PR62_SHA" || fail "Broken PR62 -> M4 ancestry"
test "$(git merge-base "$M4_SHA" "$M3_VALIDATED_SHA")" = "$M4_SHA" || fail "Broken M4 -> M3 ancestry"
test "$(git merge-base "$M3_VALIDATED_SHA" "$FROZEN_CLEANUP_SHA")" = "$M3_VALIDATED_SHA" || fail "Broken M3 -> 0c79 cleanup ancestry"
test "$(git merge-base "$FROZEN_CLEANUP_SHA" "$FROZEN_R2_SOURCE_FIX_SHA")" = "$FROZEN_CLEANUP_SHA" || fail "Broken 0c79 -> R2 source-fix ancestry"
test "$(git merge-base "$FROZEN_R2_SOURCE_FIX_SHA" "$FROZEN_R2_FINAL_SHA")" = "$FROZEN_R2_SOURCE_FIX_SHA" || fail "Broken R2 source-fix -> R2 final ancestry"
test "$(git merge-base "$FROZEN_R2_FINAL_SHA" "$FROZEN_R3_SOURCE_FIX_SHA")" = "$FROZEN_R2_FINAL_SHA" || fail "Broken R2 final -> R3 source-fix ancestry"
test "$(git merge-base "$FROZEN_R3_SOURCE_FIX_SHA" "$FROZEN_R3_FINAL_SHA")" = "$FROZEN_R3_SOURCE_FIX_SHA" || fail "Broken R3 source-fix -> R3 final ancestry"
test "$(git merge-base "$FROZEN_R3_FINAL_SHA" "$FROZEN_R4_FINAL_SHA")" = "$FROZEN_R3_FINAL_SHA" || fail "Broken R3 final -> R4 final ancestry"
test "$(git merge-base "$FROZEN_R4_FINAL_SHA" "$FROZEN_R5_FINAL_SHA")" = "$FROZEN_R4_FINAL_SHA" || fail "Broken R4 final -> R5 final ancestry"
test "$(git merge-base "$FROZEN_R5_FINAL_SHA" "$FROZEN_TCDS_COMPLETION_SOURCE_SHA")" = "$FROZEN_R5_FINAL_SHA" || fail "Broken R5 final -> TCDS completion ancestry"
test "$(git merge-base "$CANONICAL_MAIN_RECONCILED_SHA" "$FROZEN_TCDS_COMPLETION_SOURCE_SHA")" = "$CANONICAL_MAIN_RECONCILED_SHA" || fail "Missing canonical main reconciliation ancestry"
test "$(git merge-base "$FROZEN_TCDS_COMPLETION_SOURCE_SHA" "$TARGET_SHA")" = "$FROZEN_TCDS_COMPLETION_SOURCE_SHA" || fail "TARGET_REF $TARGET_SHA is not a descendant of frozen TCDS completion source $FROZEN_TCDS_COMPLETION_SOURCE_SHA"

# 2. Exact tree SHAs of frozen R2, R3 & TCDS completion source commits + pinned R3 workflow baseline blob
test "$(git rev-parse "${FROZEN_R2_SOURCE_FIX_SHA}^{tree}")" = "$FROZEN_R2_SOURCE_FIX_TREE" || fail "R2 source-fix tree mismatch"
test "$(git rev-parse "${FROZEN_R3_SOURCE_FIX_SHA}^{tree}")" = "$FROZEN_R3_SOURCE_FIX_TREE" || fail "R3 source-fix tree mismatch"
test "$(git rev-parse "${FROZEN_TCDS_COMPLETION_SOURCE_SHA}^{tree}")" = "$FROZEN_TCDS_COMPLETION_SOURCE_TREE" || fail "TCDS completion source tree mismatch"
test "$(git rev-parse "${FROZEN_R3_FINAL_SHA}:.github/workflows/ot-m3-unified-full-matrix.yml")" = "$PINNED_R3_WORKFLOW_BLOB" || fail "Pinned R3 workflow baseline blob mismatch"

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

# 4. Exact blob equality on the 4 R2 planning-correction files unchanged in R3/R4/R5
declare -A PINNED_R2_UNCHANGED_BLOBS=(
  ["app/Http/Controllers/Planning/PlanningMapController.php"]="c3f721c7ca316d22ef84adcda07a3b7136dda60e"
  ["app/Http/Controllers/Planning/PpaController.php"]="2437781b15c7a77b4179f143db836c9b4ea4462c"
  ["app/Services/Planning/PlanningSuiteInitializer.php"]="26fbfcc615e14093695266acdd938980241a7a4e"
  ["database/seeders/PlanningReferenceSampleSeeder.php"]="4c840d4c0ba636729bf99030f70f0255dbaf30d2"
)
for path in "${!PINNED_R2_UNCHANGED_BLOBS[@]}"; do
  actual_blob="$(git rev-parse "${TARGET_SHA}:${path}")"
  test "$actual_blob" = "${PINNED_R2_UNCHANGED_BLOBS[$path]}" || fail "Pinned R2 planning blob mismatch for $path (got $actual_blob expected ${PINNED_R2_UNCHANGED_BLOBS[$path]})"
done

# 5. Exact 3-file delta in frozen R3 source-fix commit + pinned blob equality at TARGET_SHA
declare -A PINNED_R3_BLOBS=(
  ["app/Http/Controllers/Planning/DevelopmentPlanController.php"]="8991af0ff6dc6b23cde84eaa1b2cd6212686b276"
  ["app/Services/Planning/PlanningAuthorizationService.php"]="5cb74880dff28fdb08ff8d28aceb77d82993ee5e"
  ["tests/Feature/Planning/LocalDevelopmentPlanningSuiteTest.php"]="6ff06a05e5f3d528423024d6bb35078f4bd53dec"
)
mapfile -t r3_source_paths < <(git diff --name-only "$FROZEN_R2_FINAL_SHA".."$FROZEN_R3_SOURCE_FIX_SHA")
test "${#r3_source_paths[@]}" -eq 3 || fail "Expected exactly 3 paths in R3 source-fix commit, got ${#r3_source_paths[@]}"
for path in "${r3_source_paths[@]}"; do
  [[ -n "${PINNED_R3_BLOBS[$path]+x}" ]] || fail "Unexpected path in R3 source-fix commit: $path"
  actual_blob="$(git rev-parse "${TARGET_SHA}:${path}")"
  test "$actual_blob" = "${PINNED_R3_BLOBS[$path]}" || fail "Pinned R3 source-fix blob mismatch for $path (got $actual_blob expected ${PINNED_R3_BLOBS[$path]})"
done

# 6. Exact 13-file TCDS completion & main-reconciliation delta after frozen R5 (zero backend/PHP changes) + pinned blob equality
declare -A PINNED_TCDS_COMPLETION_BLOBS=(
  [".forge/memory/WORK-PACKAGE-REGISTER.md"]="1501f4621858964a6c85fde3e54a490a358a1b48"
  ["resources/css/app.css"]="54d9f9e720e1488269fdeeaed47cc55cf137c0de"
  ["resources/js/components/LocaleControl.tsx"]="cb7fa6b87091ed245227a232ce75e4aa92a4e034"
  ["resources/js/components/PageHeader.tsx"]="5ff13e7bba5244849d01f0491175033acd7b23b5"
  ["resources/js/components/dashboard/ExecutiveOverview.tsx"]="de0416e20eb5135a8fbf2ad8ad86a2093361c55d"
  ["resources/js/components/dashboard/OfficeOverview.tsx"]="0fe834ac8c10a510fcf7b802ca318c7a29b6b49f"
  ["resources/js/components/filters/ProgressiveFilterBar.tsx"]="86e3eeda69e7caea67abcdce940688d1f689d9cc"
  ["resources/js/layouts/AppLayout.tsx"]="48be407aeafab464f431f6ee2ef9472e82696210"
  ["resources/js/pages/Admin/Index.tsx"]="c4046c1c96c5de5d9b30b514d38937a187f930cb"
  ["resources/js/pages/Memoranda/Index.tsx"]="bc76c10299813caca9cc4b1b1539dd8cb6b6d2bf"
  ["resources/js/pages/Reports/Index.tsx"]="3bfaf81c8a7ffaa88931da2146cc9e056a9bd1bc"
  ["resources/js/pages/Transactions/Index.tsx"]="fffe105ace8135a355bba1d31b62aef848282f63"
  ["resources/js/pages/Transactions/Show.tsx"]="55c9e1e884160a466a94e6e0dfa396fbf5f5b391"
)
mapfile -t tcds_source_paths < <(git diff --name-only "$FROZEN_R5_FINAL_SHA".."$FROZEN_TCDS_COMPLETION_SOURCE_SHA")
test "${#tcds_source_paths[@]}" -eq 13 || fail "Expected exactly 13 paths in TCDS completion source commit, got ${#tcds_source_paths[@]}"
for path in "${tcds_source_paths[@]}"; do
  [[ -n "${PINNED_TCDS_COMPLETION_BLOBS[$path]+x}" ]] || fail "Unexpected path in TCDS completion source commit: $path"
  actual_blob="$(git rev-parse "${TARGET_SHA}:${path}")"
  test "$actual_blob" = "${PINNED_TCDS_COMPLETION_BLOBS[$path]}" || fail "Pinned TCDS completion blob mismatch for $path (got $actual_blob expected ${PINNED_TCDS_COMPLETION_BLOBS[$path]})"
done

# 7. Zero non-CI source modifications after frozen TCDS completion source commit
mapfile -t post_source_paths < <(git diff --name-only "$FROZEN_TCDS_COMPLETION_SOURCE_SHA".."$TARGET_SHA")
for path in "${post_source_paths[@]}"; do
  case "$path" in
    .github/workflows/ot-m3-unified-full-matrix.yml) ;;
    scripts/ci/verify-m5-source-integrity.sh) ;;
    scripts/ci/verify-m5-workflow-structure.py) ;;
    scripts/ci/test-m5-source-integrity-negatives.sh) ;;
    *) fail "Unauthorized post-TCDS-completion modification (same-path or extra-path tampering rejected): $path" ;;
  esac
done

# 8. Strict YAML 1.2 closed-AST & pinned-baseline executable workflow verification (M5-CI-02 R5)
PYTHON_BIN=""
for cand in python3 python; do
  if command -v "$cand" >/dev/null 2>&1 && "$cand" -c "import yaml" >/dev/null 2>&1; then
    PYTHON_BIN="$cand"
    break
  fi
done
test -n "$PYTHON_BIN" || fail "Python 3 with PyYAML is required for structural workflow YAML verification"
git show "${TARGET_SHA}:.github/workflows/ot-m3-unified-full-matrix.yml" \
  | "$PYTHON_BIN" "${SCRIPT_DIR}/verify-m5-workflow-structure.py" --baseline-blob "$PINNED_R3_WORKFLOW_BLOB"

echo "FROZEN_PR62_ANCESTOR=$PR62_SHA"
echo "FROZEN_M4_SOURCE=$M4_SHA"
echo "FROZEN_M3_VALIDATED_SOURCE=$M3_VALIDATED_SHA"
echo "FROZEN_CLEANUP_SOURCE=$FROZEN_CLEANUP_SHA"
echo "FROZEN_R2_SOURCE_FIX_SHA=$FROZEN_R2_SOURCE_FIX_SHA"
echo "FROZEN_R2_FINAL_SHA=$FROZEN_R2_FINAL_SHA"
echo "FROZEN_R3_SOURCE_FIX_SHA=$FROZEN_R3_SOURCE_FIX_SHA"
echo "FROZEN_R3_SOURCE_FIX_TREE=$FROZEN_R3_SOURCE_FIX_TREE"
echo "FROZEN_R3_FINAL_SHA=$FROZEN_R3_FINAL_SHA"
echo "FROZEN_R4_FINAL_SHA=$FROZEN_R4_FINAL_SHA"
echo "FROZEN_R5_FINAL_SHA=$FROZEN_R5_FINAL_SHA"
echo "CANONICAL_MAIN_RECONCILED_SHA=$CANONICAL_MAIN_RECONCILED_SHA"
echo "FROZEN_TCDS_COMPLETION_SOURCE_SHA=$FROZEN_TCDS_COMPLETION_SOURCE_SHA"
echo "FROZEN_TCDS_COMPLETION_SOURCE_TREE=$FROZEN_TCDS_COMPLETION_SOURCE_TREE"
echo "PINNED_R3_WORKFLOW_BLOB=$PINNED_R3_WORKFLOW_BLOB"
echo "TARGET_VERIFIED_SHA=$TARGET_SHA"
echo "M5_SOURCE_INTEGRITY=PINNED_BLOB_TREE_AND_STRICT_YAML12_CLOSED_AST_PASS"
