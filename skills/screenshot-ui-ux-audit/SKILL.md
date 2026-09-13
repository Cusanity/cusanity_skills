---
name: screenshot-ui-ux-audit
description: >-
  Autonomous screenshot-driven UI/UX design system audit loop using independent, brand-new sub-agents per iteration.
  Covers both Modern Web and Desktop GUI applications (PyQt6/PySide6, Electron, native apps).
  Forces exhaustive route & sub-route exploration, multi-fold progressive scrolling (for long pages, scroll areas & mobile views),
  strict 1:1 PC/Mobile viewport parity, deterministic screen capturing, and iterates until a 100/100 sign-off is achieved.
---

# Screenshot-Based Independent Sub-Agent UI/UX Audit Workflow

This skill guides an orchestrator agent through an autonomous, ultra-high-rigor UI/UX design system audit loop for **both Modern Web Applications and Desktop GUI Applications** (PyQt6, PySide6, Electron, Web). It eliminates confirmation bias, rubber-stamping sycophancy, and visual blind spots by pairing:
1. **Mandatory Upfront Code Path & View Exploration**: Complete discovery of all routes, sub-routes (e.g. `/fee/*` chart variants), tabs, scroll panels, modals, dialogs, drawers, and conditional states before capturing.
2. **Progressive Multi-Fold Vertical Scrolling (Desktop & Mobile)**: Overcoming "above-the-fold blindness" in scrollable web pages and desktop GUI `QScrollArea` panels by capturing sequential viewport folds (`Fold1_Top`, `Fold2_Mid`, `Fold3_Bottom`).
3. **Strict 1:1 PC/Mobile Viewport Parity**: Guaranteeing that every view, sub-route, dialog, and control captured on Desktop (1440×900) has an exact counterpart captured on Compact/Mobile (760×600 / 412×915).
4. **Mandatory Negative-Proof Anti-Rubberstamping Verification (Top 10 Visual Disqualifiers)**: Banning superficial sycophantic sign-offs by requiring the reviewer subagent to explicitly certify PASS/FAIL on 10 hard disqualifiers (e.g. thick black collision lines, widget height overflow, 600px stretched spinboxes, truncated comboboxes, occluded action bars, overlapping chart labels). Any failure automatically caps score at $\le 70/100$ and mandates `ITERATE_REQUIRED`.
5. **Table Cell Widget Clearance & Input Sizing Contracts**: Enforcing strict section height and column width rules for embedded widgets to prevent row border collisions and text clipping.
6. **Deterministic Screen Capturing**: Generating a project-tailored capture script that purges old screenshots, enforces scaling, waits for settling, and writes a per-run manifest only after validating the complete fresh screenshot set.
7. **Independent Brand-New Reviewer Subagent Per Iteration**: Spawning a completely clean subagent in each round with zero conversational memory or bias.

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
5. **Per-Round Capture Identity**: Pass a unique `--captureId` for every audit round. The script must delete the prior `screenshot-capture-manifest.json` before capture and write a new manifest only after the run succeeds.
6. **Freshness Gate Before Handoff**: The orchestrator MUST confirm the manifest exists, its `captureRunId` matches the current round, every listed file exists with a non-zero size, and every file modification time is at or after that run's start time. Do not invoke the reviewer if any check fails.
7. **No Partial-Round Reuse**: If capture exits non-zero or the manifest is missing/inconsistent, treat the round as invalid, repair or rerun capture, and never give the reviewer PNGs from the previous round.

---

### 7. Mandatory Brand-New Subagent Per Iteration
**NEVER reuse the same subagent conversation across iteration loops.**
- **Why**: Reusing an existing subagent via `send_message` pollutes context with prior prompts, rationalizations, and confirmation bias. The subagent tends to confirm the fix rather than re-evaluating the actual rendered pixels.
- **Enforcement**:
  1. Note the subagent `conversationId` upon receiving its audit report.
  2. Kill the subagent using `manage_subagents` with `Action: 'kill'`, `ConversationIds: [id]`.
  3. Apply code fixes in the repository.
  4. Run build and lint verification (`npm run lint && npm run build`, `0 warnings` enforced).
   5. Run `node capture-all-screenshots.mjs --captureId <unique-round-id>` to freshly re-capture all screens. The command must exit successfully.
   6. Validate `screenshot-capture-manifest.json` and confirm it describes this round's complete, non-empty, recently modified PNG set.
   7. Call `invoke_subagent` to spawn a **fresh, brand-new subagent** with no memory of prior iterations, including the manifest path in its prompt.
   8. The fresh subagent inspects only the manifest-validated PNG files and current codebase with zero bias.

---

### 8. Table Cell Widget Clearance & Sizing Contract (Desktop GUI & Web Tables)
**Embedded widgets must NEVER exceed row section height or cause horizontal clipping.**
In desktop frameworks (PyQt6/PySide6, Tkinter, AppKit) and custom data grids:
1. **Vertical Clearance Formula**:
   Table row default section size ($H_{\text{row}}$) must strictly accommodate the inner widget height plus its styling padding and borders:
   $$H_{\text{row}} \ge H_{\text{widget}} + 2 \times \text{padding}_{\text{vertical}} + 2 \times \text{border}$$
   - *Failure Mode*: If an embedded widget (e.g. `QComboBox`, `QLineEdit`, `QSpinBox`) has `min-height: 20px; padding: 7px 12px; border: 1px;` (total 36px), putting it in a default 25px row forces an 11px vertical overflow. The widget draws over row boundaries, resulting in **thick solid black horizontal lines running through text** and unpainted gaps between columns.
   - *Enforcement*: Always enforce `setDefaultSectionSize(44)` to `56` dp whenever interactive cell widgets are present.
2. **Horizontal Clearance & Combobox Arrow Protection**:
   Columns hosting comboboxes with icons must NOT use naive `ResizeToContents` calculated from short headers (e.g. "Provider" / "提供商").
   - Set interactive column width $\ge 180\text{dp}$–$210\text{dp}$ to ensure provider names (e.g. "Google Gemini", "GitHub Copilot", "Anthropic Claude") are never truncated to "Google Gen..." or occluded by the dropdown arrow.

---

### 9. Input Control Width Sanity (Zero 600px Stretched Spinboxes)
**Form inputs must enforce ergonomic maximum widths tailored to their data type.**
1. **The Full-Width Stretch Anti-Pattern**:
   Form layouts (`QFormLayout`, CSS flex/grid) stretch children horizontally by default. Numeric spinboxes (e.g. 1–100 cycles, 0.40 temperature, port numbers, currency multipliers) that stretch 600px–1000px across the viewport look absurd and violate basic ergonomics.
2. **Prescribed Maximum Widths**:
   - Short numeric spinboxes / counters: `setMaximumWidth(80 - 120px)`.
   - Small dropdowns / select menus: `setMaximumWidth(200 - 240px)`.
   - Related paired inputs (e.g. Max cycles + Wait time): Group horizontally in a single compact row (`QHBoxLayout` / `flex-row`) rather than stacking full-width across multiple rows.

---

### 10. Persistent Action Bar vs Floating Dock Architecture
**Action bars must either be cleanly docked edge-to-edge or distinctly floating with proper clearance.**
1. **Edge-to-Edge Docked Architecture**:
   If an action bar is pinned below a scroll area:
   - Must enforce `border-radius: 0; border-top: 1px solid <outline_variant>; margin: 0;`.
   - Layout spacing between scroll area and action bar must be `0px` so the scroll area vertical scrollbar meets the action bar seamlessly.
2. **Floating Elevated Dock Architecture**:
   If designed as a floating pill:
   - Must enforce generous outer margins (`margin: 12px 16px; border-radius: 20px;`) and an elevated surface container.
3. **Forbidden Half-Cut Collision**:
   Never use a floating rounded bar (`border-radius: 16px`) with 0 margins pressed against screen borders—it creates an optical illusion of a sliced, broken window container.

---

### 11. Mandatory Anti-Rubberstamping Verification (The Top 10 Visual Disqualifiers)
**Sycophancy and confirmation bias are the #1 failure mode of LLM design reviewers.**
In prior audits, subagents looked at overall theme colors, noticed rounded buttons, and falsely awarded "100/100" while completely ignoring thick black rendering lines cutting through text, sliced containers, and 600px spinboxes.
1. **Mandatory Negative Proof Checklist**:
   Every review report MUST include Section 2 ("Negative-Proof Disqualifiers Verification") where the reviewer explicitly inspects and certifies PASS/FAIL for each of the **Top 10 Visual Disqualifiers**:
   1. **Thick Black Rendering / Collision Lines**: Black horizontal or vertical artifact lines running across table rows, through text, or between adjacent cells caused by widget bounding-box clipping or CSS overflow.
   2. **Cell Widget Height Collisions**: Table row height less than inner widget height + padding (`rowHeight < widgetHeight + 8dp`), causing borders to slice through text.
   3. **Absurdly Stretched Inputs**: Numeric spinboxes or short strings stretched across full-width layouts (> 200px wide without `maximumWidth`).
   4. **Truncated Combobox Labels**: Text clipped (e.g. "Google Gemi...") or covered by the dropdown arrow due to insufficient column width.
   5. **Abrupt Container / Card Slicing**: Cards, group boxes, or input fields sliced halfway through at a viewport fold without visual separation.
   6. **Action Bar / Sticky Dock Collisions**: Bottom action bars floating awkwardly over scrollable content with mismatched corner radii touching window edges, or obscuring interactive controls.
   7. **Unpainted Cell Gaps / Grid Holes**: Table columns showing white, transparent, or unpainted gaps between cells.
   8. **Above-the-Fold Blindness**: Reviewing only Fold 1 of a scrollable panel while ignoring below-the-fold controls (`_Fold2_Mid.png`, `_Fold3_Bottom.png`).
   9. **Data Label / Number Collisions**: Overlapping numbers on chart bars or counters touching with < 8px clearance.
   10. **Concentric Radii Violations**: Inner elements having larger corner radius than outer parent cards ($R_{\text{inner}} > R_{\text{outer}} - \text{padding}$).
2. **Automatic Score Penalty**:
   If **ANY** of these 10 disqualifiers fails in ANY screenshot:
   - Overall score is **STRICTLY CAPPED AT $\le 70 / 100$**.
   - Reviewer MUST issue **`### VERDICT: ITERATE_REQUIRED`**. Zero exceptions.

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
1. Run the script with a new round identifier: `node capture-all-screenshots.mjs --baseUrl http://localhost:3000 --captureId round-<N>`.
2. Require a successful exit and verify `screenshot-capture-manifest.json` exists in the review directory. The manifest is the freshness gate: it must list the complete PNG set produced by this run, with non-zero sizes and modification times at or after `captureStartedAt`.
3. Write `prompt.txt` in the review directory specifying the manifest path, all manifest-listed screenshots, the parity matrix, and the 7-dimension audit criteria (with bold emphasis on zero label collisions).
4. Only after those checks pass, give the manifest-listed screenshots to the independent reviewer.

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
   - Run `node capture-all-screenshots.mjs --captureId round-<N+1>` to freshly re-render all screenshots; a successful manifest is required.
   - Validate the new manifest and hand off only its files.
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
| **4** | **Data Density, Tabular Numerals & Cell Clearance** | Strict table row heights (44–56dp); embedded widget clearance ($H_{\text{row}} \ge H_{\text{widget}} + 8\text{dp}$); zero black horizontal collision lines; input control width sanity (no 600px spinboxes; numeric counters constrained to 80–120dp); all monetary numbers and counters enforce `font-variant-numeric: tabular-nums` or monospace; right-aligned amounts; compact 28–32dp Assist Chips. |
| **5** | **Chart Readability, Anti-Collision & Sub-Routes** | Strictly horizontal labels (`rotate: 0`). **Zero overlapping numbers or glyph collisions on top of bars (minimum 8px lateral clearance between adjacent labels; numbers like `$388$388` must never touch or merge)**. WCAG AAA text contrast (> 7:1) on colored bars. Micro-segment collision suppression. Elevated frosted tooltips. All sub-routes fully rendered and collision-free across both Desktop and Mobile. |
| **6** | **Temporal & Calendar Alignment** | Attendance and weekly matrices strictly anchor to real calendar weekdays (Sunday start). Current day highlighted. Complete punch status legends (`● 缺卡`). Progressive disclosure hides inactive states. |
| **7** | **Mobile Responsiveness, Multi-Fold Stacking & Parity** | Fluid responsive layout without horizontal overflow. Multi-fold vertical scroll continuity across all folds (`_Fold1_Top`, `_Fold2_Mid`, `_Fold3_Bottom`); sticky headers and action bars do not obscure data or slice mid-input; docked bottom bars sit flush or float with proper margins; touch targets meet minimum 44–48dp; strict 1:1 parity with desktop suite. |

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
