# RC1 — MAIN-ONLY CLASSIFICATION

Repository:

`Kirch-Nairu/Talibon-Sales-Prototype`

Integration branch:

`KIRCH-TALIBON-RC1-MAIN-CONSOLIDATION`

RC1 start authority:

`2410bb739993366bdb0e214754343011cc0bed7a`

Verified pre-promotion main:

`9cc1b50b28762402c3b24a721cd5ba7ae961817c`

Live merge base between reviewed DA1 integration and current main:

`d673925233b6728794d302650d026d3d758227b9`

## Live main-only inventory

The live merge-base-to-main comparison is 16 commits ahead / 0 behind and contains exactly nine effective files.

All nine are classified **RETAIN**:

| File | Classification | Reason |
| --- | --- | --- |
| `config/public_portal.php` | RETAIN | Config-backed prototype/sample public content only; explicitly labels non-official data and does not introduce internal data access. |
| `resources/css/public-portal.css` | RETAIN | Scoped public-portal presentation/responsive/accessibility styling. |
| `resources/js/components/public/PublicFooter.tsx` | RETAIN | Public footer/contact/employee-entry presentation only. |
| `resources/js/components/public/PublicHeader.tsx` | RETAIN | Public masthead, search, responsive navigation, appearance, and employee-entry presentation only. |
| `resources/js/components/public/PublicHero.tsx` | RETAIN | Public civic hero presentation only. |
| `resources/js/components/public/PublicQuickAccess.tsx` | RETAIN | Public quick-access presentation; unavailable destinations remain non-clickable/static. |
| `resources/js/components/public/PublicServices.tsx` | RETAIN | Public information/service directory presentation with prototype-data honesty. |
| `resources/js/components/public/types.ts` | RETAIN | Types for the retained public config contract only. |
| `resources/js/pages/Public/Home.tsx` | RETAIN | Public homepage composition only; consumes the public config contract. |

## Public/private boundary

The existing `PublicPortalController` remains authoritative and renders `Public/Home` from `config('public_portal')` only. No main-only change introduces WorkflowTransaction, Correspondence, Employee, AuditLog, private Document, internal Reports, HR, or other operational payload access.

## Reconciliation precedence

For the nine files above, current-main public work is retained.

For every other file, the reviewed RC1/DA1 line remains authoritative.

No authorization, CAL1, BH1, DA1 NAV-01..04, internal shell/navigation, H1, MP0, migration, or dependency change is authorized by this classification.

## Other classifications

SUPERSEDED: none.

REJECT: none.
