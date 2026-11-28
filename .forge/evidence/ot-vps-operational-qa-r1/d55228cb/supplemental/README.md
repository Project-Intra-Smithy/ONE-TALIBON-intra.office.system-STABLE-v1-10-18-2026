# R4 Supplemental N79-01 Evidence Closure (`d55228cb`)

**Mission:** `OT-VPS-OPERATIONAL-QA-R1`  
**Authority:** [Hub#197 order 7238394598](https://github.com/Project-Intra-Smithy/engineering-hub/issues/197#issuecomment-7238394598), [Nox PR82 review 6097403618](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/pull/82#pullrequestreview-6097403618) (`N79-01_SOURCE=PASS`, `N79-01_EVIDENCE=HOLD`, `N79-02..04=PASS`).  
**Frozen Candidate (Unchanged):** Draft PR #82 `candidate/ot-persistent-deployment-r4` @ `d55228cba9fca025a5b8bcf9494df5da879b7995` (tree `703f093c6be9d9ff16be4dd14c960d6ab6726a0b`, launcher SHA-256 `800849047fe4ea4cd5cf26f1308fe7aa42046642dba1ad82d6b081a724e1bef1`).  
**Original R4 Evidence Preserved:** Additive commit over `30d7ec08e105fb4f5b0cc5ff5f99ab009b9aa5a3` on `evidence/ot-persistent-r4-d55228cb`; no R5 successor, no executable source edits, no weakened trust boundary.

## External Evidence-Only Probe & Receipts

- **Inspectable probe source (outside package & candidate):** [probe.py](probe.py) (`SHA-256: 0de88668422bfdade1393fb5d071cae69681449dc6d22f8de4120c43d7968af5`)
  - Builds the real authenticated deployment package via `scripts/deployment/build-package.py` and invokes the unchanged `verified-install.py` via `TRUSTED_BOOT` without bypassing package verification or disposable guards.
  - Verifies exact candidate `HEAD` and `tree` SHA before and after execution.
  - Captures direct independent SQL observations at 4 points per cell (`clean_baseline`, `injected_pre_refusal`, `post_refusal`, `restored_baseline`) across:
    1. Injected drift state (`reloptions`, `pg_get_viewdef` SHA-256 under `search_path=pg_catalog`, `pg_rewrite` rule inventory/digest, `pg_database.dattablespace`, raw vs. filtered `pg_class.reltablespace` counts, unrelated `qa_unused_ts` presence);
    2. Complete ordered `public.migrations` ledger (or explicit `ABSENT` on fresh initial);
    3. Managed/legacy role attributes (`has_password`/`is_scram` booleans only — zero verifiers), `pg_auth_members` memberships, and effective DB/schema authority;
    4. `deployment_control` schema/table absence (initial) or exact row contents digest (registered);
    5. Preserved `users`/`employees`/`departments` counts/digests plus live Laravel `Hash::check` + `Google2FA::verifyKey` password/MFA/TOTP verification in `upgrade` mode;
    6. Unrelated `unrelated_service` database/role/grant state digest in `upgrade` mode.
- **Windows PG 16.15 (`160015`) receipt:** [supplemental-windows.json](supplemental-windows.json) (`SHA-256: 3b7f7817b2917a8c0efa25f56e813273e315f78c0407bf0c9e56d74a793b70e6`) — **`16 / 16` cells PASS**.
- **Linux PG 16.16 (`160016`) receipt:** [supplemental-linux.json](supplemental-linux.json) (`SHA-256: 6dc28fe276d1584a7ae8eb3a82ff6876e4084c459ba6da256d527a4e958e00c9`) — **`16 / 16` cells PASS**, executed on GitHub-hosted `ubuntu-24.04` + `postgresql-16` ([run 46139522420](https://github.com/Project-Intra-Smithy/ONE-TALIBON-intra.office.system-STABLE-v1-10-18-2026/actions/runs/46139522420), artifact `15261142784` `r4-supplemental-linux-d55228cb`, runner branch `evidence/ot-persistent-r4-d55228cb-linux-probe` @ `1e19fa668d5a82b956bd638f693462d5ad36d3bb` checking out exact frozen `d55228cb`).

## 32-Cell Matrix Summary (16 Windows PG16.15 + 16 Linux PG16.16)

Every cell verified: `exit_code == 1`, `refused_in_preflight == true` (`Phase: preflight;`), exact `expected_diagnostic` matched, `injection_applied == true`, all 6 `pre_post_refusal_unchanged` checks `true`, and `restored_equals_clean_baseline == true`:

| Mode | Phase | Injection | Expected Diagnostic Verified (Win + Lin) | Result |
|---|---|---|---|---|
| `fresh` | `initial` | `system_view_security_options` | `Unsupported stock system-catalog deviation.` | PASS (2/2) |
| `fresh` | `initial` | `system_view_definition` | `Unsupported stock system-catalog deviation.` | PASS (2/2) |
| `fresh` | `initial` | `system_rewrite_rule` | `Unsupported stock system-catalog deviation.` | PASS (2/2) |
| `fresh` | `initial` | `default_database_tablespace` | `Unsupported ONE TALIBON PG16 object family: user_tablespaces` | PASS (2/2) |
| `fresh` | `registered` | `system_view_security_options` | `Persistent security contract drift: system_relation_security` | PASS (2/2) |
| `fresh` | `registered` | `system_view_definition` | `Persistent security contract drift: system_relation_security` | PASS (2/2) |
| `fresh` | `registered` | `system_rewrite_rule` | `Persistent security contract drift: system_rewrite_security` | PASS (2/2) |
| `fresh` | `registered` | `default_database_tablespace` | `Unsupported ONE TALIBON PG16 object family: user_tablespaces` | PASS (2/2) |
| `upgrade` | `initial` | `system_view_security_options` | `Unsupported stock system-catalog deviation.` | PASS (2/2) |
| `upgrade` | `initial` | `system_view_definition` | `Unsupported stock system-catalog deviation.` | PASS (2/2) |
| `upgrade` | `initial` | `system_rewrite_rule` | `Unsupported stock system-catalog deviation.` | PASS (2/2) |
| `upgrade` | `initial` | `default_database_tablespace` | `Unsupported ONE TALIBON PG16 object family: user_tablespaces` | PASS (2/2) |
| `upgrade` | `registered` | `system_view_security_options` | `Persistent security contract drift: system_relation_security` | PASS (2/2) |
| `upgrade` | `registered` | `system_view_definition` | `Persistent security contract drift: system_relation_security` | PASS (2/2) |
| `upgrade` | `registered` | `system_rewrite_rule` | `Persistent security contract drift: system_rewrite_security` | PASS (2/2) |
| `upgrade` | `registered` | `default_database_tablespace` | `Unsupported ONE TALIBON PG16 object family: user_tablespaces` | PASS (2/2) |

## Reconciliation of Raw Tablespace Count `50` vs. Filtered Count `0`

Across all 8 `default_database_tablespace` cells (4 Windows PG 16.15 + 4 Linux PG 16.16):
- `target_database_tablespace` = `qa_target_ts` (both pre-refusal and post-refusal)
- `raw_reltablespace_nonzero_count` = **`50`** (stock PostgreSQL 16 `pg_global` shared cluster catalogs)
- `filtered_custom_reltablespace_count` (`pg_class JOIN pg_tablespace WHERE spcname NOT IN ('pg_default','pg_global')`) = **`0`** (confirming purely implicit relation placement via `pg_database.dattablespace`)
- `unrelated_unused_tablespace_present` (`qa_unused_ts`) = **`true`** across all 32 cells (confirming unrelated cluster tablespaces are preserved untouched).

Zero raw secrets, passwords, or SCRAM verifiers appear in any published file (`0` secret/verifier scan hits).
