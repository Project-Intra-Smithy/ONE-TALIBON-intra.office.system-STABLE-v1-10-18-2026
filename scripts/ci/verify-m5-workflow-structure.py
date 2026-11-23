#!/usr/bin/env python3
"""
Closed-AST GitHub Actions workflow verifier for M5-CI-02 (R4).
Enforces:
1. Strict YAML parsing with duplicate mapping key rejection.
2. Exact deep AST equality of top-level `name`, `permissions`, and the entire
   executable `jobs` tree against an independently pinned immutable Git blob
   (eliminating arbitrary Bash reachability and GitHub expression bypasses
   including Jane's ADV-A..F, equivalent expressions, early exits, and
   continue-on-error overrides).
3. Closed trigger allowlist (`on.push.branches` limited to baseline branches
   plus the authorized R4 branch, and `workflow_dispatch`).
4. Explicit structural verification of the parsed `jobs` AST (postgres:16,
   all 11 matrix phases, unconditional verifier, fail-closed Pint, and
   mandatory aggregate gate).
"""
import argparse
import re
import subprocess
import sys
import yaml

REQUIRED_PHASES = [
    "g2a-roles",
    "roles",
    "broker",
    "focused",
    "full",
    "browser",
    "c02",
    "c01",
    "iam-cross-session",
    "task-cross-session",
    "p0-cross-session",
]

ALLOWED_EXTRA_BRANCHES = {
    "candidate/antigravity-m5-r4-ci-reachability-r1",
}


class NoDuplicateKeysSafeLoader(yaml.SafeLoader):
    pass


def _construct_mapping_no_duplicates(loader, node, deep=False):
    mapping = {}
    for key_node, value_node in node.value:
        key = loader.construct_object(key_node, deep=deep)
        if key in mapping:
            raise yaml.constructor.ConstructorError(
                "while constructing a mapping",
                node.start_mark,
                f"found duplicate key {key!r}",
                key_node.start_mark,
            )
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


NoDuplicateKeysSafeLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
    _construct_mapping_no_duplicates,
)


def fail(msg: str) -> None:
    print(f"::error title=M5 Workflow Structural Violation::{msg}", file=sys.stderr)
    sys.exit(1)


def parse_strict_yaml(raw: str, label: str) -> dict:
    try:
        doc = yaml.load(raw, Loader=NoDuplicateKeysSafeLoader)
    except Exception as exc:
        fail(f"Invalid or duplicate-key YAML in {label}: {exc}")
    if not isinstance(doc, dict):
        fail(f"{label} did not parse to a YAML mapping")
    return doc


def get_on_key(doc: dict):
    # YAML 1.1 SafeLoader parses unquoted `on:` as boolean True.
    if True in doc:
        return True
    if "on" in doc:
        return "on"
    fail("Workflow missing top-level `on` trigger mapping")


def normalize_doc_keys(doc: dict) -> set[str]:
    keys = set()
    for k in doc.keys():
        keys.add("on" if k is True else str(k))
    return keys


def verify_structural_invariants(doc: dict) -> None:
    jobs = doc.get("jobs")
    if not isinstance(jobs, dict) or set(jobs.keys()) != {"validate", "mandatory"}:
        fail("Workflow jobs must contain exactly {validate, mandatory}")

    validate = jobs["validate"]
    if not isinstance(validate, dict):
        fail("jobs.validate must be a mapping")
    if "if" in validate:
        fail("jobs.validate must not declare an `if` condition")
    if validate.get("continue-on-error") is True:
        fail("jobs.validate must not set continue-on-error: true")

    services = validate.get("services")
    if not isinstance(services, dict) or not isinstance(services.get("postgres"), dict):
        fail("jobs.validate missing services.postgres")
    if str(services["postgres"].get("image", "")).strip() != "postgres:16":
        fail("jobs.validate services.postgres must use postgres:16")

    phases = validate.get("strategy", {}).get("matrix", {}).get("phase")
    if phases != REQUIRED_PHASES:
        fail(f"jobs.validate matrix phases must exactly match {REQUIRED_PHASES}")

    steps = validate.get("steps")
    if not isinstance(steps, list) or not steps:
        fail("jobs.validate.steps must be a non-empty list")

    has_verifier = False
    has_pint = False
    for step in steps:
        if not isinstance(step, dict):
            continue
        if step.get("if") is not None or step.get("continue-on-error") is True:
            continue
        run_block = step.get("run")
        if not isinstance(run_block, str):
            continue
        exec_lines = [l.strip() for l in run_block.splitlines() if l.strip() and not l.strip().startswith("#")]
        if any(re.fullmatch(r"bash\s+scripts/ci/verify-m5-source-integrity\.sh\s+HEAD", l) for l in exec_lines):
            has_verifier = True
        if any(re.fullmatch(r'php\s+vendor/bin/pint\s+--test\s+"\$\{changed_php\[@\]\}"', l) for l in exec_lines):
            has_pint = True

    if not has_verifier:
        fail("jobs.validate missing unconditional fail-closed verifier step")
    if not has_pint:
        fail("jobs.validate missing unconditional fail-closed Pint step")

    mandatory = jobs["mandatory"]
    if not isinstance(mandatory, dict):
        fail("jobs.mandatory must be a mapping")
    if str(mandatory.get("if", "")).strip() != "always()":
        fail("jobs.mandatory must declare `if: always()`")
    if mandatory.get("continue-on-error") is True:
        fail("jobs.mandatory must not set continue-on-error: true")
    if mandatory.get("needs") != ["validate"]:
        fail("jobs.mandatory must declare `needs: [validate]`")

    m_steps = mandatory.get("steps")
    if not isinstance(m_steps, list) or len(m_steps) != 1:
        fail("jobs.mandatory must contain exactly one aggregate enforcement step")
    m_step = m_steps[0]
    if m_step.get("if") is not None or m_step.get("continue-on-error") is True:
        fail("jobs.mandatory step must be unconditional and fail-closed")
    if m_step.get("env", {}).get("OUTCOME") != "${{ needs.validate.result }}":
        fail("jobs.mandatory step must bind OUTCOME to ${{ needs.validate.result }}")
    m_lines = [l.strip() for l in str(m_step.get("run", "")).splitlines() if l.strip() and not l.strip().startswith("#")]
    if not any(re.fullmatch(r'test\s+"\$OUTCOME"\s*=\s*success', l) for l in m_lines):
        fail("jobs.mandatory step must enforce test \"$OUTCOME\" = success")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--baseline-blob", required=True, help="Pinned immutable Git blob SHA of reviewed workflow")
    args = parser.parse_args()

    try:
        baseline_raw = subprocess.check_output(
            ["git", "cat-file", "blob", args.baseline_blob],
            stderr=subprocess.PIPE,
            text=True,
        )
    except subprocess.CalledProcessError as exc:
        fail(f"Failed to read pinned baseline workflow blob {args.baseline_blob}: {exc.stderr.strip()}")

    baseline_doc = parse_strict_yaml(baseline_raw, f"baseline:{args.baseline_blob}")
    candidate_doc = parse_strict_yaml(sys.stdin.read(), "candidate_workflow")

    # 1. Verify top-level key set strictly matches baseline (no sneaky extra keys)
    if normalize_doc_keys(candidate_doc) != {"name", "on", "permissions", "jobs"}:
        fail(f"Unexpected top-level workflow keys: {sorted(normalize_doc_keys(candidate_doc))}")

    # 2. Verify exact equality of name, permissions, and the ENTIRE executable jobs AST
    if candidate_doc.get("name") != baseline_doc.get("name"):
        fail("Workflow `name` differs from pinned immutable baseline")
    if candidate_doc.get("permissions") != baseline_doc.get("permissions"):
        fail("Workflow `permissions` differs from pinned immutable baseline")
    if candidate_doc.get("jobs") != baseline_doc.get("jobs"):
        fail("Workflow executable `jobs` AST differs from pinned immutable baseline (any altered job, condition, continue-on-error, phase, or shell command is rejected fail-closed)")

    # 3. Verify `on` triggers only permit baseline branches plus explicitly allowlisted R4 branch
    b_on = baseline_doc[get_on_key(baseline_doc)]
    c_on = candidate_doc[get_on_key(candidate_doc)]
    if not isinstance(c_on, dict) or set(c_on.keys()) != set(b_on.keys()):
        fail("Workflow `on` trigger keys differ from pinned immutable baseline")
    if c_on.get("workflow_dispatch") != b_on.get("workflow_dispatch"):
        fail("Workflow `on.workflow_dispatch` differs from baseline")

    b_push = b_on.get("push")
    c_push = c_on.get("push")
    if not isinstance(c_push, dict) or set(c_push.keys()) != {"branches"}:
        fail("Workflow `on.push` must contain only `branches`")
    b_branches = b_push.get("branches", [])
    c_branches = c_push.get("branches", [])
    if not isinstance(c_branches, list) or c_branches[: len(b_branches)] != b_branches:
        fail("Workflow `on.push.branches` must preserve all baseline branches in order")
    extra_branches = set(c_branches[len(b_branches) :])
    if not extra_branches.issubset(ALLOWED_EXTRA_BRANCHES):
        fail(f"Workflow `on.push.branches` contains unapproved branches: {sorted(extra_branches - ALLOWED_EXTRA_BRANCHES)}")

    # 4. Self-verify structural invariants on the parsed jobs AST
    verify_structural_invariants(candidate_doc)

    print(f"M5_WORKFLOW_YAML_STRUCTURE=CLOSED_AST_AND_PINNED_BASELINE_PASS({args.baseline_blob})")


if __name__ == "__main__":
    main()
