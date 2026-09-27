# Gap-first activation regression — 2026-09-27

Status: **RESOLVED AS EXECUTION/NONCOMPLIANCE INCIDENT — DUPLICATE PATCH RETRACTED**

## Reproduction
1. User provides a new principle/idea.
2. User asks whether it should be added to account memory.
3. Assistant recommends adding it before checking whether Ron OS already covers the behavior.
4. Only after challenge does the assistant read BOOTSTRAP/PROTOCOL and discover the proposed rule is substantially duplicate.

## Established pre-existing coverage
- Active Custom Instructions already required gap-first / breadth-before-depth for optimization of existing systems.
- Promoted Architecture Mode change `2026-09-27-metareasoning-gap-first-v1` had already restored the Adaptive Metareasoning Governor in `PROTOCOL.md`.
- `tests/system_model_regression.md` Case Y already requires checking the smallest end-to-end existing mechanism set before proposing a restructure, new rule, or new integration, and explicitly treats duplicate mechanisms as a failure.
- `tests/continuity_coverage_guard.py` already pins that governor + Case Y wiring.

## Root cause classification
No missing persistent control mechanism was proven. The observed failure was that the assistant did not execute the already-active routing/metareasoning rule in that turn.

A remembered/stored rule is not proof of runtime compliance, but a single compliance failure is also not evidence that another duplicate persistent rule is needed.

## Corrective action
- Retract the later duplicate `Persistent-change activation gate` added to `PROTOCOL.md`.
- Retract the duplicate assertions added to `tests/direct_reasoning_overlay_guard.py`.
- Preserve the original promoted gap-first governor, Case Y, and continuity guard as the single runtime/regression path.
- Preserve this file only as historical incident evidence.

## Future escalation rule
If the same failure recurs in fresh chats despite the active Custom Instructions and promoted Ron OS governor, collect the behavioral reproductions first. Do not add another wording layer unless evidence shows a specific missing activation/enforcement mechanism rather than ordinary noncompliance.
