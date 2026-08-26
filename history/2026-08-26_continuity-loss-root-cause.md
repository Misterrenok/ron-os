# Continuity-loss root cause — 2026-08-26

Status: **HISTORICAL / GOVERNING FIXES LIVE ELSEWHERE**  
Runtime owners: `BOOTSTRAP.md`, `CURRENT.md`, `PROTOCOL.md`, `references/continuity-contract.md`, `references/continuity-owner-registry.tsv`.

## Incident
During nutrition planning Ron noticed the assistant had forgotten previously supplied employer/workplace facts. Recovery then exposed broader losses outside nutrition: finance had no owner, useful durable personal detail had been over-compressed out of `PERSON.md`, work/schedule logistics were incomplete, and the distilled training mechanics had changed `stall = 3` into an unsupported `two consecutive failures` shorthand.

## Root cause
The primary failure was **semantic coverage blindness during migration/hygiene**.

The 2026-08-24 migration correctly optimized for:
- one authoritative owner per mutable domain;
- removal of stale current-sounding snapshots;
- compact runtime files;
- no duplicate volatile state;
- strong internal consistency/read-back of surviving artifacts.

But it lacked a complementary **lossless coverage invariant**. A useful fact could therefore fall into a gap:
- too mutable for `PERSON.md`;
- too dated to be asserted as live current state;
- no existing domain owner/live owner;
- not central to the migration's focal domains;
- legacy source then retired/compacted.

The deep migration audit made this failure explicit in hindsight: under “Finance / other work current-state owners” it decided that inspected finance material was not fresh enough to justify a new owner and left durable background to `PERSON.md`. But `PERSON.md` intentionally excluded current balances/debts/financial state. Finance therefore had **no valid destination**. The architecture had no category for “dated but still decision-relevant mutable fallback.”

## Secondary causes
1. **Local hygiene objective > global continuity objective.** Removing stale/duplicate state was treated as success without proving that all useful outgoing semantic edges had a destination.
2. **Validation checked survivors, not omissions.** File equality, syntax, routing and owner correctness could all PASS after a whole domain vanished. No before/after semantic coverage ledger existed.
3. **Migration-window/focus bias.** Audits strongly inspected recent/focal systems and active projects. Peripheral personal/financial facts could escape attention even though they materially affect later decisions.
4. **No explicit owner registry.** Scanning whatever files currently existed cannot detect that an entire owner file should exist but disappeared.
5. **Distillation lacked semantic-fidelity anchors.** Compacting detailed training mechanics could change a numeric trigger (`stall = 3` -> `two failures`) while remaining plausible and internally coherent.
6. **Freshness was binary instead of typed.** The system distinguished current truth vs stale evidence but lacked a first-class “DATED FALLBACK — VERIFY BEFORE CONSEQUENCE” storage mode for recurring mutable domains without live owners.

## Systemic fix
### 1. Lossless disposition contract
`references/continuity-contract.md` now requires every continuity-relevant item touched by migration/hygiene to end in exactly one disposition:
- OWNER
- LIVE_OWNER
- SUPERSEDED
- ARCHIVE_EVIDENCE
- SENSITIVE_EXCLUDED
- justified IRRELEVANT

There is no `too stale -> silently drop` disposition. Dated but still useful mutable state with no live owner must receive a dated domain fallback.

### 2. Explicit owner registry
`references/continuity-owner-registry.tsv` enumerates every current `domains/*.md` and `projects/*.md` owner. The executable guard requires the registry and filesystem to match exactly. This makes silent whole-domain disappearance detectable.

### 3. Semantic fidelity
`PROTOCOL.md` and the continuity contract now require preservation of numeric triggers, counts, schedules, units, booleans and provenance through compaction unless newer evidence explicitly changes them.

### 4. Executable CI regression guard
`tests/continuity_coverage_guard.py` verifies:
- every registered domain/project owner exists;
- no domain/project owner exists unregistered;
- every owner is routed from both `BOOTSTRAP.md` and `CURRENT.md`;
- the generalized continuity contract remains wired into runtime;
- real regression anchors remain recoverable (finance, 600 TL work cash, Mon–Sat workweek, NOT STARTED nutrition state, durable person context, `stall = 3`, `min(completedWeights)`);
- the known bad training phrase does not return as an operative rule.

`.github/workflows/continuity-guard.yml` runs this on every push/PR.

### 5. Peripheral-domain probe
Material migrations must test at least one domain outside the migration's main focus. Testing only focal domains is no longer sufficient evidence of continuity completeness.

## Validation
The first CI iteration exposed a defect in the newly written test anchor itself. That was corrected. After adding the owner registry and routing it through runtime, the current HEAD workflow completed successfully, including the `Run continuity coverage guard` step.

## Boundary / honesty
This fix strongly protects the **observed class** of errors: silent owner loss, owner-category gaps and known semantic-drift regressions. It cannot mathematically guarantee that no unforeseen continuity failure will ever exist. The correct promise is: future migration/hygiene may not be declared PASS merely because surviving files are clean; it must demonstrate owner coverage + semantic disposition + executable regression PASS.
