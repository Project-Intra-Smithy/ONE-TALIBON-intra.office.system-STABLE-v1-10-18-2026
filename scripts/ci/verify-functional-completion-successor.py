"""Bounded real Functional completion projection; all existing guards stay frozen."""
import subprocess

BASE = "45fb3f6467a3448d6abadc4333a59f5c94cf792a"
ALLOWED = {'tests/Feature/Planning/LocalDevelopmentPlanningSuiteTest.php', 'resources/js/components/maps/MapStudioView.tsx', 'database/migrations/2026_11_27_000004_reserve_issued_ppa_identifiers.php', 'resources/js/components/ppas/PPARegister.tsx', 'app/Http/Controllers/Planning/PpaController.php', 'app/Http/Controllers/Planning/PlanningCustodyController.php', 'resources/js/pages/PlanningMaps/Index.tsx', 'resources/js/pages/PlanningCustody/Index.tsx', 'resources/js/components/plans/PlanStudioView.tsx', 'tests/Feature/LegacyCustodyFoundationTest.php', 'resources/js/pages/Plans/Index.tsx', '.forge/memory/WORK-PACKAGE-REGISTER.md', 'app/Services/Planning/PlanningAttachmentCustody.php', '.forge/memory/OT-FUNCTIONAL-COMPLETION-R1.md', 'resources/js/pages/PPAs/Index.tsx', 'tests/Feature/Planning/PlanningCompletionTest.php', '.github/workflows/functional-completion-pg16.yml', 'app/Models/DevelopmentPlan.php', 'tests/Feature/Planning/NotificationRecipientEligibilityTest.php', 'tests/Frontend/planning-money.test.mjs', 'tests/Browser/phase-a-canonical.mjs', 'app/Http/Controllers/Planning/PlanningMapController.php', 'app/Services/Planning/PlanningDossier.php', 'app/Models/PpaRecord.php', 'resources/js/components/ppas/PPADetailPanel.tsx', 'resources/js/components/ppas/PPAStudioView.tsx', 'app/Http/Controllers/Planning/DevelopmentPlanController.php', 'resources/js/data/municipal/ppas.types.ts', 'app/Services/Planning/PlanningAmounts.php', 'routes/web.php', 'resources/js/components/plans/PlanLinkedPpas.tsx', 'tests/Browser/phase-a-planning-crud.mjs', 'resources/js/components/ppas/PpaOverview.tsx', 'database/migrations/2026_11_27_000003_complete_planning_persistence.php', 'app/Services/Planning/PlanningAuthorizationService.php', 'app/Services/PlatformNotificationService.php', 'app/Models/PlanningMap.php', 'scripts/ci/verify-functional-completion-successor.py', 'resources/js/lib/planningMoney.ts', 'resources/js/components/planning/SupportingDocsPanel.tsx', 'app/Services/Planning/PlanningReferences.php'}


def git(*args):
    return subprocess.check_output(["git", *args])


subprocess.run(["git", "merge-base", "--is-ancestor", BASE, "HEAD"], check=True)
changed = set(git("diff", "--name-only", BASE, "HEAD").decode().splitlines())
assert changed <= ALLOWED, f"Unapproved completion paths: {changed - ALLOWED}"
for name in ["composer.lock", "composer.json", "package-lock.json", "package.json"]:
    assert git("show", f"{BASE}:{name}") == open(name, "rb").read(), f"Dependency source changed: {name}"
print("Functional completion source scope and frozen dependencies: PASS")

# Preserve the original authorization assertions; only make the budget fixture explicitly complete.
fixture = "tests/Feature/Planning/LocalDevelopmentPlanningSuiteTest.php"
original = git("show", f"{BASE}:{fixture}")
needle = b"            'mooe_amount' => 150000,\n"
assert original.count(needle) == 1
expected = original.replace(needle, b"            'ps_amount' => '0.00',\n" + needle)
assert open(fixture, "rb").read() == expected, "Unexpected change to the original Planning authorization fixture"
