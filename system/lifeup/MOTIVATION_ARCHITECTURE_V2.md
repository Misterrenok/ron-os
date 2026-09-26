# Ron System — Motivation Architecture v2

Status: **APPROVED WORKING ARCHITECTURE — evidence-backed / staged experiments**
Approved: 2026-09-13 Europe/Istanbul
Evidence reconciliation: 2026-09-25 Europe/Istanbul

## Objective
Maximize real-world growth, adherence and enjoyment with low System overhead. Solo Leveling is a design inspiration, not an authority; real outcomes, evidence quality, autonomy and long-term persistence win when fiction and reality conflict.

## Evidence-supported core loop
`REAL GOAL -> QUEST -> EXECUTION -> EVIDENCE -> PROGRESS MONITORING / FEEDBACK -> ADAPTED NEXT STEP`

This core is the highest-confidence part of the design. Goal setting, progress monitoring, feedback and concrete action planning have substantially stronger direct evidence than any particular RPG label or fiction layer. Artificial deadline/commitment effects are more heterogeneous, so Challenge remains an optional N-of-1 mechanism rather than part of the evidence-supported core. Ron System should preserve the core loop even if later experiments remove or reshape a game mechanic.

## Candidate progression / motivation layers
The following are **roles, not a mandatory sequential ladder**:
- **Challenge** — optional pressure/difficulty contract applied only to a suitable Quest. Challenge Contract v1 is now the bounded writable Ron-specific experiment; its real personal utility remains a hypothesis to evaluate rather than an assumed universal benefit.
- **Level / visible progression** — frequent quantitative feedback; promising evidence exists in some learning contexts, but it is not assumed universally causal across all life domains.
- **Arc** — optional long-horizon context grouping related outcomes/milestones; not every Quest must belong to an Arc.
- **Boss** — rare evidence-backed classification/variant for a major outcome or barrier; it is not a required step after Challenge and never creates a reward multiplier by label alone.
- **Rank** — optional rare qualitative status/evolution signal. It is not required for the System to function, must not be inferred from XP alone, and must not be precommitted to a global E->S ladder without separate evidence/design.
- **Unlock** — optional new System capability/choice that follows verified real progression; not a prerequisite for ordinary execution.
- **Achievement** — durable milestone/history signal under its independent policy.
- **Coins** — reinforcement under its independent reward-economy policy, not a measure of real capability or the reason a goal matters.
- **Narrative / Solo Leveling presentation** — a low-friction meaning/engagement layer over real mechanics, never a substitute for them.

Mechanics may be tested individually or as a minimal coherent bundle when their hypothesized value depends on composition. A mechanic is not retained merely because it looks game-like.

## Invariants
- Real life is the objective; System interaction is overhead unless it improves execution or adds meaningful enjoyment at low cost.
- XP/levels/skills/stats/ranks never fabricate real capability.
- Challenge should rise with demonstrated capability and current constraints; challenge must not be confused with threat/overload.
- Verified execution should produce fast, visible feedback.
- High-pressure artificial commitments normally require Ron's explicit acceptance. Standing exception: from 2026-09-26, `system-pressure-profile:v1` carries Ron's explicit authorization for the controller to choose exact future Challenge parameters inside its strict eligibility, frequency, safety and stop-rule bounds.
- Earned progression is durable; a later miss does not erase prior verified growth.
- Pressure is scarce; constant penalties become noise.
- Recovery mechanics restore execution rather than destroy accumulated progress.
- Several legitimate obligations may remain OPEN without becoming several simultaneous execution targets; player attention has at most one System FOCUS.
- No grind for System's sake.
- No low-value task splitting, artificial Boss inflation, XP-only Rank promotion, or metric optimization that makes real outcomes worse.
- Evidence/ledger remains the source for reconstructable progression; projections/caches may exist when reproducible but must not become a second truth owner.

## Mechanics
- Keep quests as the primary execution surface.
- Keep XP/levels as versioned visible progress feedback while measuring whether they remain informative rather than gameable. Exact XP curves, level thresholds, Coin ratios and achievement thresholds are design constants, not scientifically established optima.
- Keep attributes and skills evidence-gated.
- Keep achievements as verified milestone history, not an extra reward faucet.
- Keep Coins scarce and secondary to real-world value.
- Treat Challenge, Arc, Boss, Rank and Unlocks as separately justified mechanics with explicit hypotheses, costs and anti-gaming checks.
- Hidden/emergency quests are rare and require a defensible trigger.
- Rewards support progress; they do not replace the real goal.
- Do not subtract already earned XP/skills/achievements as routine consequence.
- Execution streak v1 is active from 2026-09-26 under `system-execution-streak:v1`: current streak is a real salient stake and may break, while best streak/history and earned progression remain durable. It tracks kept planned execution days rather than arbitrary calendar attendance and is explicitly subject to N-of-1 stop rules for avoidance/gaming.

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
- Hard external deadlines and explicitly accepted Challenge contracts still apply to background quests.
- Challenge recovery creation never steals focus; after a focused Challenge expires, normal strategic re-evaluation owns any next focus choice unless an already-promoted deterministic exception applies.
- If explicit focus becomes empty while OPEN quests remain, the controller re-evaluates authoritative current context and strategy instead of using FIFO, newest-first or game reward as an automatic queue.
- Legacy ledgers with no explicit focus event preserve the earliest still-open Quest v2 as implicit focus without rewriting historical player events.

## Timing / pressure v2
1. **NONE** — default when timing adds no real value.
2. **RECOMMENDED_WINDOW** — planning aid only. It may remind before the window. Passing it never expires/fails the quest, removes reward or creates a failure-like warning. Past windows should not remain as stale countdowns.
3. **HARD_EXTERNAL** — only for a real external deadline. A miss may expire the quest and make that quest's prospective reward unavailable.
4. **CHALLENGE** — voluntary artificial pressure. The exact deadline and exact bounded recovery consequence must be known before activation. By default Ron accepts them per Challenge; under active `system-pressure-profile:v1`, Ron's standing 2026-09-26 authorization delegates exact selection to the controller inside the profile gates. It is writable only through the atomic compound `challenge.create` path under `system-challenge-contract:v1`; a miss atomically expires the parent and creates the exact predeclared recovery Quest.

The player-facing term **Soft Target** is retired for new actions. Existing `system-soft-target:v1` records stay immutable and are interpreted as legacy recommended-window evidence.

## Recovery contract
A Challenge recovery consequence must be known before start, bounded, safe, related to restoring execution, and unable to erase earned progression. It is unscored by default unless it independently satisfies the normal quest-value policy. Challenge v1 does not retrofit an already-created Quest, does not multiply reward, and does not auto-focus the recovery Quest.

## Progression composition model
- **Quest** is the bounded independently valuable and verifiable real-world outcome.
- **Challenge** may modify a suitable Quest with a voluntary bounded pressure/difficulty contract. A Quest does not need to be a Challenge.
- **Boss** may classify a Quest/outcome as a rare major barrier or multi-capability milestone. Boss does not require a prior Challenge and does not imply an Arc or Rank change.
- **Arc** is optional long-horizon context/milestone structure spanning related outcomes. Standalone Quests remain valid.
- **Level** is frequent quantitative feedback and remains separate from evidence-backed skill/domain capability.
- **Rank** is an optional rare qualitative progression signal only if a separately promoted policy establishes meaningful evidence thresholds and utility beyond Level/skill/domain progression.
- **Unlock** is an optional consequence of verified progression, not a mandatory rung.

No label inflates reward by itself; difficulty/reward still follows evidence-backed real execution factors. The architecture intentionally rejects `Action -> Quest -> Challenge -> Boss -> Arc -> Rank` as a mandatory lifecycle.

## Evaluation contract for candidate mechanics
Before a new mechanic becomes central or writable, define its hypothesis and evaluate the smallest coherent implementation against:
- real-world outcome value and difficulty calibration;
- completion/adherence and recovery after misses;
- evidence quality;
- System friction / maintenance time;
- subjective interest/meaning;
- long-horizon persistence where the mechanic is intended to operate;
- anti-gaming / metric-distortion signals.

Ron is an N-of-1 environment, so these checks establish pragmatic personal utility, not universal causal proof. Review the working architecture only when new evidence, a reproducible failure, measurable harm, or a materially better alternative appears; do not endlessly rewrite it for theoretical micro-improvements.

## Controller direction
Ron should speak naturally; the controller handles evidence checks, scoring, projection and bookkeeping. When an execution cue is naturally available, prefer one concrete implementation-intention style start plan (`ЕСЛИ <реальный триггер>, ТО <первое физическое действие>`) over vague motivational wording; do not invent a schedule merely to fill this template. The controller may recommend the next challenge or execution focus from authoritative goals/constraints. Challenge mutation remains atomic and predeclared: exact deadline + recovery must exist before `challenge.create`. Default per-Challenge acceptance still applies outside `system-pressure-profile:v1`; while that standing profile is active, Ron has already delegated exact future Challenge selection inside its bounded gates. Persistent player choices otherwise remain under the current System authorization contract until a later promoted architecture slice deliberately changes that boundary.

## Research anchors
The 2026-09-16 review separates evidence strength rather than treating all RPG mechanics alike:
- goal setting, progress monitoring and feedback are the strongest evidence-supported core;
- calibrated challenge is promising, while Ron System's exact Challenge Contract remains a testable implementation hypothesis;
- visible levels/progression have positive evidence in some contexts but are not assumed universally causal;
- Arc/Boss/Unlock/Rank are composition/meaning hypotheses with weaker or indirect direct evidence and must earn complexity through utility;
- narrative/game fiction can improve meaningfulness/engagement when integrated with real mechanics;
- excessive external rewards, punishment pressure, leaderboard-style comparison and grind can backfire, so Coins/pressure remain bounded and secondary.

Research anchors include Sailer & Homner (Educational Psychology Review, 2020); Li, Hew & Du (Educational Technology Research and Development, 2024); Harkin et al. (Psychological Bulletin, 2016); Epton, Currie & Armitage (Journal of Consulting and Clinical Psychology, 2017); Howard et al. (Perspectives on Psychological Science, 2021); Hase et al. (EXCLI Journal, 2025); Naul & Liu (Journal of Educational Computing Research, 2020); Costa (Computer Applications in Engineering Education, 2023); Mazéas et al. (JMIR, 2022); Deci, Koestner & Ryan (Psychological Bulletin, 1999).

## Evidence audit — 2026-09-25

This pass distinguishes empirically supported principles from Ron-specific/game-design parameters.

- **Progress monitoring stays core.** Harkin et al. (Psychological Bulletin, 2016; DOI 10.1037/bul0000025) synthesized 138 randomized studies (N=19,951) and found improved goal attainment (d≈0.40), with stronger effects when progress was physically recorded or reported.
- **Concrete if-then action plans are preferred when a real cue exists.** Gollwitzer & Sheeran (Advances in Experimental Social Psychology, 2006; DOI 10.1016/S0065-2601(06)38002-1) synthesized 94 tests and reported a medium-to-large average effect (d≈0.65) on goal attainment. This supports a low-friction cue→action layer, not an invented deadline.
- **Gamification remains secondary/context-dependent.** Sailer & Homner (Educational Psychology Review, 2020; DOI 10.1007/s10648-019-09498-w) reported positive but heterogeneous effects on cognitive, motivational and behavioral learning outcomes. This supports testing feedback/game layers without treating any exact RPG mechanic as universally causal.
- **Artificial deadlines/commitment devices are mixed, not a default truth.** Bisin & Hyndman (Games and Economic Behavior, 2020; DOI 10.1016/j.geb.2019.11.010) found demand for self-imposed deadlines but no increase in completion rates. Hyndman & Bisin (Psychological Science, 2026; DOI 10.1177/09567976261460772) did not replicate the classic deadline-performance result. The original Ariely & Wertenbroch (2002) article is retracted and must not be used as an evidence anchor.
- **Recovery should learn and restart, not erase progress.** Tannenbaum & Cerasoli (Human Factors, 2013; DOI 10.1177/0018720812448394) found debriefs/after-action reviews improve performance on average; the evidence supports structured learning from execution, not any universal fixed recovery duration such as 15+15 minutes.
- **External incentives can coexist with intrinsic motivation, but exact reward schedules are not scientific constants.** Cerasoli, Nicklin & Ford (Psychological Bulletin, 2014; DOI 10.1037/a0035661) found intrinsic motivation and extrinsic incentives jointly predict performance with important task/outcome moderators. Therefore the current XP/Coins/level curves are stable game-design parameters to evaluate for Ron, not literature-derived optima.
- **Reminder dose is not assumed monotonic.** The System must not infer that more reminders are better. Timing v2 keeps recommended-window automation bounded; any higher-frequency Ron-specific reminder pattern is an explicit preference/N-of-1 configuration and should be evaluated for adherence versus annoyance/alert fatigue rather than promoted as an evidence-based default.

Evidence consequence at the 2026-09-25 audit was conservative. On 2026-09-26 Ron supplied new N-of-1 preference evidence and explicitly authorized streaks plus bounded punishment. This justifies a controlled deviation: activate execution streak v1 and a strictly bounded standing Challenge profile, while preserving irreversible earned progression, sparse rewards, stop rules and measurement. No reward multiplier is introduced.

## Live rollout status — 2026-09-16

This status map records promoted runtime/controller contracts. It is an engineering navigation aid, not a new mutable owner and not a promise that every candidate mechanic must eventually become writable.

1. **Timing/Pressure v2 — ACTIVE; Challenge Contract v1 ACTIVE.** `TIMING_PRESSURE_SPEC.md` / `system-timing:v2` owns current timing semantics. `system-challenge-contract:v1` adds one bounded compound writable path: `challenge.create` atomically persists the accepted Challenge contract and parent Quest; a miss atomically creates the exact recovery Quest. Direct `quest.create` Challenge remains fail-closed and existing quests are not retrofitted.
2. **Open Quest / Execution Focus v1 — ACTIVE.** `QUEST_FOCUS_SPEC.md` / `system-quest-focus:v1` separates OPEN lifecycle from one execution FOCUS and prevents arbitrary queue selection. Challenge recovery does not auto-focus itself.
3. **Reward Economy v2 — ACTIVE.** `SHOP_SPEC.md` / `system-reward-economy:v2` is current. Quest Coin issuance remains the fixed conservative `0/0/1/2/4/8` E/D/C/B/A/S schedule with anti-farming; Challenge adds no multiplier and recovery is unscored by default.
4. **Progression composition — ACTIVE READ-ONLY EXCEPT CHALLENGE TIMING COMPOSITION.** `PROGRESSION_HIERARCHY_SPEC.md` / `system-progression-hierarchy:v1` evaluates/projects Boss/Arc/Rank-related evidence gates read-only. Challenge's separately promoted timing contract does not activate Boss/Arc/Rank/new-Unlock writes and does not make a linear progression hierarchy mandatory.
5. **Adaptive quest/reinforcement selection — PARTIALLY ACTIVE BY COMPOSITION.** Adaptive quest/focus selection already composes `system-strategic-context:v1`, `system-strategic-decision-envelope:v1`, `system-quest-focus:v1`, `system-quest-difficulty:v1` and `system-evidence-followthrough:v1`. Do **not** add a second persisted selector, queue owner or competing score. Adaptive Coin targeting/decay is **NOT ACTIVE** and remains evidence-gated: version it separately only if current personal evidence shows the fixed reinforcement policy is materially failing execution, becoming non-informative, or creating gaming pressure.
6. **Identity/unlocks — PARTIAL / OPTIONAL.** Deterministic achievements and bounded reward-choice policy are active under their existing gates; read-only progression can expose milestone readiness. Rank evolution writes remain locked and are not presumed necessary merely because they appear in the target design vocabulary.
7. **Execution streak v1 — ACTIVE / EXPERIMENTAL.** Ron explicitly reported that streaks are likely motivating for him and accepted the risk of stronger pressure. `STREAK_PRESSURE_SPEC.md`, `system-execution-streak:v1` and `system-pressure-profile:v1` own the current implementation: planned execution days are secured by verified progress, missed eligible days break current streak, best/history persist, Challenge miss forces a break, and earned XP/Coins/skills/achievements are never erased. Review after 21 days or 6 Challenge outcomes; earned progression remain durable across a miss.

For future engineering, choose a new slice by current execution/value gap or credible opportunity, expected net utility, dependencies, implementation/maintenance cost and anti-gaming risk. A later-numbered idea is never automatically the next task. Absence of a monolithic adaptive-selector service is intentional while controller-level composition is sufficient.

## Working implementation plan / stop criterion
- Preserve the Quest/evidence/progress/feedback core.
- Treat Challenge Contract v1 as a bounded active N-of-1 experiment: measure whether its voluntary deadline + recovery structure improves real execution without overload, gaming or excess friction.
- Keep visible Levels as another strong candidate feedback mechanic while validating its actual informativeness.
- Treat Arc + rare Boss semantics as lightweight compositional meaning layers that should minimize bookkeeping and derive from evidence where possible.
- Keep Rank/Unlocks optional and evidence-gated; do not force a global E->S ladder or XP-driven promotion.
- Keep Coins secondary and achievements milestone-oriented.
- Keep Solo Leveling narrative as presentation over reality, not authority over it.
- Revisit architecture only for new evidence, reproducible failure, measurable harm or a materially better alternative.

Every slice preserves Neon `system_events` as the single mutable derived-state owner and keeps the PWA projection-only.
