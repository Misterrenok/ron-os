# System Soft Target v1 — closeout

Status: **PROMOTED / MAIN CI PASS / NORTHFLANK BUILD SUCCESS / PRODUCTION TARGET SET / NEON READ-BACK PASS**  
Date: 2026-09-12 Europe/Istanbul

## Decision
Quest timing now has three modes under `system-soft-target:v1`:
1. no target when timing adds no material value;
2. soft target by default when earlier execution is useful but a miss does not invalidate the real outcome;
3. hard `deadline_at` only for a real external deadline or an explicitly accepted time-bounded challenge whose miss should terminalize the quest.

A missed soft target is a priority/adherence signal only. It must not complete, fail, expire, award or remove reward. Repeated misses trigger diagnosis of timing, scope, overload or avoidance before stronger pressure.

## Architecture and implementation
- architecture manifest: `architecture/changes/2026-09-12-system-soft-target-v1.json`;
- policy spec: `system/lifeup/SOFT_TARGET_SPEC.md`;
- controller route updated in `skills/system-controller.md`;
- helper: `system/lifeup/cloud/src/soft-target.mjs`;
- existing `deadline-engine.mjs` additionally reads soft-target declarations;
- declarations use the existing validated `notification.push` action and immutable `system_events` ledger with versioned `source_ref`; no second state store, schema migration or new SQL action was introduced;
- latest declaration for a quest wins; earlier declarations remain audit history;
- within one hour the server plans one idempotent INFO reminder;
- at/after a missed target it plans one idempotent WARNING while leaving the quest ACTIVE;
- hard deadline automation remains unchanged and takes precedence once its real deadline is due.

## Promotion evidence
Exact architecture base: `d6aebc5ed9b66d14aa97b76bd2b008ba06cf8f21`.

Final PR: #14 `System Soft Target v1`.

Final promoted runtime/controller merge commit: `62e5738f29acfd4e214c787ea16cbe9d75a96927`.

Pre-merge exact controller-policy head `21f4cec68d172f402eba9fa584c7f833d655f980`:
- system-cloud-ci `34687514626`: PASS;
- continuity-guard `34687514641`: PASS.

Promoted-manifest head `2be85239ebd1256358041cd5459a8069160543e5`:
- architecture/continuity job: PASS.

Post-main exact merge commit:
- system-cloud-ci `34687628015`: PASS — model tests, Docker smoke, PostgreSQL action gate and HTTP-through-Postgres;
- continuity-guard `34687627979`: PASS;
- lifeup-system-ci `34687627973`: PASS.

Northflank GitHub commit status for `62e5738f...`:
- context `northflank/ronsmiths-team/cronometer/system-core`;
- state `success`;
- build `playful-winter-3317`.

Direct public HTTP read-back remains `UNVERIFIED` from the current tool environment because DNS for the canonical `code.run` hostname cannot be resolved here. Deployment success is therefore recorded separately from HTTP verification rather than inferred as the same claim.

## Production player mutation
Ron authorized applying the recommended soft target to the already-created active quest.

Quest:
- id `qv2-german-nicos-weg-a1-hallo-recovery-20260912`;
- title `Немецкий: первый урок Nicos Weg A1 — Hallo!`;
- hard deadline: `null`;
- reward: D / 10 XP / 0 coins.

Soft target:
- local: **2026-09-12 21:30 Europe/Istanbul**;
- UTC: `2026-09-12T18:30:00.000Z`;
- policy: `system-soft-target:v1`;
- declaration action: existing `notification.push` through production `system_apply_action(...)`;
- notification id: `soft-target-set-384ea502e1d7a761f9dde43f9bd7519a`;
- idempotency key: `soft-target-v1:set:qv2-german-nicos-weg-a1-hallo-recovery-20260912:20260912T1830Z`;
- source ref: `system-soft-target:v1?quest=qv2-german-nicos-weg-a1-hallo-recovery-20260912&target=2026-09-12T18%3A30%3A00.000Z&reason=today`.

Production write result:
- `replay=false`;
- ledger seq **15**;
- event id `2b98bb67-a00f-4ff7-a63b-d9ed0f727266`;
- event type `notification.pushed`.

Immediate Neon read-back after the write:
- total events **13**;
- max seq **15**;
- soft-target declarations for this quest **1**;
- terminal events for this quest **0**;
- System XP **0**;
- coins **0**.

Therefore the quest remains ACTIVE. Missing 21:30 must not fail/expire it or forfeit its 10 XP. If it is still active, the deployed soft-target engine is intended to produce the one-hour reminder and then one missed-target warning idempotently.

Exact quest receipt: `history/2026-09-12-xmind-linked-quest-proposal.json`.

## Continuity tail
`projects/lifeup-system.md` is a very large historical owner and still contains older textual checkpoints such as `PROPOSED / NOT CREATED` and `no active player quest`. Those statements are superseded for mutable player state by live Neon and the exact receipt above. The current connector only supports full-file replacement, so a surgical owner-text correction was not performed in this slice to avoid destructive loss of its long historical record. This is a continuity-hygiene tail only; it does not change production System behavior or ownership priority. A future safe owner compaction/repair should preserve the displaced version losslessly under the continuity contract and then remove the stale current-state labels.
