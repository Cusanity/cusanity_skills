---
name: screenshot-ui-ux-audit
description: >-
  Autonomous screenshot-driven UI/UX design system audit loop using independent, brand-new sub-agents per iteration.
  Forces exhaustive codebase exploration, generates a deterministic capture-all-screenshots.mjs script, purges stale images
  to enforce fresh multi-viewport captures, and iterates with clean subagents until a 100/100 sign-off is achieved.
---

# Screenshot-Based Independent Sub-Agent UI/UX Audit Workflow

This skill guides an orchestrator agent through an autonomous, ultra-high-rigor UI/UX design system audit loop. It eliminates confirmation bias by pairing:
1. **Mandatory Upfront Code Path Exploration**: Complete discovery of all routes, modals, dialogs, drawers, and states before capturing.
2. **Deterministic Screen Capturing**: Generating a project-tailored `capture-all-screenshots.mjs` script that purges old screenshots to guarantee fresh renders across Desktop (1440×900) and Mobile (412×915).
3. **Independent Brand-New Reviewer Subagent Per Iteration**: Spawning a completely clean subagent in each round with zero conversational memory or bias.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTONOMOUS /goal AUDIT LOOP                           │
│                                                                             │
│   1. Explore ALL Code Paths (Routes, Modals, Drawers, States)               │
│                           │                                                 │
│                           ▼                                                 │
│   2. Generate Tailored 'capture-all-screenshots.mjs'                        │
│                           │                                                 │
│                           ▼                                                 │
│   3. Purge Stale Images & Capture Fresh Multi-Viewport Screenshots          │
│                           │                                                 │
│                           ▼                                                 │
│   4. Spawn BRAND-NEW Reviewer Subagent (Clean Transcript, Zero Bias)        │
│                           │                                                 │
│                           ▼                                                 │
│   5. Subagent Audits Visuals & Code -> Returns Scorecard + Defect Punch-List│
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

### 1. Mandatory Code Path Exploration (Before Script Generation)
**NEVER write or execute a screenshot script blindly.**
Before generating `capture-all-screenshots.mjs`, the agent MUST systematically explore the target repository:
1. **Route & Page Hierarchy**:
   - Inspect router definitions (`App.tsx`, `routes.tsx`, `vue-router`, Next.js `app/` or `pages/`).
   - Identify every top-level view and sub-route.
2. **Navigation & Interactive Triggers**:
   - Grep for navigation bars, tabs, bottom bars, drawer items, menus.
3. **Overlays, Modals & Drawers**:
   - Search for modal components: `Dialog`, `Modal`, `Sheet`, `Drawer`, `Popover`, `Menu`, `BottomSheet`.
   - Identify the trigger buttons (e.g. "Filter", "Manage Rules", "Settings", "Account Details", "Add Item").
4. **Conditional & Edge States**:
   - Identify empty states, error states, expanded/collapsed table rows, and secondary tabs.
5. **Compile a Manifest**: Document the complete inventory of screens (Desktop + Mobile) to be captured before authoring the script.

---

### 2. Forced Fresh Screenshots (Zero Stale State)
Screenshots must reflect the exact, current state of the application:
1. **Directory Purge**: The capture script MUST purge existing PNGs in the review folder (`fs.rmSync(reviewDir, { recursive: true, force: true })` or deleting prior `*.png` files) before writing new ones.
2. **Fresh Browser Context**: Create a new incognito-equivalent browser context (`browser.newContext()`) with clean storage and cache to prevent stale assets.
3. **Integrity Validation**: The capture script must verify that every expected screenshot exists and is > 0 bytes before exiting.

---

### 3. Generate Project-Tailored `capture-all-screenshots.mjs`
Rather than relying on a generic capture script, the orchestrating agent MUST generate a dedicated `capture-all-screenshots.mjs` tailored specifically to the project:
- Configures local dev server URL (e.g. `http://localhost:3000`, `http://localhost:5173`).
- Sequentially navigates routes, clicks modal triggers, waits for animation settling, and captures.
- Captures both:
  - **Desktop Viewport**: `1440 × 900`
  - **Mobile Responsive Viewports**: `412 × 915` (Flagship Android / Pixel) and `390 × 844` (Modern Mobile Portrait)
- Always passes `scale: 'css'` to ensure 1:1 CSS pixel alignment on high-DPI displays.
- Includes settling delays (300–500ms) after opening/closing dialogs or route transitions to avoid capturing mid-animation frames.

---

### 4. Mandatory Brand-New Subagent Per Iteration
**NEVER reuse the same subagent conversation across iteration loops.**
- **Why**: Reusing an existing subagent via `send_message` pollutes context with prior prompts, rationalizations, and confirmation bias. The subagent may assume a defect was fixed simply because the parent claimed so.
- **Enforcement**:
  1. Once a subagent delivers its scorecard and defects are identified, note its `conversationId`.
  2. Kill the subagent using `manage_subagents` with `Action: 'kill'`, `ConversationIds: [id]`.
  3. Apply all code fixes in the workspace.
  4. Run build and lint verification (`0 warnings` enforced).
  5. Run `node capture-all-screenshots.mjs` to freshly re-capture all screens.
  6. Call `invoke_subagent` to spawn a **fresh, brand-new subagent** with no memory of prior iterations.
  7. The fresh subagent inspects the newly rendered PNG files and current codebase with zero bias.

---

## Step-by-Step Execution Guide

### Phase 1: Code Path Exploration & Screen Manifest
Run search tools (`grep_search`, `find_by_name`, `view_file`) across the target codebase:
```markdown
Discovered Code Paths:
- Route: / -> Dashboard Home
  - Modal: Account Balance Filter Dialog (Trigger: `[data-testid="filter-btn"]`)
  - Modal: Add Account Dialog (Trigger: `[data-testid="add-btn"]`)
- Route: /transactions -> Transactions List
  - Drawer: Filter Right-Side Sheet (Trigger: `button:has-text("Filters")`)
  - Popover: Date Range Selector (Trigger: `button:has-text("Date")`)
- Route: /clock -> Attendance & Timecard
  - Sub-tab: Monthly Calendar View
  - Sub-tab: Punch Log View
```

### Phase 2: Generate `capture-all-screenshots.mjs`
Write `capture-all-screenshots.mjs` to the target repo or review workspace.
Ensure it includes:
```javascript
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const TARGET_DIR = 'C:\\Users\\...\\Desktop\\App_UI_UX_Review_Signoff';

// 1. Force fresh state: purge old screenshots
if (fs.existsSync(TARGET_DIR)) {
  for (const file of fs.readdirSync(TARGET_DIR)) {
    if (file.endsWith('.png')) {
      fs.unlinkSync(path.join(TARGET_DIR, file));
    }
  }
} else {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// 2. Launch browser with fresh context
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
const page = await context.newPage();

// 3. Deterministic capture helper
async function capture(filename, action) {
  if (action) await action(page);
  await page.waitForLoadState('networkidle');
  await new Promise(r => setTimeout(r, 400)); // allow CSS transitions to settle
  const outPath = path.join(TARGET_DIR, filename);
  await page.screenshot({ path: outPath, scale: 'css' });
  console.log(`Captured fresh: ${filename} (${fs.statSync(outPath).size} bytes)`);
}

// 4. Capture Desktop Suite (1440x900)
// ...

// 5. Capture Mobile Suite (412x915)
await page.setViewportSize({ width: 412, height: 915 });
// ...

await browser.close();
```

### Phase 3: Execute Capture & Generate Review Instructions
1. Run the script: `node capture-all-screenshots.mjs`.
2. Verify all output PNGs exist on disk and have non-zero size.
3. Write `prompt.txt` in the review directory specifying all captured screenshots and the 7-dimension audit criteria.

### Phase 4: Spawn Brand-New Reviewer Subagent
Call `invoke_subagent` to launch a new, unanchored reviewer:
```json
{
  "Subagents": [
    {
      "TypeName": "design_system_staff_reviewer",
      "Role": "Independent Staff UI/UX Reviewer (Round N)",
      "Prompt": "Perform a comprehensive, zero-shot UI/UX review using instructions in <ReviewDir>/prompt.txt. Inspect all fresh desktop and mobile screenshots in <ReviewDir>/, cross-reference with src/, and return the scorecard, punch-list, and verdict."
    }
  ]
}
```

### Phase 5: Remediate & Loop Until 100% Sign-Off
1. **If verdict requires iteration (`ITERATE_REQUIRED`)**:
   - Immediately `kill` the subagent conversation.
   - Remediate code in repo according to punch-list.
   - Run quality checks: `npm run lint && npm run build`.
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
| **1** | **Tonal Surface Stack** | Visual depth via luminance transitions (`surfaceContainerLowest` to `surfaceContainerHighest`). Zero harsh 1px high-contrast divider traps. Consistent theme seed colors. |
| **2** | **Concentric Shape & Radii Math** | Concentric formula $R_{\text{inner}} = \max(0, R_{\text{outer}} - \text{padding})$ strictly maintained. Bento cards (20px) nest 8–12px elements. Modals (28px) nest 16px cards. Pills enforce 9999px. |
| **3** | **Sheets & Modals Hierarchy** | Desktop (>= 900px) uses contextual right-docked side sheets (28px left corners) keeping underlying view visible. Mobile (< 600px) uses full-screen or bottom sheets with flush geometry. Center dialogs reserved for compact confirmations. |
| **4** | **Data Density & Tabular Numerals** | Strict table row heights (56dp). All monetary numbers, counters, and timestamps enforce `font-variant-numeric: tabular-nums` and `font-feature-settings: 'tnum'`. Right-aligned amounts. Compact 28–32dp Assist Chips. |
| **5** | **Chart Readability & Contrast** | Strictly horizontal labels (`rotate: 0`). WCAG AAA text contrast (> 7:1) on colored bars (e.g., dark text on amber/yellow bars). Micro-segments under threshold suppress collision-prone inline text. Elevated card tooltips. |
| **6** | **Temporal & Calendar Alignment** | Attendance and weekly matrices strictly anchor to real calendar weekdays (Sunday start). Current day highlighted. Complete punch status legends (`● 缺卡`). Progressive disclosure hides inactive states. |
| **7** | **Mobile Responsiveness & Ergonomics** | Fluid 1-column layout without horizontal overflow (`overflow-x: clip`). Safe-area insets (`env(safe-area-inset-bottom)`) respected. Touch targets meet minimum 48×48dp (or 36dp for secondary chips). Full-capsule active navigation pills. |

---

## Directory Structure

```
screenshot-ui-ux-audit/
├── SKILL.md                               # Master runbook & instructions
├── scripts/
│   └── capture-all-screenshots.mjs        # Reference deterministic capture script template
├── resources/
│   ├── audit_prompt_template.txt          # Reviewer subagent prompt template
│   └── scorecard_template.md              # 100/100 scorecard template
└── references/
    └── workflow_guide.md                  # Isolation, lifecycle, and code path exploration guide
```
