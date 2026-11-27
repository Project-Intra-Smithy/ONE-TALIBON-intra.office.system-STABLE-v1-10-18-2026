#!/usr/bin/env python3
"""
Closed-AST GitHub Actions workflow verifier for M5-CI-02 (R5).
Enforces:
1. Strict YAML 1.2-compatible parsing (`StrictYaml12NoDupLoader`):
   - Only `true|True|TRUE|false|False|FALSE` resolve as booleans (`on`/`off`/`yes`/`no`
     resolve natively as `str`, matching GitHub Actions / YAML 1.2).
   - Rejects YAML merge keys (`<<`), non-string mapping keys (including `true:`,
     `!!bool true:`, `!!bool on:`), exact duplicate keys, and case/whitespace-colliding
     keys (`on:` + `"on":`, `"on":` + `on:`, `on:` + `'on':`, `on:` + `ON:`) at the
     parser boundary BEFORE any normalization or set conversion.
2. Exact deep AST equality of top-level `name`, `permissions`, and the entire
   executable `jobs` tree against an independently pinned immutable Git blob.
3. Exactly one canonical root `on` mapping with closed event/branch allowlist
   and no duplicate branches.
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
    "candidate/antigravity-m5-r5-yaml-trigger-normalization-r1",
    "candidate/antigravity-canonical-tcds-completion-r1",
}


class StrictYaml12NoDupLoader(yaml.SafeLoader):
    pass


# Replace YAML 1.1 implicit boolean resolvers (which coerce `on`/`off`/`yes`/`no` to bool)
# with strict YAML 1.2 Core Schema booleans (`true|True|TRUE|false|False|FALSE` only)
# and remove YAML 1.1 merge-key (`<<`) resolution.
StrictYaml12NoDupLoader.yaml_implicit_resolvers = {
    ch: [
        (tag, regexp)
        for (tag, regexp) in resolvers
        if tag not in ("tag:yaml.org,2002:bool", "tag:yaml.org,2002:merge")
    ]
    for ch, resolvers in yaml.SafeLoader.yaml_implicit_resolvers.items()
}
StrictYaml12NoDupLoader.add_implicit_resolver(
    "tag:yaml.org,2002:bool",
    re.compile(r"^(?:true|True|TRUE|false|False|FALSE)$"),
    list("tTfF"),
)


def _construct_mapping_strict(loader, node, deep=False):
    mapping = {}
    seen_canonical = {}
    for key_node, value_node in node.value:
        if key_node.tag == "tag:yaml.org,2002:merge":
            raise yaml.constructor.ConstructorError(
                "while constructing a mapping",
                node.start_mark,
                "YAML merge keys (<<) are forbidden",
                key_node.start_mark,
            )
        key = loader.construct_object(key_node, deep=deep)
        if not isinstance(key, str):
            raise yaml.constructor.ConstructorError(
                "while constructing a mapping",
                node.start_mark,
                f"non-string mapping key {key!r} ({type(key).__name__}) is forbidden",
                key_node.start_mark,
            )
        if key in mapping:
            raise yaml.constructor.ConstructorError(
                "while constructing a mapping",
                node.start_mark,
                f"found duplicate mapping key {key!r}",
                key_node.start_mark,
            )
        canonical = key.strip().lower()
        if canonical in seen_canonical:
            raise yaml.constructor.ConstructorError(
                "while constructing a mapping",
                node.start_mark,
                f"found semantically colliding mapping key {key!r} (conflicts with {seen_canonical[canonical]!r})",
                key_node.start_mark,
            )
        seen_canonical[canonical] = key
        mapping[key] = loader.construct_object(value_node, deep=deep)
    return mapping


StrictYaml12NoDupLoader.add_constructor(
    yaml.resolver.BaseResolver.DEFAULT_MAPPING_TAG,
    _construct_mapping_strict,
)


def fail(msg: str) -> None:
    print(f"::error title=M5 Workflow Structural Violation::{msg}", file=sys.stderr)
    sys.exit(1)


def parse_strict_yaml12(raw: str, label: str) -> dict:
    try:
        doc = yaml.load(raw, Loader=StrictYaml12NoDupLoader)
    except Exception as exc:
        fail(f"Strict YAML 1.2 validation failed in {label}: {exc}")
    if not isinstance(doc, dict):
        fail(f"{label} did not parse to a YAML mapping")
    return doc


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
        fail('jobs.mandatory step must enforce test "$OUTCOME" = success')


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

    baseline_doc = parse_strict_yaml12(baseline_raw, f"baseline:{args.baseline_blob}")
    candidate_doc = parse_strict_yaml12(sys.stdin.read(), "candidate_workflow")

    # 1. Strict root key set (no boolean True aliasing, no set-collapsing)
    expected_root_keys = {"name", "on", "permissions", "jobs"}
    if set(candidate_doc.keys()) != expected_root_keys:
        fail(f"Unexpected top-level workflow keys: {sorted(candidate_doc.keys())}")

    # 2. Exact deep-AST equality of name, permissions, and the ENTIRE executable jobs tree
    if candidate_doc["name"] != baseline_doc["name"]:
        fail("Workflow `name` differs from pinned immutable baseline")
    if candidate_doc["permissions"] != baseline_doc["permissions"]:
        fail("Workflow `permissions` differs from pinned immutable baseline")
    if candidate_doc["jobs"] != baseline_doc["jobs"]:
        fail("Workflow executable `jobs` AST differs from pinned immutable baseline (any altered job, condition, continue-on-error, phase, or shell command is rejected fail-closed)")

    # 3. Closed canonical `on` trigger verification
    b_on = baseline_doc["on"]
    c_on = candidate_doc["on"]
    if not isinstance(c_on, dict) or set(c_on.keys()) != {"push", "workflow_dispatch"}:
        fail(f"Workflow `on` trigger keys must be exactly {{push, workflow_dispatch}}, got {c_on!r}")
    if c_on["workflow_dispatch"] is not None or c_on["workflow_dispatch"] != b_on["workflow_dispatch"]:
        fail("Workflow `on.workflow_dispatch` must be null/empty matching baseline")

    b_push = b_on["push"]
    c_push = c_on["push"]
    if not isinstance(c_push, dict) or set(c_push.keys()) != {"branches"}:
        fail("Workflow `on.push` must contain only `branches`")
    b_branches = b_push["branches"]
    c_branches = c_push["branches"]
    if not isinstance(c_branches, list) or not all(isinstance(b, str) for b in c_branches):
        fail("Workflow `on.push.branches` must be a list of strings")
    if len(c_branches) != len(set(c_branches)):
        fail("Workflow `on.push.branches` contains duplicate branch entries")
    if c_branches[: len(b_branches)] != b_branches:
        fail("Workflow `on.push.branches` must preserve all baseline branches in order")
    extra_branches = set(c_branches[len(b_branches) :])
    if not extra_branches.issubset(ALLOWED_EXTRA_BRANCHES):
        fail(f"Workflow `on.push.branches` contains unapproved branches: {sorted(extra_branches - ALLOWED_EXTRA_BRANCHES)}")

    # 4. Self-verify structural invariants on the parsed jobs AST
    verify_structural_invariants(candidate_doc)

    print(f"M5_WORKFLOW_YAML_STRUCTURE=STRICT_YAML12_CLOSED_AST_AND_PINNED_BASELINE_PASS({args.baseline_blob})")


if __name__ == "__main__":
    main()
