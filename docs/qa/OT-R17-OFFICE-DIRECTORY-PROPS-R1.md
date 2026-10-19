# OT-R17 OFFICE DIRECTORY PROPS R1 — FROZEN INTERFACE

Mission: `OT-R17-A1-LUCIEN1-40-OFFICE-CATALOG-BACKEND-R1`
Source: backend application `88f3d6bd6258d502f1b5e6bf323bcf22619f5f8d`; PR92 wrapper `964ee473e226bcf320c7c45c44e1e06f1e3abcc8` (workflow-only delta).
Status: LOCAL_DRAFT / START_SYNC_REQUIRED / SOURCE_WRITE_HOLD; NOT merged, not runtime-accepted.

## Sole content source
- `config/office_directory.php`, generated from attached `R17_FOCAL_40_OFFICE_CATALOG_WITH_SERVICES.json` SHA256 `dea98decca5c28ce6a1f0147f95e81ba70bcb0f3ab6755b36095a0d98dd07e6a`.
- 40 ordered, unique FOCAL keys; 14 groups in first-occurrence source order, counts Planning=1, Executive=2, Legislative=2, Infrastructure=2, Finance=4, Administration=4, Social=9, Economic=8, Environment=2, Education=1, Transport=1, National Agency=1, Community=1, Community Partners=2.
- Canonical config entries JSON SHA-256 `bba6745fbb981cf47cd91abf9391cfe8cf2f8db1302862899050e15d7e87c768` (UTF-8, no extra JSON whitespace, insertion-order keys preserved).

## Consumer contract for Account 2 / Lucien (2)
```ts
type OfficeDirectoryEntry = {
  key: string;
  group: string;
  shortName: string;
  name: string;
  responsibility: string;
  backingDepartmentCode: string | null;
  recordsHref: string | null;
  routable: boolean;
};
type OfficeDirectoryProps = {
  directoryEntries: OfficeDirectoryEntry[];
  directoryGroups: string[];
};
```

`GET /departments?view=directory` renders `Departments/Index` with existing `departments`, `summary` plus the new props for an already authenticated active/MFA-assured actor. The default department head `GET /departments` still renders `Departments/Workspace`; non-head default remains Index. No route or middleware changes.

Mapping only for `mapping_status=MATCH`, exact code when a backing DB Department exists. `routable` reflects existing Department `is_active && is_routable` and **does not itself authorize sending work**; any workflow receiver must still be vetted by existing server action. For absent Departments and all composite/aggregate/unmapped entries, `backingDepartmentCode=null`, `routable=false`. All `recordsHref=null` (no office-specific authorized URL verified). Index never adds staffWorkload/recentActivity. Existing `summary.offices` is the backend operational count, not the displayed catalog count; use `directoryEntries.length` for 40-card label.

Do not implement a new API, 40 backend offices, a one-to-many Vice Mayor/SB receiver, a CSO/PO/DILG principal, fake per-office records, or automatic public/LGU permission. Consumer owns filtering client-side. Server returns all 40.
