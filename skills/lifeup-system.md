# Skill — LifeUp System

Scope: building, operating or changing Ron's LifeUp-based real-life RPG System, including quests, XP/coins, skills, achievements, shop rewards, LifeUp Cloud, the official LifeUp MCP and the Northflank remote bridge.

1. Start from `BOOTSTRAP.md` -> `CURRENT.md` -> `PROTOCOL.md` when current personal/project state or nontrivial reasoning matters.
2. Read `projects/lifeup-system.md` before asserting the System's current implementation/status.
3. LifeUp is a **derived RPG ledger/execution UI**. It never replaces the real owner of nutrition, training, health, finance, schedule, learning, mobility, e-commerce or other life state.
4. For a quest/reward/stat decision, load the smallest complete union of affected domain packages and claim-relevant live owners before deciding what the game should represent.
5. A LifeUp task being present/scheduled is not proof of execution. A genuine completion may be supporting execution evidence only when it reflects Ron's real action and does not conflict with a stronger direct/live execution record.
6. Any LifeUp mutation follows `PROTOCOL.md`'s live-mutation gate. Building/configuring the System or reading LifeUp does not authorize creating/editing/completing/deleting tasks, skills, achievements, items, rewards or penalties.
7. Primary technical implementation: official `Ayagikei/LifeUp-SDK` MCP. Preferred always-on route: Northflank Streamable HTTP adapter -> Tailscale -> LifeUp Cloud on Android.
8. Never place LifeUp API tokens, MCP bearer tokens, Tailscale secrets or account credentials in Ron OS/GitHub. Runtime secret stores and local environment variables own them.
9. Keep gameplay aligned to real-world value: anti-farming, conservative penalties, no harmful punishment mechanics, and calibrated workload against relevant current constraints.
10. After continuity-relevant System work, record the exact delta/status/blocker/next step in `projects/lifeup-system.md` and read it back. Update `CURRENT.md` only when the cross-domain continuation index materially changes.

This skill owns procedure/routing only, never mutable LifeUp or personal state.
