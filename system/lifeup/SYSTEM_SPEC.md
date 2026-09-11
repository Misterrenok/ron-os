# LifeUp System v1 — mechanics

Status: **CLOUD-FIRST MECHANICS / REQUIRES LIVE CALIBRATION BEFORE LIFEUP MUTATION**

This file defines game mechanics only. It does not own Ron's real-world state; Ron OS and claim-specific live owners do.

Canonical numeric calibration policy: `system/lifeup/CALIBRATION_SPEC.md`. That versioned policy owns the exact meanings of level progression, quest XP/coins, attribute tiers, skill tiers and rank review. LifeUp is an optional downstream surface and does not determine the cloud-core economy.

## 1. Character model

### Core attributes

| Attribute | Meaning | Typical evidence |
|---|---|---|
| `STR` | Physical strength / force production | verified training performance and strength milestones |
| `VIT` | Recovery-supporting capacity and endurance | safe consistency, recovery-supporting behavior, endurance milestones |
| `INT` | Learning, reasoning and knowledge acquisition | study/application evidence, exams, demonstrated capability |
| `DISC` | Reliable execution of chosen commitments | planned-vs-actual completion consistency and follow-through |
| `CHA` | Communication / social effectiveness | demonstrated communication, negotiation, networking or presentation outcomes |

These are broad game attributes. They are not medical measurements and never replace domain-specific metrics. Numeric values, when supported, use the versioned calibration scale in `CALIBRATION_SPEC.md`; unsupported values remain `null`.

### Skills

Skills are narrower trainable capabilities below/alongside the core attributes. Create a skill only when a current Ron OS domain or direct evidence justifies it. Do not infer the active skill portfolio from memory or old plans. A real skill may exist with `level=null` when there is not enough evidence for a numeric tier.

## 2. Quest classes

- `DAILY` — a small number of repeatable actions that protect current priorities. Default cap: **3–5 meaningful quests/day**.
- `SIDE` — optional leverage/opportunity; missing it normally has no penalty.
- `MAIN` — a multi-step outcome with a material real-world result.
- `RECOVERY` — restores execution after overload/failure; should usually reduce complexity rather than punish.
- `HIDDEN/ACHIEVEMENT` — milestone recognition revealed after verified evidence.

A task is not a quest merely because it exists. It must advance a real outcome or protect a meaningful constraint.

## 3. Difficulty ranks

Difficulty describes the quest, not Ron's worth or competence.

| Rank | Meaning |
|---|---|
| `E` | trivial but useful; very low friction |
| `D` | easy, short, little friction |
| `C` | moderate effort or meaningful friction |
| `B` | demanding, multi-step or sustained focus |
| `A` | high-effort/high-value outcome with substantial constraints |
| `S` | exceptional milestone/project; rare |

## 4. Reward economy

The cloud-first reward economy uses the versioned deterministic policy `system-quest-reward:v1` defined in `CALIBRATION_SPEC.md`:

| Rank | XP | Coins |
|---|---:|---:|
| E | 5 | 0 |
| D | 10 | 0 |
| C | 20 | 1 |
| B | 40 | 2 |
| A | 80 | 4 |
| S | 160 | 8 |

There are no discretionary XP multipliers in v1. Real-world leverage belongs in honest quest/rank selection, not arbitrary reward inflation. A quest can remain unscored (`reward_xp=null`, `reward_coins=null`) when classification is uncertain or the economy is not calibrated.

Rules:
- scored quests are allowed only after cloud economy calibration;
- awarded XP/coins must exactly match the originating scored quest;
- only a verified completion may receive progression;
- one completion basis can be rewarded once;
- repeated trivial actions cannot be split or duplicated to farm points;
- E/D deliberately yield no coins;
- unsafe or counterproductive behavior is never rewarded.

Coins are internal System currency for bounded reward-shop privileges. They have no cash value and never authorize an external purchase or payment.

## 5. Progression principles

1. **Real outcome > XP.** Never optimize behavior for game points at the expense of the real objective.
2. **Evidence matters.** Important progression should require direct execution evidence or a credible live record.
3. **Diminishing returns.** Repeating a trivial action cannot farm unlimited XP.
4. **Progressive difficulty.** Increase challenge only after demonstrated reliability; reduce complexity after repeated failure or overload.
5. **No fake precision.** Do not derive STR/INT/etc. as if they were scientific measurements.
6. **No cross-domain laundering.** LifeUp cannot turn a plan into an executed nutrition/training/finance/learning fact.

## 6. Failure / recovery

Normal failure handling, in preferred order:
1. no reward;
2. small in-game coin loss only if a future explicitly versioned policy permits it;
3. streak reset;
4. diagnostic review of the blocker;
5. recovery quest or smaller next step.

Never use sleep deprivation, food/water restriction, unsafe exercise, pain, humiliation, forced spending, illegal actions, health risk or similar harmful punishment mechanics.

## 7. Rank and level

Cloud System Level is a numerical progression counter for verified System activity **after System launch**. It is not a rating of Ron's real-life worth or competence. `system-level-xp:v1` starts at level 1 with zero retroactive XP and derives level/xp-to-next from cumulative System XP.

System Rank (`E → D → C → B → A → S`) remains a separate coarse capability/readiness review and is never promoted from XP alone. `system-rank-review:v1` requires longitudinal evidence before the first non-null rank; the database blocks rank assignment before at least 20 verified rewarded completions spanning at least 28 days, and the controller additionally requires a cited cross-domain evidence/anti-farming review.

If evidence cannot defend a rank, Rank stays `null` or unchanged.

LifeUp native levels, if later synced, are a downstream representation only; they do not become the cloud System's progression authority.

## 8. Achievements

Achievements represent verified milestones, not attendance trophies. Candidate families:
- consistency streaks;
- education/language milestones;
- training milestones;
- financial milestones;
- project/career milestones;
- major administrative/mobility milestones.

Specific achievements are created only from current authoritative domain state and verified provenance. Optional LifeUp synchronization requires separate permission.

## 9. Reward shop

Reward items must be reversible and bounded. Examples of categories, not pre-approved current items:
- leisure blocks;
- discretionary entertainment;
- small purchases within current finance rules;
- planned rest/recovery privileges.

The shop must not incentivize unhealthy food restriction/binging, sleep loss, debt, risky spending or medically unsafe behavior. System redemption itself never performs an external purchase/payment.

## 10. Cloud launch vs optional LifeUp launch gate

Promoting a calibration policy does not fabricate a player profile. The first real cloud profile launch is a separate evidence-backed write through `system_apply_action`; unsupported attributes/skills/rank remain `null`.

The following gate applies specifically before any initial **LifeUp mutation** or sync write:
1. Northflank remote MCP is reachable.
2. LifeUp Cloud is reachable over Tailscale.
3. Read-only `get_info` / skills / tasks / coin/shop baseline has been read.
4. Relevant Ron OS owners have been recovered.
5. Exact initial LifeUp mutations are listed and explicitly authorized.
6. Writes are executed in a bounded batch and read back.

Thus the cloud-first System may calibrate and operate independently of Android/LifeUp, while optional LifeUp mutation remains separately gated.
