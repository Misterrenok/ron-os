# Strategic Context Orchestration v1

Policy ref: `system-strategic-context:v1`

## Objective

Choose the best real-world next move with minimum System overhead. Long-horizon strategy should shape discretionary quest selection; current facts, hard obligations, safety and execution evidence must remain authoritative.

## Authority model

1. **Ron explicit intent** — Ron's current explicit request/decision remains controlling for the action he actually chose.
2. **Mandatory reality gates** — safety, health, legal duties, hard external deadlines and genuinely blocking obligations can preempt discretionary strategy.
3. **Active quest continuity** — for `GIVE_QUEST` / System Pulse, an existing valid active quest is continued or resolved rather than silently creating a competing active quest. Cancellation/replacement remains user-directed.
4. **Strategic direction** — when choosing among discretionary cross-domain outcomes, live XMind is the default strategic prior and primary long-horizon alignment signal. It answers `where should growth point?`, not `what is factually true right now?`.
5. **Current domain/live truth** — Ron OS owners and claim-specific live sources own current facts, constraints, execution and measurements. They may invalidate or constrain an XMind projection.
6. **Execution surfaces** — Calendar and TickTick primarily shape timing, commitments and feasibility. A task being scheduled does not by itself make it more strategically valuable. Cronometer, Liftosaur and analogous sources primarily shape domain state/evidence unless their owner establishes a real obligation or decision.
7. **Game mechanics** — XP, coins, rank and presentation never decide real-world priority ahead of the layers above.

XMind is a strong prior, not a closed world. A materially higher-value opportunity supported by authoritative current evidence must not be discarded merely because it is absent from the map. Treat that as a potential strategy-map gap; do not write XMind without separate authorization.

## Ephemeral capability preflight

For each source that can materially change the decision, classify access for this run only:

- `LIVE` — current source was read successfully and is fresh enough for the claim.
- `FALLBACK` — live access is unavailable/unnecessary but an explicitly dated owner fallback is sufficient for this decision.
- `UNKNOWN` — decision-critical mutable state cannot be established.

Track in working context: `source`, `claim`, `observed_at/as_of`, freshness basis, status and conflict state. This is an ephemeral reasoning envelope, not a new mutable database owner. Do not persist connector availability as current truth in Ron OS or Neon.

## Selection procedure

For `GIVE_QUEST`, System Pulse or another open-ended next-action request:

1. Resolve Ron's explicit intent and read live System state first when active-quest state matters.
2. If a valid active quest exists, prefer helping execute/resolve it. Do not create a second active quest merely because another candidate scores well.
3. Identify the smallest causally complete set of real-world domains and perform capability preflight only for sources that can change the choice.
4. When the choice spans materially different long-horizon directions, attempt a fresh read-only XMind check. Use verified XMind alignment as the primary strategic prior among discretionary candidates.
5. Apply mandatory reality gates: safety, health/legal constraints, hard external deadlines, genuinely blocking obligations and owner conflicts.
6. Compare remaining candidates by expected real-world value and strategic alignment; use current feasibility, timing, energy/resource constraints and reversibility to shape the executable quest. Scheduledness alone is not a priority score.
7. If a high-value candidate is absent from XMind, keep it in comparison and mark a potential map gap rather than forcing it out.
8. Apply Quest v2 difficulty/reward policy only after the real-world outcome has been selected.
9. Persist only the existing action/quest payload plus minimal provenance permitted by its policy (for example the existing XMind strategy `source_ref`). Do not mirror Calendar, TickTick, Cronometer, Liftosaur or XMind into Neon.

## Graceful degradation

- XMind unavailable/stale/conflicting: exact map state is `UNKNOWN/UNVERIFIED`; continue from stronger current owners when they are sufficient, but do not call the result XMind-aligned.
- Noncritical source unavailable: omit it when it cannot plausibly change the decision.
- Critical source unavailable: keep the affected claim/score unresolved or choose a safe reversible action that does not depend on it.
- One connector failure must not block an unrelated quest.

## Non-goals

This policy does not create a new Context Broker service, app-data warehouse, synchronization daemon, webhook mesh or second source of truth. Such infrastructure should be added only when a concrete tested use case cannot be met by the controller plus selective live reads.

This policy does not change external-source mutation permissions, Quest v2 scoring/reward semantics, XMind read-only rules, or Neon ownership.
