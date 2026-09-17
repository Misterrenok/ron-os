# System Quest Difficulty v1

Status: **ACTIVE / CONTROLLER POLICY / NO PLAYER STATE CREATED BY THIS SPEC**

Policy reference: `system-quest-difficulty:v1`

This policy classifies the execution difficulty of a proposed player quest. It does not decide whether the quest is valuable, safe or worth doing. Ron OS and claim-specific live owners remain authoritative for the underlying goal, constraints, baseline and completion evidence. Neon/PostgreSQL `system_events` remains the sole mutable owner of derived RPG state.

## 1. Outcome gate before scoring

Score the smallest outcome that is independently valuable and independently verifiable across its shortest necessary lifecycle. An outcome fails closed to `UNSCORED` when any of these is true:

- it is unsafe or safety is not established;
- it is only a micro-step whose parent outcome supplies all real value;
- it duplicates an active/already rewarded outcome key for the same cadence;
- its effort was inflated by avoidable waiting, rework, multitasking or deliberate inefficiency;
- required inputs or evidence anchors are missing;
- confidence is low.

For a learning quest, reconcile the learner's current verified baseline, the material's real prerequisites, the instruction/interface language Ron can use, and one concrete independently valuable capability outcome before scoring or creation. A strategic course/track label or XMind alignment alone never proves that a specific lesson is a suitable entry step; an unknown or incompatible prerequisite/language fit fails closed until the quest is adapted or replaced.
For a zero/near-zero baseline, verify the **actual instructional content is comprehensible**, not merely that the page/UI is localized: initial explanation must be understandable through a known language or equivalent explicit scaffolding, while target-language-only immersion is supporting practice only after the relevant material has been introduced. A localized shell around otherwise incomprehensible target-language content does not satisfy entry fit.

Importance, urgency and expected value affect quest selection, not difficulty points. Self-created risk or deadline pressure never increases reward.

## 2. Required classification input

Every scored proposal requires:

| Field | Contract |
|---|---|
| `outcome_key` | Stable identity for duplicate/split detection. |
| `independently_valuable` | True only if the outcome remains worth completing when detached from a larger parent task. |
| `safe` | True only after relevant domain constraints are checked. |
| `active_minutes` | Expected focused execution time; exclude passive waiting and avoidable inefficiency. |
| `friction` | `0..3`, anchored to Ron's recent comparable baseline. |
| `complexity` | `0..3`, anchored to concrete steps, uncertainty and dependencies. |
| `stakes` | `0..2`, anchored to an externally real consequence; never self-created danger. |
| `confidence` | `high`, `medium` or `low`; low is always unscored. |
| `anchors` | Non-empty audit notes for effort, friction, complexity and stakes. |

Use current direct evidence or the most recent relevant owner/live source. A historical baseline may be used only as dated evidence. When reasonable input uncertainty can cross a rank boundary, use the lower defensible input or leave the quest unscored.

## 3. Effort points

Only focused active time counts.

| Active minutes | Points |
|---:|---:|
| 1–15 | 0 |
| 16–45 | 1 |
| 46–120 | 2 |
| 121–240 | 3 |
| 241–480 | 4 |
| 481–960 | 5 |
| 961–1,920 | 6 |
| 1,921+ | 7 |

Time above the final bucket does not keep increasing reward. Large projects should normally become one parent quest with objectives, not a farm of separately rewarded steps.

## 4. Adaptive modifiers

### Friction `0..3`

- `0` — routine activation; no meaningful current resistance.
- `1` — noticeable but familiar activation cost.
- `2` — substantial recent avoidance, sustained self-regulation or coordination burden.
- `3` — exceptional individually grounded barrier supported by current evidence.

Friction is relative to Ron's recent comparable baseline, normally the prior 28–42 days. It cannot be raised merely by choosing an inconvenient method.

### Complexity `0..3`

- `0` — one familiar, well-specified execution path.
- `1` — several known steps or ordinary dependencies.
- `2` — meaningful problem-solving, ambiguity or coordination.
- `3` — novel high uncertainty or multiple difficult external dependencies.

### Stakes `0..2`

- `0` — low consequence and readily reversible.
- `1` — meaningful real deadline, external commitment or material consequence.
- `2` — high but legitimate consequence requiring careful execution.

Stakes never override the safety gate and never reward dangerous, illegal or counterproductive action.

## 5. Rank and reward

```text
score = effort_points + friction + complexity + stakes
```

| Score | Rank | Reward under `system-quest-reward:v1` |
|---:|---:|---:|
| 0–1 | E | 5 XP / 0 coins |
| 2–3 | D | 10 XP / 0 coins |
| 4–6 | C | 20 XP / 1 coin |
| 7–9 | B | 40 XP / 2 coins |
| 10–12 | A | 80 XP / 4 coins |
| 13–15 | S | 160 XP / 8 coins |

No discretionary multiplier exists. The classifier returns the rank, exact calibrated reward, factor breakdown, policy references and any `UNSCORED` reason codes.

## 6. Anti-farming and cadence

- One real outcome has one `outcome_key` and at most one scored completion basis.
- Required substeps become Quest v2 objectives unless they retain independent value without the parent outcome.
- A recurring routine uses a declared cadence; duplicate instances inside the same cadence are unscored.
- Persistence does not promote a trivial action by itself.
- Passive waiting, avoidable delay, repeated rework and chosen inefficiency do not count as active effort.
- A materially expanded or replaced outcome must be reclassified explicitly; never silently edit its rank after creation.

## 7. Controller execution sequence

1. Recover the real goal and current constraints from the correct domain owners/live sources.
2. Select the highest-value safe outcome independently of game reward.
3. Build the complete difficulty input and run the reference classifier in `cloud/src/difficulty.mjs`.
4. If `UNSCORED`, propose no XP/coin values. If scored, use exactly the returned E–S rank and `system-quest-reward:v1` reward.
5. Present the proposed Quest v2 payload, difficulty breakdown, evidence anchors and outcome key before mutation.
6. Write only after exact authorization, through `system_apply_action(...)`, with `system-quest-difficulty:v1` in the action provenance/source reference; then read back the event and snapshot.

For routine verified scored completion, use the additive atomic `quest.resolve` action once: it commits final verified objective progress, the verified terminal completion event and the exact canonical progression award in one idempotent transaction. Do not split that path into separate completion and reward writes.
