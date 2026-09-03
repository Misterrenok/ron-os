# Temporal state / target-horizon regression v1

Status: FROZEN BEHAVIORAL CASES

Purpose: catch the failure class where a temporary current state is incorrectly used as the state for a future/launch plan.

Scoring: each case is PASS only if the answer uses the state belonging to the question's horizon while preserving other temporal states as distinct facts. Do not infer extra changes.

## TST-1 — nutrition launch after temporary training pause
Facts: Ron normally plans four strength sessions per week. He says: “I paused training until we finish the nutrition plan; I will resume training as soon as I start the diet.” Question: “Design the calories for Day 1 of the diet.”
Expected: Day 1 calculations include the resumed four-day training regime. The present pause may be mentioned as NOW but must not lower launch calories.
Hard fail: designing Day 1 as a no-training diet solely because training is paused today.

## TST-2 — current-state query must stay current
Same facts as TST-1. Question: “Am I training right now?”
Expected: No; training is currently paused until diet launch.
Hard fail: answering that he is currently training because the target schedule contains four sessions.

## TST-3 — temporary expense ends before future budget horizon
Facts: A temporary 4,000 TL monthly expense applies only in September and ends before October. Question: “Build the November monthly budget.”
Expected: Do not include the temporary September-only 4,000 TL expense in November unless newer evidence extends it.
Hard fail: carrying a current/temporary expense into the future target horizon without evidence.

## TST-4 — future salary must not rewrite current income
Facts: Ron currently earns 35,000 TL salary. A signed change says salary becomes 40,000 TL starting 1 November. Question: “What is my salary today, 3 September?”
Expected: 35,000 TL current salary; 40,000 TL is a future effective state.
Hard fail: calling 40,000 TL the current salary.

## TST-5 — project maintenance pause vs cancellation
Facts: A project is paused for two weeks while an external dependency is unavailable; Ron explicitly says work resumes when the dependency returns. Question: “Plan the first week after the dependency returns.”
Expected: Plan against the resumed project state; do not treat the pause as cancellation.
Hard fail: recommend abandoning or excluding the project merely because it is paused now.

## TST-6 — explicit target change overrides old target
Facts: Ron previously planned four training days, but now explicitly says: “When I restart with the diet, I am changing permanently to three training days per week.” Question: “Design Day 1 calories.”
Expected: Use three training days as the new TARGET/LAUNCH state. The old four-day target is superseded.
Hard fail: preserve four days merely because it was canonical before the explicit target change.

## Required invariant
For consequential planning when temporal states differ, interpretation must preserve distinct state slots:
- NOW: what is true at present;
- TRANSITION/CONDITION: what temporarily bridges now to the target;
- TARGET/LAUNCH: the state relevant to the requested future/launch horizon.

The requested horizon selects the state used for calculations. A fact in one slot does not silently overwrite another.
