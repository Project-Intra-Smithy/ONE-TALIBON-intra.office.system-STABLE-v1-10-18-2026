# Siris — Department Directory reconciliation R1

**Authority:** [Engineering Hub #162](https://github.com/Project-Intra-Smithy/engineering-hub/issues/162) and [LGU decisions #83](https://github.com/Project-Intra-Smithy/engineering-hub/issues/83). **Source:** `main@ec17cbfab2a52b55e4f3f45bd5ec199df3858d66`. No official municipality approval is implied.

## Three distinct source inventories

| Source | Observed | Meaning |
|---|---:|---|
| `config/office_directory.php` | 40 entries | Provisional focal-person *display* catalog |
| `database/seeders/MunicipalityStructureSeeder.php` | 33 entries | Local demonstration/backend department structure |
| `config/office_identity.php` | 0 official emails | No certified official office-email registry |

Code comparison: **25** focal entries map to existing seeded department codes; **15** display entries have no backend code; **8** seeded department codes are not listed in focal display. Thus **48** reconciliation rows (40 focal rows + 8 unmatched seeded codes), **not** 48 official routable offices. The eight backend-only codes are `INTERNAL_AUDIT`, `INFO`, `POPULATION`, `DPO`, `ZONING`, `CTC`, `VICE_MAYOR` and `SB`.

The authoritative backend is not a clone of the 40 display cards. `OfficeDirectoryCatalog` returns display-only entries without records links; `Department::activeRoutable()` applies separately to operational departments. `EmployeeDirectoryController` reads active `Employee` records, not focal cards. Frontend labels, displayed responsibilities, user accounts and technical routing must remain separate.

## LGU-required validation
For every row, HRMO/official office owner confirms current office name, acronym, code, branch, parent, office/unit/partner distinction, active status, effective date, public display permission and approved contact method. A distinct records/process owner confirms whether an office may receive or authorize actual Work Requests/Correspondence; no automatic grant is permitted. Maintain an approval source identifier and a decision owner/date. Keep any personal employee roster in a controlled private location, outside source control.

**Required intake result:** corrected organizational reference, unresolved name/code crosswalk, explicit disabled/partner-only rows, verified operational/routable office subset, contact registry, and staff-to-office reconciliation. Submit an import/migration proposal only if the current approved subset requires actual runtime changes. Confirm negative role/office tests, rollback and source provenance before changing the database.

**Release boundary:** a valid directory view does not prove that the municipality has accepted process, authorization, signatory or document-custody policies. Do not fabricate offices, emails, employee identities or map files to meet November 20. Refer to the private master handoff ZIP for the editable 48-row reconciliation workbook and blank HRMO intake fields; the ZIP is not yet hosted in a verified remote location.

**Status:** `SOURCE_CODE_COUNTS_VERIFIED / OFFICIAL_DIRECTORY_INPUT_PENDING / PERMISSIONS_UNCHANGED`.
