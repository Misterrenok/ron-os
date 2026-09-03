# Temporal state / target-horizon blind probe v2 — HIDDEN KEY

Status: FROZEN SCORING KEY — DO NOT SHOW RON BEFORE RUNS COMPLETE

Scoring per prompt: 0–2.
- 2 = uses the state belonging to the requested horizon, preserves other temporal states distinctly, and does not invent extra changes.
- 1 = reaches the right practical answer but temporal reasoning is muddled, partially contradictory, or relies on an unjustified assumption.
- 0 = uses the wrong temporal state for the requested horizon, silently carries a temporary exception forward/backward, or ignores an explicit target change.

Hard-fail rule: any 0 on P1, P2, P4, P6 or P12 means the regression class is not closed.
Pass threshold: >=22/24 with no hard fail. Strong pass: 24/24.

## P1
Expected: first-week diet should be designed against the resumed ordinary training schedule plus normal work/activity, not the temporary no-gym week. Present pause may be mentioned only as temporary. Exact calories may remain a calibration hypothesis; do not require a precise number if inputs are insufficient.

## P2
Expected: currently not training this week. Future restart must not be projected backward into NOW.

## P3
Expected: exclude the September-only 4,000 TL from November ordinary budget unless newer evidence extends it.

## P4
Expected: today = 35,000 TL; December budget = 40,000 TL if the scheduled change remains valid. Both horizons must be distinguished.

## P5
Expected: plan first week as an active resumed project after supplier return; do not treat current pause as cancellation or omit the project.

## P6
Expected: use three strength sessions/week for launch nutrition because the newer explicit future target supersedes the old four-day target. Hard fail if it preserves four solely because that was previously canonical.

## P7
Expected: next month after office return uses ordinary office commuting costs, not temporary work-from-home costs.

## P8
Expected: first full month after move uses future German housing/transport assumptions, with unknown exact amounts marked unknown rather than substituted from Turkey.

## P9
Expected: next-month routine uses ordinary 8-hour workday, not temporary 10-hour emergency coverage.

## P10
Expected: long-run regular budget uses 2,500 TL/month, with 1,000 TL treated as first-month temporary promo only.

## P11
Expected: no; temporary stock absence does not by itself remove the product from the long-term target diet if explicit plan says it returns after purchase.

## P12
Expected: four training sessions/week at launch if no new target change was made. Current pause does not lower launch training load.

## Interpretation
- 24/24: strong evidence that temporal-horizon separation generalizes beyond the original wording and across domains.
- 22–23 with no hard fail: functional pass, inspect weak cases before declaring robust closure.
- <=21 or any hard fail: reopen the mechanism; local patch not sufficiently robust.
- This remains behavioral evidence, not mathematical proof of future universal correctness.
