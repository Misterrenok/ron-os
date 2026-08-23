# Training program mechanics

> **STATE POINTER:** current/last-confirmed training state lives only in `domains/training.md`. Exact mutable app state lives in live Liftosaur. This file is durable mechanics/history reference, not a current-state owner.

## Progression / deload logic retained from the historical `txfxzary` implementation

The reusable custom progression used state variables for initialization, consecutive failures, deload stage, working weight, increment and rep range.

1. On successful completion, add one rep until the top of the rep range.
2. At the top of the rep range, add the exercise-specific weight increment and reset reps to the lower bound.
3. After two consecutive failures, use a staged deload: approximately 60% of working weight -> 90% -> return to working weight, then clear the failure counter.
4. Explicit initialization is required for exercises that may start at 0 kg so the working-weight state is not accidentally treated as uninitialized.
5. Exact current progression code, exercise list, weights and source text must be read from live Liftosaur before mutation.

The full 2026-07-30 program source is intentionally not copied into the runtime Ron OS repository because it is historical and could be mistaken for current state. It remains legacy evidence only.
