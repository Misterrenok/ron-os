# Skill — training / Liftosaur

Scope: training program, progression and live Liftosaur state.

- Read `domains/training.md` for last-confirmed fallback.
- Live Liftosaur owns exact post-export mutable app/session/progression state when accessible. While subscription-gated, use the newest Ron-supplied sanitized export as exact dated evidence and `domains/training.md` as its current fallback; never imply that a dated export proves later state.
- Read `references/training/program-mechanics.md` when progression/deload/load rules matter, `references/training/science.md` for programming decisions, and `references/training/mcp-quirks.md` for connector behavior.
- Direct Ron evidence owns actual completed training when no stronger live execution record exists.
- Until subscription, Ron edits Liftosaur manually. On a new export: hash -> remove account identifiers only -> retain all training-relevant data -> diff against the previous dated snapshot -> append snapshot -> update/read back `domains/training.md`.
- Add schedule, nutrition and health packs when they materially affect training decisions.

This skill owns procedure only, never mutable training state.
