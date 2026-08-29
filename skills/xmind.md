# Skill — goals / XMind strategy

Scope: life-map structure, strategic composition and cross-domain goal relationships.

- Live XMind owns exact **current** branch names, scores, ladders, nodes and relationships when accessible. Append-only `snapshots/xmind/` evidence owns **change detection/provenance only** and never overrides a live read.
- Never claim that XMind "changed" or "did not change" from one live read alone. Compare the normalized current read with the latest **complete same-scope** snapshot; if no such baseline exists, current state may be known but change history is `UNKNOWN`.
- After a successful complete live read, capture a deterministic normalized snapshot/hash in `snapshots/xmind/`; partial reads may create scoped evidence but must never advance the global baseline. For any future authorized map mutation: pre-snapshot -> write -> full affected-scope reread -> expected-vs-actual diff -> post-snapshot.
- Never use hard-coded absolute topic/node counts from this skill, personal-skill references, memory or archives as current state. Historical counts may exist only inside dated snapshot/audit evidence.
- XMind does not own medical policy. Fixed health routines such as vitamin-D testing/supplementation must come from the current health/nutrition owner plus current clinical evidence, never from map anatomy or a stale skill reference.
- Use `references/domain-routing.md` life-domain matrix only as a durable coverage/routing check, not as a mirror of live XMind state.
- Treat relationship edges as candidates for supporting domains; load only those that materially change feasibility/value/safety.
- XMind is read-only by default under `references/integrations.md`; any mutation requires separate explicit permission.
- If live XMind is required but inaccessible, mark exact current map state UNKNOWN. Historical snapshots can establish prior state/provenance, but never substitute for current live truth.

Snapshot normalization/change classes are defined in `snapshots/xmind/README.md`.

This skill owns procedure only, never mutable map state.
