"""Bounded real Planning attachment custody projection; all existing guards stay frozen."""
import subprocess

BASE = "ea4e144cb648dd4ad38cb0b5c6d2b504a48f8068"
ALLOWED = {'app/Http/Controllers/Planning/PlanningMapController.php', 'app/Http/Controllers/Planning/PpaController.php', 'tests/Feature/LegacyCustodyFoundationTest.php', 'app/Http/Controllers/Planning/DevelopmentPlanController.php', 'resources/js/components/ppas/PPADetailPanel.tsx', 'resources/js/pages/PPAs/Index.tsx', 'resources/js/pages/PlanningMaps/Index.tsx', 'app/Services/Planning/PlanningAttachmentCustody.php', 'resources/js/pages/Plans/Index.tsx', '.github/workflows/planning-custody-pg16.yml', 'tests/Feature/Planning/PlanningIntegrityTest.php', 'scripts/ci/verify-planning-custody-successor.py', '.forge/memory/OT-FUNCTIONAL-CUSTODY-R2.md', 'resources/js/components/planning/SupportingDocsPanel.tsx', 'app/Services/Planning/PlanningAuthorizationService.php', 'database/migrations/2026_11_27_000002_bind_new_planning_attachment_parents.php', 'app/Models/PlanningAttachment.php', 'app/Http/Controllers/Planning/PlanningAttachmentController.php'}


def git(*args):
    return subprocess.check_output(["git", *args])


subprocess.run(["git", "merge-base", "--is-ancestor", BASE, "HEAD"], check=True)
changed = set(git("diff", "--name-only", BASE, "HEAD").decode().splitlines())
assert changed <= ALLOWED, f"Unapproved custody paths: {changed - ALLOWED}"
for name in ["composer.lock", "composer.json", "package-lock.json", "package.json"]:
    assert git("show", f"{BASE}:{name}") == open(name, "rb").read(), f"Dependency source changed: {name}"
print("Planning attachment custody source scope and frozen dependencies: PASS")
