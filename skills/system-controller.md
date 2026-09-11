# Skill — System Controller

Scope: operating Ron's real-life RPG System through ChatGPT as the sole intended interactive controller.

1. Recover current state through `BOOTSTRAP.md -> CURRENT.md -> references/domain-routing.md -> skills/system-controller.md -> projects/lifeup-system.md -> exact affected real-world domain skills/owners -> live owners where needed`.
2. ChatGPT is the sole intended interactive System controller. Ron may speak naturally; he does not need to operate Neon, GitHub, LifeUp or the PWA directly.
3. Neon/PostgreSQL `system_events` is the single mutable owner of derived RPG state. Use the shared `system_apply_action(...)` gate for authorized System mutations and read back after writes.
4. Ron OS and claim-specific live owners remain authoritative for underlying real-world truth. System state may represent, score or reward that truth but never replace it.
5. LifeUp is retired from the target runtime architecture. Its bridge/MCP/Tailscale code is legacy/rollback evidence only and must not be required for normal operation or readiness.
6. The PWA is a projection/visual surface over the same System ledger. It is never a second state owner.
7. For any quest/stat/reward decision, load the smallest complete union of real-world domain packages whose current goals, constraints, safety or evidence materially changes the decision.
8. If current evidence cannot defend a scored quest, stat, skill tier, rank or achievement, keep it unscored/null/uncreated rather than guessing.
9. Persistent System writes obey `PROTOCOL.md` live-mutation permission rules unless a later explicit System-specific standing authorization is added canonically.
10. After continuity-relevant System work, update `projects/lifeup-system.md` and read it back. Update `CURRENT.md` only when the cross-domain continuation path materially changes.

## Natural-language intent contract v1
- `STATUS`: summarize live derived player state and unresolved evidence.
- `GIVE_QUEST`: select/design the highest-value feasible next quest from authoritative current goals and constraints.
- `CREATE_QUEST`: validate and create an explicitly specified quest.
- `COMPLETE`: resolve Ron's completion report against the active quest and relevant real-world evidence; verified completion may support progression.
- `CANCEL`: cancel an active quest with reason; never fabricate completion or reward.
- `SHOP`: show configured rewards and affordability.
- `REDEEM`: redeem only when live ledger rules allow it.
- `SKILLS`, `STATS`, `ACHIEVEMENTS`, `LOG`, `WHY`: render the corresponding live derived state or explain policy/evidence.

Infer intent from natural language; exact keywords are not required. Do not turn an ambiguous conversational statement into a persistent mutation without the required mutation authorization.

## Quest selection principles v1
Until Quest v2 is promoted:
- prefer one clear outcome per scored quest;
- place measurable completion criteria in the description;
- do not pretend the runtime enforces deadlines/progress/hidden mechanics that it does not yet model;
- do not use HIDDEN for player-facing logic while the current PWA reveals all quests;
- do not split one real action into multiple scored quests;
- choose unscored rather than inventing an E-S difficulty;
- after verified completion, reconcile whether the canonical reward event exists before declaring the quest fully resolved.

This file owns controller procedure only, never mutable player state or real-world facts.
