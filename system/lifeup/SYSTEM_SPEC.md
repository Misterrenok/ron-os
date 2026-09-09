# LifeUp System v1 — mechanics

Status: **STARTING SPEC / REQUIRES LIVE CALIBRATION BEFORE LIFEUP MUTATION**

This file defines game mechanics only. It does not own Ron's real-world state; Ron OS and claim-specific live owners do.

## 1. Character model

### Core attributes

| Attribute | Meaning | Typical evidence |
|---|---|---|
| `STR` | Physical strength / force production | verified training performance and strength milestones |
| `VIT` | Recovery-supporting capacity and endurance | safe consistency, recovery-supporting behavior, endurance milestones |
| `INT` | Learning, reasoning and knowledge acquisition | study/application evidence, exams, demonstrated capability |
| `DISC` | Reliable execution of chosen commitments | planned-vs-actual completion consistency and follow-through |
| `CHA` | Communication / social effectiveness | demonstrated communication, negotiation, networking or presentation outcomes |

These are broad game attributes. They are not medical measurements and never replace domain-specific metrics.

### Skills

Skills are narrower trainable capabilities below/alongside the core attributes. Create a skill only when a current Ron OS domain or direct evidence justifies it. Do not infer the active skill portfolio from memory or old plans.

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

Exact XP/coin values remain **UNVERIFIED until the first live LifeUp baseline**. The initial economy will be calibrated from current level, existing skills/tasks, completion rate and observed task difficulty.

### Relative reward weights

Use these ratios before converting to LifeUp integer XP:

| Rank | Relative XP weight |
|---|---:|
| E | 1 |
| D | 2 |
| C | 4 |
| B | 8 |
| A | 16 |
| S | 32 |

Modifiers may adjust the base weight:
- meaningful real-world leverage: up to `×1.5`;
- verified deliberate practice / measurable output: up to `×1.5`;
- repeated trivial task: down to `×0` through diminishing returns;
- optional SIDE quest: no failure penalty;
- unsafe or counterproductive behavior: never rewarded.

Coins are for controlled reward-shop spending/privileges and must remain subordinate to finance/health constraints.

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
2. small in-game coin loss when appropriate;
3. streak reset;
4. diagnostic review of the blocker;
5. recovery quest or smaller next step.

Never use sleep deprivation, food/water restriction, unsafe exercise, pain, humiliation, forced spending, illegal actions, health risk or similar harmful punishment mechanics.

## 7. Rank and level

LifeUp's native levels remain the numerical progression ledger. A separate System Rank (`E → D → C → B → A → S`) is a coarse capability/readiness tier and must not be promoted from total XP alone.

Rank promotion should eventually require a bundle of evidence such as:
- sustained execution reliability;
- progression in multiple relevant skills;
- at least one meaningful MAIN quest/milestone;
- no obvious exploit/farming pattern.

Exact promotion thresholds remain **OPEN** until live baseline + several weeks of actual System usage provide calibration data.

## 8. Achievements

Achievements represent verified milestones, not attendance trophies. Candidate families:
- consistency streaks;
- education/language milestones;
- training milestones;
- financial milestones;
- project/career milestones;
- major administrative/mobility milestones.

Specific achievements are created only from current authoritative domain state and with exact LifeUp write permission.

## 9. Reward shop

Reward items must be reversible and bounded. Examples of categories, not pre-approved current items:
- leisure blocks;
- discretionary entertainment;
- small purchases within current finance rules;
- planned rest/recovery privileges.

The shop must not incentivize unhealthy food restriction/binging, sleep loss, debt, risky spending or medically unsafe behavior.

## 10. V1 launch gate

Do not create the initial System in LifeUp until all are true:
1. Northflank remote MCP is reachable.
2. LifeUp Cloud is reachable over Tailscale.
3. Read-only `get_info` / skills / tasks / coin/shop baseline has been read.
4. Relevant Ron OS owners have been recovered.
5. Exact initial mutations are listed and explicitly authorized.
6. Writes are executed in a bounded batch and read back.

Until then this specification is design state, not live execution state.
