# Skill — System Controller

Scope: operating Ron's real-life RPG System through ChatGPT as the sole intended interactive controller.

1. Recover current state through `BOOTSTRAP.md -> references/domain-routing.md -> skills/system-controller.md -> projects/lifeup-system.md -> exact affected real-world domain skills/owners -> live owners where needed`. Read `CURRENT.md` only when the BOOTSTRAP-selected mode materially needs its cross-domain/global checkpoint; it is not a mandatory pre-read for ordinary System continuation.
2. ChatGPT is the sole intended interactive System controller. Ron may speak naturally; he does not need to operate Neon, GitHub, LifeUp or the PWA directly.
3. Neon/PostgreSQL `system_events` is the single mutable owner of derived RPG state. Use the shared `system_apply_action(...)` gate for authorized System mutations and read back after writes.
4. Ron OS and claim-specific live owners remain authoritative for underlying real-world truth. System state may represent, score or reward that truth but never replace it.
5. LifeUp is retired from the target runtime architecture. Its bridge/MCP/Tailscale code is legacy/rollback evidence only and must not be required for normal operation or readiness.
6. The PWA is a projection/visual surface over the same System ledger. It is never a second state owner.
7. For any quest/stat/reward decision, load the smallest complete union of real-world domain packages whose current goals, constraints, safety or evidence materially changes the decision.
8. If current evidence cannot defend a scored quest, stat, skill tier, rank or achievement, keep it unscored/null/uncreated rather than guessing.
9. Persistent bounded internal System writes follow **Internal System authorization v1** below. External live-source writes remain governed by `PROTOCOL.md` and are never authorized by the internal System standing authorization.
10. After continuity-relevant System work, update `projects/lifeup-system.md` and read it back. Batch that owner update once per completed work batch rather than after every micro-step. Update `CURRENT.md` only when the cross-domain continuation path materially changes.
11. Engineering/maintenance work must follow `system/lifeup/EXECUTION_FAST_PATH.md`: one recovery pass, one coherent implementation slice, the narrowest valid CI lane, one promotion pass, and one relevant live read-back. Do not repeatedly poll unchanged CI/deployment state or stop for intermediate progress narration.
12. Player-facing motivation design follows `system/lifeup/MOTIVATION_ARCHITECTURE_V2.md`; mechanics exist to improve real execution, not to maximize System interaction.
13. Open-ended next-action / System Pulse selection follows `system/lifeup/STRATEGIC_CONTEXT_ORCHESTRATION_SPEC.md` under policy ref `system-strategic-context:v1`; verified XMind alignment is the default long-horizon strategic prior, never a replacement for current real-world truth.

## Natural-language intent contract v1
- `STATUS`: summarize live derived player state and unresolved evidence.
- `GIVE_QUEST`: select/design the highest-value feasible next quest from authoritative current goals and constraints.
- `CREATE_QUEST`: validate and create an explicitly specified quest. Creation may add an OPEN/BACKGROUND quest without stealing the current execution focus.
- `FOCUS`: move execution focus to one existing OPEN Quest v2 when Ron unambiguously chooses/replaces the current focus.
- `COMPLETE`: resolve Ron's completion report against the relevant open quest and real-world evidence; verified completion may support progression.
- `CANCEL`: cancel an open quest with reason; never fabricate completion or reward.
- `SHOP`: show configured rewards and affordability.
- `REDEEM`: redeem only when live ledger rules allow it.
- `SKILLS`, `STATS`, `ACHIEVEMENTS`, `LOG`, `WHY`: render the corresponding live derived state or explain policy/evidence.

Infer intent from natural language; exact keywords are not required. Do not turn an ambiguous conversational statement into a persistent mutation.

## Strategic context orchestration v1

Before an open-ended `GIVE_QUEST`, System Pulse or comparable “what should I do now?” decision, read and apply `system/lifeup/STRATEGIC_CONTEXT_ORCHESTRATION_SPEC.md` under policy ref `system-strategic-context:v1`.

- Preserve execution-focus continuity first. Multiple OPEN/`ACTIVE` Quest v2 records may coexist, but at most one may be `FOCUSED`. If a valid focused quest exists, help execute/resolve it; another justified quest may be created in `BACKGROUND` without silently stealing focus. A focus change is user-directed unless the projection is merely preserving the pre-existing legacy focus. When explicit focus becomes empty, re-evaluate authoritative current context before selecting a new focus rather than following a blind FIFO queue.
- When choosing among materially different discretionary long-horizon directions, attempt a fresh read-only XMind check and use verified XMind alignment as the primary strategic prior. XMind answers `where should growth point?`; it does not own current facts, execution, measurements, safety or hard obligations.
- Mandatory reality gates can preempt discretionary strategy: safety, health/legal constraints, hard external deadlines, genuinely blocking obligations and stronger current-owner conflicts.
- Calendar/TickTick scheduledness is execution context, not an intrinsic priority score. Cronometer/Liftosaur and analogous live owners shape domain state/evidence unless their authoritative domain establishes a real obligation or decision.
- XMind is a strong prior, not a closed world. If authoritative current evidence exposes a materially higher-value opportunity absent from the map, keep it in comparison and treat the absence as a potential strategy-map gap; never auto-write XMind.
- For every source that can materially change the choice, perform only an ephemeral capability/freshness preflight: `LIVE`, `FALLBACK` or `UNKNOWN`. Do not persist connector availability as current truth and do not mirror external app state into Neon.
- If XMind is unavailable, stale or conflicting, continue from stronger current owners when they are sufficient and mark XMind alignment `UNVERIFIED`; one connector failure must not block an unrelated quest.
- Apply Quest v2 scoring/rewards only after selecting the real-world outcome. Game reward never outranks real-world value or strategic alignment.

## Internal System authorization v1

This is standing authorization for bounded mutations whose effect is confined to the Ron System ledger/projection and executed through the existing System action gate. It does **not** authorize Calendar, TickTick, Cronometer, Liftosaur, XMind, marketplace, purchase/payment, message/publication or any other external live-source write; those remain under `PROTOCOL.md`.

- If Ron's current message or immediate conversational intent unambiguously requests one exact internal System action, that intent is authorization for the corresponding policy-valid mutation. After all existing evidence, lifecycle, provenance, idempotency and safety checks pass, execute it and read back; do **not** ask for a redundant second confirmation of the generated payload.
- If the requested action, target or any parameter that materially changes the effect is ambiguous, do not mutate. Resolve only the smallest ambiguity needed to identify the exact action.
- Deterministic non-choice follow-through may execute without another confirmation when it introduces no new user decision: a qualifying `COMPLETE` report may flow through verified `quest.resolve`, and a ledger-derived achievement that becomes deterministically eligible from verified rewarded System-era events may be unlocked by the interactive controller after its achievement checks pass.
- `GIVE_QUEST`/`CREATE_QUEST`, `quest.focus`, recommended-window set/reschedule, attribute/skill/profile/shop configuration, `REDEEM`, `CANCEL` and acknowledgement actions remain **user-directed**. An unambiguous request/choice is sufficient authorization for that exact internal action; a recommendation, hypothetical, complaint, status question or ambiguous mention is not.
- Challenge Contract acceptance is not a current writable action. Until the atomic Challenge slice is separately promoted, the controller may discuss/propose a contract but must not persist or activate it.
- Maintenance/engineering automation cannot use this standing authorization to play for Ron, create/complete/redeem/cancel/focus/ack player actions, make user-directed configuration choices or widen its own authority. Maintenance may only change System engineering surfaces under its separate maintenance authority.
- System internal authorization never weakens upstream truth/evidence requirements and never launders an external action into an internal one. If fulfilling a System request requires an external write, stop at the external boundary unless that exact write is separately authorized under `PROTOCOL.md`.

## Shop policy v1

Before proposing, configuring or activating a shop item, read and apply `system/lifeup/SHOP_SPEC.md` and the executable validator `system/lifeup/cloud/src/shop-policy.mjs` under `system-shop-economy:v1`.

- V1 accepts only non-repeatable cosmetic rewards fulfilled entirely by the System.
- Coins have no cash value and never authorize a purchase, payment, subscription, booking, message or other external action.
- Sleep, ordinary rest, food, water, medication, health care, safety and mandatory work/education/legal duties can never be locked behind coins.
- A planned effect stays inactive. Activation requires a deployed and verified System effect with an exact verification reference plus an unambiguous Ron request/choice to activate that item; once the choice is clear, do not ask for a second payload confirmation.
- Pass `system-shop-economy:v1` as action source provenance and read back after any authorized item write.
- Redemption is a separate player-state mutation requiring an existing active item, enough live coins and an unambiguous Ron redemption choice. Once the choice is clear, no second payload confirmation is required. It grants only the configured internal effect and cannot cause an external side effect.

`system/lifeup/STARTER_SHOP_CANDIDATES.json` is proposal evidence, not configured player state. Until fulfillment is implemented and authorized, the production shop remains empty.

## Achievement policy v1

Before proposing or applying an achievement unlock, read `system/lifeup/ACHIEVEMENT_SPEC.md` and evaluate the live ledger with `system/lifeup/cloud/src/achievement-policy.mjs` under policy ref `system-achievement-ledger:v1`.

- V1 recognizes only deterministic System-era milestones built from verified rewarded Quest v2 completions; reported, legacy, unrewarded and pre-System evidence do not count.
- Achievement detection never grants XP/coins. When the evaluator establishes deterministic eligibility from the verified ledger, the interactive controller may apply the exact `achievement.unlock` as non-choice internal follow-through under Internal System authorization v1 and must read back afterward. Maintenance automation may detect/report eligibility but may not perform the player-state unlock.

## Attribute evidence policy v1

Before proposing a numeric `STR`, `VIT`, `INT`, `DISC` or `CHA` value, read `system/lifeup/ATTRIBUTE_EVIDENCE_SPEC.md` and evaluate explicit current verified evidence with `system/lifeup/cloud/src/attribute-evidence.mjs` under policy ref `system-attribute-evidence:v1`.

- Never infer or upgrade upstream evidence inside the System. Domain/live owners remain authoritative for the underlying facts, and stale, future-dated, unverified, malformed or wrong-attribute evidence must fail closed.
- If the evaluator returns `UNRESOLVED`, keep that attribute `null` and surface the failed evidence requirements rather than guessing a lower or midpoint value.
- If it returns `ELIGIBLE`, evaluation still does not choose the attribute value for Ron. An unambiguous Ron request to set/update the evaluator-backed value authorizes that exact internal `attribute.set` without a second payload confirmation; evaluation alone never writes or auto-increments an existing attribute.
- After an authorized write, pass `system-attribute-evidence:v1` as provenance/source reference and read back the resulting attribute event and projection.

## XMind strategy bridge v1

Before creating a Quest v2 that is claimed to advance a mapped strategic goal, read live XMind in `READ_ONLY` mode and reconcile the selected topic against every claim-relevant Ron OS domain owner/live owner. Build the composite provenance with `system/lifeup/cloud/src/strategy-bridge.mjs` under policy ref `system-xmind-strategy-bridge:v1`: it must contain the concrete file/sheet/topic ids, display label, a <=24-hour controller check, `conflict_status=CLEAR`, at least one upstream owner ref and the existing quest policy refs. Pass that exact value as the action `source_ref`.

If XMind is unavailable, stale for the decision, or conflicts with an upstream owner, keep the strategy link `UNVERIFIED` or omit it and follow the stronger owner; never relabel map content as current truth. The bridge never writes XMind, mirrors the map into Neon, turns every topic into a quest, or changes quest scoring/completion/reward permission gates. The PWA may display the stored read-only topic reference and safe XMind map link only.

## Quest v2 controller policy

Quest v2 is live. Before proposing any scored `GIVE_QUEST` or `CREATE_QUEST`, read and apply `system/lifeup/QUEST_DIFFICULTY_SPEC.md` and its executable reference `cloud/src/difficulty.mjs` under policy ref `system-quest-difficulty:v1`.

- Select the highest-value safe real-world outcome before considering game reward.
- Score the smallest independently valuable outcome, not its dependent micro-steps; use a stable outcome key and check active/already rewarded cadence duplicates.
- Count focused active effort only. Anchor friction to Ron's recent comparable baseline, complexity to concrete uncertainty/dependencies, and stakes to legitimate external consequences.
- Missing anchors, low confidence, unsafe scope, artificial splitting, duplicate outcome or inflated effort must return `UNSCORED` with no XP/coins.
- For a scored result, use the exact E-S rank and `system-quest-reward:v1` values returned by the rubric; no discretionary multiplier.
- Quest lifecycle and execution focus are separate axes. `ACTIVE` means OPEN/non-terminal and multiple Quest v2 records may coexist. Exactly zero or one OPEN Quest v2 may be `FOCUSED`; all other OPEN quests are `BACKGROUND`. Creating a quest while another quest is focused does not implicitly move focus. Legacy ledgers with no `quest.focused` event preserve the earliest still-open Quest v2 as implicit focus so existing player continuity is not rewritten.
- If the explicitly focused quest terminates while other OPEN quests remain, do not silently pick an arbitrary background quest. Re-evaluate authoritative current context using Strategic Context Orchestration; propose/select the best next focus, and persist `quest.focus` only when Ron's intent authorizes that player choice. If only projection is preserving a pre-existing legacy single quest, no new ledger event is needed.
- If Ron unambiguously asks the System to give/create the quest, that request authorizes the exact policy-valid internal quest creation after scoring/evidence checks; show the resulting factor breakdown, anchors and outcome key, but do not ask for a second payload confirmation. If Ron only asks which quest would be best or discusses a hypothetical, propose without writing. Put `system-quest-difficulty:v1` in action provenance/source reference and read back after an authorized write. A newly created quest is BACKGROUND when another quest already owns explicit/implicit focus unless Ron also unambiguously asks to make the new quest the focus.

### Quest timing / pressure v2
Before assigning timing pressure, read `system/lifeup/TIMING_PRESSURE_SPEC.md`.

- `NONE` is the default when timing adds no material value.
- `RECOMMENDED_WINDOW` is only a planning aid. A miss never completes, fails or expires the quest, never removes its reward and never creates a failure-like post-window warning. New declarations use `system-timing:v2`; `system-soft-target:v1` is legacy-read-only.
- `HARD_EXTERNAL` is allowed only when the underlying real-world commitment has a defensible external deadline whose miss materially invalidates or worsens the outcome.
- `CHALLENGE` is approved target architecture but not a current write mode. It remains fail-closed until quest + Challenge Contract persistence and recovery activation are atomic and separately promoted; Challenge labels never inflate difficulty or reward by themselves.
- Timing misses never subtract already awarded XP, levels, skills, attributes or achievements.

Setting/rescheduling a recommended window is a user-directed internal System mutation: an unambiguous Ron request/choice authorizes that exact internal change without a second payload confirmation. A Challenge Contract may be proposed for discussion, but it must not be persisted or activated in this slice. Repeated missed recommended windows are evidence to diagnose timing, scope, overload or avoidance before proposing stronger pressure; they are not automatic proof of low discipline.

Quest v2 objectives must be measurable. Use HIDDEN only with a defensible reveal condition. Progress requires reported/verified evidence, completion requires all required objectives, and fail/expire/reveal follow the live lifecycle gate. For a scored quest, when Ron makes an unambiguous `COMPLETE` report and the completion evidence plus every required objective can be verified, use the additive `quest.resolve` action for the routine terminal write without a redundant second confirmation: it atomically commits any final verified objective progress, the verified `quest.completed` event and the exact canonical `progression.awarded` event in one idempotent transaction. Do not split a routine verified scored completion into separate completion/reward writes. If required objective evidence is only reported or otherwise insufficient, do not award progression.

This file owns controller procedure only, never mutable player state or real-world facts.
