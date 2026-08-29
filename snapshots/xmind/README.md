# XMind snapshot / change-detection contract

Purpose: preserve **historical evidence** needed to detect XMind changes without creating a second current-state owner.

## Authority boundary
- Live XMind answers **what is true in the map now**.
- `snapshots/xmind/` answers **what was observed before, and what changed between two observations**.
- Snapshots are append-only evidence. They never override a newer live read and are never promoted as current map truth merely because they are newer than another snapshot.

## Baseline rule
A change claim requires two comparable observations:
1. latest prior **complete same-scope** snapshot;
2. a fresh live read of that same scope.

If no comparable complete prior snapshot exists, say: **current state known; change history UNKNOWN**. Never infer “unchanged” from one live read, from equal node counts, or from an old audit summary.

A partial sheet/subtree read may be saved with its exact scope, but it cannot advance the whole-file/global baseline.

## Complete snapshot shape
When live XMind access can read the required fields, save deterministic JSON (or an equivalent lossless structured representation) containing:
- schema version;
- capture timestamp and source = live XMind;
- XMind file ID;
- scope: whole-file / sheet IDs / subtree root IDs;
- every observed sheet in display order;
- every observed topic: stable topic ID, parent ID, sibling order/index, level, exact title, exact note text, labels, markers, hyperlink/image/rich-content flags when exposed;
- every observed relationship: stable/source ID, target ID, label/title and other exposed attributes;
- sheet-level counts and capabilities/fields that the connector did **not** expose.

Preserve exact user content. Canonicalization for hashing may normalize only serialization noise: JSON key order, line endings and deterministic list ordering where the application order is not semantically meaningful. Do not lowercase, trim meaningful whitespace, rewrite punctuation or otherwise normalize away real content changes.

Compute SHA-256 over the canonical serialized snapshot and store the hash with the snapshot.

## Diff classes
A normalized diff should classify at least:
- topic added / deleted;
- topic moved (parent or sibling order changed);
- title changed;
- note changed;
- label/marker changed;
- relationship added / removed / retargeted / relabeled;
- sheet added / removed / renamed / reordered;
- observable rich-content/hyperlink/image flag changed;
- count/invariant changed;
- `UI-UNVERIFIED` for style/todo/UI-only fields the connector cannot actually read.

Stable IDs are the first identity key. If the connector omits an ID for an object, use the strongest available structural fingerprint and mark the match as lower confidence rather than pretending identity is exact.

## Read-only observation cycle
For a full audit or whenever “what changed?” matters:
1. read the live scope completely;
2. build the normalized snapshot;
3. load the latest complete same-scope snapshot;
4. diff old -> new;
5. report changes and any unobservable fields;
6. save the new snapshot/hash as append-only evidence.

If the live read fails or is incomplete, do not advance that scope's baseline.

## Authorized mutation cycle
XMind remains read-only unless Ron separately authorizes the exact mutation.

For any authorized structural/content write:
1. full affected-scope live read;
2. save **pre-write** snapshot/hash;
3. execute the smallest authorized write;
4. full affected-scope live reread;
5. diff pre -> post;
6. compare **expected delta vs actual delta**;
7. save post-write snapshot/hash;
8. claim success only if intended changes occurred and no unintended observable changes appeared.

For full-sheet replacement (`edit_mindmap`-class operations), whole affected sheet snapshot/backup before the write is mandatory because the transport can replace the sheet rather than patch one node.

## Historical gap
The 2026-08-29 full audit read all 717 topics but Ron OS retained only the audit/report, not a lossless normalized 717-topic snapshot. Therefore that audit is a **coarse historical baseline**, not sufficient to prove exact per-node change/no-change later. The first future complete live snapshot becomes the first exact machine-comparable baseline unless an older raw live-read payload is recovered and verified.
