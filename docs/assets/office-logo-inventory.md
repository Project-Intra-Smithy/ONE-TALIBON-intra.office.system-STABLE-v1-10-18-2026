# Office logo integration inventory

2026-10-20. AJ explicitly authorized frontend integration of the ten supplied office-logo candidates, including confidently matched naming variants. [Authorization checkpoint](https://github.com/Project-Intra-Smithy/FRONTEND-TEAM-ONE-TALIBON-INTRA-OFFICE-WORKSPACE/issues/39#issuecomment-6292080432); branch START memory `72c635e5ba8107e137ca5e61a3cb5df0de55fc49`. This supersedes the previous zero-mapping review checkpoint. **Official LGU branding approval remains pending for every asset.** No municipal endorsement or production release is implied.

All 14 supplied images inspected; MSWDO also inspected full-size. Names and stable identifiers matched against canonical backend catalog `2145fcb797c4cd5e173dad24b7da876a93f2814d` (40/14 unchanged). Nine assets activated for frontend review:

| Public asset URL | Canonical backend code | Catalog key | Visual identity / variant |
|---|---|---|---|
| `/logos/MPDO.png` | MPDO | FOCAL-001 | Municipal Planning and Development Office |
| `/logos/MAccO.png` | ACCOUNTING | FOCAL-009 | Municipal Accounting Office; not Internal Auditing |
| `/logos/MTO.png` | TREASURY | FOCAL-010 | Municipal Treasury; not Tourism |
| `/logos/MSWDO.jpg` | MSWDO | FOCAL-016 | Municipal Social Welfare and Development Office, LGU-Talibon |
| `/logos/MAO.jpg` | AGRI | FOCAL-018 | Office of the Municipal Agriculturist |
| `/logos/MPESO.jpg` | PESO | FOCAL-022 | Municipal Public Employment Service Office |
| `/logos/MEDIPO.png` | LEDIPO | FOCAL-024 | Economic Development and Investment Promotion; Municipal/Local naming variant |
| `/logos/MMAO.png` | MARKET | FOCAL-035 | Market Administration / Office of the Market Supervisor; not Municipal Administrator |
| `/logos/MO-TTMO (1).png` | null | FOCAL-036 | Talibon Traffic Management Unit / Traffic and Management Office; not TITT |

MSWDO is explicitly mapped to `/logos/MSWDO.jpg`. Exact catalog keys also resolve when backingDepartmentCode is null, without inventing operational codes. A supplied code/key disagreement remains neutral. Matching does not use fuzzy names or guessed aliases.

Unmatched: `MAccO-IAU (1).png` says Municipal Internal Auditing Unit; no corresponding canonical catalog entry is established. Do not reuse Accounting. Leave it untracked/unmapped until the backend/LGU identity is established. Four municipal backdrop/profile images remain excluded from office mapping and publication.

OfficeLogo preserves 36/48/64px dimensions, object-contain, accessible alt/fallback labels, broken-image fallback and reset on source change. Index changes only the logo's catalog-key prop; white/green UI, search, 40/14 props and exact `/records` guard remain unchanged. No backend/Auth/unrelated file changes.

## Asset integrity

| Asset | SHA256 |
|---|---|
| MPDO.png | `771a9a3ec03546210ad933427e0359b1b257b0640d9f5850ad29649190832d81` |
| MAccO.png | `684cc37b1d45537753e5614480bd517e5562e06d33e0ca6fb7278fb26d5b903e` |
| MTO.png | `feaae68b16a840d4af7f6862b8559a62bca400371fbca77b2ab7d17a29e51943` |
| MSWDO.jpg | `33cd1dd4738e9780f636197226fba8f15b48a6ebadf4b39c08df4980fc8fa88b` |
| MAO.jpg | `91a1b51f2f02a819f29b8259d986e6aeeba4e36027a742eb0881c4037966718e` |
| MPESO.jpg | `43333d30fd3a73bae269dbb6dc133c9263f1175628bd384f97e09b256f22d1e4` |
| MEDIPO.png | `6790ea53e85ad7cc159916a3d17592633b785f91702aafc5c74eb7ffea1dd9c1` |
| MMAO.png | `70ee3da65eb8a23a8aba381c5e1e20746b00a395c7b7cf9d4a7ad1556fd80a7d` |
| MO-TTMO (1).png | `2300edbf6a524f38648b82dce91ce3e91a2d1ea7bbc294137771d7c3004fc03c` |

NEXT: verify/publish the scoped follow-up; Kirch/LGU retain official branding and runtime acceptance gates. Canonical-main continuity synchronization remains held.

## Verification

Clean PR40 baseline plus exactly this follow-up: TypeScript and production build exit 0; full suite 52/52 PASS. Nine real public images load at 320/390/768/1024/1440 with 48px containers, object-contain, accessible names, no overflow, 40 cards/14 groups, search/filter/keyboard behavior, and MSWDO 404 fallback. Desktop/mobile screenshots inspected; all 28 Records-negative cases pass. Exact guard unchanged. Whole-tree diff check PASS. Logs/builds/contact sheet remain local and excluded. An initial unchanged-baseline run had one unrelated Personal Tasks mount timeout (50/51); final complete suite passed without altering Tasks or timeouts.

Authenticated backend testing NOT RUN; official LGU branding approval and canonical-main continuity remain pending. AJ authorization covers frontend integration only. Existing unrelated dirty Auth edits and their known Google assertion mismatch remain outside the clean candidate. No merge/deploy.
