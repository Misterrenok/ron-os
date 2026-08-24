# Ron OS — bootstrap

This repository is the canonical file store for Ron OS continuity/current-state.

## When to use Ron OS
Use Ron OS only when the request materially depends on Ron's current personal/project/app state, prior decisions, or continuation of past work.
For self-contained/general questions, answer directly without loading Ron OS.

A native ChatGPT memory entry may serve only as a durable pointer telling a future chat to start here. That memory entry must not carry mutable Ron OS state.

## Runtime route
1. Read `CURRENT.md` from the default branch.
2. Follow the exact owner path named there for the relevant domain/project.
3. If the fact is mutable and a live app/source owns it, read the live owner before asserting current state.
4. Treat saved memory content beyond the bootstrap pointer, old chats, ChatGPT Library files, exports, and archive material as leads/evidence only; they cannot override the current owner.
5. If the required owner cannot be read, return `UNVERIFIED/UNKNOWN` rather than guessing from stale context.

## Core execution rules
- Plan/prefill/projection != real-world execution. Ron's explicit execution report owns execution facts unless a stronger live execution record exists.
- For writes: identify the owner -> write there -> read back -> update `CURRENT.md` only if cross-domain continuation materially changed.
- Do not create duplicate current-state owners or mirrors.
- Migration/hygiene is not deletion: before removing continuity-relevant mutable/project state from a legacy surface, move it to a proper owner or explicitly retire it. Do not delete the only recoverable current project residue.
- Keep internal implementation details out of user-visible replies unless Ron asks or they are needed to explain a blocker.

## Supporting files
- `PROTOCOL.md` — compact continuity/write/failure rules plus proportional partner/meta-governance for nontrivial decisions and self-improvement.
- `PERSON.md` — durable facts/preferences only.
- `domains/nutrition.md` — nutrition current-state owner/fallback.
- `domains/training.md` — training last-confirmed fallback; live Liftosaur owns exact mutable state.
- `domains/ecommerce.md` — marketplace-working constraints + small current content residue; live platforms own orders/stock/price/listing state.
- `domains/mobility.md` — last-confirmed Türkiye residence conflict + Germany/Ausbildung strategy fallback; official/live sources own current legal/status facts.
- `projects/trendyol-print-automation.md` — last-confirmed fallback for the active Tampermonkey print/order automation project; live installed script is exact mutable owner when inspectable.
- `references/integrations.md` — stable live-owner/derived-surface contracts and verified connector quirks; never a mutable-state owner.
- `schemas/ron_os_db.sql` — schema artifact only; live Neon owns actual DB records and remains derived relative to upstream domain/live owners.
