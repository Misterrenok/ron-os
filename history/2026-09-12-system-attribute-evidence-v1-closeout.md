# System Attribute Evidence v1 — closeout

Date: 2026-09-12 Europe/Istanbul
Status: CLOSED / PROMOTED / PRODUCTION VERIFIED / NO PLAYER MUTATION

## Policy
- policy ref: `system-attribute-evidence:v1`
- existing scale retained: `system-attribute-ordinal5:v1`
- specification: `system/lifeup/ATTRIBUTE_EVIDENCE_SPEC.md`
- evaluator: `system/lifeup/cloud/src/attribute-evidence.mjs`
- controller procedure: `skills/system-controller.md`
- architecture manifest: `architecture/changes/2026-09-12-system-attribute-evidence-v1.json`

The evaluator is a fail-closed preflight for proposed numeric STR/VIT/INT/DISC/CHA values. It never infers upstream facts, never writes player state, never auto-increments an attribute, and never replaces domain/live-source authority.

Evidence must be verified, current, correctly scoped, and uniquely referenced. Future-dated, stale (>180 days), unverified, malformed, wrong-attribute, or conflicting duplicate evidence is excluded/fails closed. Unsupported proposals return `UNRESOLVED`; eligible proposals return only an exact permission-gated `attribute.set` action plan with deterministic SHA-256 provenance.

## Thresholds
- level 1: >=1 verified baseline-or-stronger record;
- level 2: >=2 records including repeated-execution-or-stronger;
- level 3: >=3 records spanning >=28 days plus objective-benchmark-or-stronger;
- level 4: >=4 records spanning >=56 days plus benchmark and >=2 difficult-outcome-or-stronger records;
- level 5: >=5 records spanning >=84 days plus benchmark, >=2 difficult outcomes, and external-validation-or-stronger.

These are preflight gates for the already-live ordinal scale; they do not change PostgreSQL attribute validation or assign a value automatically.

## Verification
Exact base: `d00d5da425ccf4c6a74c1f521199b1988850b0be`.
Promoted head: `5efdda3473c8037c027c56f32bd6e505027e24b2`.

Candidate evidence:
- targeted evaluator tests: 12/12 PASS;
- system-cloud CI `34677866112`: PASS (model, Docker, real PostgreSQL gate, HTTP-through-Postgres);
- LifeUp rollback CI `34677866189`: PASS;
- first continuity `34677866080`: intentionally failed only because the controller commit push range did not itself contain the already-existing manifest change;
- manifest-in-range continuity `34678011396`: PASS;
- promoted-manifest continuity `34678035645`: PASS.

Full base-to-promoted diff was reviewed: exactly five intended paths (manifest, controller procedure, attribute evidence spec, pure evaluator, focused tests). No migration, SQL action gate, projection, PWA, secret, owner, or unrelated-domain code changed.

Post-promotion main evidence on exact head `5efdda3473c8037c027c56f32bd6e505027e24b2`:
- continuity `34678056934`: PASS;
- system-cloud `34678056947`: PASS;
- LifeUp rollback `34678056962`: PASS;
- Northflank `system-core` build `chunky-rock-242`: SUCCESS.

## Production read-back
After promotion, production Neon remained exactly:
- 11 total events;
- max seq 13;
- 0 `progression.awarded`;
- 0 `attribute.set`;
- 0 `achievement.unlocked`;
- 0 `shop.item.upserted`;
- 0 `shop.redeemed`.

Therefore STR/VIT/INT/DISC/CHA remain UNKNOWN/null. No attribute proposal has been authorized or written by this release. Future calibration must first recover current evidence from the correct domain/live owner, pass `system-attribute-evidence:v1`, present the exact resulting `attribute.set` payload, and obtain separate exact mutation permission.
