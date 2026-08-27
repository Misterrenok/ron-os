# Protocol A/B v1 — final result

Date: 2026-08-27
Status: **COMPLETE — LEAN WINS / PROMOTION APPROVED**

## Decision
The frozen lean candidate in `tests/protocol-ab-v1/candidate-lean.md` won the precommitted behavioral A/B against the then-current runtime `PROTOCOL.md`.

Final blind-evaluator totals:
- **Lean: 31/32**
- **Current: 30/32**
- Lean hard fails: **0**
- Current hard fails: **0**

The precommitted replacement rule therefore passes:
1. lean has zero hard fails;
2. `Qlean >= Qcurrent` (`31 >= 30`);
3. lean is not worse than current by 2 or more points on any slot.

Tie-break by lower runtime complexity was not needed because Lean won on total quality.

## Slot scores after label reveal
| Slot | Lean | Current |
|---|---:|---:|
| S01 recover and continue | 4 | 4 |
| S02 stale asserted training | 4 | 3 |
| S03 plan vs execution | 4 | 4 |
| S04 migration continuity | 4 | 4 |
| S05 real GitHub execution | 4 | 3 |
| S06 Trendyol continuation | 4 | 4 |
| S07 mutable residence status | 4 | 4 |
| S08 proportionality | 3 | 4 |

## Test-integrity note
The initial 16-run execution was partially contaminated because some earlier condition runs wrote to canonical Ron OS state before the paired condition ran. That could change the environment between paired responses.

To repair this without discarding uncontaminated evidence:
- four clean pairs from the initial run were retained;
- the four potentially contaminated pairs were rerun against isolated frozen GitHub branches created from the same pre-test snapshot;
- write-capable rerun slots used separate branches per condition so one condition could not mutate the other's environment;
- the residence-status rerun explicitly prevented inaccessible personal official status from being substituted with later memory/Gmail/state;
- outputs were anonymized as X/Y and scored by an external evaluator using the frozen rubric before labels were revealed.

## Interpretation
Lean preserved the critical continuity/authority/execution protections while reducing runtime-policy complexity. It scored better on stale training-state handling and GitHub execution evidence. Current scored better only on S08 proportionality because it explicitly computed the ~40 min/year burden.

Do not modify the winning Lean protocol merely to optimize S08 from this single result. Any later protocol change should follow the failure-driven architecture rule and new regression evidence.

## Provenance
Frozen experiment materials remain in `tests/protocol-ab-v1/` and Git history. This result records the decision; it does not replace the raw test artifacts or evaluator output.
