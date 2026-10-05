# Responsive and keyboard verification

Recorded 2026-10-05 on production localhost in the Codex in-app browser. Synthetic example only; no SME sessions or comprehensive accessibility audit.

## Issue and fix

At a 320px viewport, expanding Daily calculation made the document 344px wide and clipped the scenario column. The table now sits in a named, focusable horizontal scroll region. The whole document stays within its client width; table columns remain readable by scrolling that region.

Results use one metric per row below 560px, two below 1000px, three on larger screens. Payment description occupies its own row on narrow screens, with amount/day/remove below it. The header and plan actions wrap; long card text can wrap. Bank selection has an explicit accessible label independent of option text. Focus outlines include summary and scroll-region controls.

## Observed checks

| Viewport | Document client width | Views checked | Result |
|---|---:|---|---|
| 320px | 305px | Cash, payments, interruption, results, expanded daily table, evidence with open limitations, generated plan preview | Document/body scroll widths 305px |
| 390px | 375px | Same seven views | Document/body scroll widths 375px |
| 768px | 753px | Same seven views | Document/body scroll widths 753px |
| 1280px | 1265px | Same seven views | Document/body scroll widths 1265px |

The difference between viewport and client width is the browser's vertical scrollbar. At 320px the table region measured 238px with 311px scroll content. Keyboard Right moved its horizontal scroll to 73.23px and a focus outline was present.

At 320px, clearing a payment amount displayed validation and a last-valid-save notice; Next: interruption was disabled. Restoring the amount enabled the next step. Enter activated navigation, calculation verification and preparation; confirmation initially stayed disabled. Space checked the review checkbox; Enter confirmed the simulation, producing $0 maximum shortfall with a matching server response. No real money moved.

Tab order from Verify calculation was destination select → minimum preparation → optional-AI checkbox → question → Ask Copilot → Prepare one-page plan. This is a checked segment, not proof of every focus transition or screen-reader announcement.

Machine measurements: `outputs/RESPONSIVE_UI_VERIFICATION.json`. Screenshot: `outputs/mobile-results-proof-20261005.png`. Temporary viewport override was reset after the checks.

## Remaining limits

These checks use the synthetic three-bank example. Prior PDF tests separately cover maximum supported input count/labels. Native mobile touch keyboards, other browsers, screen readers, color contrast and every extreme-input responsive combination are not established by this measurement matrix. Five real SME sessions remain pending.
