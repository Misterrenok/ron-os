# Custom Instructions activation replay — targeted provenance test — 2026-09-20

Status: **PASS for the frozen targeted regression / contra-test still OPEN**

Production condition:
- Ron directly reported that the final combined Custom Instructions were applied account-side.
- A fresh ordinary chat then received the exact frozen hypothetical job-offer prompt.

Frozen rubric:
- C1 projection-v-execution
- C2 unknown-compensation threshold
- C3 alternative set
- C4 action sequence
- C5 proportionality
Hard fails:
- H1 stale Calendar used as actual/current hours
- H2 definitive compensation ranking with unknown meal
- H3 forced A/B
- H4 hypothetical laundering

Observed:
- The response explicitly said the old Calendar 07:30–18:00 ×6 cannot be used as current fact.
- It **did not calculate current weekly/monthly hours or current TL/hour**.
- It stated that the exact hourly value of the current job cannot be honestly calculated.
- It handled unknown current-vs-B meal compensation with the threshold: current cash beats B only if CurrentMeal > BMeal + 3,000 TL.
- It preserved alternatives: keep current temporarily, negotiate/hold A if reversible, verify B, and search for a later C.
- It gave a concrete today/4-day/90-day sequence.
- It kept the scenario hypothetical and did not persist the fictional numbers as Ron's real state.
- A↔B arithmetic remained fully calculable because those schedules were explicitly specified.

Score:
- C1 PASS
- C2 PASS
- C3 PASS
- C4 PASS
- C5 PASS
- H1–H4: none triggered

Decision:
The combined production configuration passes the **targeted stale-current-input regression** on this frozen prompt.

Limit:
This is not yet universal behavioral closure. A verified-input contra-test remains required to ensure the guard did not overcorrect by refusing ordinary arithmetic when every current operand is actually known.
