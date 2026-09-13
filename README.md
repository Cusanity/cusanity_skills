# Cusanity Skills (`cusanity_skills`)

A curated repository of high-rigor, autonomous skills for agentic AI programming tools (**Antigravity**, **Claude Code**, **Codex**, **Gemini CLI**, and **CC Switch**).

---

## 📦 Skills Inventory

| Skill Name | Description | Viewports / Scope |
|:---|:---|:---|
| [`screenshot-ui-ux-audit`](./skills/screenshot-ui-ux-audit/) | Autonomous screenshot-driven UI/UX design system audit loop using independent, brand-new sub-agents per iteration. Forces upfront code path exploration, generates deterministic `capture-all-screenshots.mjs`, purges stale images, and iterates until a 100/100 sign-off grade is achieved. | Desktop (`1440×900`) & Mobile (`412×915` / `390×844`) |

---

## 🌟 Highlight: `screenshot-ui-ux-audit`

### Why This Skill Exists
Traditional agent visual audits fail for two fundamental reasons:
1. **Confirmation Bias**: When an agent fixes code and asks the same subagent to re-review it, the subagent anchors on previous turns and rationalizes existing bugs.
2. **Stale or Incomplete Screenshots**: Generic scripts miss dynamic modals, dialogs, drawers, and edge cases, or capture mid-transition frames.

### How It Solves Them
- **Mandatory Upfront Code Path Exploration**: The agent must explore all routes, navigation bars, modals, dialogs, drawers, and dynamic states in the target codebase *before* writing the capture script.
- **Project-Tailored `capture-all-screenshots.mjs`**: The agent dynamically generates a dedicated Playwright script that purges old screenshots to force fresh captures, enforces `scale: 'css'`, waits for animation settling, and verifies file sizes.
- **Brand-New Subagent Per Iteration**: Spawns an isolated, unanchored Staff Reviewer subagent for every round, ensuring zero-shot objectivity until a mathematically verified `100 / 100` grade is achieved.

---

## 🚀 Installation Guide

### Option 1: Install in CC Switch (Recommended)

#### Method A: Add as a Custom Repository
1. Open **CC Switch**.
2. Switch to **Skills** → click **仓库管理** (Repository Management).
3. Click **添加仓库** (Add Repository) and enter:
   - **Owner**: `Cusanity`
   - **Name**: `cusanity_skills`
   - **Branch**: `main`
   - **Subdirectory**: `skills`
4. Click **添加** (Add), then install `screenshot-ui-ux-audit` directly from the list.

#### Method B: Install via Release ZIP
1. Download `screenshot-ui-ux-audit.zip` from the latest [GitHub Release](https://github.com/Cusanity/cusanity_skills/releases).
2. Open **CC Switch** → click **Skills**.
3. In the top action bar, click **"从 ZIP 安装"** (*Install from ZIP*).
4. Select `screenshot-ui-ux-audit.zip`.

---

### Option 2: Project-Level Manual Installation
Copy the skill directory into your repository's `.agents/skills` folder:
```bash
mkdir -p .agents/skills
cp -r skills/screenshot-ui-ux-audit .agents/skills/
```

---

### Option 3: Global Installation for CLI Tools
Copy into your CLI tool's global skills directory:
```bash
# For Gemini CLI / Antigravity:
cp -r skills/screenshot-ui-ux-audit ~/.gemini/skills/

# For Claude Code:
cp -r skills/screenshot-ui-ux-audit ~/.claude/skills/

# For Codex:
cp -r skills/screenshot-ui-ux-audit ~/.codex/skills/
```

---

## 📖 Triggering the Workflow

In your agentic session, run:
```bash
/goal run screenshot-ui-ux-audit until 100% sign-off
```
The orchestrator will:
1. Scan your codebase to discover all routes, modals, dialogs, and drawer triggers.
2. Generate a tailored `capture-all-screenshots.mjs` Playwright script.
3. Purge existing screenshots and capture a fresh suite across Desktop (`1440×900`) and Mobile (`412×915`).
4. Spawn an independent reviewer subagent for Round 1.
5. Remediate all reported defects, re-capture, and spawn a brand-new subagent for Round 2.
6. Continue looping autonomously until the subagent delivers an `Overall Platform Grade: 100/100` and `### VERDICT: SIGN-OFF_APPROVED`.

---

## 📄 License
MIT © [Cusanity](https://github.com/Cusanity)
