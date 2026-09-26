# Calibration runtime enforcement

Canonical base policy: `../CALIBRATION_SPEC.md`.

Current Level policy: `../LEVEL_PROGRESSION_SPEC.md` / `system-level-xp:v2`.

Runtime enforcement is intentionally duplicated at two boundaries:

- `src/calibration.mjs` mirrors the current projection policies for the explicit ephemeral development/test store and derives calibrated snapshot level metadata.
- `migrations/004_calibration_v1.sql` preserves the original reward/attribute/skill/rank calibration helpers and the historical v1 Level contract.
- `migrations/016_level_progression_v2.sql` promotes the current Level projection/write guard to `system-level-xp:v2` while deliberately retaining `system-quest-reward:v1` and the existing attribute/skill/rank policies. Its replacement `BEFORE INSERT` calibration trigger continues to constrain privileged raw inserts.

The migrations are projection/guard changes: they create policy helper functions and validation triggers but do **not** mint XP, delete XP or create fake completion events. Level v2 intentionally reprojects existing verified cumulative XP under the new curve; all historical ledger events stay immutable.

Policy references written into events are immutable version identifiers:

- historical Level events may reference `system-level-xp:v1`; current projection/new Level calibration uses `system-level-xp:v2`
- `system-quest-reward:v1`
- `system-attribute-ordinal5:v1`
- `system-skill-competency5:v1`
- `system-rank-review:v1`

A future policy change must introduce a new reference and migration rather than reinterpret historical events.
