# System Soft Target v1 — legacy compatibility

Status: **RETIRED FOR NEW ACTIONS / HISTORY ONLY**
Policy ref: `system-soft-target:v1`
Replacement: `system/lifeup/TIMING_PRESSURE_SPEC.md` / `system-timing:v2`

## Purpose
Preserve interpretation of immutable historical Soft Target declarations already present in `system_events`. This policy must not be used to create new player timing pressure.

Historical declarations use:

`system-soft-target:v1?quest=<quest-id>&target=<iso-timestamp>[&reason=...]`

Runtime compatibility may parse them as legacy `RECOMMENDED_WINDOW` evidence. They never authorize a quest failure, expiry, reward removal or recovery consequence.

The old pre-target reminder and post-target `Мягкая цель пропущена` behavior are historical semantics only. Timing/Pressure v2 sends no post-window missed warning for recommended windows.

## New actions
For all new timing decisions use `system/lifeup/TIMING_PRESSURE_SPEC.md`:
- `NONE` when timing adds no material value;
- `RECOMMENDED_WINDOW` as a non-terminal planning aid;
- `HARD_EXTERNAL` only for a real external deadline;
- `CHALLENGE` only after explicit acceptance of the artificial deadline and its bounded recovery consequence.

Do not rewrite or delete old ledger events merely to migrate terminology. Git history preserves the former active Soft Target policy exactly.
