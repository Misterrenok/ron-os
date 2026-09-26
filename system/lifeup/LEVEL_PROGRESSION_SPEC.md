# Level Progression v2 — Solo-inspired pacing

Status: **ACTIVE TARGET / production policy `system-level-xp:v2`**

This policy owns only the quantitative System Level curve. It does not estimate Ron's real-world competence, worth, skill tier or Rank. Verified real-world outcomes remain the only source of XP, and Quest reward amounts remain under `system-quest-reward:v1`.

## Design objective

Level progression should feel visible and motivating early, then become progressively harder without turning ordinary life into XP grind.

Ron supplied direct N-of-1 evidence on 2026-09-26 that the v1 opening pace was under-reinforcing: at D-rank = 10 XP, the old 500 XP Level 1 threshold required 50 D-equivalent completions. This policy is a deliberate game-design correction, not a claim that the constants are scientifically optimal.

The presentation is inspired by the pacing feel of progression fantasy / Solo Leveling: early level-ups are attainable, later levels require increasingly substantial verified outcomes, and a level-up is a salient event. No copyrighted story text, artwork, characters or proprietary progression table is copied.

## Policy constants

For Level 1:

- XP needed for Level 1 -> 2: **100 XP**
- each next level span compounds by approximately **12%**
- every span is quantized to the nearest **5 XP**
- the quantization is applied after each level so JavaScript and PostgreSQL can reproduce the same integer curve without hidden floating-state

Canonical recurrence:

```text
span(1) = 100
span(L+1) = round_to_nearest_5(span(L) * 1.12)

threshold(1) = 0
threshold(L) = sum(span(k), k=1..L-1)
```

Ties round upward. Level is the largest `L` whose cumulative threshold is <= cumulative verified XP.

Early curve:

| Level | Minimum cumulative XP | XP to next level |
|---:|---:|---:|
| 1 | 0 | 100 |
| 2 | 100 | 110 |
| 3 | 210 | 125 |
| 4 | 335 | 140 |
| 5 | 475 | 155 |
| 10 | 1,465 | 275 |
| 15 | 3,210 | 480 |
| 20 | 6,275 | 850 |
| 25 | 11,675 | 1,500 |

At 20 cumulative XP, the correct projection is Level 1 with **80 XP to Level 2**.

## Reward compatibility

Quest rewards do not inflate to make the level bar move:

| Quest rank | XP | Coins |
|---|---:|---:|
| E | 5 | 0 |
| D | 10 | 0 |
| C | 20 | 1 |
| B | 40 | 2 |
| A | 80 | 4 |
| S | 160 | 8 |

This preserves the meaning of Quest difficulty. Higher levels become easier to advance through genuinely more difficult/higher-value outcomes rather than by arbitrarily increasing XP on trivial tasks.

Anti-farming rules from `system-quest-reward:v1` remain unchanged.

## Migration semantics

- Historical `progression.awarded` events are immutable.
- No retroactive XP is created or deleted.
- Historical `profile.calibrated` events retain their original `system-level-xp:v1` provenance.
- Current Level and XP-to-next are a projection of the same cumulative verified XP under v2.
- New level calibration events use `system-level-xp:v2`.
- Rank remains separate and must never be derived from Level or XP alone.

The v1 curve remains historical evidence only:

```text
v1 span(L) = 500 * L
```

## Player feedback

A verified XP award immediately recomputes the before/after Level projection.

If the award crosses a threshold, the player feedback surface should prominently show:

- **ПОВЫШЕНИЕ УРОВНЯ**
- old Level -> new Level
- XP gained
- XP remaining to the following Level
- a full-screen celebration when opened from the reward push/deep-link

A single large verified award may cross more than one level. The displayed transition must use the actual before and after levels; no intermediate fake reward events are created.

## Guardrails

- XP is irreversible and non-spendable.
- A missed task does not subtract earned XP.
- Level is quantitative engagement feedback, not a skill credential.
- Level-up never auto-promotes Rank.
- No task splitting or duplicate cadence farming.
- If Ron-specific evidence later shows over-reinforcement, under-reinforcement, gaming, boredom or loss of informativeness, introduce a new versioned policy instead of silently editing v2.
