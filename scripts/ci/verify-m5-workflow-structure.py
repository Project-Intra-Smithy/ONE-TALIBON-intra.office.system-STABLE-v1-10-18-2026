#!/usr/bin/env python3
"""
Structural GitHub Actions workflow verifier for M5-CI-02.
Parses the actual YAML AST (yaml.safe_load) and inspects executable job/step
structure rather than raw text substrings, rejecting comment-only spoofs,
disabled jobs, continue-on-error bypasses, removed verifier calls, and
weakened Pint/matrix/aggregate gates.
"""
import re
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


def fail(msg: str) -> None:
    print(f"::error title=M5 Workflow Structural Violation::{msg}", file=sys.stderr)
    sys.exit(1)


def is_disabled_if(cond) -> bool:
    if cond is None:
        return False
    if isinstance(cond, bool):
        return cond is False
    text = str(cond).strip().lower()
    return text in ("false", "${{ false }}", "0", "!true")


def executable_lines(run_block) -> list[str]:
    if not isinstance(run_block, str):
        return []
    lines = []
    for raw in run_block.splitlines():
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            continue
        lines.append(stripped)
    return lines


def main() -> None:
    raw_yaml = sys.stdin.read()
    try:
        doc = yaml.safe_load(raw_yaml)
    except Exception as exc:
        fail(f"Invalid workflow YAML: {exc}")

    if not isinstance(doc, dict) or not isinstance(doc.get("jobs"), dict):
        fail("Workflow missing top-level jobs mapping")

    jobs = doc["jobs"]

    # 1. Validate job structural checks
    validate = jobs.get("validate")
    if not isinstance(validate, dict):
        fail("Workflow missing jobs.validate")
    if is_disabled_if(validate.get("if")):
        fail("jobs.validate is disabled via if condition")
    if validate.get("continue-on-error") is True:
        fail("jobs.validate must not set continue-on-error: true")

    # 2. Disposable PostgreSQL 16 service check
    services = validate.get("services")
    if not isinstance(services, dict) or not isinstance(services.get("postgres"), dict):
        fail("jobs.validate missing services.postgres")
    if str(services["postgres"].get("image", "")).strip() != "postgres:16":
        fail("jobs.validate services.postgres must use postgres:16")

    # 3. Exact 11 matrix phases
    strategy = validate.get("strategy")
    matrix = strategy.get("matrix") if isinstance(strategy, dict) else None
    phases = matrix.get("phase") if isinstance(matrix, dict) else None
    if not isinstance(phases, list):
        fail("jobs.validate.strategy.matrix.phase must be a list")
    missing_phases = [p for p in REQUIRED_PHASES if p not in phases]
    if missing_phases:
        fail(f"jobs.validate missing required matrix phases: {', '.join(missing_phases)}")

    steps = validate.get("steps")
    if not isinstance(steps, list) or not steps:
        fail("jobs.validate.steps must be a non-empty list")

    has_verifier_step = False
    has_fail_closed_pint_step = False
    has_g2a_step = False
    has_broker_step = False
    has_full_phpunit_step = False
    has_browser_step = False

    for step in steps:
        if not isinstance(step, dict):
            continue
        step_if = step.get("if")
        continue_err = step.get("continue-on-error") is True
        lines = executable_lines(step.get("run"))
        if not lines:
            continue

        # Verifier step must be unconditional and fail-closed
        if step_if is None and not continue_err:
            for line in lines:
                if re.fullmatch(r"bash\s+scripts/ci/verify-m5-source-integrity\.sh\s+HEAD", line):
                    has_verifier_step = True

        # Fail-closed Pint step must be unconditional and fail-closed
        if step_if is None and not continue_err:
            has_pint_cmd = False
            has_pint_bypass = False
            has_php_l = False
            for line in lines:
                if "php -l" in line:
                    has_php_l = True
                if "vendor/bin/pint" in line:
                    if re.search(r"^\s*if\s+!|\|\|\s*true|\|\|\s*:|;\s*true\b", line):
                        has_pint_bypass = True
                    elif re.fullmatch(r'php\s+vendor/bin/pint\s+--test\s+"\$\{changed_php\[@\]\}"', line):
                        has_pint_cmd = True
                    else:
                        has_pint_bypass = True
            if has_pint_cmd and has_php_l and not has_pint_bypass:
                has_fail_closed_pint_step = True

        if not continue_err and not is_disabled_if(step_if):
            joined = "\n".join(lines)
            if "LegacyCustodyFoundationTest.php" in joined and "--group=n03-role" in joined:
                has_g2a_step = True
            if "LegacyCustodyK3BrokerIsolationTest.php" in joined:
                has_broker_step = True
            if "vendor/bin/phpunit" in joined and "ops009-registry-bootstrap.php" in joined:
                has_full_phpunit_step = True
            if "legacy-pdf-inline-authenticated.mjs" in joined:
                has_browser_step = True

    if not has_verifier_step:
        fail("jobs.validate missing unconditional fail-closed verifier invocation step")
    if not has_fail_closed_pint_step:
        fail("jobs.validate missing unconditional fail-closed Pint step")
    if not (has_g2a_step and has_broker_step and has_full_phpunit_step and has_browser_step):
        fail("jobs.validate missing one or more required PG16/broker/browser executable test steps")

    # 4. Mandatory aggregate gate structural checks
    mandatory = jobs.get("mandatory")
    if not isinstance(mandatory, dict):
        fail("Workflow missing jobs.mandatory aggregate gate")
    if is_disabled_if(mandatory.get("if")):
        fail("jobs.mandatory is disabled via if condition")
    if mandatory.get("continue-on-error") is True:
        fail("jobs.mandatory must not set continue-on-error: true")

    needs = mandatory.get("needs")
    needs_list = [needs] if isinstance(needs, str) else (needs if isinstance(needs, list) else [])
    if "validate" not in needs_list:
        fail("jobs.mandatory must declare needs: [validate]")

    m_steps = mandatory.get("steps")
    if not isinstance(m_steps, list) or not m_steps:
        fail("jobs.mandatory.steps must be a non-empty list")

    has_aggregate_gate = False
    for step in m_steps:
        if not isinstance(step, dict):
            continue
        if step.get("if") is not None or step.get("continue-on-error") is True:
            continue
        env = step.get("env")
        outcome_expr = str(env.get("OUTCOME", "")).strip() if isinstance(env, dict) else ""
        if outcome_expr != "${{ needs.validate.result }}":
            continue
        lines = executable_lines(step.get("run"))
        for line in lines:
            if re.fullmatch(r'test\s+"\$OUTCOME"\s*=\s*success', line):
                has_aggregate_gate = True

    if not has_aggregate_gate:
        fail("jobs.mandatory missing unconditional step enforcing OUTCOME == needs.validate.result == success")

    print("M5_WORKFLOW_YAML_STRUCTURE=PARSED_AST_PASS")


if __name__ == "__main__":
    main()
