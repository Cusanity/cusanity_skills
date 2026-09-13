# Screenshot Audit Workflow Guide

`SKILL.md` is the normative audit contract. This guide covers implementation mechanics only.

## 1. Build The Capture Plan

Review every current file in the application's source roots, including data clients, auth, flags, errors, and responsive/state logic. Hash those files, derive the complete UI coverage inventory, and create a JSON plan for the generic Playwright script:

```jsonc
{
  "sourceReview": {
    "roots": ["src", "vite.config.ts"],
    "files": [
      { "path": "src/App.tsx", "sha256": "<64-character SHA-256>" },
      { "path": "vite.config.ts", "sha256": "<64-character SHA-256>" }
    ]
  },
  "coverageInventory": [
    { "id": "route:home" },
    { "id": "state:settings-dialog" }
  ],
  "viewports": [
    { "id": "Desktop", "width": 1440, "height": 900 }
  ],
  "views": [
    {
      "id": "home",
      "path": "/",
      "covers": ["route:home"],
      "requiredApi": ["/api/dashboard"],
      "waitFor": "main",
      "folds": 3
    },
    {
      "id": "settings-dialog",
      "path": "/settings",
      "covers": ["state:settings-dialog"],
      "dataIndependentReason": "Static client-side dialog verified in source",
      "action": { "type": "click", "selector": "button[data-testid='open-settings']" },
      "waitFor": "[role='dialog']",
      "folds": 1
    },
    {
      "id": "chart-tooltip",
      "path": "/analytics",
      "action": { "type": "hover", "selector": "[data-testid='chart-point']" },
      "only": ["Desktop"]
    }
  ]
}
```

The source file list above is abbreviated for readability. A real plan must list every file discovered under every declared root.

Rules:
- `sourceReview.roots` must include every application-owned source directory and source-bearing entry/config file. Dependencies, generated output, vendored code, secrets, and capture output are excluded.
- `sourceReview.files` must exactly match all files under those roots and contain hashes generated after the full code review. The runner fails if a file is added, removed, or changed.
- `coverageInventory` contains every source-discovered route, view, overlay, tab, meaningful state, breakpoint variant, and shared-component comparison set. Every ID must appear in a view's `covers` list for every viewport.
- A genuinely platform-specific coverage entry may declare `"viewports": ["Desktop"]`, but it must also provide a concrete `reason`. This narrows applicability; it does not reduce the required 100% coverage of applicable surfaces.
- IDs must be stable, filesystem-safe, and unique.
- `path` is relative to `--baseUrl`; selectors come from the target code, not this repository.
- Supported actions are `click`, `hover`, and `focus`. Tailor the script when a workflow needs typing, real authentication, or multiple steps.
- Every view must declare source-derived `requiredApi` URL regexes or a specific `dataIndependentReason`. The runner records successful Fetch/XHR responses and fails when required real API evidence is absent.
- Use `only` solely for documented platform-specific behavior. Otherwise each view runs in every viewport.
- Add explicit entries for meaningful interactive, loading, error, empty, filtered, validation, and permission states.
- Do not add a Mobile viewport to the plan. The runner always injects `Mobile` at exactly `440x956` and rejects attempts to redefine it.

Keep the human-readable parity matrix beside the JSON plan. Verify that every applicable matrix cell maps to a planned artifact.

## 2. Capture Deterministically

Run:

```bash
node capture-all-screenshots.mjs \
  --baseUrl http://localhost:3000 \
  --plan capture-plan.json \
  --outDir review \
  --captureId round-1
```

The script must:
- Delete old PNGs and the previous manifest before capture.
- Verify source roots/files/hashes and 100% coverage mapping before launching the browser.
- Inject the hardcoded `440x956` Mobile viewport, use a new isolated context per viewport and a fresh page per capture entry, and set `deviceScaleFactor: 1`.
- Wait for navigation, `document.fonts.ready`, the optional `waitFor` selector, and animation settling.
- Use the application's real API configuration without request interception, mocked responses, fake records, or fixtures; block service workers that could substitute mocked network responses.
- Require successful Fetch/XHR responses matching each data-backed view's source-derived `requiredApi` patterns.
- Capture top/intermediate/bottom viewport folds when requested and content is long.
- Restore scroll and page state between entries.
- Write the manifest only after every planned artifact succeeds and passes file-size/timestamp checks.

For desktop GUI targets, create a project-specific driver that preserves the same plan and manifest contract. Use the normal and smallest supported window sizes; do not claim mobile parity unless the application supports it.

## 3. Fold Strategy

Use viewport captures because full-page stitching can hide sticky-header, fixed-footer, safe-area, and viewport-relative defects.

For a page taller than `1.2x` its viewport:
1. Capture the top.
2. Capture enough evenly distributed intermediate positions to cover the content.
3. Capture the exact bottom.

Use slight overlap when needed for continuity. Prefer useful component boundaries, but do not misclassify normal viewport-edge cropping as a UI defect.

## 4. Dynamic And Semantic Evidence

- Wait for fonts, real API data, charts, and transitions before capture.
- Capture hover/focus/selected overlays after their state becomes visible.
- Disable nonessential motion only after separately verifying reduced-motion behavior.
- Use DOM/accessibility-tree and keyboard evidence for names, roles, reading order, focus trapping/restoration, and validation semantics.
- Record evidence references in the report; screenshots alone cannot prove these checks.

## 5. Manifest Gate

Before review, verify:
- `captureRunId` equals the requested round ID.
- Source roots, file hashes, and coverage inventory match the current reviewed code.
- `captureStartedAt <= file mtime <= captureCompletedAt` with a small filesystem tolerance.
- Every file exists, is non-empty, and belongs to a planned view/viewport/fold.
- Every applicable parity pair and required fold exists.
- Every data-backed view records successful responses matching all required real-API patterns.
- No unlisted PNG is handed to the reviewer.

Any failure invalidates the whole round. Fix and recapture; never mix artifacts from different rounds.

## 6. Reviewer Isolation Loop

1. Start a new reviewer conversation with the validated manifest, plan/matrix, prompt template, and current code.
2. On `ITERATE_REQUIRED`, dispose of that reviewer context.
3. Fix defects at their shared owner and run focused lint/test/build checks.
4. Capture a new round with a new ID and validate its manifest.
5. Start another new reviewer.
6. On `SIGN-OFF_APPROVED`, verify 100/100 and save the completed scorecard.

Do not tell a new reviewer which defects were supposedly fixed; the current evidence must stand on its own.
