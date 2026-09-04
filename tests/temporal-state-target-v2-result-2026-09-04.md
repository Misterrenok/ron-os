# Temporal state / target-horizon blind probe v2 — result

Date: 2026-09-04 Europe/Istanbul
Status: **OBSERVED 24/24, BUT STATE-CONTAMINATED — NOT VALID INDEPENDENT CLOSURE EVIDENCE**

Ron ran the 12 frozen prompts in separate fresh ordinary chats and returned the responses for scoring only afterward against `tests/temporal-state-target-v2-key.md`.

Prompt/response mapping was reconstructed by content because Ron pasted several answers in a different order from the original prompt numbering.

## Observed scores
- P1 nutrition launch after temporary gym pause: **2/2**
- P2 current training status: **2/2**
- P3 September-only expense vs November budget: **2/2**
- P4 current salary vs December budget: **2/2**
- P5 supplier pause vs project restart: **2/2**
- P6 explicit future change from four to three training days: **2/2**
- P7 temporary home-office week vs next-month transport: **2/2**
- P8 Turkey now vs first full month after Germany move: **2/2**
- P9 temporary 10-hour coverage vs next-month routine: **2/2**
- P10 one-month gym promo vs six-month regular budget: **2/2**
- P11 temporary product stockout vs long-term diet: **2/2**
- P12 current gym pause with no future plan change: **2/2**

Observed total: **24/24**.

## Contamination discovered after the run
The fresh chats shared the same writable Ron OS. Several synthetic test facts were persisted into real current owners as if they were direct Ron updates, including a 40,000 TL salary from 1 November, a September-only 4,000 TL expense, an 8,000 TL one-off bonus, and a temporary three-session training target. Later prompts could therefore read state created by earlier test prompts.

This invalidates the run as independent cross-chat evidence even though the answers matched the frozen key. The result is retained as observed behavior only, not as proof that the temporal-horizon mechanism independently generalized.

The contaminated current-owner writes were removed on 2026-09-04 by restoring `domains/finance.md` to its clean pre-test state at commit `3addfdaf0fb718942640637f9c9d86d7c1547173` and `domains/training.md` to the legitimate pause/restart state at commit `7fd317ec143ae847022a7d4283bf7bad1d449017`.

## Testing implication
Future personalized behavioral probes must prevent shared-state writes from one case influencing another. Acceptable designs include an explicit no-persistence instruction for each fresh chat, an isolated/frozen Ron OS branch with reset between cases, or one-case-at-a-time execution with owner rollback before the next case. Separate chat windows alone are not isolation.
