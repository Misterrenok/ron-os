# Strategic Decision Envelope v1

Policy ref: `system-strategic-decision-envelope:v1`
Status: **RUNTIME POLICY — controller-level / ephemeral**
Baseline: `system/lifeup/STRATEGIC_LIFE_TRAJECTORY_PLAN_V1.md`

## Purpose

Activate the smallest decision-making subset of the approved Strategic Life Trajectory Plan without creating a new mutable owner, database, generic evidence warehouse or strategy mirror.

Use this envelope only when the choice is materially strategic: System Pulse across materially different directions, selecting/replacing execution focus, choosing a quest across materially different outcomes, comparing important life trajectories, or allocating scarce time/money/energy/attention across goals. Do not invoke it for small obvious actions whose strategic context is already fixed.

The envelope is a **gate/state machine, not a fake life score**. The controller may use structured multi-criteria reasoning, but must not collapse life value into one invented scalar. Important choices remain Ron's.

## Authority and preservation

1. Ron's explicit values, desired life and important choices remain authoritative.
2. Mandatory reality constraints preempt discretionary strategy when action is genuinely required: safety, legality, serious health risk, hard external deadlines and blocking obligations.
3. Current mutable truth comes from the corresponding domain/live owner. XMind remains strategic/map evidence, not factual current-state authority.
4. Several OPEN quests may coexist; at most one is FOCUSED. A temporary reality preemption does not itself rewrite quest focus.
5. A real-world outcome is selected before Quest Difficulty/Reward/Timing mechanics are applied.
6. Existing difficulty, reward, timing, evidence, anti-farming, lifecycle and external write gates are unchanged.
7. The envelope never authorizes a persistent mutation. Quest creation/focus changes and external live-source writes still require their existing user-directed authority.
8. No decision-envelope state is persisted in Neon or Ron OS. Only already-authorized downstream artifacts may persist under their existing contracts.

## Ephemeral input

Build only the minimum working set needed for this decision. Candidate fields may include:

- `id` / plain-language outcome;
- `kind`: current focus, obligation, opportunity, direct action, System engineering, keep-current-course, or information test;
- owner/source and evidence status (`LIVE` / `FALLBACK` / `UNKNOWN` as applicable);
- mandatory-reality status and hard external deadline if any;
- strategic/XMind alignment when relevant;
- expected real-world benefit and success basis;
- time, money, energy and attention demand;
- downside/risk, reversibility, option value and compounding;
- switching cost and lost momentum from leaving a viable current course;
- decision-critical uncertainty and whether a reversible information-gaining test exists;
- resource conflicts with other credible goals.

Sunk cost is **not** a reason to continue. Preserve only forward-looking value: remaining momentum, switching cost, option value, commitments and consequences.

When a structured comparison is necessary, include `KEEP_CURRENT_COURSE` / do-nothing as a candidate whenever it is genuinely credible. A candidate becomes `best_supported` only after the controller has compared the material criteria and constraints; the executable reference never invents that judgment.

## Decision order

Apply these gates in order:

1. **Mandatory reality gate.** If a real safety/legal/serious-health/hard-deadline/blocking obligation requires action now, return `MANDATORY_PREEMPT`. This may change immediate attention without silently mutating persistent quest focus.
2. **Resource-conflict gate.** If several credible goals cannot all receive the needed scarce resources, return `RESOURCE_ALLOCATION_REQUIRED`; do not silently stack them. Recommend an explicit allocation/trade-off for Ron to choose when the choice is important.
3. **Uncertainty gate.** If decision-critical evidence is insufficient, do not fabricate a winner. Prefer one small feasible reversible information-gaining test when it can materially change the decision; otherwise return `UNKNOWN_NO_COMMIT` and preserve a valid current course when possible.
4. **System-opportunity-cost gate.** When the direct comparison is System engineering versus direct real-world action, direct action wins unless the engineering slice has a demonstrated marginal execution benefit that justifies its opportunity cost.
5. **Focus-continuity gate.** A valid current focus is the default. A new attractive opportunity does not steal focus merely because it is novel, XMind-aligned or game-rewarding. Propose a switch only when the replacement case explicitly justifies switching cost and lost momentum, or the current course has become impossible, unsafe, illegal, blocking, or based on materially disproven assumptions.
6. **Strategic comparison.** If focus is empty or invalid and sufficient evidence exists, compare the remaining feasible trajectories using the approved baseline criteria and goal interactions. Recommend a candidate only when one current bet is actually best-supported. `KEEP_CURRENT_COURSE` may be that recommendation.
7. **User-choice boundary.** A recommendation or `PROPOSE_FOCUS_SWITCH` is not a mutation. Ron chooses important goal/focus/resource-allocation changes; then the ordinary System/external-write contract handles any authorized persistence.
8. **Quest mechanics last.** Only after the real-world outcome is selected may Quest v2 difficulty/reward/timing/evidence policies shape its execution representation.

## Output states

The envelope returns one of these ephemeral states:

- `MANDATORY_PREEMPT` — act on mandatory reality before discretionary strategy; no implicit focus rewrite.
- `CONTINUE_CURRENT_FOCUS` — current focus remains the best execution default.
- `PROPOSE_FOCUS_SWITCH` — one replacement has a justified forward-looking case; Ron still owns the focus choice.
- `RUN_REVERSIBLE_TEST` — uncertainty is decision-relevant and one bounded information-gaining test is preferable to premature commitment.
- `RECOMMEND_CANDIDATE` — one feasible current bet is best-supported.
- `RECOMMEND_KEEP_COURSE` — keep-current-course/do-nothing is best-supported.
- `RESOURCE_ALLOCATION_REQUIRED` — credible goals conflict on scarce resources and need an explicit trade-off.
- `UNKNOWN_NO_COMMIT` — evidence cannot support a unique choice; do not invent one.

Every output carries `persistent_action_authorized=false` by contract.

## XMind and mandatory reality

Verified XMind alignment remains the default long-horizon strategic prior among discretionary candidates. It never defeats a mandatory-reality gate, never proves current facts, and never turns map absence into disqualification. A materially valuable current opportunity absent from XMind remains eligible and may reveal a strategy-map gap; XMind writes still require separate authorization.

## Switching, sunk cost and churn control

- Respect **switching cost** and lost momentum while the current strategy remains viable.
- Ignore **sunk cost** as a justification by itself.
- Do not switch because of ordinary noise, novelty or one noisy result.
- Do not protect a course that is impossible, unsafe, illegal or materially based on disproven assumptions.
- Review on material evidence/events or bounded checkpoints, consistent with the frozen baseline.

## Executable reference

`system/lifeup/cloud/src/strategic-decision-envelope.mjs` implements the deterministic gates above. It deliberately does **not** compute a numeric life score or infer `best_supported`; the controller supplies that conclusion only after authoritative evidence and multi-criteria comparison.

The reference is a regression oracle for the decision order and authority boundary. It is not a new state owner and has no persistence side effects.
