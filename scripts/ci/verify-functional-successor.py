"""Bounded successor proof; accepted historical validators remain unchanged."""
import subprocess

BASE = "a944fe3486365297b9ebb085161316bfbb962c3c"
ALLOWED = {'tests/Feature/LegacyCustodyFoundationTest.php', 'resources/js/components/ppas/PPADetailPanel.tsx', 'resources/js/data/municipal/ppas.types.ts', 'tests/Feature/Planning/LocalDevelopmentPlanningSuiteTest.php', 'resources/js/pages/Plans/Index.tsx', 'resources/js/pages/PPAs/Index.tsx', 'resources/js/pages/PlanningMaps/Index.tsx', 'resources/js/components/planning/DesignatedStaffModal.tsx', 'resources/js/components/planning/PlanningStaffList.tsx', 'resources/js/components/planning/SupportingDocsPanel.tsx', 'app/Http/Controllers/Planning/PpaController.php', 'scripts/ci/verify-functional-successor.py', '.github/workflows/functional-planning-pg16.yml', 'tests/Feature/Planning/PlanningIntegrityTest.php', 'database/migrations/2026_11_27_000001_enforce_one_active_planning_designation.php', 'app/Http/Controllers/Planning/PlanningMapController.php', 'app/Http/Controllers/Planning/DevelopmentPlanController.php', '.forge/memory/WORK-PACKAGE-REGISTER.md', 'app/Http/Controllers/Planning/DesignatedPlanningStaffController.php', 'app/Http/Controllers/Planning/PlanningAttachmentController.php', '.forge/plans/OT-FUNCTIONAL-BACKEND-R1.md', 'app/Services/Planning/PlanningAuthorizationService.php'}


def git(*args):
    return subprocess.check_output(["git", *args])


subprocess.run(["git", "merge-base", "--is-ancestor", BASE, "HEAD"], check=True)
changed = set(git("diff", "--name-only", BASE, "HEAD").decode().splitlines())
assert changed <= ALLOWED, f"Unapproved functional paths: {changed - ALLOWED}"
assert git("show", f"{BASE}:composer.lock") == open("composer.lock", "rb").read(), "Accepted dependency lock changed"
assert git("show", f"{BASE}:composer.json") == open("composer.json", "rb").read(), "Composer manifest changed"
print("Functional Planning source scope and accepted dependencies: PASS")
