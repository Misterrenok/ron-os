# Ron OS — bootstrap

This repository is the canonical file store for Ron OS continuity/current-state.

## When to use Ron OS
Use Ron OS only when the request materially depends on Ron's current personal/project/app state, prior decisions, or continuation of past work.
For self-contained/general questions, answer directly without loading Ron OS.

A native ChatGPT memory entry may serve only as a durable pointer telling a future chat to start here. That memory entry must not carry mutable Ron OS state.

## Runtime route
1. Read `CURRENT.md` from the default branch.
2. Follow the exact owner path named there for the relevant domain.
3. If the fact is mutable and a live app/source owns it, read the live owner before asserting current state.
4. Treat saved memory content beyond the bootstrap pointer, old chats, ChatGPT Library files, exports, and archive material as leads/evidence only; they cannot override the current owner.
5. If the required owner cannot be read, return `UNVERIFIED/UNKNOWN` rather than guessing from stale context.

## Core execution rules
- Plan/prefill/projection != real-world execution. Ron's explicit execution report owns execution facts unless a stronger live execution record exists.
- For writes: identify the owner -> write there -> read back -> update `CURRENT.md` only if cross-domain continuation materially changed.
- Do not create duplicate current-state owners or mirrors.
- Keep internal implementation details out of user-visible replies unless Ron asks or they are needed to explain a blocker.

## Supporting files
- `PROTOCOL.md` — compact continuity/write/failure rules.
- `PERSON.md` — durable facts/preferences only.
- `domains/nutrition.md` — nutrition current-state owner/fallback.
- `domains/training.md` — training last-confirmed fallback; live Liftosaur owns exact mutable state.
- `schemas/ron_os_db.sql` — schema artifact only; live Neon owns actual DB state.
