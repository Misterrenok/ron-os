# Ron System — Progression Hierarchy v1

Status: **PROMOTED / DESIGN CONTRACT / NOT RUNTIME-ACTIVE**
Policy ref: `system-progression-hierarchy:v1`

## Objective
Close the gap between verified quest execution and meaningful long-horizon growth without inventing capability, farming labels, or adding System overhead.

Canonical hierarchy:

`Action -> Quest -> Challenge -> Boss Quest -> Arc milestone -> Rank evolution`

This contract classifies progression meaning. It does not itself create player state, award XP/coins, activate Challenge, or authorize any mutation.

## Invariants
- Real-world outcomes and evidence remain upstream truth; Neon remains the sole mutable owner of derived RPG state.
- A higher hierarchy label never increases XP/coins by itself. Quest difficulty/reward remains governed by `system-quest-difficulty:v1` and `system-quest-reward:v1`.
- Progression is evidence-backed and durable. A later miss does not erase verified growth.
- Higher tiers must compress meaningful evidence; they must not become extra chores or duplicate rewards.
- Player-facing progression should make growth legible with minimal bookkeeping.

## Tiers

### Action
A concrete physical or cognitive next step inside an objective. Normally not independently rewarded and not persisted as a separate quest unless independently valuable.

### Quest
A bounded independently valuable and independently verifiable real-world outcome. Existing Quest v2 lifecycle, focus, timing, evidence and reward policies remain unchanged.

### Challenge
A voluntary harder/time-bounded quest with an exact preaccepted recovery contract. `CHALLENGE` remains fail-closed until the atomic Challenge persistence/recovery slice is separately promoted. This spec does not activate it.

### Boss Quest
A rare major outcome integrating multiple demonstrated capabilities or a materially harder execution barrier. Eligibility requires all of:
1. independently valuable real-world outcome;
2. normal Quest v2 evidence/scoring eligibility;
3. concrete reason it integrates multiple capabilities or represents a major barrier relative to Ron's current verified baseline;
4. completion evidence strong enough for the underlying quest;
5. no duplicate Boss label for the same outcome/cadence.

Boss is a semantic progression classification, not a reward multiplier. Until a later runtime slice deliberately persists Boss metadata, it remains controller/projection classification only.

### Arc milestone
A verified boundary that closes a meaningful development phase, not a large task. An Arc milestone may be recognized only from a set of already verified underlying outcomes that together establish the phase transition. It must not re-award their XP/coins.

Examples of valid evidence shape: a completed course/module sequence plus demonstrated application; a migration/education phase whose required independent outcomes are all verified; a capability-development phase with explicit completion criteria met.

### Rank evolution
A rare identity/progression state backed by milestone evidence. Rank must never be inferred from XP alone, time elapsed, self-description, or a single ordinary quest. A future writable rank policy must define explicit evidence thresholds and idempotent transition rules before any `rank.*` mutation becomes valid.

Until that later policy/runtime slice is promoted, Rank remains null/unmodified unless an already-promoted independent policy authorizes it.

## Evidence aggregation
Higher tiers reference verified lower-tier evidence; they do not copy external mutable facts into a second owner. Aggregation must be reconstructable from exact System ledger event references plus claim-relevant upstream owner/live evidence where required.

If any required evidence is missing, stale for the claim, contradictory, or merely reported when verification is required, classification stays `UNVERIFIED` rather than being downgraded to an invented midpoint.

## Anti-gaming
- No XP/coin multiplier for Boss/Arc/Rank labels.
- No double reward when an Arc milestone summarizes already rewarded quests.
- No splitting one outcome into several Bosses/Arcs.
- No promotion because a quest was delayed, unpleasant, or repeatedly missed.
- No Rank evolution from accumulated low-value grind alone.

## Player-facing contract
Show only the highest progression information that is currently evidence-backed and actionable. Do not flood the main quest surface with hierarchy bookkeeping.

When a verified completion closes a meaningful milestone, immediate feedback should expose the resulting visible growth/unlock in the same interaction when the relevant runtime policy is active. Until those runtime policies exist, describe eligibility as pending rather than pretending an unlock occurred.

## Rollout boundary
This candidate deliberately adds **no new action type, database field, trigger, reward, rank write, Challenge activation, or external write**. Safe rollout sequence:
1. promote this semantic/evidence contract;
2. add deterministic read-only hierarchy evaluation with tests;
3. add projection of evidence-backed Boss/Arc eligibility;
4. only then consider separately governed writable milestone/rank transitions.

Every later writable slice must preserve append-only ledger semantics, current authorization boundaries, Quest v2 focus/timing contracts, and atomic verified quest completion/reward behavior.