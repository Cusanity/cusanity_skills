---
name: screenshot-ui-ux-audit
description: >-
  Autonomous screenshot-driven UI/UX audit for responsive web and desktop GUI applications.
  Discovers routes and states, captures deterministic desktop and compact views, uses a fresh
  reviewer each round, fixes defects, and repeats until every applicable gate passes at 100/100.
---

# Screenshot UI/UX Audit

Use this skill to run an evidence-based visual and interaction audit. The target application's code determines the route inventory, selectors, states, and platform-specific expectations; never copy sample application paths into a capture plan.

## Operating Contract

1. **Review all current source code before capture**: inspect every file under the application's source roots, including routing, views, shared components, data clients, authentication, feature flags, error handling, and responsive/state logic. Record every reviewed file and SHA-256 hash; generated output, dependencies, and vendored code are excluded.
2. **Prove 100% UI capture coverage**: create a source-derived inventory of every auditable route, view, overlay, tab, state, breakpoint variant, and shared component set. Every inventory ID must be mapped to at least one capture entry; this means complete discovered UI/state coverage, not source-line or branch coverage.
3. **Generate or tailor the capture script** from [scripts/capture-all-screenshots.mjs](scripts/capture-all-screenshots.mjs). The runner must reject stale source hashes, uncovered inventory IDs, fake-data configuration, and incomplete captures.
4. **Capture a fresh round**: use a unique capture ID, clean browser/application state, deterministic viewport and scale, settled animation/data, and progressive folds for scrollable content.
5. **Validate the manifest**: reject the round unless every covered surface is listed, non-empty, created after the round start, paired across applicable viewports, and backed by recorded real-API evidence when data-driven.
6. **Use a fresh reviewer** with no prior-round conversation. Give it the validated manifest, capture plan, [resources/audit_prompt_template.txt](resources/audit_prompt_template.txt), and current code.
7. **Remediate at the owning abstraction**: prefer shared tokens, primitives, layout shells, and components over page-specific patches. Run the repository's focused checks, recapture with a new ID, and use another fresh reviewer.
8. **Sign off only at 100/100** with every applicable gate passing and no unresolved defect. Save the completed [resources/scorecard_template.md](resources/scorecard_template.md) as `README_UI_UX_SIGNOFF.md`.

## Discovery And Capture

Create a parity matrix with these columns:

| Coverage ID | View / state | Trigger or route | Desktop artifact | Mobile artifact | Data evidence | Notes / exception |
|:---|:---|:---|:---|:---|:---|:---|

Inventory:
- Routes, nested routes, tabs, menus, drawers, dialogs, popovers, sheets, and scroll regions.
- Default, hover, focus-visible, pressed, selected, disabled, loading, success, error, empty, filtered, permission-denied, and validation states that users can reach.
- Shared component equivalence sets: headers, text roles, buttons, icon actions, tabs, navigation items, badges, inputs, table cells, status indicators, and empty states.
- Content stress cases: long/localized labels, large and negative values, user content, narrow widths, and 200% text zoom where supported.

Capture rules:
- Every web audit uses the runner's hardcoded mobile viewport `440x956`, `deviceScaleFactor: 1`, and screenshot `scale: "css"`. Desktop defaults to `1440x900`; add other source-discovered breakpoints when they expose materially different layouts.
- Desktop GUI defaults: normal desktop window plus the smallest supported compact window. Do not invent a mobile mode for an application that has none.
- Capture sequential viewport folds when content exceeds `1.2x` viewport height. Include the top and bottom plus enough intermediate folds to cover all content. Full-page images may supplement but not replace viewport captures.
- Align fold positions to useful component boundaries when practical. A control merely crossing a viewport edge is not a defect; clipping by sticky UI, broken scrolling, or unreachable content is.
- Capture dynamic canvases/charts only after fonts, real API data, and animation settle. Capture tooltips or selected points when those interactions matter.
- Use the same real API/data path configured in the reviewed source. Do not intercept requests, mock responses, seed fake records, replace API clients, or use fixture data. Use a legitimate account and existing records when authentication is required; keep credentials out of plans and reports.
- Purge prior PNGs and the prior manifest. Use a fresh isolated context. Record source hashes, coverage IDs, successful API response URLs/statuses, timestamps, viewport, state ID, and file metadata in the new manifest.
- Where screenshots cannot prove semantics or behavior, record DOM/accessibility-tree, keyboard, or source evidence in the report. Never infer a PASS from pixels alone.

## Audit Dimensions

Score each dimension from 0 to 10. All ten must score 10 for sign-off.

| # | Dimension | Required evidence |
|:---|:---|:---|
| 1 | Visual hierarchy and surfaces | Clear hierarchy, coherent color roles, sufficient separation, no rendering artifacts. |
| 2 | Shape, spacing, and layout | Consistent radius/spacing tokens, aligned edges, stable geometry, no overlap or accidental overflow. |
| 3 | Navigation and overlays | Clear location/active state; appropriate dialog/sheet/popover behavior; reliable dismissal and focus return. |
| 4 | Data and form ergonomics | Legible tables and values, suitable control widths, visible labels/values, stable validation, preserved input. |
| 5 | Charts and visualization | Legible axes/legends/labels, no collisions, accessible color encoding, usable tooltip/selection behavior. |
| 6 | Domain correctness | Labels, units, ordering, dates when present, status semantics, and domain-specific visual rules are correct. |
| 7 | Responsive and compact behavior | No unreachable content or unintended horizontal overflow; safe areas and targets work; applicable feature parity is complete. |
| 8 | Cross-component consistency | Equivalent components share typography, icon, geometry, spacing, alignment, and state contracts. |
| 9 | Accessibility and input semantics | WCAG 2.2 AA contrast, non-color cues, names/labels/roles, keyboard order, focus visibility, reduced motion, and target spacing. |
| 10 | States, feedback, and content resilience | Distinct states, timely async/destructive feedback, useful recovery, and robust zoom/localized/long content. |

### Equivalent Component Gate

Compare each equivalence set side by side at the same viewport and 100% zoom:
- **Typography**: family, size, weight, line height, letter spacing, casing, color role, and numeric treatment.
- **Icons**: semantic choice, family, bounding-box size, stroke/fill and optical weight, color role, and icon-label gap.
- **Geometry**: control height, padding, gap, baseline/optical centering, shared edges, and title/action alignment.
- **States**: default, hover, focus-visible, pressed, selected, disabled, loading, and error styling.

Equivalent roles must use the same design tokens. Differences require a documented semantic, responsive, density, or platform reason. Pixel thresholds are diagnostic evidence, not substitutes for optical judgment.

### Accessibility Baseline

- Meet WCAG 2.2 AA: `4.5:1` normal text, `3:1` large text, and `3:1` meaningful non-text controls and focus indicators. Require AAA only when the product specification does.
- Do not communicate meaning by color alone. Every interactive element needs an accessible name, appropriate role, and visible focus indicator; placeholders are not labels.
- Keyboard order follows visual order. Modal surfaces trap focus while open, support expected dismissal, and restore focus to the trigger.
- Use a product baseline of `44x44` CSS px/dp for primary touch targets. Smaller compact targets need adequate spacing and a documented platform convention.
- Errors identify the affected field, explain recovery, and preserve recoverable input. Motion respects reduced-motion preferences.

### Visualization Clearance

Inspect chart labels at 100% zoom. Labels must not touch or overlap; use at least `8px` clearance where static labels are retained. On dense layouts, prefer selective labels or tooltips over shrinking text. Color must not be the only encoding.

## Negative-Proof Checklist

Every report must mark all applicable items PASS/FAIL with artifact or interaction evidence. Any FAIL caps the total at `70/100` and requires `ITERATE_REQUIRED`.

1. Rendering artifacts, unpainted gaps, or unintended opaque blocks.
2. Component, cell, border, or text collisions.
3. Invisible or collapsed input values.
4. Overlapping or ambiguous multi-control layouts.
5. Clipped data or inaccessible truncation.
6. Labels obscured by icons, adornments, or controls.
7. Controls stretched or compressed beyond their content purpose.
8. Unreachable content, broken scrolling, or clipping by sticky/fixed UI.
9. Action bars or overlays obscure content or actions.
10. Stale/incomplete source review, uncovered inventory IDs, missing folds/viewports, or absent real-data evidence.
11. Chart label, legend, axis, or tooltip collisions.
12. Unexplained sibling typography, icon, geometry, spacing, or alignment drift.
13. Missing focus, accessible name/label, contrast, keyboard path, or non-color cue.
14. Missing or ambiguous selected, disabled, loading, success, error, or empty feedback.
15. Zoom, long/localized content, large values, or narrow widths cause overflow, overlap, or loss of information.

## Reviewer Output

The report must contain:
1. Ten-dimension scorecard and total out of 100.
2. Fifteen-item negative-proof table with evidence.
3. Cross-route and cross-component comparison table.
4. Accessibility, interaction, and content-resilience table.
5. Defect list with severity, artifact/state, owning code, and remediation.
6. Exactly one verdict: `### VERDICT: ITERATE_REQUIRED` or `### VERDICT: SIGN-OFF_APPROVED`.

Use `SIGN-OFF_APPROVED` only when the score is `100/100`, every applicable check passes, and every N/A has a valid reason.

## Resources

- [references/workflow_guide.md](references/workflow_guide.md): implementation details for capture plans, folds, manifests, and reviewer isolation.
- [scripts/capture-all-screenshots.mjs](scripts/capture-all-screenshots.mjs): generic plan-driven Playwright capture template.
- [resources/audit_prompt_template.txt](resources/audit_prompt_template.txt): concise reviewer handoff template.
- [resources/scorecard_template.md](resources/scorecard_template.md): sign-off report template.
