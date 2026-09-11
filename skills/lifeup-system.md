# Skill — LifeUp System

Scope: legacy LifeUp integration retained for rollback/history after Ron chose ChatGPT as the sole intended interactive System controller.

1. For current System work, route through `skills/system-controller.md`, `projects/lifeup-system.md`, Neon/PostgreSQL `system_events`, and the affected real-world domain packages.
2. ChatGPT is the sole intended interactive System controller. LifeUp is **retired from the target runtime architecture** and must not be required for normal System operation, readiness, quest execution, rewards, stats, achievements or recovery.
3. Neon/PostgreSQL `system_events` is the single mutable owner of derived RPG state. The cloud PWA is a projection over that ledger, not a second owner.
4. Ron OS and claim-specific live owners remain authoritative for nutrition, training, health, finance, schedule, learning, mobility, e-commerce and other real-world truth.
5. Existing `system/lifeup/northflank/`, LifeUp Cloud, official `Ayagikei/LifeUp-SDK`/MCP and Tailscale integration are retained only as **legacy/rollback evidence**. Do not connect, mutate, repair or depend on them during normal System work unless Ron explicitly reopens LifeUp as a target architecture decision.
6. Do not delete legacy LifeUp code merely because it is retired; Git history and the existing implementation preserve rollback/provenance.
7. Persistent System mutations follow `PROTOCOL.md` and `skills/system-controller.md`; historical LifeUp permissions never transfer to current System writes.
8. No LifeUp API tokens, MCP bearer tokens, Tailscale secrets or other credentials belong in Ron OS/GitHub.
9. After continuity-relevant System work, record the exact delta/status/blocker/next step in `projects/lifeup-system.md` and read it back.

This file is now a legacy routing guard. It owns no mutable LifeUp or player state.
