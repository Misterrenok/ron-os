# Ron OS — architecture change contract

Purpose: prevent a locally correct architecture fix from silently removing another capability of Ron OS.

This contract applies when a proposed change alters any of: authority/source-of-truth, routing, owner creation/retirement, continuity or migration semantics, snapshot/provenance/rollback behavior, write/mutation gates, executor semantics, or architecture-level regression enforcement.

## Architecture Mode
Architecture Mode is not “think longer”. It changes the order of work: **breadth before depth, preservation before optimization, adversarial falsification before promotion**.

### 0. Candidate isolation
- Start from the exact current `main` SHA.
- Work on a dedicated candidate branch. Do not make the architecture delta directly on `main`.
- Record the base SHA and branch in `architecture/changes/<change-id>.json`.

### 1. Preservation contract before implementation
Inventory every material role served by the affected artifacts before changing them. Typical roles include:
- current truth / authority;
- routing / discovery;
- provenance / history;
- change detection;
- rollback / recovery;
- execution / mutation;
- safety / permission gate;
- derived projection / analytics;
- regression enforcement.

Each role must receive exactly one disposition:
- `PRESERVE` — same role remains available;
- `REPLACE` — role moves to an explicit destination/replacement;
- `INTENTIONAL_REMOVE` — role is deliberately removed with an explicit rationale and consequence.

A role must never disappear merely because it was not part of the focal defect.

### 2. Capability preservation / negative-space check
Before implementation, list concrete queries/actions/recovery paths that the old architecture can perform and that must still work afterward. At minimum include:
- one **existing-capability** probe directly adjacent to the change;
- one **contra/adversarial** probe designed to reproduce the feared local-fix failure;
- one **peripheral** probe outside the focal component, to catch collateral routing/continuity loss;
- a **rollback/provenance** probe when the affected component has historical/recovery semantics.

Ask explicitly: **what previously answerable query, recovery path, audit, or rollback becomes impossible after this design?** Any unintended material loss rejects the design before writing.

### 3. Candidate implementation
Implement only after the preservation manifest is complete. Keep the runtime protocol thin; detailed mechanics live here or in executable tests rather than growing `PROTOCOL.md` into a checklist.

### 4. Falsifiable verification
Verification must contain both:
- `new_behavior` tests proving the intended fix;
- `regression` tests proving preserved old capabilities still work.

A test suite that only proves the new behavior is incomplete. Same-model review is supportive only; deterministic tests, exact diffs, owner read-back and live/runtime probes are preferred where possible.

### 5. Base → head review
Before promotion:
- inspect the complete candidate diff against the recorded base SHA, not only the last commit;
- reconcile every changed authority/routing/owner/snapshot/write-gate surface with the manifest;
- confirm `unintended_capability_loss` is empty;
- verify every declared `REPLACE` destination exists and every `INTENTIONAL_REMOVE` is truly intended.

### 6. Promotion gate
Promotion to `main` is allowed only when:
- the candidate architecture manifest validates;
- the architecture guard self-test passes;
- ordinary continuity/regression CI passes;
- base→head diff was reviewed;
- changed runtime files were read back;
- no unexplained material capability loss remains.

After candidate CI passes, update the manifest to `status: promoted` with verification evidence, run CI again, then fast-forward/merge `main` to that verified candidate. Do not call the migration complete before the promoted commit itself passes CI.

### 7. Closeout
Update `CURRENT.md` only if the architecture change materially changes future continuation. Preserve the manifest as historical architecture evidence; it is not a mutable-state owner.

## Machine-readable manifest
`tests/architecture_change_guard.py` validates all manifests under `architecture/changes/`. `tests/architecture_change_guard_selftest.py` exercises positive and contra cases, including the failure class where a stale-current fix accidentally destroys provenance/change-detection.

This contract supplements `references/continuity-contract.md`; migration/compaction work must satisfy both when both trigger.
