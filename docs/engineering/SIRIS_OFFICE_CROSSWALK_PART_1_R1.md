# Siris provisional office-code inventory — part 1/2

**Source:** ec17cbfab2a52b55e4f3f45bd5ec199df3858d66. **No LGU verification, no routing/permission grants.** This table is an exact code crosswalk from `config/office_directory.php` and `MunicipalityStructureSeeder.php`, not an official staff directory. [Hub takeover #162](https://github.com/Project-Intra-Smithy/engineering-hub/issues/162), [summary and rules](SIRIS_OFFICE_DIRECTORY_AUTHORITY_RECONCILIATION_R1.md). Total 48 rows across both parts: 40 focal displays + 8 seeded-only offices.

| Key | Display group | Focal display title | Backend code | Seed department | Branch | Status |
|---|---|---|---|---|---|---|
| FOCAL-001 | Planning | Municipal Planning & Development Office | MPDO | Municipal Planning and Development Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-002 | Executive | Office of the Municipal Mayor | MAYOR | Office of the Municipal Mayor | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-003 | Legislative | Vice Mayor & Sangguniang Bayan | — | — | — | NO_BACKEND_CODE |
| FOCAL-004 | Legislative | Secretary to the Sangguniang Bayan | SB_SECRETARY | Office of the Secretary to the Sangguniang Bayan | legislative | CODE_MATCH_UNVERIFIED |
| FOCAL-005 | Executive | Municipal Administrator’s Office | ADMIN | Office of the Municipal Administrator | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-006 | Infrastructure | Municipal Engineering Office | ENG | Municipal Engineering Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-007 | Infrastructure | Office of the Building Official | — | — | — | NO_BACKEND_CODE |
| FOCAL-008 | Finance | Municipal Budget Office | BUDGET | Municipal Budget Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-009 | Finance | Municipal Accounting Office | ACCOUNTING | Municipal Accounting Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-010 | Finance | Municipal Treasurer’s Office | TREASURY | Municipal Treasury Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-011 | Finance | Municipal Assessor’s Office | ASSESSOR | Municipal Assessor's Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-012 | Administration | Human Resource Management Office | HRMO | Human Resource Management Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-013 | Administration | General Services Office | GSO | Municipal General Services Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-014 | Administration | Bids & Awards Committee Secretariat | BAC | Bids and Awards Committee | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-015 | Social | Municipal Civil Registrar | CIVIL_REG | Municipal Civil Registrar / Local Civil Registry | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-016 | Social | Municipal Social Welfare & Development Office | MSWDO | Municipal Social Welfare and Development Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-017 | Social | Municipal Health Office / Rural Health Unit | HEALTH | Municipal Health Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-018 | Economic | Municipal Agriculture Office | AGRI | Municipal Agriculture Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-019 | Environment | Municipal Environment & Natural Resources Office | MENRO | Municipal Environment and Natural Resources Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-020 | Environment | Municipal Disaster Risk Reduction & Management Office | MDRRMO | Municipal Disaster Risk Reduction and Management Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-021 | Economic | Municipal Tourism Office | TOURISM | Municipal Tourism Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-022 | Economic | Public Employment Service Office | PESO | Public Employment Service Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-023 | Economic | Business Permits & Licensing Office | BPLO | Business Permit and Licensing Office / BPLS | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-024 | Economic | Local Economic Development & Investment Promotion | LEDIPO | Local Economic Development and Investment Promotion Office | executive | CODE_MATCH_UNVERIFIED |

All values provisional. HRMO and authorized process owners decide official classification, office hierarchy, active status, employee membership, contact data, visibility and operational routing. Keep actual personnel records in a private certified source, not GitHub.
