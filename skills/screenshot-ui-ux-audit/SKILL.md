---
name: screenshot-ui-ux-audit
description: >-
  Autonomous screenshot-driven UI/UX design system audit loop using independent, brand-new sub-agents per iteration.
  Forces exhaustive route & sub-route exploration, multi-fold progressive scrolling (for long pages & mobile views),
  strict 1:1 PC/Mobile viewport parity, deterministic screen capturing, and iterates until a 100/100 sign-off is achieved.
---

# Screenshot-Based Independent Sub-Agent UI/UX Audit Workflow

This skill guides an orchestrator agent through an autonomous, ultra-high-rigor UI/UX design system audit loop. It eliminates confirmation bias and visual blind spots by pairing:
1. **Mandatory Upfront Code Path & Sub-Route Exploration**: Complete discovery of all routes, sub-routes (e.g. `/fee/*` chart variants), nested tabs, modals, dialogs, drawers, and conditional states before capturing.
2. **Progressive Multi-Fold Vertical Scrolling (Desktop & Mobile)**: Overcoming "above-the-fold blindness" by capturing sequential viewport folds (`Fold1_Top`, `Fold2_Mid`, `Fold3_Bottom`) for long dashboards, ledgers, and 1-column mobile stacked layouts.
3. **Strict 1:1 PC/Mobile Viewport Parity**: Guaranteeing that every route, sub-route, chart view, and overlay captured on Desktop (1440×900) has an exact counterpart captured on Mobile (412×915).
4. **Zero-Tolerance Chart Data Label Anti-Collision Audit**: Strict detection of number collisions on top of chart bars (e.g. `$388$388$388` merging or adjacent labels with < 8px clearance), enforcing P0 defect logging and score deduction.
5. **Deterministic Screen Capturing**: Generating a project-tailored `capture-all-screenshots.mjs` script that purges old screenshots, enforces `scale: 'css'`, waits for animation & canvas settling, and validates non-zero file sizes.
6. **Independent Brand-New Reviewer Subagent Per Iteration**: Spawning a completely clean subagent in each round with zero conversational memory or bias.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTONOMOUS /goal AUDIT LOOP                           │
│                                                                             │
│   1. Explore ALL Code Paths (Routes, Sub-Routes, Modals, Drawers, Tabs)     │
│      -> Compile 1:1 PC/Mobile Parity Matrix & Multi-Fold Scroll Plan        │
│                           │                                                 │
│                           ▼                                                 │
│   2. Generate Tailored 'capture-all-screenshots.mjs'                        │
│      (Multi-fold scrolling, canvas settling, clean modal dismissals)        │
│                           │                                                 │
│                           ▼                                                 │
│   3. Purge Stale Images & Capture Fresh Multi-Viewport Screenshots          │
│      (Desktop 1440×900 & Mobile 412×915 across all folds & sub-routes)      │
│                           │                                                 │
│                           ▼                                                 │
│   4. Spawn BRAND-NEW Reviewer Subagent (Clean Transcript, Zero Bias)        │
│                           │                                                 │
│                           ▼                                                 │
│   5. Subagent Audits Visuals & Code -> Returns Scorecard + Defect Punch-List│
│      (Deep micro-typography check: zero overlapping numbers in charts)      │
│                           │                                                 │
│             ┌─────────────┴─────────────┐                                   │
│             ▼                           ▼                                   │
│  [Score < 100 / Defect Found]    [Score == 100 / Approved]                  │
│             │                           │                                   │
│             ▼                           ▼                                   │
│   6. Kill Previous Subagent      9. Finalize Sign-Off Report                │
│      (manage_subagents kill)        (README_UI_UX_SIGNOFF.md)               │
│             │                           │                                   │
│             ▼                           ▼                                   │
│   7. Remediate Code in Repo         <!-- GOAL_COMPLETE -->                  │
│             │                                                               │
│             ▼                                                               │
│   8. Verify Quality Gates                                                   │
│      (npm run lint && npm run build)                                        │
│             │                                                               │
│             └───────────► Re-capture & Re-loop                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Operational Rules

### 1. Mandatory Code Path & Sub-Route Exploration (Before Script Generation)
**NEVER write or execute a screenshot script blindly.**
Before generating `capture-all-screenshots.mjs`, the agent MUST systematically explore the target repository:
1. **Route & Page Hierarchy**:
   - Inspect router definitions (`App.tsx`, `routes.tsx`, `vue-router`, Next.js `app/` or `pages/`).
   - Identify **every** top-level view AND **every sub-route / deep link**.
   - *Example*: For `/fee`, check for sub-routes like `/fee/waterChart/`, `/fee/electricityChart/`, `/fee/gasChart/`, `/fee/totalChart/`, or `/fee/mortgage`. Do NOT stop at top-level `/fee`.
2. **Navigation & Interactive Triggers**:
   - Grep for navigation bars, tabs, bottom bars, drawer items, menus.
   - Enumerate all sub-tab switchers (e.g., month tabs, chart category switchers, preset chips).
3. **Overlays, Modals, Sheets & Drawers**:
   - Search for modal primitives: `Dialog`, `Modal`, `Sheet`, `Drawer`, `Popover`, `Menu`, `BottomSheet`.
   - Identify the trigger buttons (e.g. "Filter", "Manage Rules", "Settings", "Add Account", "AI Summary").
   - Identify the clean dismissal mechanism (`Escape` key, backdrop click, close button).
4. **Conditional & Edge States**:
   - Identify empty states, filtered views, row expansion, and secondary tabs.
5. **Compile a 1:1 Parity Matrix**:
   Document the complete inventory of screens ensuring strict parity between PC Desktop and Mobile before authoring the script.

---

### 2. Progressive Multi-Fold Vertical Scrolling (Desktop & Mobile)
**Capturing only the top fold (above-the-fold) creates severe visual blind spots.**
Modern web apps stack components vertically. On mobile (`412×915`), multi-column desktop layouts collapse into a single vertical column, stretching pages across 3 to 6 viewport heights!
1. **Multi-Fold Viewport Capturing**:
   - For long dashboards, ledgers, or analytics views where content exceeds the viewport height (`scrollHeight > innerHeight * 1.2`), the capture script MUST capture sequential viewport folds:
     - `_Fold1_Top.png`: Sticky headers, top summary KPIs, primary navigation.
     - `_Fold2_Middle.png`: Middle cards, interactive charts, filter chips, secondary widgets.
     - `_Fold3_Bottom.png` (or `_FoldN_*.png`): Data tables, breakdown summaries, pagination, footer actions.
2. **Why Viewport Folds Are Required**:
   - Full-page stitching (`fullPage: true`) alone can mask viewport-relative UI bugs (e.g., sticky headers overlapping content, floating action buttons obscuring data, bottom navigation bar safe-area clipping, touch target misalignments).
   - Viewport-level captures preserve the authentic ergonomic perspective of the user at each scroll position.
3. **Automated Scroll Helper**:
   The capture script should implement a reusable helper:
   ```javascript
   await captureFolds(page, '01_PC_Dashboard_Home', { maxFolds: 3, scrollOverlap: 0.15 });
   ```

---

### 3. Strict 1:1 Cross-Viewport Parity (Desktop <-> Mobile)
**Mobile must NEVER be a truncated subset of Desktop.**
A common anti-pattern is capturing 20 rich screenshots on PC, but only 5–8 basic overviews on Mobile. Mobile viewports are where over 80% of real-world layout defects, text clipping, and touch target violations occur.
1. **Mandatory 1:1 Parity**:
   Every route, sub-route, chart view, modal, drawer, and tab captured on PC MUST have an exact counterpart captured on Mobile.
   - PC side sheets (docked right) <-> Mobile bottom sheets (`anchor="bottom"` or full-screen).
   - PC dialogs <-> Mobile responsive dialogs.
   - PC sub-route charts (`/fee/waterChart/`, `/fee/electricityChart/`, etc.) <-> Mobile sub-route charts.
2. **Mobile Ergonomics Audit**:
   Verify bottom navigation pills, floating action buttons, touch targets (minimum 48×48dp), and safe-area padding (`env(safe-area-inset-bottom)`).

---

### 4. Zero-Tolerance Chart Number & Data Label Collision Audit
**Overlapping numbers on chart bars represent a critical defect in data legibility and visual craft.**
In multi-bar charts (such as 12 monthly bars in `/fee/*` utility charts), static value labels rendered above bars frequently collide into unreadable text blobs (e.g. `$388$388$388` where numbers merge horizontally, or `$216$220` where adjacent glyphs touch).
1. **Mandatory Label Clearance Inspection**:
   - The reviewer subagent MUST inspect the numeric values above every bar at 100% zoom.
   - Any two adjacent labels that overlap, touch, or have less than **8px horizontal clearance** between their bounding boxes constitute a **P0 / Blocker Visual Defect**.
2. **Automated Score Penalty & Iteration**:
   - If ANY data labels overlap or touch in any chart screenshot, Dimension 5 score is capped at **5 / 10 maximum**.
   - The subagent must return `### VERDICT: ITERATE_REQUIRED`.
3. **Prescribed Remediation Patterns**:
   - *Tooltip-First on Mobile*: On mobile screens (< 600px) or whenever `barWidth < labelWidth + 8px`, suppress static top labels and reveal exact amounts via elevated interactive tooltips on touch/hover.
   - *Selective / Peak Labeling*: Render labels only on max/min bars or when spacing permits clean clearance.
   - *Currency Symbol Removal*: Omit "$" prefix from bar tops when the Y-axis or card header already indicates currency, reducing label text width by 30%.

---

### 5. Canvas, Chart & Dynamic Animation Settling
Data visualization components (Chart.js, Recharts, ECharts, SVGs) animate dynamically on load:
1. **Network & Element Stabilization**:
   - Always call `waitForLoadState('networkidle')`.
   - Call `page.waitForSelector('canvas, svg, .MuiCard-root, tbody tr', { state: 'visible' })`.
   - Enforce a 600–800ms settling timeout before taking screenshots to allow bar/line transitions to complete.
2. **Interactive Chart Tooltip Capture**:
   - To audit tooltip design system compliance (frosted glass, contrast, typography), simulate mouse hover over chart data points to capture tooltips (`*_Chart_Elevated_Tooltip.png`).

---

### 6. Forced Fresh Screenshots (Zero Stale State)
Screenshots must reflect the exact, current state of the application:
1. **Directory Purge**: The capture script MUST purge existing PNGs in the review folder before writing new ones (`fs.unlinkSync` on all `*.png` files).
2. **Fresh Browser Context**: Create a new incognito-equivalent browser context (`browser.newContext({ deviceScaleFactor: 1 })`) with clean storage and cache.
3. **Scale: 'css'**: Always pass `scale: 'css'` to `page.screenshot()` to ensure 1:1 CSS pixel alignment on high-DPI displays.
4. **Integrity Validation**: The capture script must verify that every expected screenshot exists and is > 0 bytes before exiting.

---

### 7. Mandatory Brand-New Subagent Per Iteration
**NEVER reuse the same subagent conversation across iteration loops.**
- **Why**: Reusing an existing subagent via `send_message` pollutes context with prior prompts, rationalizations, and confirmation bias. The subagent tends to confirm the fix rather than re-evaluating the actual rendered pixels.
- **Enforcement**:
  1. Note the subagent `conversationId` upon receiving its audit report.
  2. Kill the subagent using `manage_subagents` with `Action: 'kill'`, `ConversationIds: [id]`.
  3. Apply code fixes in the repository.
  4. Run build and lint verification (`npm run lint && npm run build`, `0 warnings` enforced).
  5. Run `node capture-all-screenshots.mjs` to freshly re-capture all screens.
  6. Call `invoke_subagent` to spawn a **fresh, brand-new subagent** with no memory of prior iterations.
  7. The fresh subagent inspects the newly rendered PNG files and current codebase with zero bias.

---

## Step-by-Step Execution Guide

### Phase 1: Code Path Exploration & Parity Matrix
Run search tools (`grep_search`, `find_by_name`, `view_file`) across the target codebase to build the **1:1 Parity Matrix**:

```markdown
Discovered Route & Code-Path Inventory:
1. / (Dashboard Home)
   - Sections: Account Summary, Mortgage Teaser, Utility Cards, Recent Ledger
   - Multi-fold scroll: Top Fold, Mid Fold, Bottom Fold
   - Modal: Mortgage Calculator Dialog (Trigger: `[aria-label*="房贷"]`)
2. /transactions/ (Transactions Ledger)
   - Sections: Filter Toolbar, Summary Chips, Transaction Table, Pagination
   - Multi-fold scroll: Top Fold, Scrolled Table Fold
   - Drawer/Sheet: Filter Sheet (Trigger: `button:has-text("筛选")`)
   - Drawer/Sheet: AI Summary Sheet (Trigger: `button:has-text("AI 总结")`)
   - Drawer/Sheet: Account Filter Sheet (Trigger: `button:has-text("账户")`)
   - Modal: Spending Charts Modal (Trigger: `button:has-text("图表")`)
   - Modal: Rule Management Modal (Trigger: `button:has-text("规则")`)
   - Popover: Row Action Popover (Trigger: `tbody tr:first-child`)
3. /clock/ (Attendance & Timecard)
   - Sections: Punch Status, Weekly Hours, Current Cycle
   - Modal: Clock Stats Modal (Trigger: `button:has-text("统计")`)
   - Modal: Clock Calendar Modal (Trigger: `button:has-text("日历")`)
   - Modal: Clock Control Modal (Trigger: `button:has-text("控制")`)
4. /fee/ (Utility Analytics Overview)
   - Multi-year bar charts & utility KPI cards (Top Fold, Scrolled Fold)
   - Sub-route: /fee/waterChart/ (Water expense & usage analytics)
   - Sub-route: /fee/electricityChart/ (Electricity expense & usage analytics)
   - Sub-route: /fee/gasChart/ (Gas expense & usage analytics)
   - Sub-route: /fee/totalChart/ (Total combined utility trend)
```

---

### Phase 2: Generate `capture-all-screenshots.mjs`
Write `capture-all-screenshots.mjs` with multi-fold scrolling helpers and 1:1 parity execution.
See `scripts/capture-all-screenshots.mjs` for the reference implementation:
- Launches Chromium / system Chrome with font smoothing arguments.
- Purges output directories.
- Uses `captureFolds(page, baseName, { maxFolds, scrollStep })` for long pages.
- Uses `captureOverlay(page, trigger, overlaySelector, filename)` for dialogs and sheets.
- Navigates every sub-route (`/fee/waterChart/`, `/fee/electricityChart/`, etc.) across **both** Desktop and Mobile suites.

---

### Phase 3: Execute Capture & Generate Review Instructions
1. Run the script: `node capture-all-screenshots.mjs http://localhost:3000`.
2. Verify all output PNGs exist on disk and have non-zero size.
3. Write `prompt.txt` in the review directory specifying all captured screenshots, the parity matrix, and the 7-dimension audit criteria (with bold emphasis on zero label collisions).

---

### Phase 4: Spawn Brand-New Reviewer Subagent
Call `invoke_subagent` to launch a new, unanchored reviewer:
```json
{
  "Subagents": [
    {
      "TypeName": "design_system_staff_reviewer",
      "Role": "Independent Staff UI/UX Reviewer (Round N)",
      "Prompt": "Perform a comprehensive, zero-shot UI/UX review using instructions in <ReviewDir>/prompt.txt. Inspect all fresh desktop and mobile screenshots (including multi-fold views, sub-routes, and micro-typography in charts) in <ReviewDir>/, cross-reference with src/, and return the scorecard, punch-list, and verdict."
    }
  ]
}
```

---

### Phase 5: Remediate & Loop Until 100% Sign-Off
1. **If verdict requires iteration (`ITERATE_REQUIRED`)**:
   - Immediately `kill` the subagent conversation (`manage_subagents`).
   - Remediate code in repo according to the punch-list.
   - Run quality checks: `npm run lint && npm run build` (0 warnings enforced).
   - Run `node capture-all-screenshots.mjs` to freshly re-render all screenshots.
   - Spawn a brand-new subagent for Round N+1.
2. **If verdict is approved (`SIGN-OFF_APPROVED`)**:
   - Verify overall grade is `100 / 100`.
   - Save sign-off report to `README_UI_UX_SIGNOFF.md`.
   - Conclude goal with `<!-- GOAL_COMPLETE -->`.

---

## Standard 7-Dimension Audit Checklist

| # | Dimension | Core Audit Checklist |
|---|:---|:---|
| **1** | **Tonal Surface Stack** | Visual depth via luminance transitions (`surfaceContainerLowest` to `surfaceContainerHighest`). Zero harsh 1px high-contrast divider traps. Consistent theme seed colors across all views. |
| **2** | **Concentric Shape & Radii Math** | Concentric formula $R_{\text{inner}} = \max(0, R_{\text{outer}} - \text{padding})$ strictly maintained. Bento cards (20px) nest 8–12px elements. Modals (28px) nest 16px cards. Pills enforce 9999px. |
| **3** | **Sheets & Modals Hierarchy** | Desktop (>= 900px) uses contextual right-docked side sheets (28px left corners) keeping underlying view visible. Mobile (< 600px) uses full-screen or bottom sheets with flush geometry. Center dialogs reserved for compact confirmations. |
| **4** | **Data Density & Tabular Numerals** | Strict table row heights (56dp). All monetary numbers, counters, and timestamps enforce `font-variant-numeric: tabular-nums` and `font-feature-settings: 'tnum'`. Right-aligned amounts. Compact 28–32dp Assist Chips. |
| **5** | **Chart Readability, Anti-Collision & Sub-Routes** | Strictly horizontal labels (`rotate: 0`). **Zero overlapping numbers or glyph collisions on top of bars (minimum 8px lateral clearance between adjacent labels; numbers like `$388$388` must never touch or merge)**. WCAG AAA text contrast (> 7:1) on colored bars. Micro-segment collision suppression. Elevated frosted tooltips. All sub-routes (`/fee/*` water, electric, gas, total) fully rendered and collision-free across both Desktop and Mobile. |
| **6** | **Temporal & Calendar Alignment** | Attendance and weekly matrices strictly anchor to real calendar weekdays (Sunday start). Current day highlighted. Complete punch status legends (`● 缺卡`). Progressive disclosure hides inactive states. |
| **7** | **Mobile Responsiveness, Multi-Fold Stacking & Parity** | Fluid 1-column layout without horizontal overflow (`overflow-x: clip`). Safe-area insets (`env(safe-area-inset-bottom)`) respected. Touch targets meet minimum 48×48dp. Multi-fold vertical scroll stability: sticky headers do not obscure content, bottom nav stays docked, and below-the-fold cards maintain spacing. Strict 1:1 parity with desktop suite. |

---

## Directory Structure

```
screenshot-ui-ux-audit/
├── SKILL.md                               # Master runbook & instructions
├── scripts/
│   └── capture-all-screenshots.mjs        # Production-grade deterministic capture script template
├── resources/
│   ├── audit_prompt_template.txt          # Reviewer subagent prompt template (with collision audit)
│   └── scorecard_template.md              # 100/100 scorecard template
└── references/
    └── workflow_guide.md                  # Comprehensive isolation, scrolling, and parity guide
```
