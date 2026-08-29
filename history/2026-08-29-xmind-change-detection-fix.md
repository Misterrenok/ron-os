# XMind current-state vs change-detection fix — 2026-08-29

## Trigger
Ron identified a logical defect in the 2026-08-29 XMind skill repair: making live XMind the only current-state authority prevents stale snapshots from overriding current truth, but a single live read cannot reveal **whether** the map changed since a prior observation.

## Root cause
Two claim classes were incorrectly collapsed:
- current-state authority: “what is in XMind now?”
- temporal provenance/change detection: “what changed since the last observed state?”

Live XMind is sufficient for the first and insufficient for the second without prior comparable evidence.

## Repair
- `skills/xmind.md`: separates live current authority from append-only snapshot history and forbids change/no-change claims from one live read.
- `references/integrations.md`: records the same authority boundary and requires pre/post snapshot verification for future authorized structural writes.
- `snapshots/xmind/README.md`: defines deterministic normalized snapshots, same-scope baseline rules, semantic diff classes, partial-read behavior and authorized mutation transaction.
- `snapshots/xmind/2026-08-29-coarse-baseline.md`: preserves the existing audit counts/invariants explicitly as **coarse historical evidence**, not an exact per-node baseline.
- `scripts/xmind_snapshot_diff.py`: deterministic SHA-256 + semantic diff utility.
- `tests/xmind_skill_regression.py` and `tests/xmind_snapshot_diff_selftest.py`: independent regression/behavior checks; CI executes both.

## Important remaining boundary
The 2026-08-29 audit read all 717 topics, but Ron OS did not retain a lossless normalized raw snapshot of every topic/relationship. Therefore exact per-node change attribution from that audit forward is **not fully recoverable** merely from equal aggregate counts. The first future complete live normalized snapshot becomes the first exact machine-comparable baseline unless the old raw live-read payload is later recovered and verified.

No XMind live mutation was performed by this repair.
