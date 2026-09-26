# System Attribute Evidence v1

Policy ref: `system-attribute-evidence:v1`
Scale ref: `system-attribute-ordinal5:v1`

## Purpose
Turn STR / VIT / INT / DISC / CHA calibration from an informal judgment into a fail-closed evidence package. This policy validates whether a proposed numeric attribute has enough current verified evidence for the existing 1..5 scale. It does not infer real-world facts, auto-select a score, or write player state.

## Authority boundary
- Real-world evidence remains owned by the relevant domain/live source. The System only consumes explicit evidence records with provenance.
- Unsupported or stale evidence leaves the attribute `null`; unknown is never treated as 0 or midpoint.
- `attribute.set` remains a separate exact-permission player mutation through `system_apply_action(...)`.
- This policy never changes the existing attribute scale or PostgreSQL validation; it only adds a reproducible preflight before proposing a write.

## Evidence record
Every evidence record must contain:
- `status: "verified"`;
- `source`: non-empty authority/source name;
- `ref`: non-empty stable reference;
- `observed_at`: valid timestamp;
- `kind`: one of `baseline`, `repeated_execution`, `objective_benchmark`, `difficult_outcome`, `external_validation`, `exceptional_milestone`.

Optional `attribute` may narrow an evidence record to one of STR/VIT/INT/DISC/CHA. Evidence explicitly tied to a different attribute cannot be reused.

## Minimum evidence by proposed level
The existing ordinal scale remains authoritative; these are conservative preflight gates for it:

| Level | Minimum evidence package |
|---|---|
| 1 | >=1 verified `baseline` or stronger evidence |
| 2 | >=2 verified records, including `repeated_execution` or stronger |
| 3 | evidence span >=28 days, >=3 verified records, and >=1 `objective_benchmark` or stronger |
| 4 | evidence span >=56 days, >=4 verified records, >=1 objective benchmark and >=2 distinct `difficult_outcome` or stronger records |
| 5 | evidence span >=84 days, >=5 verified records, >=1 objective benchmark, >=2 difficult outcomes, and >=1 `external_validation` or `exceptional_milestone` |

“Stronger” means a later evidence class may satisfy a weaker qualitative requirement, but counts remain distinct records by stable `ref`.

## Freshness
A proposal must include an explicit `as_of` timestamp. Evidence more than 180 days older than `as_of` is excluded from numeric calibration. This is a conservative System rule, not a claim that the underlying real-world trait disappears after 180 days.

## Output
The evaluator returns either:
- `ELIGIBLE`: exact permission-gated `attribute.set` action payload plus deterministic evidence digest; or
- `UNRESOLVED`: no action payload and explicit failed requirements.

The evidence digest is SHA-256 over deterministic normalized evidence identity. It is provenance support, not a substitute for the upstream evidence itself.

## Promotion boundary
The evaluator itself never increments an attribute. A later stronger evidence package only returns eligibility.

Ordinary/manual numeric changes remain separately user-directed. Narrow versioned exception: under `system-growth:v1`, Ron's explicit 2026-09-26 authorization permits the Growth Engine to perform an **upward-only** `attribute.set` when all of the following hold: the evidence came from a prospective Quest growth mapping, the Quest outcome was verified, this evaluator returns `ELIGIBLE` for a value above the current value, and the mutation carries deterministic Growth provenance. Global Level, Skill Mastery XP, task count or an unverified mapping can never trigger the exception. Automatic downward recalibration is not authorized by Growth v1.
