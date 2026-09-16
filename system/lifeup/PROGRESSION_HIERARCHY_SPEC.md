# Ron System — Progression Composition v1

Status: **PROMOTED READ-ONLY RUNTIME BASE / WRITABLE EXPERIMENTS LOCKED**
Policy ref: `system-progression-hierarchy:v1`

## Objective
Make verified long-horizon growth legible without inventing capability, farming labels, forcing every Quest through one game ladder, or adding System overhead.

This policy keeps its existing ref for compatibility, but the canonical conceptual model is **compositional, not a mandatory hierarchy**.

## Canonical model
- **Quest** — bounded independently valuable and independently verifiable real-world outcome.
- **Challenge** — optional voluntary pressure/difficulty contract on a suitable Quest.
- **Boss** — rare evidence-backed classification/variant for a major outcome, barrier or multi-capability test.
- **Arc** — optional long-horizon context/milestone structure spanning related outcomes; standalone Quests remain valid.
- **Level** — frequent quantitative progress feedback, separate from evidence-backed real skill/capability.
- **Rank** — optional rare qualitative progression status if a separately promoted policy establishes meaningful evidence thresholds and real utility beyond Level/skills/domain progression.
- **Unlock** — optional System capability/choice enabled by verified progression; not a required rung.

The architecture explicitly rejects `Action -> Quest -> Challenge -> Boss Quest -> Arc milestone -> Rank evolution` as a required lifecycle. A Quest does not need to be a Challenge. Challenge does not imply Boss; Boss does not require a prior Challenge and does not imply Arc or Rank; Arc does not own every Quest; Rank is not required for progression to be meaningful.

The current runtime activation remains deliberately read-only for Boss/Arc/Rank-related evaluation. It does not create player state, award XP/coins, activate Challenge, or authorize progression mutation.

## Runtime activation status
Current cloud/PWA behavior remains:
- deterministic read-only evaluation in `cloud/src/progression-hierarchy.mjs`;
- `cloud/src/progression-player-view.mjs` converts that evaluation into a player projection;
- `cloud/src/snapshot-projection.mjs` composes it into `snapshot.progression`;
- the Russian-first PWA may render visible growth plus evidence-backed Boss/Arc/Rank-related gates.

The active projection is fail-closed and non-mutating: `read_only=true`, `reward_delta={xp:0, coins:0}`, and `action=null`. Any existing Boss/Arc readiness is eligibility/projection only. Rank remains locked.

The following remain **NOT runtime-active** until separately promoted with explicit persistence/recovery/idempotency/evidence contracts:
- Challenge persistence/recovery/activation;
- persisted Boss metadata or Boss-specific write actions;
- Arc write transitions where persistence is actually necessary rather than derivable;
- Rank evolution writes or any `rank.*` mutation;
- progression-triggered Unlock writes beyond already-promoted independent achievement/shop policies.

## Invariants
- Real-world outcomes and evidence remain upstream truth; Neon remains the sole mutable owner of derived RPG state.
- A game label never increases XP/coins by itself. Quest difficulty/reward remains governed by `system-quest-difficulty:v1` and `system-quest-reward:v1`.
- Progression is evidence-backed and durable. A later miss does not erase verified growth.
- Higher-level meaning compresses verified evidence; it must not become extra chores or duplicate rewards.
- Player-facing progression should make growth legible with minimal bookkeeping.
- Low-value task splitting, artificial Boss inflation, grind and XP-only Rank promotion are invalid progression strategies.
- Derived progression should remain reconstructable from ledger/evidence. A cache/projection is acceptable only when reproducible and non-authoritative.

## Mechanic contracts

### Quest
Quest remains the primary execution object. Existing Quest v2 lifecycle, focus, timing, evidence and reward policies remain unchanged.

### Challenge
Challenge is an optional contract on a suitable Quest, not a mandatory tier between Quest and Boss. Target behavior is a voluntary harder/time-bounded commitment with an exact preaccepted recovery contract. `CHALLENGE` remains fail-closed until the separate atomic persistence/recovery slice is promoted.

The exact Ron System Challenge Contract is a pragmatic N-of-1 hypothesis: its implementation must be evaluated for real outcome value, adherence, recovery, friction and overload/threat signals rather than assumed effective merely because calibrated challenge has broader empirical support.

### Boss
Boss is a rare semantic classification/variant for a major outcome integrating multiple demonstrated capabilities or representing a materially harder barrier relative to Ron's verified baseline.

Read-only Boss eligibility requires all of:
1. independently valuable real-world outcome;
2. normal Quest v2 evidence/scoring eligibility;
3. concrete reason it integrates multiple capabilities or represents a major barrier relative to current verified baseline;
4. completion evidence strong enough for the underlying Quest;
5. no duplicate Boss label for the same outcome/cadence.

Boss is not a reward multiplier and does not require that the Quest was a Challenge. Until a later runtime slice deliberately persists Boss metadata, it remains controller/projection classification only.

### Arc
Arc is optional long-horizon context around related verified outcomes. It must not become a mandatory folder for every Quest or a second task queue.

An Arc milestone may be recognized only when already verified underlying outcomes jointly establish a meaningful phase transition. It must not re-award their XP/coins. Where Arc progress can be derived reproducibly from ledger/evidence, prefer derivation over new mutable state; persist only information that cannot be reconstructed or that represents an explicit user choice.

### Level
Level is frequent visible quantitative progress feedback. It may help make accumulation legible, but it must not be interpreted as proof of real capability in a domain. Domain skills/stats remain evidence-gated by their own policies.

### Rank
Rank is optional and rare. It must never be inferred from XP alone, elapsed time, self-description, grind, or one ordinary Quest. The System is not committed to a global E->S ladder. A future writable Rank policy must first justify why Rank adds utility beyond Level/skills/domain progression and define explicit evidence thresholds plus idempotent transition rules.

Until such a policy/runtime slice is promoted, Rank remains null/unmodified unless an already-promoted independent policy authorizes it.

### Unlock
Unlock is an optional consequence of verified progression, not a mandatory step after Rank or Arc. Any new Unlock class must have an explicit fulfillment surface and must not gate protected needs or mandatory duties. Existing achievement/shop contracts remain authoritative for their own unlock-like behavior.

## Evidence aggregation
Boss/Arc/Rank/Unlock eligibility may reference verified Quest evidence, but it does not copy external mutable facts into a second owner. Aggregation must be reconstructable from exact System ledger event references plus claim-relevant upstream owner/live evidence where required.

If required evidence is missing, stale for the claim, contradictory, or merely reported when verification is required, classification stays `UNVERIFIED` rather than being downgraded to an invented midpoint.

## Anti-gaming
- No XP/coin multiplier merely for Boss/Arc/Rank/Unlock labels.
- No double reward when an Arc/milestone summarizes already rewarded Quests.
- No splitting one outcome into several Bosses/Arcs for progression farming.
- No promotion because a Quest was delayed, unpleasant, or repeatedly missed.
- No Rank evolution from accumulated low-value grind alone.
- No pressure mechanic that improves System metrics by making real outcomes or recovery worse.

## Evaluation contract
A new writable/compositional mechanic must state its hypothesis and be evaluated pragmatically against:
- real-world outcome value and difficulty calibration;
- completion/adherence;
- recovery after misses;
- evidence quality;
- System maintenance/friction;
- subjective interest/meaning;
- long-horizon persistence where relevant;
- anti-gaming / metric-distortion signals.

Ron is an N-of-1 environment. These checks establish personal utility and detect harm; they do not pretend to provide universal causal proof.

## Player-facing contract
Show only progression information that is evidence-backed and useful. Do not flood the main Quest surface with hierarchy bookkeeping.

When verified completion closes a meaningful milestone, the read-only projection may expose visible growth or eligibility in the same interaction. It must describe eligibility as pending/read-only rather than pretending a writable transition occurred when no separately promoted write policy exists.

## Rollout boundary
This reconciliation itself adds **no new action type, database field, trigger, reward, rank write, Challenge activation, Arc mutation, Boss mutation, Unlock mutation or external write**.

Current state:
1. **ACTIVE** — semantic/evidence contract;
2. **ACTIVE** — deterministic read-only Boss/Arc/Rank-related evaluation with tests;
3. **ACTIVE** — player projection of evidence-backed readiness/gates;
4. **LOCKED** — writable Challenge/Boss/Arc/Rank/new-Unlock behavior until each separately justified contract is promoted.

Every later writable slice must preserve append-only ledger semantics, current authorization boundaries, Quest v2 focus/timing contracts, atomic verified quest completion/reward behavior and the non-linear compositional model above.
