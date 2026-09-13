# Subagent Isolation, Multi-Fold Scrolling & Parity Architecture Guide

This guide explains the architectural principles, code path exploration methods, multi-fold scrolling algorithms, and operational patterns for running the screenshot-driven UI/UX audit loop with guaranteed zero-shot objectivity, complete route parity, and deterministic screen capturing.

---

## 1. Upfront Code Path & Sub-Route Exploration (Before Scripting)

### Why Generic Scripts Fail
Every web application structures navigation, modals, and conditional states differently. If an agent writes or runs a generic screenshot script:
- Sub-routes (e.g., `/fee/waterChart/`, `/fee/electricityChart/`) are skipped entirely.
- Half of the modals or slide-overs are never triggered.
- Dynamic states (e.g. filtered views, date pickers, empty tables) are missed.
- Animations trigger half-way, capturing blurry or semi-opaque frames.
- Mobile viewports are treated as a secondary afterthought, capturing only 20–30% of the views captured on desktop.

### Mandatory Discovery Protocol
Before authoring `capture-all-screenshots.mjs`, the orchestrating agent MUST execute this discovery workflow:
1. **Route & Sub-Route Hierarchy**:
   - Inspect router definitions (`App.tsx`, `routes.tsx`, `vue-router`, etc.).
   - Enumerate all valid top-level AND nested sub-paths:
     - Top-level: `/`, `/transactions`, `/fee`, `/clock`
     - Nested sub-routes: `/fee/waterChart/`, `/fee/electricityChart/`, `/fee/gasChart/`, `/fee/totalChart/`, `/fee/mortgage`
     - Wildcard routes: `/item/:id`, `/analytics/*`
2. **Navigation Component Auditing**:
   - Search for top app bars, side navigation rails, desktop menus, and mobile bottom navigation bars.
   - Note the exact test IDs or text selectors used to switch views.
3. **Modal, Sheet & Drawer Component Auditing**:
   - Grep for dialog primitives: `Dialog`, `Modal`, `Sheet`, `Drawer`, `Popover`, `Menu`, `BottomSheet`.
   - Identify trigger buttons (e.g. "Filter", "Manage Rules", "Settings", "Add Account", "AI Summary").
   - Determine the close mechanism (`Escape` key, backdrop click, or close icon button) to ensure the script resets the UI cleanly after capturing each overlay.
4. **Compile the 1:1 Parity Matrix**:
   - Document a tabular screen manifest asserting that every single view, sub-route, and overlay is captured on **both** Desktop (`1440×900`) and Mobile (`412×915`).

---

## 2. The Scrolling Dilemma: Above-the-Fold Blindness vs. Viewport Realities

### The "Above-the-Fold" Failure Mode
A standard `page.screenshot()` call without scrolling only captures the top 900px on PC or 915px on Mobile.
In modern responsive applications:
- On desktop, dashboards often span 1,400–2,000px vertically (KPI cards -> charts -> tables -> footers).
- On mobile (`412×915`), multi-column grids collapse into a single vertical column. A page that spans 1.5 folds on desktop will easily span **3 to 6 viewport heights** on mobile!
- If only above-the-fold screenshots are taken:
  - Utility cards, mortgage comparisons, breakdown tables, and pagination bars are never audited.
  - Text clipping, horizontal overflow, and touch target violations occurring below fold 1 remain undetected until production.

### Why Full-Page Stitches (`fullPage: true`) Are Insufficient on Their Own
Using `fullPage: true` captures a single ultra-tall image (e.g. 412 × 4,500px):
1. **Sticky Element Breakage**: Sticky top app bars and fixed bottom navigation bars can detach, render unnaturally across the middle of content, or get clipped.
2. **Loss of Ergonomic Perspective**: Reviewers cannot evaluate what the user actually sees within the physical device bounds (e.g., whether content peeks above the bottom edge to indicate scrollability).
3. **Touch Target Measurement Distortion**: Scaling a 4,500px tall image for review degrades visual fidelity and makes 48×48dp touch target validation inaccurate.

### The Solution: Progressive Multi-Fold Viewport Capturing
The capture script must dynamically inspect page height and take sequential viewport captures:
```javascript
const captureFolds = async (page, baseName, { maxFolds = 3, scrollStep = 0.75 } = {}) => {
  await waitAndSettle(page);
  await page.evaluate(() => window.scrollTo(0, 0));

  const { scrollHeight, innerHeight } = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }));

  // If page content fits within viewport (+15% tolerance), single capture suffices
  if (scrollHeight <= innerHeight * 1.15) {
    await saveScreenshot(page, `${baseName}_Overview.png`);
    return;
  }

  // Fold 1: Top / Hero / Sticky Header
  await saveScreenshot(page, `${baseName}_Fold1_Top.png`);

  const totalScrollable = scrollHeight - innerHeight;
  const numExtraFolds = Math.min(maxFolds - 1, Math.ceil(totalScrollable / (innerHeight * scrollStep)));

  for (let i = 1; i <= numExtraFolds; i++) {
    const isLastFold = i === numExtraFolds;
    const targetScrollY = isLastFold 
      ? totalScrollable 
      : Math.round((totalScrollable * i) / (numExtraFolds + 1));

    await page.evaluate((y) => window.scrollTo(0, y), targetScrollY);
    await waitAndSettle(page, 400);

    const foldLabel = isLastFold ? `Fold${i + 1}_Bottom` : `Fold${i + 1}_Middle`;
    await saveScreenshot(page, `${baseName}_${foldLabel}.png`);
  }

  // Restore scroll position cleanly
  await page.evaluate(() => window.scrollTo(0, 0));
  await waitAndSettle(page, 200);
};
```

---

## 3. Strict 1:1 Cross-Viewport Parity Enforcement

### The Asymmetric Audit Anti-Pattern
Orchestrating agents frequently capture 20 comprehensive screenshots on Desktop (covering all dialogs, charts, and drawers), but only 5–8 simple views on Mobile. This is backwards: **mobile viewports contain the majority of UX failures**:
- Modals that render cleanly as 480px side sheets on desktop often clip or overflow when rendered on a 412px mobile screen.
- Button rows that fit horizontally on desktop wrap into awkward orphans on mobile.
- Chart legends and tooltips collision-clash on mobile screens.

### The Parity Matrix Standard
For every project, construct and verify a parity matrix before running the audit:

| Feature / Route / Overlay | Desktop Capture (`1440×900`) | Mobile Capture (`412×915`) | Interaction Notes |
|:---|:---|:---|:---|
| `/` Dashboard Home | `01_PC_Dashboard_Home_Fold1_Top`<br>`01_PC_Dashboard_Home_Fold2_Bottom` | `01_Mobile_Dashboard_Home_Fold1_Top`<br>`01_Mobile_Dashboard_Home_Fold2_Middle`<br>`01_Mobile_Dashboard_Home_Fold3_Bottom` | Multi-fold scroll captures top cards, teasers, and quick links |
| Mortgage Dialog | `02_PC_Mortgage_Calculator_Dialog` | `02_Mobile_Mortgage_Calculator_Dialog` | Verify preset chips grid & slider ergonomics |
| `/transactions/` Ledger | `03_PC_Transactions_Ledger_Fold1_Top`<br>`03_PC_Transactions_Ledger_Fold2_Bottom` | `03_Mobile_Transactions_Ledger_Fold1_Top`<br>`03_Mobile_Transactions_Ledger_Fold2_Middle`<br>`03_Mobile_Transactions_Ledger_Fold3_Bottom` | Verify table horizontal scrolling & summary bar |
| AI Summary Drawer | `04_PC_Transactions_AISummary_Modal` | `04_Mobile_Transactions_AISummary_Sheet` | Desktop side sheet vs Mobile bottom sheet |
| Filter Drawer | `05_PC_Transactions_Filter_Modal` | `05_Mobile_Transactions_Filter_Sheet` | Desktop side sheet vs Mobile bottom sheet |
| Account Switcher | `06_PC_Transactions_Account_Filter_Modal` | `06_Mobile_Transactions_Account_Sheet` | Verify list touch targets |
| Spending Charts | `07_PC_Transactions_Charts_Modal` | `07_Mobile_Transactions_Charts_Modal` | Verify chart responsive container |
| Rule Management | `08_PC_Transactions_Rule_Management_Modal` | `08_Mobile_Transactions_Rule_Management_Modal` | Verify drag handle & row heights |
| Rule Edit Modal | `09_PC_Transactions_Rule_Edit_Modal` | `09_Mobile_Transactions_Rule_Edit_Modal` | Verify input field padding & select dropdowns |
| Row Action Popover | `10_PC_Transactions_Row_Action_Popover` | `10_Mobile_Transactions_Row_Action_Popover` | Verify popover anchor alignment |
| `/clock/` Main View | `11_PC_Clock_Main_Fold1_Top`<br>`11_PC_Clock_Main_Fold2_Bottom` | `11_Mobile_Clock_Main_Fold1_Top`<br>`11_Mobile_Clock_Main_Fold2_Bottom` | Verify timecard matrix & punch cards |
| Clock Stats Modal | `12_PC_Clock_Stats_Modal_Calendar_Aligned` | `12_Mobile_Clock_Stats_Modal` | Verify calendar weekday alignment |
| Clock Calendar Modal | `13_PC_Clock_Calendar_Modal` | `13_Mobile_Clock_Calendar_Modal` | Verify month grid |
| Clock Control Modal | `14_PC_Clock_Control_Modal` | `14_Mobile_Clock_Control_Modal` | Verify toggle switches |
| `/fee/` Overview | `15_PC_Fee_Overview_MultiYear_Fold1_Top`<br>`15_PC_Fee_Overview_MultiYear_Fold2_Bottom` | `15_Mobile_Fee_Overview_Fold1_Top`<br>`15_Mobile_Fee_Overview_Fold2_Bottom` | Multi-year bar chart & breakdown cards |
| Elevated Chart Tooltip | `16_PC_Fee_Chart_Elevated_Tooltip` | N/A (Desktop hover specific) | Mouse hover simulation over canvas |
| `/fee/waterChart/` | `17_PC_Fee_Water_Chart` | `16_Mobile_Fee_Water_Chart` | Single-utility deep sub-route |
| `/fee/electricityChart/` | `18_PC_Fee_Electricity_Chart` | `17_Mobile_Fee_Electricity_Chart` | Single-utility deep sub-route |
| `/fee/gasChart/` | `19_PC_Fee_Gas_Chart` | `18_Mobile_Fee_Gas_Chart` | Single-utility deep sub-route |
| `/fee/totalChart/` | `20_PC_Fee_Total_Chart` | `19_Mobile_Fee_Total_Chart` | Combined utility deep sub-route |

---

## 4. Overlay & Dynamic State Lifecycle

When triggering dialogs, sheets, and popovers:
1. **Scroll Trigger Into View**:
   ```javascript
   await triggerLocator.first().scrollIntoViewIfNeeded();
   ```
2. **Force Click & Wait for Presentation Layer**:
   ```javascript
   await triggerLocator.first().click({ force: true });
   await page.waitForSelector('.MuiDialog-paper, .MuiDrawer-paper, [role="dialog"]', { state: 'visible', timeout: 10000 });
   await waitAndSettle(page, 600); // Allow CSS slide-in/fade-in animation to finish
   ```
3. **Capture High-DPI Snapshot**:
   ```javascript
   await page.screenshot({ scale: 'css' });
   ```
4. **Clean Dismissal**:
   Always press `Escape` or click the backdrop/close button, and wait 300–400ms for the exit animation to complete. Leaving an open overlay blocks pointer events on the underlying page and will cause subsequent route navigations or clicks to fail!

---

## 5. The Subagent Confirmation Bias Problem & Lifecycle

### Why Old Subagents Fail Across Iterations
- **Conversation Anchoring**: If a subagent reported a defect in Turn 1, and the orchestrator sends a follow-up message saying *"I fixed this in commit XYZ, please verify"*, the subagent's attention mechanism heavily anchors on the claim that the issue has been addressed. It tends to confirm the fix rather than re-evaluating the actual rendered pixels.
- **Context Bloat**: As screenshots, file contents, and discussion accumulate in a subagent's transcript, its context window degrades in precision, and subtle defects in edge cases get overlooked.

### The Solution: Zero-Shot Brand-New Subagent Per Loop
In this workflow:
- Each iteration creates a **brand-new, independent subagent** with a fresh conversation ID.
- The subagent has **zero memory** of who built the app, what bugs existed 5 minutes ago, or what the orchestrator thinks of the UI.
- It arrives like a newly hired external Staff Design System Architect at Google conducting a blind audit.
- It sees only:
  1. The freshly rendered PNG screenshots on disk (all folds, sub-routes, and viewports)
  2. The current codebase in `src/`
  3. The rigorous design system rules in `prompt.txt`

### Subagent Lifecycle Execution
1. Once Round N subagent delivers its report:
   - If defects are found:
     - `manage_subagents` -> `Action: 'kill'` with `ConversationIds: [id]`.
     - Remediate code in repo.
     - Run `npm run lint && npm run build`.
     - Run `node capture-all-screenshots.mjs` to re-render fresh screenshots.
     - Call `invoke_subagent` to launch Round N+1 subagent.
   - If verdict is `SIGN-OFF_APPROVED` (100/100):
     - Generate `README_UI_UX_SIGNOFF.md`.
     - Conclude with `<!-- GOAL_COMPLETE -->`.
