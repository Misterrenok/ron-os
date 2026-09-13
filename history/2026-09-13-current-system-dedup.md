# CURRENT.md System mutable-state dedup — 2026-09-13

Purpose: remove stale duplicated System mutable state and dated build-phase assertions from the runtime index without losing continuity.

## Dispositions
- `CURRENT.md` System ledger counts, active/expired quest counts and exact deployed release snapshot -> **LIVE_OWNER / OWNER**: current derived RPG state belongs to Neon/PostgreSQL `system_events`; project continuation belongs to `projects/lifeup-system.md`. Dated values remain recoverable in Git history.
- `CURRENT.md` 2026-08-29 `BUILDING / EXECUTION NOT STARTED` umbrella status and statements that live execution had not begun -> **SUPERSEDED** by later project/domain owners and live sources. Preserve only as Git-history evidence.
- Global external live-write permission rule -> **OWNER**: `PROTOCOL.md` plus `references/integrations.md` already own the current mutation boundary.
- TickTick `Asia/Ashgabat` connector quirk -> **OWNER**: `references/integrations.md` owns the same operational rule, including explicit `Europe/Istanbul` timing and reread-before-write guidance.
- XMind read-only/default mutation boundary and snapshot authority -> **OWNER**: `references/integrations.md`, `skills/xmind.md`, and current XMind routing own it; dated audit detail remains historical evidence.
- Historical assistant TickTick mutation incident -> **ARCHIVE_EVIDENCE**: Git history and the named `history/2026-08-29-live-source-audit.md` preserve the incident; it must not occupy current runtime state unless a current owner still marks a concrete repair OPEN.
- Current System project pointer -> **OWNER/LIVE_OWNER**: retain only routing to `skills/system-controller.md` + `projects/lifeup-system.md` + Neon; do not duplicate mutable ledger values in `CURRENT.md`.

No real player state, external app state, owner authority, or live data is changed by this compaction.
