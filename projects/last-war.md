# Last War — current project owner

Status: **CANDIDATE — NOT YET PROMOTED**  
AS_OF: **2026-11-12 Europe/Istanbul** (project routing only; not a current game-state snapshot)

## Purpose and authority

This is the stable project/source map for Ron's recurring Last War execution. It owns project identity and routing, not mutable game progress.

- **Exact Ron gameplay contract and execution checkpoints:** TickTick NOTE task ID: `6ae4df4e8f0847e165baa705`; project ID: `6ad83dfa8f086e43495bde94`. Read the current task and newest relevant comments before each ping. Do not duplicate or silently rewrite its detailed user decisions here.
- **Current game state is owned only by the live A55 UI.** Daily score, chest claim receipts, energy, troops, hero squads, marches, resources, queue timers, builders, train seats, trucks, secret tasks, events, VS battle timer and shield state must be read fresh from the game. TickTick comments are dated checkpoints, not a substitute for live UI.
- **Execution surface:** the existing Oracle Phoenix Admin connection and the single guarded A55 virtual display. `skills/last-war.md` defines the mandatory preflight, visual interaction and recovery procedure. ADB serials and display IDs are volatile; enumerate and verify them each session.
- **Authority boundary:** ChatGPT is the sole interactive game executor; Hermes only delivers scheduled pings. No second game process, secondary model, new automation or infrastructure is authorized by this project route.
- **Separation:** Last War is an external mobile game, separate from the internal Ron System/LifeUp/Neon. Do not create or mutate `system_events` for ordinary Last War play.

## Operational continuity

- The 2026-11-12 ADB/VD stall incident is preserved in TickTick comment `HERMES_LASTWAR_NUDGE_5981589`: in-session ADB devices/get-state timed out while the VD frame remained nonblack; after the owned client/desktop were stopped, idle ADB recovered. The cause remains **UNKNOWN**. If it recurs, pause input and follow the bounded recovery path; do not assume the transport issue is fixed.
- The missing Last War route reported in pings `5981597`–`5981614` is addressed by this registered skill/owner package. Route registration is not a game action and does not establish any current game progress.

## Non-duplication rule

Do not store current Daily points, chest receipts, energy totals, troops, resources, march assignments, ADB serials, display IDs, window coordinates, event availability, battle countdowns or shield state in this file. Keep durable procedure in the skill, Ron's exact gameplay decisions/checkpoints in the TickTick NOTE, and mutable gameplay facts in the live game UI.
