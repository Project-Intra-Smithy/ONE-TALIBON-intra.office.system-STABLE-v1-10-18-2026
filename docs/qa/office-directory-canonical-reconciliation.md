# Canonical backend catalog reconciliation

Read-only verification, 2026-10-20. Backend candidate `2145fcb797c4cd5e173dad24b7da876a93f2814d`, `config/office_directory.php`; 40 unique FOCAL keys and 14 groups. This is the proposed backend UAT contract, not released main or municipal organizational approval.

Producer `OfficeDirectoryCatalog::props()` reads that config, resolves exact live Department codes, returns null Records destinations, and adds `directoryEntries` / `directoryGroups`. Candidate controller preserves the default head Workspace and selects the catalog on explicit `?view=directory`. Live backend main `8a130e151fdf79e87e134a5d26e58667889f0a7e` does not yet emit those catalog props.

Frontend reads these props and computes counts; no production frontend dataset. Existing 40/14 automated fixtures are synthetic shape tests, not independent proof of real Laravel payloads. Backend database-backed projection and authenticated delivery remain NOT RUN.

| Group | Entries |
|---|---:|
| Planning | 1 |
| Executive | 2 |
| Legislative | 2 |
| Infrastructure | 2 |
| Finance | 4 |
| Administration | 4 |
| Social | 9 |
| Economic | 8 |
| Environment | 2 |
| Education | 1 |
| Transport | 1 |
| National Agency | 1 |
| Community | 1 |
| Community Partners | 2 |

| Key | Group | Short name | Config backend code (not a permission) |
|---|---|---|---|
| FOCAL-001 | Planning | MPDO | MPDO |
| FOCAL-002 | Executive | Mayor’s Office | MAYOR |
| FOCAL-003 | Legislative | Vice Mayor / SB | null |
| FOCAL-004 | Legislative | SB Secretariat | SB_SECRETARY |
| FOCAL-005 | Executive | Municipal Administrator | ADMIN |
| FOCAL-006 | Infrastructure | Engineering | ENG |
| FOCAL-007 | Infrastructure | Building Official | null |
| FOCAL-008 | Finance | Budget Office | BUDGET |
| FOCAL-009 | Finance | Accounting | ACCOUNTING |
| FOCAL-010 | Finance | Treasurer | TREASURY |
| FOCAL-011 | Finance | Assessor | ASSESSOR |
| FOCAL-012 | Administration | HRMO | HRMO |
| FOCAL-013 | Administration | GSO | GSO |
| FOCAL-014 | Administration | BAC Secretariat | BAC |
| FOCAL-015 | Social | Civil Registrar | CIVIL_REG |
| FOCAL-016 | Social | MSWDO | MSWDO |
| FOCAL-017 | Social | MHO / RHU | HEALTH |
| FOCAL-018 | Economic | Agriculture | AGRI |
| FOCAL-019 | Environment | MENRO | MENRO |
| FOCAL-020 | Environment | MDRRMO | MDRRMO |
| FOCAL-021 | Economic | Tourism | TOURISM |
| FOCAL-022 | Economic | PESO | PESO |
| FOCAL-023 | Economic | BPLO | BPLO |
| FOCAL-024 | Economic | LEDIPO | LEDIPO |
| FOCAL-025 | Economic | Economic Enterprises | null |
| FOCAL-026 | Administration | ICT / MIS | null |
| FOCAL-027 | Social | GAD Focal Point | null |
| FOCAL-028 | Social | LYDO | null |
| FOCAL-029 | Social | PDAO | null |
| FOCAL-030 | Social | OSCA | null |
| FOCAL-031 | Social | Municipal Nutrition Office | null |
| FOCAL-032 | Social | MPRAO | null |
| FOCAL-033 | Economic | TITT | TRANSPORT |
| FOCAL-034 | Education | TPC | TPC |
| FOCAL-035 | Economic | Market Office | MARKET |
| FOCAL-036 | Transport | Traffic and Management Office | null |
| FOCAL-037 | National Agency | MLGOO / DILG | null |
| FOCAL-038 | Community | Barangay Affairs | null |
| FOCAL-039 | Community Partners | CSOs | null |
| FOCAL-040 | Community Partners | POs | null |

Config SHA256: `5cb8a6e60f67563a99807989a5364f3156e856729f5d50fb4902fc3b653df174`.

Dependencies: [backend #93](https://github.com/Project-Intra-Smithy/Talibon-Sales-Prototype/issues/93), [frontend #39](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/39).
