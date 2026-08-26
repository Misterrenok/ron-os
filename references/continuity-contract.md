# Ron OS — continuity coverage contract

Purpose: prevent semantic data loss during migration, hygiene, compaction, deduplication, owner splitting, or architecture redesign.

This is a **process/coverage contract**, not a mutable-state owner. Runtime truth still follows `BOOTSTRAP.md -> CURRENT.md -> exact owner -> live owner`.

## The failure class this contract prevents
A continuity-relevant fact can be lost even when every surviving file is internally correct. The dangerous pattern is:
1. a legacy surface contains useful state/context;
2. compaction correctly decides that the legacy surface should not own it;
3. the fact is considered too mutable for `PERSON.md`, too old for a new domain owner, or simply outside the migration focus;
4. the old surface is retired anyway;
5. no current owner can recover the fact later.

This is an **orphaned-state migration defect**. Internal consistency of surviving files does not make the migration complete.

## Lossless-disposition invariant
Before a continuity-relevant source is deleted, compacted, retired, or made non-authoritative, every materially useful claim/state edge in that source must receive exactly one explicit disposition:

1. **OWNER** — moved/preserved in a current GitHub domain/project/durable owner.
2. **LIVE_OWNER** — intentionally not copied because a named live system is authoritative and reliably retrievable.
3. **SUPERSEDED** — contradicted/replaced by newer explicit Ron evidence or a stronger owner.
4. **ARCHIVE_EVIDENCE** — intentionally historical/non-current but still recoverable as provenance/evidence.
5. **SENSITIVE_EXCLUDED** — identifying/secret data deliberately not copied; only the minimum non-sensitive operational consequence may be retained.
6. **IRRELEVANT** — genuinely no continuity value. This disposition requires a reason when the source previously influenced decisions or execution.

**There is no `too stale to own, therefore silently drop` disposition.** If a mutable fact is old but still potentially decision-relevant and has no live owner, preserve it as a clearly dated fallback in a proper domain owner until newer evidence supersedes it.

## Coverage procedure for migration/hygiene
For any substantial migration, compaction, dedup, or deletion of a continuity surface:

1. Inventory the source's materially useful facts, decisions, unresolved conflicts, active-project residue, durable preferences/frameworks, integration quirks, executors/projections, and accepted external-source-derived rules.
2. Assign each item one disposition from the list above and name its destination/authority.
3. Check **domain coverage**, not just file coverage: work/schedule, finance, nutrition, training, mobility/legal, education/languages, e-commerce/projects, integrations, goals/frameworks, and any newly discovered domain with recurring continuity value.
4. Check **semantic fidelity** for distilled mechanics/rules: numeric triggers, units, counts, schedules, thresholds and provenance must not change merely because wording was compressed.
5. Only after the ledger has no unresolved continuity-relevant item may the old source be retired/compacted.
6. Run `python tests/continuity_coverage_guard.py` and fix every failure.
7. Read back the changed owners and routes.
8. For high-impact migrations, perform at least one clean continuation probe that asks for a fact from a domain not central to the migration, specifically to detect omitted coverage.

The ledger itself may live in `history/<date>_*migration*.md`; it need not become runtime bloat. The important invariant is explicit disposition before destructive cleanup.

## Routing invariants
- Every `domains/*.md` current owner must be named in both `BOOTSTRAP.md` and `CURRENT.md`.
- Every `projects/*.md` active project owner must be named in both `BOOTSTRAP.md` and `CURRENT.md`.
- `PERSON.md` owns durable personal facts/preferences, not mutable balances/statuses.
- A mutable recurring domain that matters across chats must not be left ownerless merely because its last snapshot is dated; use a dated fallback owner with a freshness warning.
- Current mutable app state stays with its live owner where one exists.

## Semantic-fidelity invariants
When converting detailed source material into compact references:
- preserve exact numerical/boolean mechanics unless newer evidence explicitly changes them;
- distinguish `fact`, `Ron decision/report`, `assistant proposal`, `inference`, `summary`, and `UNKNOWN` when provenance matters;
- never convert a dated fallback into current truth;
- never convert missing data into zero/false;
- never let a shorter paraphrase silently change trigger semantics (for example `stall = 3` becoming `two failures`).

## Current regression anchors
These anchors exist because they were actually lost or distorted once:
- finance must have an owner;
- employer meal cash = **600 TL/workday**, not 60;
- workweek = **Mon–Sat**;
- nutrition remains **NOT STARTED** until purchase + real execution report;
- training fallback progression retains **stall = 3 -> ~60% -> ~90% -> working load** and `min(completedWeights)` where applicable;
- durable language/education/e-commerce background remains recoverable from `PERSON.md`.

These anchors are not the complete user model. Future concrete loss incidents should add the smallest useful regression anchor rather than growing this file into a second owner.
