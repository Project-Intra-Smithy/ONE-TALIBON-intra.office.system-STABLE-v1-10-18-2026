# S1-W04C — COMPACT WORKSPACE HEADER + DENSITY LOCK

Date: 2026-09-30
Program: SEPTEMBER 30 PROTOTYPE SHOWCASE PREPARATION
Repository: Kirch-Nairu/Talibon-Sales-Prototype
Technical Authority: Kirch Ivan Balite
Governing lane: S1-W04C — FUTURE SYSTEM FULL-PROTOTYPE SURFACES

## 1. PURPOSE

This directive prevents recurring vertical-space waste and generic hero/header inflation across selected municipal-system workspaces.

The remaining W04C work is now under time pressure. Product identity is already being established through distinct workspace architecture, information hierarchy, terminology, and interaction models. Future workers must not spend excessive vertical space repeatedly explaining what page the user is on.

## 2. PRIMARY RULE

**Use horizontal space before consuming vertical space.**

A selected municipal workspace should expose useful operational content as high in the viewport as practical.

The header exists to establish identity and compact context. It is not a marketing hero.

## 3. SELECTED-SYSTEM SHELL

When a specific Future Integration system is selected:

- the broad `Future Integrations` catalog header must not remain stacked above the workspace;
- the selected product becomes the primary page;
- navigation back to the catalog should use a compact in-product return control;
- avoid a separate oversized navigation row when the return control can be incorporated compactly with the workspace header or immediately adjacent to it.

## 4. DESKTOP HEADER COMPOSITION

Preferred desktop composition:

- LEFT: product family/eyebrow, product title, one concise office/context line;
- RIGHT: presentation boundary, year/period/reference context, and only the few compact operational counters or status markers that materially improve the workspace;
- tabs or primary workspace navigation should follow immediately after the header.

Use layouts such as:

`minmax(0,1fr) + bounded right region`

rather than centered stacked hero composition.

Do not create large blank zones merely to keep the right side visually sparse.

## 5. VERTICAL-DENSITY STANDARD

Avoid:

- giant hero sections;
- large top/bottom padding around simple titles;
- repeated title/subtitle blocks;
- generic catalog headers above selected products;
- duplicated KPI/status strips when equivalent context can live in the header;
- ornamental whitespace with no information or interaction value;
- fixed header heights that create blank space at common desktop widths.

Prefer:

- compact padding;
- tight title/subtitle grouping;
- right-side contextual use of available horizontal space;
- immediate transition from header to tabs/work surface;
- content visible above the fold.

## 6. PRODUCT-IDENTITY RULE

Workers must not compensate for weak product identity by making headers larger.

Product recognition must come primarily from the workspace itself.

Examples already accepted:

- Budget: peso values, approved/obligated/available balance, utilization analysis, budget register;
- Citizen Action: queue navigation, priority inbox, routing/status, desk snapshot;
- GIS: layer rail, map/spatial canvas, selected-location context.

The title may identify the system, but the composition must do the heavier recognition work.

## 7. HEADER CONTENT LIMIT

A header may contain:

- one small product-family/eyebrow label;
- one main title;
- one concise context/office line;
- a compact presentation-environment boundary;
- one compact period/reference marker such as `FY 2026` where appropriate;
- a small set of high-value operational counters only when they eliminate a redundant summary row.

Do not place full dashboard sections inside the header.

## 8. RESPONSIVE RULE

Desktop:

- use the full horizontal canvas;
- keep the header compact;
- avoid large empty right-side regions.

Tablet:

- allow right-side context/counters to wrap without introducing excessive vertical padding.

Mobile:

- stack naturally;
- no fixed height;
- no horizontal overflow from header content;
- preserve the same information priority.

## 9. LOCKED REFERENCES

### FUT-02 Budget & Obligation Monitoring

Visually accepted on 2026-09-30.

The accepted financial-monitoring pattern uses:

- compact financial identity header;
- right-side `FY 2026` and presentation-environment context;
- immediate financial summary;
- immediate analytical/register work surface.

Do not enlarge its header unless a concrete defect is identified.

### FUT-07 Citizen Request / Action Center

Visually accepted on 2026-09-30.

The accepted service-desk pattern uses:

- compact product header;
- high-value desk counters in previously unused right-side header space;
- no redundant status strip beneath tabs;
- immediate queue/inbox/snapshot work surface.

## 10. ACCEPTANCE TEST

For every remaining FUT workspace, ask:

1. Is the header compact enough that useful domain content appears early in the viewport?
2. Is unused horizontal header space being wasted while vertical space grows?
3. Is any summary/status row duplicating information that could live compactly in the header?
4. If the title were hidden, would the workspace still be recognizable from its composition?

If the answer to 1 or 4 is no, or to 2 or 3 is yes without a clear product reason, the layout is not ready to lock.

## 11. SPEED / SHOWCASE RULE

Do not reopen a visually accepted header for aesthetic experimentation.

For remaining systems, default to this compact-header standard immediately so header-density rework does not become a repeated cycle.

Under showcase time pressure, spend design effort on the domain-specific work surface, not on oversized introductory chrome.

## 12. GOVERNING SUMMARY

**Compact header. Immediate work surface. Use horizontal space. Product identity comes from the workspace, not from oversized introductory chrome.**
