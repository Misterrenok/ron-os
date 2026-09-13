# Ron System — mechanics

Status: **CLOUD-FIRST / QUEST V2 ACTIVE / LIFEUP RETIRED**

This file defines game mechanics only. It does not own Ron's real-world state; Ron OS and claim-specific live owners do. LifeUp is not part of the target runtime.

Canonical numeric calibration policy: `system/lifeup/CALIBRATION_SPEC.md`.

## 1. Character model

Core attributes are `STR`, `VIT`, `INT`, `DISC`, `CHA`. They are coarse game abstractions, not medical or psychological measurements. Numeric values use the versioned evidence policy and remain `null` when current evidence is insufficient.

Skills are narrower trainable capabilities. Create or change them only from current authoritative evidence. A real skill may exist with `level=null` when a numeric tier is not defensible.

## 2. Quest classes

- `DAILY` — a small set of repeatable priority-protecting actions.
- `SIDE` — optional leverage/opportunity.
- `MAIN` — multi-step outcome with a material real-world result.
- `RECOVERY` — reduces complexity or restores execution after overload/failure.
- `HIDDEN/ACHIEVEMENT` — milestone recognition with a defensible reveal condition.

A task is not a quest merely because it exists; it must advance a real outcome or protect a meaningful constraint.

## 3. Difficulty and rewards

Difficulty describes the quest, not Ron's worth. Quest scoring follows `QUEST_DIFFICULTY_SPEC.md` and `system-quest-difficulty:v1`.

Deterministic reward policy `system-quest-reward:v1`:

| Rank | XP | Coins |
|---|---:|---:|
| E | 5 | 0 |
| D | 10 | 0 |
| C | 20 | 1 |
| B | 40 | 2 |
| A | 80 | 4 |
| S | 160 | 8 |

No discretionary multiplier exists in v1. Missing anchors, artificial splitting, duplicates, unsafe scope or low confidence must fail closed to unscored rather than inventing progression.

## 4. Progression

1. Real outcome > XP.
2. Only verified completion may support progression.
3. One scored completion basis is rewarded once.
4. Repeated trivial activity cannot be split to farm XP/coins.
5. Unsupported attributes/skills/rank remain `null`.
6. System-derived state never overrides the upstream real-world owner.

Routine verified scored completion uses atomic `quest.resolve`: final verified objective progress + `quest.completed` + exact canonical progression in one idempotent transaction.

## 5. Timing and failure

Timing follows `SOFT_TARGET_SPEC.md`:
- no target when timing adds no material value;
- soft target when earlier execution helps but a miss does not invalidate the outcome;
- hard deadline only for a real external deadline or explicitly accepted time-bounded challenge whose miss should end the quest.

Hard deadlines may be server-expired automatically. A missed soft target never completes, fails, expires or removes the quest reward.

Failure/recovery should use bounded internal consequences such as no reward, diagnosis, recovery quest, smaller next step or a future explicitly versioned safe game consequence. Never use sleep deprivation, food/water restriction, medication/health/safety deprivation, unsafe exercise, pain, humiliation, forced spending, debt, illegal behavior or mandatory real-world duties as punishment.

## 6. Level and rank

`system-level-xp:v1` starts at level 1 with zero retroactive XP. Level is derived from verified System XP and is not a rating of real-life worth.

Rank `E -> D -> C -> B -> A -> S` is separate from XP and follows `system-rank-review:v1`. If longitudinal evidence cannot defend a rank, keep it `null` or unchanged.

## 7. Achievements, shop and attributes

Achievements follow `ACHIEVEMENT_SPEC.md` / `system-achievement-ledger:v1` and recognize deterministic verified System-era milestones. Unlocking never fabricates evidence or grants progression by itself.

Shop behavior follows `SHOP_SPEC.md` / `system-shop-economy:v1`. Coins have no cash value and never authorize an external purchase, payment, subscription, booking or message. Protected needs and mandatory duties can never be locked behind coins.

Attributes follow `ATTRIBUTE_EVIDENCE_SPEC.md` / `system-attribute-evidence:v1` plus `system-attribute-ordinal5:v1`. Evaluation does not write by itself.

## 8. Strategy bridge

`XMIND_STRATEGY_BRIDGE_SPEC.md` provides an optional read-only strategic reference. XMind never becomes a second truth store and is never written automatically by the System.

## 9. Cloud runtime boundary

The active runtime is:

`ChatGPT controller -> Ron OS/upstream owners -> Neon System action gate -> system_events -> projections -> Northflank PWA/API`.

The PWA may perform only bounded actions exposed by the active API/session contract. It does not own current real-world truth or a parallel RPG database.

LifeUp, LifeUp Cloud, Tailscale and the former remote LifeUp bridge are retired and preserved only as rollback evidence under Git history and `system/lifeup/northflank/`. Reopening them requires an explicit new decision; normal readiness must not depend on them.

## 10. Production mutation boundary

A policy/spec being present never initializes or mutates production by itself. Any real player-state change must satisfy the current controller policy, evidence requirements and permission gate, use the shared System action path, and be read back. Unsupported state remains absent/null rather than guessed.
