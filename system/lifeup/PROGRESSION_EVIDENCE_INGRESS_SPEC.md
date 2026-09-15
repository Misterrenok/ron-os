# Ron System — Progression Evidence Ingress v1

Status: **READ-ONLY RUNTIME BRIDGE**
Policy ref: `system-progression-evidence:v1`
Parent: `system-progression-hierarchy:v1`

## Purpose
Provide a deterministic path from already verified Ron System evidence into Boss/Arc projection without a second mutable owner, a new action type, a new database field, or extra rewards.

Neon `system_events` remains the sole mutable owner of derived RPG state. This bridge only interprets provenance already attached to a Quest v2 `quest.created.source_ref` and resolves it against exact verified ledger events.

## Transport
A future Quest v2 may carry a read-only progression declaration in its existing `source_ref`. The declaration may wrap ordinary quest provenance or be appended to an existing verified XMind strategy reference. It must remain within the existing 500-character `source_ref` limit and preserve the underlying provenance.

## Boss ingress
V1 runtime ingress supports the multi-capability Boss path. A Boss declaration predeclares 2–6 distinct exact `skill.upserted` event IDs. Each referenced event must exist uniquely, be verified, carry verified upstream evidence, represent an active distinct skill, and have occurred no later than the Boss quest declaration. The underlying quest still must be a verified rewarded Quest v2 outcome with a stable outcome identity.

The alternative major-barrier path remains fail-closed in runtime ingress until a separately verified baseline/barrier bridge exists.

## Arc ingress
An Arc declaration carries one stable milestone id and 2–12 distinct basis Quest v2 ids. The declaring quest must itself be one of the basis quests. Its exact verified completion event is the phase-transition witness. Arc becomes eligible only when all basis quests are verified rewarded Quest v2 outcomes and the declaring completion contains verified upstream evidence.

## Anti-gaming
Missing, malformed, duplicated, late, reported, or contradictory evidence fails closed. Two updates of the same skill count as one capability. Duplicate Boss outcomes and duplicate Arc milestone ids are suppressed deterministically. No Boss/Arc label is inferred from XP, elapsed time, rank, repeated misses, unpleasantness, or ordinary completion alone.

## Player-facing behavior
Snapshot composition may expose only `NO_CANDIDATE`, `NOT_READY`, or `READY`. `READY` is read-only eligibility. It does not create a Boss/Arc record, award XP/coins, activate Challenge, or evolve Rank.

## Non-goals
V1 adds no database/schema migration, external write, new action type, reward multiplier, writable Arc transition, Challenge persistence, or writable Rank evolution.
