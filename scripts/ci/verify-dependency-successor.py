#!/usr/bin/env python3
"""Bound the dependency lane while preserving every frozen product/test blob."""
import copy
import json
import subprocess
import sys

BASE = "9ea015a8a3a6131a18ac6bb800edc9dbad0f065a"
PATCHES = {
    "laravel/framework": ("v13.40.0", "v13.44.1"),
    "symfony/http-foundation": ("v8.1.11", "v8.1.12"),
    "symfony/http-kernel": ("v8.1.11", "v8.1.12"),
    "symfony/mailer": ("v8.1.5", "v8.1.12"),
    "symfony/routing": ("v8.1.11", "v8.1.12"),
}
ALLOWED = {
    "composer.lock",
    ".forge/memory/WORK-PACKAGE-REGISTER.md",
    ".github/workflows/dependency-security-pg16.yml",
    "scripts/ci/verify-dependency-successor.py",
    "scripts/ci/dependency-security-regressions.php",
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def check_lock(before, after):
    old_top = {k: v for k, v in before.items() if k not in ("packages", "packages-dev", "plugin-api-version")}
    new_top = {k: v for k, v in after.items() if k not in ("packages", "packages-dev", "plugin-api-version")}
    require(old_top == new_top, "Unrelated lock configuration changed")
    require(before["plugin-api-version"] == "2.11.0", "Unexpected frozen Composer format")
    require(after["plugin-api-version"] in ("2.11.0", "2.9.0"), "Unexpected Composer format")
    changed = set()
    for section in ("packages", "packages-dev"):
        old = {p["name"]: p for p in before[section]}
        new = {p["name"]: p for p in after[section]}
        require(old.keys() == new.keys(), "Package added or removed")
        for name, package in new.items():
            if name in PATCHES:
                require(section == "packages", "Security package moved to development scope")
                require((old[name]["version"], package["version"]) == PATCHES[name], f"Unexpected patch version: {name}")
                require(package["source"]["url"] == old[name]["source"]["url"], f"Source origin changed: {name}")
                require(package["dist"]["reference"] == package["source"]["reference"], f"Distribution/source mismatch: {name}")
                require(package["dist"]["url"] == old[name]["dist"]["url"].replace(old[name]["source"]["reference"], package["source"]["reference"]), f"Distribution origin changed: {name}")
                changed.add(name)
            else:
                # Composer 2.10 drops registry-only publication timestamps.
                normalize = lambda p: {k: v for k, v in p.items() if k != "published-time"}
                require(normalize(old[name]) == normalize(package), f"Unrelated package changed: {name}")
    require(changed == PATCHES.keys(), "Security patch inventory incomplete")


def self_test(before, after):
    check_lock(before, after)
    mutations = [
        lambda d: d["packages"][0].update(version="999.0.0"),
        lambda d: d["packages-dev"].pop(),
        lambda d: d.update(**{"content-hash": "changed"}),
        lambda d: next(p for p in d["packages"] if p["name"] == "laravel/framework").update(version="v13.40.0"),
        lambda d: next(p for p in d["packages"] if p["name"] == "symfony/mailer")["dist"].update(url="https://untrusted.invalid/archive.zip"),
    ]
    for mutate in mutations:
        altered = copy.deepcopy(after)
        mutate(altered)
        try:
            check_lock(before, altered)
        except ValueError:
            continue
        raise ValueError("Hostile lock mutation accepted")
    print("Dependency lock negatives: 5/5 rejected")


def check_workflow():
    frozen = subprocess.check_output(["git", "show", f"{BASE}:.github/workflows/tcds-phase-a-backend.yml"], text=True, encoding="utf-8")
    expected = frozen.replace("name: TCDS Phase A preserved backend — Protected PG16", "name: Dependency security successor — Protected PG16")
    expected = expected.replace("branches: [candidate/antigravity-tcds-full-presentation-r1]", "branches: [candidate/ot-dependency-security-remediation-r1]")
    old_guard = '          git diff --exit-code "$baseline" HEAD -- app routes database config bootstrap composer.json composer.lock \'tests/**/*.php\' bin scripts/ci/verify-m5-source-integrity.sh scripts/ci/verify-m5-workflow-structure.py scripts/ci/test-m5-source-integrity-negatives.sh .github/workflows/ot-m3-unified-full-matrix.yml'
    require(expected.count(old_guard) == 1, "Frozen workflow guard drift")
    expected = expected.replace(old_guard, "          python3 scripts/ci/verify-dependency-successor.py\n          python3 scripts/ci/verify-dependency-successor.py --self-test")
    install = "      - run: composer install --no-interaction --prefer-dist --no-progress --optimize-autoloader"
    require(expected.count(install) == 1, "Frozen install step drift")
    expected = expected.replace(install, install + "\n      - name: Validate dependency security and behavior\n        run: |\n          composer validate --strict --no-check-publish\n          composer audit --locked\n          composer audit --locked --no-dev\n          php scripts/ci/dependency-security-regressions.php")
    with open(".github/workflows/dependency-security-pg16.yml", encoding="utf-8") as source:
        require(source.read() == expected, "Protected PG16 partitions or aggregate changed")


before = json.loads(subprocess.check_output(["git", "show", f"{BASE}:composer.lock"]))
with open("composer.lock", encoding="utf-8") as source:
    after = json.load(source)
check_lock(before, after)
if "--self-test" in sys.argv:
    self_test(before, after)
else:
    subprocess.run(["git", "merge-base", "--is-ancestor", BASE, "HEAD"], check=True)
    changes = set(subprocess.check_output(["git", "diff", "--name-only", BASE, "--"], text=True).splitlines())
    require(changes <= ALLOWED, f"Outside dependency scope: {sorted(changes - ALLOWED)}")
    check_workflow()
    print("Frozen presentation, backend, protected tests and original workflows unchanged; five security package updates only")
