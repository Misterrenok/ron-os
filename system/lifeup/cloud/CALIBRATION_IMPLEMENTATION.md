# Calibration v1 runtime enforcement

Canonical policy: `../CALIBRATION_SPEC.md`.

Runtime enforcement is intentionally duplicated at two boundaries:

- `src/calibration.mjs` mirrors the policy for the explicit ephemeral development/test store and derives calibrated snapshot level metadata.
- `migrations/004_calibration_v1.sql` is the production authority boundary for writes into the PostgreSQL event ledger. Its `BEFORE INSERT` trigger also constrains privileged raw inserts, so callers cannot bypass canonical reward/scale rules by avoiding `system_apply_action`.

The migration is additive: it creates policy helper functions and a validation trigger; it does **not** create player-profile events. Promoting the code therefore must leave production Level/Rank/attributes/skills/economy unchanged until a separate evidence-backed launch mutation is authorized.

Policy references written into events are immutable version identifiers:

- `system-level-xp:v1`
- `system-quest-reward:v1`
- `system-attribute-ordinal5:v1`
- `system-skill-competency5:v1`
- `system-rank-review:v1`

A future policy change must introduce a new reference and migration rather than reinterpret historical events.
