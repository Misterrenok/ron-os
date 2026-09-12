# LifeUp System — project owner

Updated: 2026-09-12 Europe/Istanbul
Status: **LIVE / CLOUD-FIRST SYSTEM / CHATGPT CONTROLLER / QUEST V2 ACTIVE / SOFT TARGET V1 LIVE / LIFEUP RETIRED FROM TARGET RUNTIME**

## Purpose
Own the current project decisions, runtime boundaries, current verified fallback checkpoint, OPEN/CLOSED state and continuation path for Ron's real-life RPG System. Historical implementation detail belongs in architecture manifests, closeouts and Git history rather than this current owner.

## Authority and routing
- ChatGPT is the sole intended interactive System controller.
- Neon/PostgreSQL `system_events` is the one mutable owner of **derived RPG state**.
- Ron OS and claim-specific live owners remain authoritative for underlying real-world facts; the System may represent/reward them but never replaces them.
- Northflank PWA is a projection/read surface over the same ledger, not a second mutable owner.
- LifeUp is retired from the target runtime. Its MCP/Tailscale/Android bridge remains legacy/rollback evidence only unless Ron explicitly reopens that architecture.
- Before asserting mutable player state, read live Neon. This file is a verified fallback/checkpoint, not permission to treat old counts as live forever.
- Persistent player mutations go only through `system_apply_action(...)`, remain exact-authorization gated, and require write read-back.

## Runtime architecture
```text
Ron
 |
 v
ChatGPT / System Controller
 |
 +----> Ron OS + claim-specific live owners  (real-world truth)
 |
 +----> Neon/PostgreSQL system_apply_action(...)
              |
              v
       append-only system_events
              |
              v
       rebuildable projections
              |
              +----> Northflank PWA / read surfaces
```

## Current production checkpoint
Fresh live Neon read during the 2026-09-12 owner-compaction recovery:
- ledger: **13 events / max seq 15**; historical sequence gaps are expected;
- event types: `profile.calibrated` 1, `skill.upserted` 2, `quest.created` 4, `quest.cancelled` 2, `quest.expired` 1, `notification.pushed` 2, `notification.acknowledged` 1;
- `progression.awarded`: **0**;
- therefore calibrated System XP remains **0**, coins remain **0**, and no verified rewarded Quest v2 completion exists yet;
- latest calibrated profile event: Level **1**, Rank `null`, XP-to-next **500**, economy `CALIBRATED`, refs `system-level-xp:v1` + `system-quest-reward:v1`;
- active initialized skills remain `Turkish` Tier **3** and `Marketplace Operations` Tier **3** under `system-skill-competency5:v1`;
- STR/VIT/INT/DISC/CHA remain `null` because no `attribute.set` event exists;
- production shop remains unconfigured because no shop event exists;
- no achievement unlock exists.

### Active player Quest v2
Quest seq **14**:
- id: `qv2-german-nicos-weg-a1-hallo-recovery-20260912`;
- title: `Немецкий: первый урок Nicos Weg A1 — Hallo!`;
- class/rank/reward: `RECOVERY / D / 10 XP / 0 coins`;
- hard deadline: **none**;
- objective 1: complete `Hallo!` lesson and exercises, target `1 lesson`;
- objective 2: without prompts, provide `3` German phrases from the lesson with Russian meanings;
- stable outcome key: `learning:german:nicos-weg:a1:hallo`;
- the fresh quest-specific Neon read returned only its `quest.created` event; no completion/cancel/fail/expire event was present at this checkpoint.

Soft-target declaration seq **15**:
- policy: `system-soft-target:v1`;
- target: **2026-09-12 21:30 Europe/Istanbul** = `2026-09-12T18:30:00Z`;
- this is intentionally **not** a hard deadline;
- missing it must not complete/fail/expire the quest and must not remove the 10 XP reward;
- exact receipt: `history/2026-09-12-xmind-linked-quest-proposal.json`;
- release closeout: `history/2026-09-12-system-soft-target-v1-closeout.md`.

The previous real player quest `qv2-german-nicos-weg-a1-day1-20260911` is historically **EXPIRED / unrewarded**. Legacy infrastructure `persist-probe` is **CANCELLED / neutralized** and was never a genuine player quest.

## Canonical mechanics and policies
- Calibration/XP: `system-level-xp:v1`; no retroactive XP for pre-System history.
- Quest reward ladder: `system-quest-reward:v1` — E 5/0, D 10/0, C 20/1, B 40/2, A 80/4, S 160/8 XP/coins.
- Quest difficulty: `system-quest-difficulty:v1`; use the executable rubric, fail closed to UNSCORED when evidence is insufficient or scope is gameable.
- Quest v2 lifecycle is live with the one-active-player-quest invariant.
- Routine verified scored completion uses atomic `quest.resolve`: verified final objective progress + `quest.completed` + exact canonical reward in one idempotent PostgreSQL transaction. Reported-only evidence cannot be laundered into progression.
- Timing: `system/lifeup/SOFT_TARGET_SPEC.md`; choose NO TARGET when timing adds no value, SOFT by default when earlier execution helps but a miss does not invalidate the outcome, HARD only for a real external deadline or explicitly accepted time-bounded challenge.
- Deadline automation remains authoritative for hard deadlines and can server-expire them without ChatGPT.
- Shop: `system-shop-economy:v1`; only safe System-controlled cosmetics, and configuration/redemption remain separate exact-permission mutations. Verified starter fulfillments exist but production catalog is empty.
- Achievements: `system-achievement-ledger:v1`; eligibility derives only from verified rewarded Quest v2 completions and unlocking is permission-gated.
- Attributes: `system-attribute-evidence:v1` + `system-attribute-ordinal5:v1`; unresolved evidence stays `null` and evaluator never writes by itself.
- Skills: `system-skill-competency5:v1`; numeric skill tiers require verified provenance.
- XMind bridge: `system-xmind-strategy-bridge:v1`; strictly READ_ONLY, optional strategy provenance only, never a second truth store or automatic sync.
- Russian-first PWA + signed persistent device session are live; Web Push subsystem is implemented. Exact subscription/delivery state is mutable and must be read live before asserting it.

## Autonomous maintenance executor
- Live automation owner confirms task **`Развитие Ron System`** is **ENABLED**, exact hourly, timezone `Europe/Istanbul`.
- Its automation prompt is an executable projection, not a current-state owner; every run must recover this GitHub owner and live owners first.
- The prompt still contains a historical P0 about the CRITICAL-notification acknowledgement/drill-down dead-end. That P0 is **CLOSED / SUPERSEDED**: PWA notification acknowledgement + drill-down v1 was promoted on `61b77b389608c1e1d4f06d63e5b9ea086431be4d` and must not be selected again merely because the automation prompt still mentions it.
- Do not rewrite the automation definition implicitly. If its prompt itself should be cleaned up, that is a separate live automation mutation.

## Deployment and verification boundary
- Soft Target v1 runtime/controller merge: `62e5738f29acfd4e214c787ea16cbe9d75a96927`.
- Post-main CI for that release: system-cloud `34687628015` PASS, continuity `34687627979` PASS, legacy LifeUp rollback `34687627973` PASS.
- Northflank commit status for that release: `system-core` build `playful-winter-3317` SUCCESS.
- Direct public HTTP read-back for the Soft Target release was retried during owner-compaction closeout, but the canonical `code.run` hostname still did not resolve from the available environments. Do not silently promote build success into an HTTP-health claim.
- Canonical historical public route: `https://p01--system-core--yh2fvbyd9vfg.code.run`; the old short alias was previously 502 and is not canonical.

## OPEN
1. **Current active quest:** wait for real completion evidence for both Hallo objectives. Do not infer completion from elapsed time or a soft-target miss. When evidence is sufficient, resolve through canonical `quest.resolve`; reward exactly **10 XP / 0 coins once**.
2. **Achievement follow-on:** after the first verified rewarded Quest v2 completion, evaluate `system-achievement-ledger:v1`; any unlock remains a separate exact-permission mutation.
3. **Shop:** verified starter cosmetics remain unconfigured/inactive in production. Do not activate/redeem implicitly; live coins are 0 at this checkpoint.
4. **Attributes:** STR/VIT/INT/DISC/CHA remain null until current upstream evidence makes an individual attribute ELIGIBLE and Ron authorizes the exact `attribute.set` payload.
5. **Skills:** add/change only with evidence-supported current competence; do not initialize weakly evidenced skills for visual completeness.
6. **Disposable Neon test branches:** cleanup is destructive and remains permission-gated.
7. **HTTP verification tail:** a future environment that can resolve the canonical Northflank hostname may close the Soft Target v1 direct HTTP read-back; this is verification hygiene, not a player-state blocker.
8. **Automation prompt hygiene:** the hourly executor is live, but its embedded notification-UX P0 is stale. Current GitHub owner supersedes it, so this does not block execution; editing the automation definition remains a separate live mutation.

## Next execution
- If Ron reports the active Hallo quest complete, verify both objectives against the completion/evidence contract and use the atomic resolution path only if the required evidence qualifies.
- Otherwise continue highest-value bounded System engineering under `system/lifeup/EXECUTION_FAST_PATH.md`; safe code-only work may proceed through candidate/CI/promotion, while player/schema/credential/external side effects remain separately authorization-gated.
- Do not create another player Quest v2 while the current one is ACTIVE.
- The hourly maintenance loop must ignore its stale notification-UX P0 because this owner records that slice as CLOSED.

## Continuity / history
This owner was compacted because the former large current surface contained stale current-state labels after production seq14/15 already existed. No displaced content was deleted from Git history.

Owner-compaction v1 was promoted through PR #15. Candidate and post-main continuity plus legacy LifeUp static/Docker regression checks passed. The compaction changed no runtime code, database schema, routing, automation definition or player state.

Exact pre-compaction recovery points:
- base commit: `b0afda51add2feecffc36331a75f91a2855fb06f`;
- old `projects/lifeup-system.md` Git blob: `23ddbca42d2936d016ef371019845d66c41058c6`.

The old owner remains byte-recoverable from that commit/blob, while detailed historical closeouts remain discoverable in `history/` and `architecture/changes/`. Architecture evidence for this compaction: `architecture/changes/2026-09-12-system-owner-compaction-v1.json`.

This file owns current project continuity only. It does not own mutable player state, underlying real-world facts, automation definitions, or historical archive truth.