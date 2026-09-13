# Subagent Isolation & Iteration Architecture Guide

This guide explains the architectural principles, code path exploration methods, and operational patterns for running the screenshot-driven UI/UX audit loop with guaranteed zero-shot objectivity and deterministic screen capturing.

---

## 1. Upfront Code Path Exploration (Before Scripting)

### Why Generic Scripts Fail
Every web application structures navigation, modals, and conditional states differently. If an agent writes or runs a generic screenshot script:
- Half of the modals or slide-overs are never triggered.
- Dynamic states (e.g. filtered views, date pickers, empty tables) are missed.
- Animations trigger half-way, capturing blurry or semi-opaque frames.

### Mandatory Discovery Protocol
Before authoring `capture-all-screenshots.mjs`, the orchestrating agent MUST execute this discovery workflow:
1. **Route Mapping**:
   - Inspect router definitions (`App.tsx`, `routes.tsx`, `vue-router`, etc.).
   - Enumerate all valid top-level and nested paths (e.g., `/`, `/transactions`, `/fee/electricity`, `/clock`).
2. **Navigation Component Auditing**:
   - Search for top app bars, side navigation rails, drawers, bottom navigation bars, and tabs.
   - Note the exact test IDs or text selectors used to switch views.
3. **Modal & Drawer Component Auditing**:
   - Grep for dialog primitives: `Dialog`, `Modal`, `Sheet`, `Drawer`, `Popover`, `Menu`, `BottomSheet`.
   - Identify trigger buttons (e.g. "Filter", "Manage Rules", "Settings", "Add Account").
   - Determine the close mechanism (`Escape` key, backdrop click, or close icon button) to ensure the script resets the UI cleanly after capturing each overlay.
4. **Compile Screen Manifest**:
   - Document the complete list of target desktop (`*_PC_*.png`) and mobile (`*_Mobile_*.png`) files to be captured.

---

## 2. Deterministic Screen Capturing via `capture-all-screenshots.mjs`

### Key Requirements of the Generated Script
When generating `capture-all-screenshots.mjs`:
1. **Forced Freshness**:
   - Always purge prior `.png` files in the review folder before capturing:
     ```javascript
     const existing = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
     for (const f of existing) fs.unlinkSync(path.join(dir, f));
     ```
   - Prevents stale screenshots from leaking into the reviewer subagent's audit.
2. **Clean Browser Context**:
   - Create a fresh incognito-like context with `deviceScaleFactor: 1`.
3. **Settling Delays**:
   - Use `waitForLoadState('networkidle')` followed by a brief 300–500ms delay (`setTimeout`) to let CSS transitions and layout reflows settle completely.
4. **Scale: 'css'**:
   - Always pass `scale: 'css'` to `page.screenshot()`. On high-DPI screens (Retina / 4K), omitting this can cause rendering timeouts or distorted pixel ratios.
5. **Output Integrity Verification**:
   - Inspect all written files at the end of the script, asserting that each file exists and is > 0 bytes.

---

## 3. The Subagent Confirmation Bias Problem

### Why Old Subagents Fail Across Iterations
When an LLM agent reviews code or designs:
- **Conversation Anchoring**: If a subagent reported a defect in Turn 1, and the orchestrator sends a follow-up message saying *"I fixed this in commit XYZ, please verify"*, the subagent's attention mechanism heavily anchors on the claim that the issue has been addressed. It tends to confirm the fix rather than re-evaluating the actual rendered pixels.
- **Context Bloat**: As screenshots, file contents, and discussion accumulate in a subagent's transcript, its context window degrades in precision, and subtle defects in edge cases get overlooked.
- **Rationalization**: A subagent that previously rationalized an ambiguous layout quirk will continue to defend that rationalization across subsequent turns.

### The Solution: Zero-Shot Brand-New Subagent Per Loop
In this workflow:
- Each iteration creates a **brand-new, independent subagent** with a fresh conversation ID.
- The subagent has **zero memory** of who built the app, what bugs existed 5 minutes ago, or what the orchestrator thinks of the UI.
- It arrives like a newly hired external Staff Design System Architect at Google conducting a blind audit.
- It sees only:
  1. The freshly rendered PNG screenshots on disk
  2. The current codebase in `src/`
  3. The rigorous design system rules in `prompt.txt`

---

## 4. Managing the Subagent Lifecycle

### Step 1: Define the Subagent Template (Once Per Session)
Use `define_subagent` to register the reviewer archetype:
```json
{
  "name": "design_system_staff_reviewer",
  "description": "Zero-shot independent UI/UX and design system auditor.",
  "system_prompt": "You are an independent Principal Design System Architect conducting an uncompromising pixel-level visual and code audit...",
  "enable_write_tools": false,
  "enable_subagent_tools": false,
  "enable_mcp_tools": false
}
```

### Step 2: Spawn Brand-New Instance for Round N
Use `invoke_subagent` with a descriptive role including the round number:
```json
{
  "Subagents": [
    {
      "TypeName": "design_system_staff_reviewer",
      "Role": "Independent MD3 Reviewer (Round 1)",
      "Prompt": "Perform a comprehensive, zero-shot UI/UX review using instructions in C:/Users/.../prompt.txt..."
    }
  ]
}
```

### Step 3: Handle Reactive Notification & Evaluate Verdict
When the subagent sends its audit report back:
- If `### VERDICT: ITERATE_REQUIRED`:
  1. **Kill the Subagent**:
     ```json
     {
       "Action": "kill",
       "ConversationIds": ["conv-abc-123"]
     }
     ```
  2. **Implement Code Remediations** in the workspace.
  3. **Run Quality Gates** (`npm run lint && npm run build`).
  4. **Re-capture Screenshots** (`node capture-all-screenshots.mjs`).
  5. **Spawn Brand-New Subagent** for Round 2 (`Round 2 Reviewer`).
- If `### VERDICT: SIGN-OFF_APPROVED`:
  1. Verify the grade is `100 / 100`.
  2. Update sign-off documentation.
  3. Conclude with `<!-- GOAL_COMPLETE -->`.

---

## 5. Reusing in Other Repositories

To apply this skill to any web repository:
1. **Explore Code Paths**: Search router definitions, modals, and navigation components.
2. **Generate `capture-all-screenshots.mjs`**: Author the deterministic capture script tailored to the repository's ports, paths, and selectors.
3. **Execute Capture**: Run `node capture-all-screenshots.mjs` to populate the review folder with clean, fresh screenshots.
4. **Spawn Reviewer & Loop**: Drive the autonomous loop with `/goal` until an independent reviewer issues 100/100 approval.
