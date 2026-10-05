# SME pilot protocol

Status 2026-10-05: no participants recruited and no sessions completed, confirmed by the owner. This document is a plan.

## Recruitment

Recruit five US SME owners or people who directly manage business cash/payroll using US banks. Prefer more than one bank and a recurring essential payment schedule. Aim for variation in current workflow (spreadsheet, accounting software, manual banking). Do not substitute software developers unfamiliar with SME cash operations and count them as target users.

The project owner recruits and contacts participants. No messages have been sent by the agent. Record only participant codes P01–P05, role category and relevant workflow; do not collect names, account identifiers or real balances. Use the synthetic task below. Obtain agreement before recording; recording is optional.

## Session, 15–20 minutes

1. Ask how the participant currently prepares for temporary loss of access to one bank. Record a concrete past workflow if available; do not imply a failure is likely.
2. Present the English app with an empty session and the task below. Start timing when they begin. Observe silently; record every facilitator hint separately.
3. Ask them to explain the result and review a proposed preparation. Confirm that they understand the action changes only a simulation. Ask them to prepare the printable summary.
4. Ask what was unclear, what action the plan would support, and what they would need before using it in their workflow. Discuss pricing only after need and trust questions; hypothetical willingness is not revenue.

## Synthetic task card

“You have $90,000 at Example bank A, $60,000 at Example bank B and $30,000 at Example bank C. Payroll of $85,000 is due on day 5, supplier payments of $40,000 on day 15 and operating costs of $25,000 on day 25. Before an interruption, test the assumption that 80% of bank A's funds become unavailable for 21 days. Identify the first unmet payment day and peak shortfall. Find the smallest preparation to bank B, review and confirm it in the simulation, then create a plan.”

Expected deterministic values: total $180,000; inaccessible $72,000; first shortfall day 15; peak $17,000; minimum preparation $21,250; simulated peak after confirmation $0. Funds return at the start of day 22. These are example assumptions, not observed company finances.

## Comprehension questions, without hints

- Is the 80% value your assumption or the software's prediction?
- Does this result predict a bank failure?
- Does confirmation move real money?
- Are future receipts included? What day do inaccessible funds return?
- Does this preparation guarantee coverage when a different bank becomes unavailable?

Correct answers: user assumption; no; no; receipts excluded / day 22; no. Record verbatim misconceptions and whether they persisted after seeing the app's explanations.

## Predeclared usability gate

At least 4 of 5 participants complete input → result → reviewed confirmation → printable plan within five minutes without facilitator assistance, and answer all critical questions about user assumptions, real transfers and bank failure predictions correctly. Report assisted completion separately. Report observed counts, not percentages implying population validity. Five sessions detect practical usability issues; they do not establish statistical generalization or financial outcomes.

## Results template

| Code | Role/workflow | Completed unassisted | Seconds | First failure/hint | Assumptions understood | No real transfer understood | No failure prediction understood | Useful next step stated | Revision |
|---|---|---|---|---|---|---|---|---|---|
| P01 | Pending | Pending | — | — | — | — | — | — | — |
| P02 | Pending | Pending | — | — | — | — | — | — | — |
| P03 | Pending | Pending | — | — | — | — | — | — | — |
| P04 | Pending | Pending | — | — | — | — | — | — | — |
| P05 | Pending | Pending | — | — | — | — | — | — | — |

Record build/commit or source hash, device/browser, date and task variant for each session. Prioritize changes by observed failures and rerun changed flows. Keep research model claims separate from UX findings.
