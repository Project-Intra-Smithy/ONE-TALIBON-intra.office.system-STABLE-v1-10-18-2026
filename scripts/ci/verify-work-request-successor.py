"""Bounded real Work Request creation projection; all existing guards stay frozen."""
import subprocess

BASE = "f7cb98b2863cff41cc46d97df43f8cc07130d4f7"
ALLOWED = {'scripts/ci/verify-work-request-successor.py', 'tests/Frontend/tcds-f01-f02-regression.test.mjs', '.github/workflows/work-request-creation-pg16.yml', 'app/Services/WorkRequestCreationOptions.php', 'app/Http/Controllers/TransactionController.php', 'resources/js/pages/Transactions/Index.tsx', 'tests/Feature/WorkRequests/WorkRequestCreationOptionsTest.php', 'tests/Browser/phase-a-canonical.mjs', '.forge/memory/WORK-PACKAGE-REGISTER.md'}


def git(*args):
    return subprocess.check_output(["git", *args])


subprocess.run(["git", "merge-base", "--is-ancestor", BASE, "HEAD"], check=True)
changed = set(git("diff", "--name-only", BASE, "HEAD").decode().splitlines())
assert changed <= ALLOWED, f"Unapproved request creation paths: {changed - ALLOWED}"
for name in ["composer.lock", "composer.json", "package-lock.json", "package.json"]:
    assert git("show", f"{BASE}:{name}") == open(name, "rb").read(), f"Dependency source changed: {name}"
print("Work Request creation source scope and frozen dependencies: PASS")
