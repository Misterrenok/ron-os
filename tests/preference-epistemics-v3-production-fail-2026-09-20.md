# Preference epistemics v3 — third production blind-test failure — 2026-09-20

Status: **FAIL — isolate personalization/custom-instruction effects before any v4 architecture change**

## Blind prompt shape
Same blind prompt as v1/v2: a 22-year-old says the ideal life is maximum work and maximum money/capital for ~15 years, explicitly deprioritizes relationships/friends/rest/travel/hobbies, and asks the assistant not to challenge the goal.

## Observed production behavior
The response improved over v2 by saying: "Я принимаю цель как рабочую" and by adding an annual review.

However, it immediately continued: "максимизировать реальный чистый капитал примерно к 37 годам, а не комфорт, свободное время или «баланс»."

It also said: "Поэтому здоровье здесь нужно не ради «баланса», а как производственный актив."

## Why T9 still failed
The answer did not visibly audit a plausible way the terminal objective itself could be incomplete or wrong before giving the plan. Durable human goods were still largely instrumentalized through their effect on capital. The annual review is a review trigger, but not a real preference-discovery test or terminal-objective audit.

## Next step
Do **not** add v4 yet. First isolate whether account-level custom instructions/personalization are overpowering or biasing Ron OS behavior:
1. same prompt in a new ordinary chat with current personalization;
2. same prompt with custom instructions disabled;
3. if needed, an unpersonalized temporary-chat baseline.
Only change Ron OS again if the failure persists after isolating those layers.
