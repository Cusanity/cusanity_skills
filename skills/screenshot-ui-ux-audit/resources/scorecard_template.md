# {{APPLICATION_NAME}} - UI/UX Audit Sign-Off

- Capture ID: `{{CAPTURE_RUN_ID}}`
- Manifest: `{{MANIFEST_PATH}}`
- Source review/hash status: {{SOURCE_REVIEW_STATUS}}
- UI capture coverage: {{CAPTURE_COVERAGE_PERCENT}}%
- Real API evidence: {{REAL_API_EVIDENCE_STATUS}}
- Viewports/windows: {{VIEWPORTS}}
- Reviewed at: {{DATE_TIME}}
- Reviewer: {{REVIEWER_ID}}

## Scorecard

| # | Dimension | Score / 10 | Evidence |
|:---|:---|:---:|:---|
| 1 | Visual hierarchy and surfaces |  |  |
| 2 | Shape, spacing, and layout |  |  |
| 3 | Navigation and overlays |  |  |
| 4 | Data and form ergonomics |  |  |
| 5 | Charts and visualization |  |  |
| 6 | Domain correctness |  |  |
| 7 | Responsive and compact behavior |  |  |
| 8 | Cross-component consistency |  |  |
| 9 | Accessibility and input semantics |  |  |
| 10 | States, feedback, and content resilience |  |  |
| | **Total** | ** / 100** |  |

## Negative-Proof Checks

Copy the 15 checks from `SKILL.md` and complete every row. Do not pre-fill PASS.

| # | Status (PASS / FAIL / N/A) | Artifact or interaction evidence |
|:---|:---:|:---|
| 1-15 |  |  |

## Cross-Component Consistency

| Equivalence set | Typography | Icons | Geometry/alignment | States | Evidence |
|:---|:---:|:---:|:---:|:---:|:---|

## Accessibility, Interaction & Resilience

| Check | Status | Evidence |
|:---|:---:|:---|
| WCAG 2.2 AA contrast, names/roles, non-color cues, and focus |  |  |
| Keyboard order, overlay focus, dismissal, and restoration |  |  |
| Loading, success, error, empty, disabled, selected, and permission-denied states |  |  |
| Validation, feedback, recovery, and wayfinding |  |  |
| Zoom, long/localized content, truncation, and overflow |  |  |

## Defects

| ID | Severity | Viewport / state / artifact | Owning code | Defect | Remediation |
|:---|:---:|:---|:---|:---|:---|

## Exceptions And Residual Risk

Document every N/A and intentional variant with its reason. State `None` when empty.

## Verdict

Use exactly one:

`### VERDICT: ITERATE_REQUIRED`

`### VERDICT: SIGN-OFF_APPROVED`

Sign-off requires 100/100, every applicable check passing, and every N/A justified.
