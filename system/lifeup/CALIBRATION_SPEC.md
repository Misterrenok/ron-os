# System Calibration v1

Status: **CANDIDATE / NO PRODUCTION PROFILE VALUES ARE CREATED BY THIS SPEC**

This file defines the canonical game-scale meanings used by the cloud-first System. It does not own real-world truth. Ron OS and claim-specific live owners remain authoritative for the underlying evidence.

## 1. Versioned policy references

The v1 policy identifiers are stable data-contract references:

- Level policy: `system-level-xp:v1`
- Quest reward policy: `system-quest-reward:v1`
- Core attribute scale: `system-attribute-ordinal5:v1`
- Generic skill scale: `system-skill-competency5:v1`
- System rank review: `system-rank-review:v1`

A later policy must use a new reference rather than silently changing the meaning of an old event.

## 2. Unknown is not zero

`null` means **not calibrated / insufficient current evidence**. It never means zero ability.

Rules:
- never fill unknown attributes or skills with a midpoint;
- never infer a current value solely from old memory, age, job title, plans, or unrelated activity;
- never backfill XP for life before System launch;
- when evidence is too weak for a numeric tier, keep the field `null` or keep the skill with `level=null`;
- calibration values are game abstractions, not medical, psychological, educational or occupational diagnoses.

## 2A. Scientific status of numeric constants

The numeric progression/economy constants in this v1 policy are **versioned game-design calibration parameters**, not empirically established psychological optima.

In particular:
- `500 * L` level spacing is an internal pacing curve, not a scientifically validated learning or motivation law;
- quest rewards `5/10/20/40/80/160 XP` and `0/0/1/2/4/8 Coins` are deterministic anti-gaming/game-balance choices, not effect-size translations;
- rank-review and achievement thresholds are evidence/UX gates chosen for stable operation, not population-derived optimal cutoffs.

`CALIBRATED` therefore means **internally defined, versioned and consistently applied**, not “scientifically optimized.” The System must never cite these exact numbers as research-backed. Change them only through a new versioned policy after either (a) materially stronger external evidence justifies a directional change, or (b) Ron-specific N-of-1 evidence shows the current constants create meaningful under-reinforcement, over-reinforcement, gaming, friction or loss of informativeness.

## 3. Level policy — `system-level-xp:v1`

Level is deliberately **not an estimate of Ron's real-life worth or competence**. It is only a progression counter for verified System activity after launch.

Launch semantics:
- cumulative System XP starts at `0`;
- the first calibrated System level is `1`;
- no retroactive XP is granted for pre-System history;
- rank remains separate and may remain `null`.

For level `L >= 1`:

```text
XP required from level L to L+1 = 500 * L
cumulative XP threshold for level L = 250 * L * (L - 1)
```

Examples:

| Level | Minimum cumulative XP | XP from that level to next |
|---:|---:|---:|
| 1 | 0 | 500 |
| 2 | 500 | 1,000 |
| 3 | 1,500 | 1,500 |
| 4 | 3,000 | 2,000 |
| 5 | 5,000 | 2,500 |
| 10 | 22,500 | 5,000 |

`xp_to_next` is always the next cumulative threshold minus current cumulative XP. Once this policy is active, level and `xp_to_next` are derived from XP and cannot be independently chosen.

## 4. Quest reward policy — `system-quest-reward:v1`

V1 intentionally has **no discretionary multipliers**. A quest's scored reward is determined only by its difficulty rank. Real-world leverage should influence honest rank classification, not an ad-hoc XP multiplier.

| Quest rank | XP | Coins |
|---|---:|---:|
| E | 5 | 0 |
| D | 10 | 0 |
| C | 20 | 1 |
| B | 40 | 2 |
| A | 80 | 4 |
| S | 160 | 8 |

Rules:
- an unscored quest may exist with `reward_xp=null` and `reward_coins=null`;
- a scored quest must use exactly the table above;
- a scored quest is allowed only after the reward economy is calibrated;
- progression still requires a **verified** `quest.completed` basis event;
- one completion basis can be rewarded only once;
- the awarded XP/coins must exactly match the originating scored quest;
- E/D deliberately produce no coins to make trivial routine farming unattractive;
- coins have no cash value and never authorize spending by themselves.

### Anti-farming

- One real action cannot be split into multiple scored quests merely to multiply XP.
- A repeatable routine receives at most one scored quest for its intended cadence; duplicate instances in the same cadence must be unscored.
- Repeated trivial activity should remain E/D or become unscored rather than being promoted for persistence alone.
- No reward is issued for unsafe, counterproductive, fabricated or unverifiable execution.
- If a controller cannot confidently classify a quest, it should create it unscored rather than guess a reward.

## 5. Core attributes — `system-attribute-ordinal5:v1`

`STR`, `VIT`, `INT`, `DISC`, and `CHA` use the same **ordinal evidence-strength scale**. The number is a coarse tier, not a scientific measurement and not a percentage.

Use the highest tier whose entire evidence floor is supported. Do not average partial anchors.

| Tier | Anchor | Minimum evidence floor |
|---:|---|---|
| 1 | Demonstrated baseline | At least one current direct verified evidence item relevant to the attribute. |
| 2 | Functional / repeated | Repeated verified evidence on at least two distinct occasions, including a real outcome rather than only intention. |
| 3 | Reliable | Evidence spans about 4+ weeks and includes an objective benchmark, measurable output or repeated successful outcome. |
| 4 | Advanced | Evidence spans about 8+ weeks and includes a difficult benchmark or high-friction outcome that is repeatedly demonstrated. |
| 5 | Exceptional | Evidence spans about 12+ weeks and includes unusually strong independent/external validation or an exceptional milestone. |

Attribute-specific evidence must remain relevant to the attribute:

- `STR`: verified resistance/force-production performance and strength milestones.
- `VIT`: endurance/recovery-supporting performance and safe sustained capacity; never a diagnosis or proxy for hidden medical state.
- `INT`: demonstrated learning, reasoning, exams, applied knowledge or produced work.
- `DISC`: planned-vs-executed follow-through across meaningful commitments, not raw busyness.
- `CHA`: demonstrated communication, negotiation, presentation, networking or relationship outcomes.

A prior tier may be lowered or cleared when current evidence no longer supports it. Attributes are current coarse game-state estimates, not permanent achievements.

Every numeric `attribute.set` must carry:
- verified evidence;
- a concrete evidence reference;
- `scale_ref = system-attribute-ordinal5:v1`;
- integer value `1..5`.

## 6. Skills — `system-skill-competency5:v1`

Skills are narrower capabilities than attributes. A skill may exist with `level=null` when the capability is real but evidence is insufficient for a tier.

| Tier | Competency anchor |
|---:|---|
| 1 | Guided — can perform a basic task with instructions, examples or close reference. |
| 2 | Basic independent — can complete routine tasks independently in familiar conditions. |
| 3 | Reliable independent — handles normal variation and common problems without step-by-step help. |
| 4 | Advanced — handles difficult/complex cases, adapts method and can explain the capability clearly. |
| 5 | Expert evidence — repeatedly solves novel difficult cases and has strong external validation, teaching-quality mastery or equivalent evidence. |

Rules:
- numeric levels require verified evidence and `scale_ref = system-skill-competency5:v1`;
- use the highest fully demonstrated anchor, not an average;
- domain-specific objective benchmarks may strengthen evidence but cannot redefine the generic tier silently;
- if a domain needs a materially different scale, introduce a new versioned scale reference instead of abusing this one.

## 7. Rank policy — `system-rank-review:v1`

System Rank (`E → D → C → B → A → S`) is a coarse readiness/capability review. It is **not calculated from XP**.

The initial production profile may remain `rank=null`. The first rank review requires enough longitudinal System evidence to make the label meaningful:
- at least roughly 28 days of live System use;
- at least 20 verified rewarded completions;
- evidence from at least two real-world domains;
- an explicit anti-farming review;
- a cited evidence bundle.

Rank anchors:
- `E` — foundation: first defensible cross-domain baseline after the review gate.
- `D` — functional: repeated execution plus at least one clearly functional calibrated capability.
- `C` — reliable: sustained cross-domain execution with multiple tier-3-or-equivalent capability signals or meaningful outcomes.
- `B` — advanced: demanding outcomes plus advanced capability evidence; not attainable by routine completion volume alone.
- `A` — exceptional: sustained high-value results with strong independent evidence across more than one dimension.
- `S` — rare: exceptional milestone(s), independent validation and explicit manual review; never automatically promoted.

If the evidence bundle cannot defend a rank, keep the previous rank or `null`.

## 8. Economy calibration semantics

`economy_status=CALIBRATED` means only that the **issuance policy** above is activated. It does not mean the reward shop is configured.

The first launch calibration under v1 must derive the current level from existing System XP (normally zero at first real launch), derive `xp_to_next`, and activate `system-quest-reward:v1`. It must not set an attribute, skill or rank unless separate authoritative evidence supports it.

Reward-shop prices are a later bounded configuration step. Shop redemption remains an internal System event and never authorizes an external purchase/payment.

## 9. Evidence bundle contract

A calibration evidence reference should resolve to enough information to audit the decision. At minimum it should identify:
- which real-world owner/source supplied the evidence;
- the relevant observation/window;
- the benchmark or outcome used;
- why the selected anchor is the highest fully supported tier;
- unresolved uncertainty.

A self-report may be useful evidence, but claims requiring stronger live records must not be upgraded merely because the System needs a number.

## 10. Production launch boundary

Promoting this calibration policy does **not** initialize Ron's production profile.

The first real profile calibration is a separate mutation step and must:
1. recover current authoritative owners;
2. assemble cited evidence bundles;
3. initialize only supported fields;
4. leave unsupported attributes/skills/rank `null`;
5. initialize the game level from actual System XP under `system-level-xp:v1`;
6. activate the deterministic reward policy;
7. write through the same `system_apply_action` gate;
8. read back the production snapshot after the bounded write set.
