# Training program mechanics

> **STATE POINTER:** current/last-confirmed training state lives only in `domains/training.md`. Exact mutable app state lives in live Liftosaur. This file is durable mechanics/history reference, not a current-state owner.

## Progression / deload logic — recovered fallback
The most recent persistent fallback evidence available while live Liftosaur is subscription-gated records this shorthand:

1. `stall` counts **sessions without progression**, not merely attempts that fall below the lower rep bound.
2. On incomplete prescribed work, keep the same target and increment `stall`.
3. If all prescribed work closes, progress reps by +1 according to the program logic; after the rep ceiling, the executable program may progress load.
4. Where the custom rule applies, weight selection uses the minimum of completed weights: `min(completedWeights)`.
5. **Last-known deload trigger: `stall = 3`**, followed by staged loading of approximately **60% -> 90% -> working load**, then return to normal progression.
6. Do **not** replace this with the previously stored `two consecutive failures` shorthand; that runtime reference was contradicted by the later consolidated fallback.
7. Exact current Liftosaur source code, per-exercise application, counters and mutable targets remain `UNKNOWN` until live Liftosaur or a fresh export is available.

## Load logging conventions — durable fallback
- For barbell movements, historical equipment configuration uses `bar.kg = 0` because the gym bar weight is not reliably known.
- Logged barbell weight therefore represents **plates only**.
- Known plate denominations: **20 / 10 / 5 / 2.5 kg**.
- Practical total load step: **5 kg**.
- Apparent historical changes around the logging-method switch must not automatically be treated as strength regression.

## Session / timer conventions — durable fallback
- First two movements were last known as standalone movements with roughly **180 s** rest.
- Remaining work was organized in supersets.
- Shorthand: roughly **15 s** between exercises inside a round, **90–120 s** between rounds.
- Exact current timer/exercise configuration remains live-app state.

## Boundary
The full historical program source is intentionally excluded from runtime Ron OS because it could be mistaken for current state. This reference retains only mechanics that are useful when live Liftosaur is inaccessible; live Liftosaur or a newer explicit Ron report supersedes it.
