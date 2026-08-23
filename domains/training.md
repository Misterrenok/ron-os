# Ron Training — current-state canon

Updated: 2026-08-21
Status: ACTIVE
AS_OF: 2026-08-18 confirmed state unless a newer Ron report or live Liftosaur read supersedes it

## Ownership contract

This file is the **single GitHub file owner of the last-confirmed training fallback state**.

Live Liftosaur remains the owner of exact mutable application state: exact current source text, exercise/set/weight targets, progression state, workout history, and any edits made after this snapshot. Ron's newer explicit report owns real-world execution and can supersede this fallback for the fact he directly reports.

If live Liftosaur is unavailable, authentication/subscription-gated, or fails after reasonable retries, **do not stop at the connector error** when this fallback can answer the stable-state question. Use only the facts explicitly confirmed below, stamp them as last-confirmed/as-of, and keep exact volatile fields `UNKNOWN` until live read-back is possible.

## Last-confirmed stable training state

- Active program: `txfxzary` («Программа тренировок от Клода»), active since 2026-07-31.
- `kmxuaopn` («3 раза в неделю фуллбади, Моя программа») is inactive/archive and must not be edited.
- Confirmed weekly schedule: **Mon Lower A / Tue Upper A / Thu Lower B / Fri Upper B**.
- Confirmed planned volume: **146 sets/week = 36 / 39 / 37 / 34** for Mon/Tue/Thu/Fri respectively.
- Ron explicitly confirmed the weekday correction on 2026-08-18.
- **Known stale premise:** Mon/Tue/Wed/Fri is not the current confirmed schedule; Wednesday must not be resurrected from older summaries.
- Do not cut the program roughly in half merely because an old snapshot, estimated duration, or stale premise makes it look too long. First collect real session duration/performance/recovery data and run the normal impact-check.

## Degraded-read boundary

When live Liftosaur cannot be read, this canon is sufficient to answer questions such as:
- which program is the last-confirmed active program;
- which weekdays are last-confirmed training days;
- the last-confirmed planned weekly set count and day split;
- whether an older Mon/Tue/Wed/Fri premise or archived `kmxuaopn` state is stale.

It is **not** sufficient to claim the exact current exercise list, target weights/reps, progression counters, completed workout results, or exact program source. Those remain `UNKNOWN` without a newer live read or explicit Ron report.

## Detailed reference boundary

`references/training/program-mechanics.md` contains only durable progression/deload mechanics distilled from the historical implementation. The full historical program source is intentionally excluded from runtime Ron OS because it could be mistaken for current state. Exact current source/weights/exercises come only from live Liftosaur; current stable fallback state comes from this canon.
