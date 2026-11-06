# Siris provisional office-code inventory — part 2/2

**Source:** ec17cbfab2a52b55e4f3f45bd5ec199df3858d66. **No LGU verification, no routing/permission grants.** This table is an exact code crosswalk from `config/office_directory.php` and `MunicipalityStructureSeeder.php`, not an official staff directory. [Hub takeover #162](https://github.com/Project-Intra-Smithy/engineering-hub/issues/162), [summary and rules](SIRIS_OFFICE_DIRECTORY_AUTHORITY_RECONCILIATION_R1.md). Total 48 rows across both parts: 40 focal displays + 8 seeded-only offices.

| Key | Display group | Focal display title | Backend code | Seed department | Branch | Status |
|---|---|---|---|---|---|---|
| FOCAL-025 | Economic | Municipal Economic Enterprises | — | — | — | NO_BACKEND_CODE |
| FOCAL-026 | Administration | ICT / Management Information Systems | — | — | — | NO_BACKEND_CODE |
| FOCAL-027 | Social | Gender & Development Focal Point System | — | — | — | NO_BACKEND_CODE |
| FOCAL-028 | Social | Local Youth Development Office / Focal Point | — | — | — | NO_BACKEND_CODE |
| FOCAL-029 | Social | Persons with Disability Affairs Office / Focal Point | — | — | — | NO_BACKEND_CODE |
| FOCAL-030 | Social | Office for Senior Citizens Affairs | — | — | — | NO_BACKEND_CODE |
| FOCAL-031 | Social | Municipal Nutrition Office | — | — | — | NO_BACKEND_CODE |
| FOCAL-032 | Social | Municipal Poverty Reduction Action Office | — | — | — | NO_BACKEND_CODE |
| FOCAL-033 | Economic | Talibon Integrated Transport Terminal | TRANSPORT | Talibon Integrated Transport Terminal Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-034 | Education | Talibon Polytechnic College | TPC | Talibon Polytechnic College | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-035 | Economic | Office of the Market Supervisor | MARKET | Municipal Market Office | executive | CODE_MATCH_UNVERIFIED |
| FOCAL-036 | Transport | Talibon Traffic and Management Office | — | — | — | NO_BACKEND_CODE |
| FOCAL-037 | National Agency | Municipal Local Government Operations Office / Department of the Interior and Local Government | — | — | — | NO_BACKEND_CODE |
| FOCAL-038 | Community | Barangay Affairs | — | — | — | NO_BACKEND_CODE |
| FOCAL-039 | Community Partners | Civil Society Organizations | — | — | — | NO_BACKEND_CODE |
| FOCAL-040 | Community Partners | People’s Organizations | — | — | — | NO_BACKEND_CODE |
| BACKEND_ONLY | executive | — | INTERNAL_AUDIT | Internal Audit Service | executive | NO_FOCAL_DISPLAY |
| BACKEND_ONLY | executive | — | INFO | Municipal Information Office | executive | NO_FOCAL_DISPLAY |
| BACKEND_ONLY | executive | — | POPULATION | Municipal Population Office | executive | NO_FOCAL_DISPLAY |
| BACKEND_ONLY | executive | — | DPO | Data Protection Office | executive | NO_FOCAL_DISPLAY |
| BACKEND_ONLY | executive | — | ZONING | Zoning Administration | executive | NO_FOCAL_DISPLAY |
| BACKEND_ONLY | executive | — | CTC | Community Tax Certificate Function | executive | NO_FOCAL_DISPLAY |
| BACKEND_ONLY | legislative | — | VICE_MAYOR | Office of the Municipal Vice Mayor | legislative | NO_FOCAL_DISPLAY |
| BACKEND_ONLY | legislative | — | SB | Sangguniang Bayan Office | legislative | NO_FOCAL_DISPLAY |

All values provisional. HRMO and authorized process owners decide official classification, office hierarchy, active status, employee membership, contact data, visibility and operational routing. Keep actual personnel records in a private certified source, not GitHub.
