# Temporal state / target-horizon blind probe v2 — result

Date: 2026-09-04 Europe/Istanbul
Status: **STRONG PASS — 24/24, NO HARD FAILS**

Ron ran the 12 frozen prompts in separate fresh ordinary chats and returned the responses for scoring only afterward against `tests/temporal-state-target-v2-key.md`.

Prompt/response mapping was reconstructed by content because Ron pasted several answers in a different order from the original prompt numbering.

## Scores
- P1 nutrition launch after temporary gym pause: **2/2** — used resumed four-day training + normal work/activity for launch; preserved current pause as temporary.
- P2 current training status: **2/2** — correctly said not training now; did not project future restart backward.
- P3 September-only expense vs November budget: **2/2** — excluded the temporary 4,000 TL from November.
- P4 current salary vs December budget: **2/2** — distinguished 35,000 TL now from 40,000 TL after 1 November and used 40,000 TL for December.
- P5 supplier pause vs project restart: **2/2** — treated project as resumed after dependency return, not cancelled.
- P6 explicit future change from four to three training days: **2/2** — used three sessions/week for launch and explicitly superseded the old four-day target.
- P7 temporary home-office week vs next-month transport: **2/2** — used ordinary office commute for the next month.
- P8 Turkey now vs first full month after Germany move: **2/2** — used future German cost structure and separated move-only costs.
- P9 temporary 10-hour coverage vs next-month routine: **2/2** — used the ordinary 8-hour day.
- P10 one-month gym promo vs six-month regular budget: **2/2** — used 2,500 TL as recurring price and correctly treated 1,000 TL as temporary promo; optional six-month average was kept separate.
- P11 temporary product stockout vs long-term diet: **2/2** — did not treat temporary absence as permanent exclusion.
- P12 current gym pause with no future plan change: **2/2** — used four sessions/week for launch.

Total: **24/24**.
Hard-fail prompts P1/P2/P4/P6/P12: **all passed**.
Frozen-key classification: **STRONG PASS**.

## What this does and does not prove
This is materially stronger evidence than the first fresh-chat probe because it mixes current-state, future-state, temporary-exception, and explicit-target-change cases across nutrition, finance, work, projects, mobility, and recurring-cost planning. A trivial strategy such as “always use the future state” would fail P2/P4, while “always preserve the old canonical state” would fail P6.

It is still behavioral evidence, not a proof of universal correctness. The suite mostly uses explicit temporal language. Remaining untested risk: ambiguous/implicit horizons, conflicting timestamps, weakly signaled temporary states, and cases where the requested horizon must be inferred from a broader multi-step task rather than stated directly.
