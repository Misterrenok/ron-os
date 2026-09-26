# Strategic Context Orchestration v1

Policy ref: `system-strategic-context:v1`

## Objective

Choose the best real-world next move with minimum System overhead. Long-horizon strategy should shape discretionary quest selection; current facts, hard obligations, safety and execution evidence must remain authoritative.

## Authority model

1. **Ron explicit intent** — Ron's current explicit request/decision remains controlling for the action he actually chose.
2. **Mandatory reality gates** — safety, health, legal duties, hard external deadlines and genuinely blocking obligations can preempt discretionary strategy.
3. **Execution-focus continuity** — several legitimate OPEN Quest v2 records may coexist, but at most one owns execution focus. For `GIVE_QUEST` / System Pulse, continue or resolve a valid focused quest rather than silently replacing its focus. Creating a justified background OPEN quest is allowed and does not steal focus. When focus is empty, re-evaluate the current situation instead of blindly selecting from a fixed queue. The narrow `system-evidence-followthrough:v1` exception may continue exactly one already-approved same trajectory after verified completion only when its deterministic gate returns `AUTO_CONTINUE`; that is continuity, not a strategic switch.
4. **Strategic direction** — when choosing among discretionary cross-domain outcomes, live XMind is the default strategic prior and primary long-horizon alignment signal. It answers `where should growth point?`, not `what is factually true right now?`.
5. **Current domain/live truth** — Ron OS owners and claim-specific live sources own current facts, constraints, execution and measurements. They may invalidate or constrain an XMind projection.
6. **Execution surfaces** — Calendar and TickTick primarily shape timing, commitments and feasibility. A task being scheduled does not by itself make it more strategically valuable. Cronometer, Liftosaur and analogous sources primarily shape domain state/evidence unless their owner establishes a real obligation or decision.
7. **Game mechanics** — XP, coins, rank and presentation never decide real-world priority ahead of the layers above.

The controller must preserve current domain/live truth even when it conflicts with a strategic projection. XMind is a strong prior, not a closed world. A materially higher-value opportunity supported by authoritative current evidence must not be discarded merely because it is absent from the map. Treat that as a potential strategy-map gap; do not write XMind without separate authorization.

Execution focus follows `system/lifeup/QUEST_FOCUS_SPEC.md` under policy ref `system-quest-focus:v1`. `ACTIVE` means OPEN/non-terminal; it is not itself proof that a quest should own immediate attention.

## Ephemeral capability preflight

For each source that can materially change the decision, classify access for this run only:

- `LIVE` — current source was read successfully and is fresh enough for the claim.
- `FALLBACK` — live access is unavailable/unnecessary but an explicitly dated owner fallback is sufficient for this decision.
- `UNKNOWN` — decision-critical mutable state cannot be established.

Track in working context: `source`, `claim`, `observed_at/as_of`, freshness basis, status and conflict state. This is an ephemeral reasoning envelope, not a new mutable database owner. Do not persist connector availability as current truth in Ron OS or Neon.

## Strategic Decision Envelope v1

For a materially important ambiguous comparison across directions, a possible focus replacement, a multi-goal resource conflict, or a System-engineering-vs-direct-action choice, apply `system/lifeup/STRATEGIC_DECISION_ENVELOPE_V1.md` under policy ref `system-strategic-decision-envelope:v1` **before** Quest scoring/reward/timing.

The envelope is controller-level and ephemeral. It preserves the existing focus model and all current write gates, explicitly considers keep-current-course when credible, counts switching cost without protecting sunk cost, prefers small reversible information-gaining tests when decision-critical uncertainty is high, and returns `UNKNOWN_NO_COMMIT` rather than inventing a winner when evidence is insufficient. Its executable reference is `system/lifeup/cloud/src/strategic-decision-envelope.mjs`; it is a deterministic gate/state-machine regression oracle, not a numeric life-ranking engine or state owner.

A mandatory reality preemption may change immediate attention without implicitly persisting a `quest.focus` change. A proposed strategic focus switch remains user-directed under the existing focus contract. An `AUTO_CONTINUE` result under `system-evidence-followthrough:v1` is not a proposed strategic switch: it is permitted only when exactly one safe policy-valid candidate continues the same already-approved trajectory, no material choice/resource/mandatory-reality conflict exists, and a fresh strategic opportunity refresh has ruled out a materially higher-value cross-domain move. Same-trajectory continuity is therefore never a standing priority claim.

## Selection procedure

For `GIVE_QUEST`, System Pulse or another open-ended next-action request:

1. Resolve Ron's explicit intent and read live System state first when quest/focus state matters.
2. If a valid focused quest exists, prefer helping execute/resolve it. Another legitimate outcome may be represented as an OPEN/BACKGROUND quest, but it does not replace focus merely because it also scores well.
3. Immediately after a verified completion, run a lightweight **strategic opportunity refresh** before deterministic continuation: inspect the smallest causally complete current sources that could reveal mandatory preemption or a materially higher-value cross-domain move. Do not perform a full ecosystem scan or force XMind reads when they cannot change the decision. Pass `strategic_refresh_status=PASS` to `system-evidence-followthrough:v1` only when that refresh is current and no materially better cross-domain opportunity was found. If and only if its executable continuation gate then returns `AUTO_CONTINUE`, the one same-trajectory continuation may be created/focused. Otherwise continue with the normal selection procedure below.
4. If focus is empty while OPEN quests remain, compare those open quests together with any materially higher-value authoritative current opportunity; do not use FIFO/newest-first/highest-XP as a substitute for selection.
5. Identify the smallest causally complete set of real-world domains and perform capability preflight only for sources that can change the choice.
6. When the choice spans materially different long-horizon directions, attempt a fresh read-only XMind check. Use verified XMind alignment as the primary strategic prior among discretionary candidates.
7. Apply mandatory reality gates: safety, health/legal constraints, hard external deadlines, genuinely blocking obligations and owner conflicts.
8. When the remaining choice is materially strategic or ambiguous, run Strategic Decision Envelope v1. Respect focus continuity, switching cost, keep-current-course, resource conflicts, reversible information gain and the System opportunity-cost gate; do not collapse the comparison into one fake life score.
9. Compare remaining candidates by expected real-world value and strategic alignment; use current feasibility, timing, energy/resource constraints and reversibility to shape the executable quest. Scheduledness alone is not a priority score.
10. If a high-value candidate is absent from XMind, keep it in comparison and mark a potential map gap rather than forcing it out.
11. Quest v2 scoring/rewards only after the real-world outcome has been selected; apply the existing difficulty/reward policy at that point.
12. Persist only the existing action/quest/focus payload plus minimal provenance permitted by its policy (for example the existing XMind strategy `source_ref`). Do not mirror Calendar, TickTick, Cronometer, Liftosaur or XMind into Neon, and do not persist decision-envelope working state.

## Graceful degradation

- XMind unavailable/stale/conflicting: exact map state is `UNKNOWN/UNVERIFIED`; continue from stronger current owners when they are sufficient, but do not call the result XMind-aligned.
- Noncritical source unavailable: omit it when it cannot plausibly change the decision.
- Critical source unavailable: keep the affected claim/score unresolved or choose a safe reversible action that does not depend on it.
- One connector failure must not block an unrelated quest.
- Decision-critical evidence insufficient after the smallest useful recovery attempt: use `RUN_REVERSIBLE_TEST` when one bounded information-gaining test can materially resolve the choice; otherwise `UNKNOWN_NO_COMMIT` rather than fabricated priority.

## Non-goals

This policy does not create a new Context Broker service, app-data warehouse, synchronization daemon, webhook mesh or second source of truth. Such infrastructure should be added only when a concrete tested use case cannot be met by the controller plus selective live reads.

This policy does not change external-source mutation permissions, Quest v2 scoring/reward semantics, XMind read-only rules, or Neon ownership.
