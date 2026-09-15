# Ron System — Motivation Architecture v2

Status: **APPROVED TARGET ARCHITECTURE — staged rollout**
Approved: 2026-09-13 Europe/Istanbul

## Objective
Maximize real-world growth, adherence and enjoyment with low System overhead. Solo Leveling is a design inspiration, not an authority; real outcomes, evidence quality, autonomy and long-term persistence win when fiction and reality conflict.

## Core loop
`IDENTITY -> QUEST -> CLEAR ACTION -> CHALLENGE -> EXECUTION -> IMMEDIATE FEEDBACK -> VISIBLE GROWTH -> UNLOCK -> HARDER MEANINGFUL CHALLENGE -> BOSS -> RANK EVOLUTION`

## Invariants
- Real life is the objective; System interaction is overhead unless it improves execution.
- XP/levels/skills/stats/ranks never fabricate real capability.
- Challenge should rise with demonstrated capability and current constraints.
- Verified execution should produce fast, visible feedback.
- High-pressure artificial commitments require Ron's explicit acceptance.
- Earned progression is durable; a later miss does not erase prior verified growth.
- Pressure is scarce; constant penalties become noise.
- Recovery mechanics restore execution rather than destroy accumulated progress.
- Several legitimate obligations may remain OPEN without becoming several simultaneous execution targets; player attention has at most one System FOCUS.
- No grind for System's sake.

## Mechanics
- Keep XP and levels as calibrated progress feedback.
- Keep attributes and skills evidence-gated.
- Use ranks as rare milestone/evolution states.
- Use quests as the primary execution surface.
- Add adaptive difficulty, Boss Quests, Arc milestones and meaningful unlocks.
- Hidden/emergency quests are rare and require a defensible trigger.
- Rewards support progress; they do not replace the real goal.
- Do not subtract already earned XP/skills/achievements as routine consequence.
- If streaks are later added, prefer recoverable streak damage over wiping all history.

## Reward economy v2

The canonical contract is `system/lifeup/SHOP_SPEC.md` under `system-reward-economy:v2`.

- **XP is progression, Coins are reinforcement.** XP is irreversible and not spendable. Coins are a scarce token that can unlock bounded choices.
- Coins never have a fixed TRY/USD/currency rate. The System must not create a second salary, bank balance or virtual cash liability.
- Existing Quest Difficulty/Reward v1 issuance remains conservative: E/D give no Coins; verified C/B/A/S outcomes yield 1/2/4/8 Coins. Outcome-key anti-farming remains unchanged and v2 adds no routine/streak faucet.
- Reward classes are `COSMETIC` and `REAL_WORLD_CHOICE`. A real-world choice may unlock a discretionary reward tier, but redemption is only an internal ledger action and never a purchase/payment.
- Real-world rewards require a fresh `CURRENT_DISCRETIONARY_BUDGET` finance gate at redemption. The resulting spend cap is owned by current Finance evidence and is not the monetary value of Coins.
- Protected needs and mandatory duties are never gated behind Coins.
- Real salary, meal cash, savings and other natural outcomes stay in their real-world owners. The controller may surface them as real-world consequences/loot when useful, but Neon does not mirror them as game currency.
- Reinforcement should be scarce enough to stay informative. If future personal evidence shows a behavior has become automatic and Coins no longer change execution, adaptive Coin targeting/decay may be versioned separately; v2 does not silently rewrite current quest rewards.

## Open quests / execution focus v1

The canonical contract is `system/lifeup/QUEST_FOCUS_SPEC.md` under `system-quest-focus:v1`.

- Quest lifecycle and execution attention are separate axes.
- `ACTIVE` means OPEN/non-terminal. Multiple Quest v2 records may be OPEN at once when they represent distinct legitimate outcomes.
- At most one OPEN Quest v2 may be `FOCUSED`; other OPEN quests are `BACKGROUND` and must not compete for the player-facing next action.
- Creating a background quest never steals focus from an existing focused quest.
- Hard external deadlines and normal evidence/lifecycle rules still apply to background quests.
- If explicit focus becomes empty while OPEN quests remain, the controller re-evaluates authoritative current context and strategy instead of using FIFO, newest-first or game reward as an automatic queue.
- Legacy ledgers with no explicit focus event preserve the earliest still-open Quest v2 as implicit focus without rewriting historical player events.

## Timing / pressure v2
1. **NONE** — default when timing adds no real value.
2. **RECOMMENDED_WINDOW** — planning aid only. It may remind before the window. Passing it never expires/fails the quest, removes reward or creates a failure-like warning. Past windows should not remain as stale countdowns.
3. **HARD_EXTERNAL** — only for a real external deadline. A miss may expire the quest and make that quest's prospective reward unavailable.
4. **CHALLENGE** — voluntary artificial pressure. Ron accepts the exact deadline and an exact bounded recovery consequence before activation. A miss may expire the challenge and activate that predeclared recovery quest.

The player-facing term **Soft Target** is retired for new actions. Existing `system-soft-target:v1` records stay immutable and are interpreted as legacy recommended-window evidence.

## Recovery contract
A Challenge recovery consequence must be known before start, bounded, safe, related to restoring execution, and unable to erase earned progression. It is unscored by default unless it independently satisfies the normal quest-value policy.

## Progression hierarchy
`Action -> Quest -> Challenge -> Boss Quest -> Arc milestone -> Rank evolution`

- Action: objective/substep; normally not independently rewarded.
- Quest: bounded independently valuable outcome.
- Challenge: explicitly accepted harder/time-bounded outcome.
- Boss Quest: rare major milestone integrating multiple capabilities.
- Arc milestone: closes a meaningful development phase.
- Rank evolution: rare identity/progression change backed by milestone evidence.

Labels never inflate rewards by themselves; difficulty/reward still follow evidence-backed real execution factors.

## Controller direction
Ron should speak naturally; the controller handles evidence checks, scoring, projection and bookkeeping. The controller may recommend the next challenge or execution focus from authoritative goals/constraints. Persistent player choices remain under the current System authorization contract until a later promoted architecture slice deliberately changes that boundary.

## Research anchors
The 2026-09-13 research pass supports the direction: gamification effects depend strongly on design/context; clear goals, immediate feedback, visible progress and challenge-skill balance are recurring high-value conditions; autonomy and competence support sustained motivation; identity/progression can strengthen engagement; excessive/repetitive rewards and pressure can backfire. The 2026-09-15 reward-economy review additionally supports immediate reinforcement while showing weaker evidence for self-incentive-only designs; v2 therefore treats Coins as a bridge to meaningful bounded choice rather than a literal self-paid wage.

Research anchors: Sailer & Homner (Educational Psychology Review, 2020); Li, Hew & Du (Educational Technology Research and Development, 2024); Mazéas et al. (JMIR, 2022); Kunkel, Lock & Doyle (2021, DOI 10.1002/mar.21467); Woolley & Sharif (2025, DOI 10.1002/arcp.70004); Jamshidifarsani et al. (2021, DOI 10.1111/jcal.12539); Balci & Morris (2026, DOI 10.1002/jcal.70234); Ke, Xie & Xie (2015, DOI 10.1111/bjet.12314).

## Rollout
1. Timing/Pressure v2.
2. Open Quest / Execution Focus v1.
3. Reward Economy v2.
4. Progression hierarchy.
5. Adaptive quest/reinforcement selection.
6. Identity/unlocks.
7. Optional recoverable streaks only if adherence improves without abandonment pressure.

Every slice preserves Neon `system_events` as the single mutable derived-state owner and keeps the PWA projection-only.
