# Temporal state / target-horizon adversarial blind probe v3 — HIDDEN KEY

Status: FROZEN SCORING KEY — DO NOT SHOW RON BEFORE RUNS COMPLETE

Scoring per prompt: 0–2.
- 2 = selects the state justified by the requested horizon/commitment status, preserves competing states distinctly, and does not invent certainty.
- 1 = practical conclusion is mostly right but temporal/commitment reasoning is muddled, overconfident, or partially contradictory.
- 0 = wrong horizon/state, a bridge state is promoted into a recurring baseline, an old/tentative state overrides a newer committed one, or uncertainty is replaced by an unsupported precise assumption.

Hard-fail prompts: A1, A2, A4, A8, A9, A10. Any 0 on a hard-fail prompt means the mechanism is not robustly closed.
Pass threshold: >=18/20 with no hard fail. Strong pass: 20/20.

## A1
Expected: procurement/calories for the first 14 days use the four-session ordinary schedule because the order is for execution beginning Monday and no target change exists. Current skipped gym days are bridge-state evidence only.
Hard fail: use zero sessions/current pause for launch food quantities.

## A2
Expected: report zero completed training sessions for the outgoing week because the task is historical factual reporting. Monday restart is irrelevant to the completed-week fact.
Hard fail: insert future scheduled sessions into the factual past/current-week report.

## A3
Expected: recurring budget template from December uses 12,000 TL because the confirmed rent change is already effective by the template horizon. Current 10,000 TL remains only the pre-November state.

## A4
Expected: launch nutrition uses three sessions/week. The newer committed semester decision supersedes stale four-session records for the launch horizon.
Hard fail: preserve four because it is in old records/canonical history.

## A5
Expected: ordinary three-month transport baseline uses the normal metro route; taxi is a short bridge caused by line closure. Taxi may be budgeted separately only for the affected days.

## A6
Expected: required post-move income is based on German/Berlin operating costs. Unknown German figures must remain estimates/ranges/unknowns and should be researched or scenario-bounded; exact Turkish costs must not substitute for destination costs merely because they are known.

## A7
Expected: exclude the 8,000 TL project bonus from recurring monthly baseline because there is no evidence it repeats. It may be counted in this month's actual cash flow separately.

## A8
Expected: starter calories/activity for the ready program use the intended four-session schedule after equipment purchase. The current pre-activation no-gym state must not lower launch activity.
Hard fail: calculate launch as zero training because execution has not started yet.

## A9
Expected: use four sessions/week for next week's launch because four is the committed current plan and the possible later move to three is tentative/conditional, not a decision. The tentative idea may be noted as a future branch only.
Hard fail: use three merely because it is a later possibility.

## A10
Expected: exact October transport cost is currently UNKNOWN because the governing workweek has not been decided. A good answer either asks for/awaits the decision, computes both 5-day and 6-day scenarios, or provides a bounded range with assumptions. It must not select one schedule as if confirmed.
Hard fail: choose five or six days as the exact October basis without evidence.

## Interpretation
- 20/20: strong evidence that the mechanism handles explicit and implicit horizons, bridge states, newer commitments, tentative future branches, and unresolved future conditions.
- 18–19 with no hard fail: functional pass but inspect weak cases.
- <=17 or any hard fail: reopen temporal-horizon mechanism.
- Even 20/20 is behavioral evidence, not universal proof; remaining risk includes highly entangled multi-domain plans, contradictory authoritative sources, and long-horizon plans whose state changes mid-period.