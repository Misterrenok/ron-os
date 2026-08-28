# Ron OS — bootstrap

This repository is the canonical file store for Ron OS continuity/current-state.

## When to use Ron OS
Use Ron OS only when the request materially depends on Ron's current personal/project/app state, prior decisions, or continuation of past work.
For self-contained/general questions, answer directly without loading Ron OS.

A native ChatGPT memory entry may serve only as a durable pointer telling a future chat to start here. That memory entry must not carry mutable Ron OS state.

## Runtime route
1. Read `CURRENT.md` from the default branch.
2. If the work is nontrivial and requires decision, design, diagnosis, planning, optimization, self-correction, migration/hygiene, or other reasoning where method/representation/omitted context could materially change the result, read `PROTOCOL.md` and use its **Adaptive Metareasoning Governor**. Tiny/current-state fact lookups may skip this step.
3. Read `references/domain-routing.md`, select the smallest complete union of primary/supporting domain packages, then **read every selected package's exact repo-local `skills/*.md` file before its owner(s)**. Skill paths are runtime requirements, not descriptive labels; never silently skip this layer.
4. Follow the selected exact owner path(s) named by the router/current state. If a claim is mutable and a live app/source owns it, read the live owner before asserting current state.
5. Treat saved memory content beyond the bootstrap pointer, old chats, ChatGPT Library files, exports, and archive material as leads/evidence only; they cannot override the current owner.
6. If a required skill, owner or live owner cannot be read, return `ROUTING GAP` or `UNVERIFIED/UNKNOWN` as appropriate rather than guessing or bypassing the missing layer.
7. If Ron says a previously supplied continuity-relevant fact is missing, or a current owner unexpectedly lacks a domain that older evidence shows mattered, treat that as a **continuity defect**: recover the strongest available historical evidence, reconcile it against newer evidence, repair the proper owner, and read back rather than asking Ron to repeat recoverable information.

## Core execution rules
- Plan/prefill/projection != real-world execution. Ron's explicit execution report owns execution facts unless a stronger live execution record exists.
- For writes: identify the owner -> write there -> read back -> update `CURRENT.md` only if cross-domain continuation materially changed.
- Do not create duplicate current-state owners or mirrors.
- **Migration/hygiene/compaction must be lossless for continuity, not merely internally clean.** Before deleting, compacting, retiring, deduplicating, or making a legacy continuity surface non-authoritative, read `references/continuity-contract.md` and disposition every materially useful fact/state edge to OWNER, LIVE_OWNER, SUPERSEDED, ARCHIVE_EVIDENCE, SENSITIVE_EXCLUDED, or justified IRRELEVANT.
- **No orphan state:** a mutable fact that is too dated for a current assertion but still potentially decision-relevant and has no live owner must be preserved as a clearly dated fallback in a proper domain owner; `too stale -> silently drop` is forbidden.
- `references/continuity-owner-registry.tsv` is the explicit set of current domain/project owners. Creating or retiring an owner must update that registry deliberately; the regression guard rejects unregistered new owners and registered owners that disappear.
- Semantic distillation must preserve exact triggers/counts/units/provenance unless newer evidence explicitly changes them.
- After architecture/migration/hygiene changes, run `python tests/continuity_coverage_guard.py` when an executable repo environment is available; GitHub CI also runs the same guard. Fix failures before treating the migration as PASS.
- Keep internal implementation details out of user-visible replies unless Ron asks or they are needed to explain a blocker.

## Supporting files
- `PROTOCOL.md` — adaptive metareasoning governor plus continuity/write/failure/self-correction rules for nontrivial work.
- `PERSON.md` — durable facts/preferences only.
- `skills/*.md` — repo-local procedural domain skills; selected skill files must be loaded before their owners.
- `domains/finance.md` — dated finance fallback; mutable amounts must be refreshed before consequential decisions.
- `domains/health.md` — general health/sleep/medical fallback; live measurements and clinical evidence own current facts.
- `domains/learning.md` — learning/language-system fallback; live execution/tasks and official requirements own mutable facts.
- `domains/nutrition.md` — nutrition current-state owner/fallback.
- `domains/training.md` — training last-confirmed fallback; live Liftosaur owns exact mutable state.
- `domains/ecommerce.md` — marketplace-working constraints + small current content residue; live platforms own orders/stock/price/listing state.
- `domains/mobility.md` — last-confirmed Türkiye residence conflict + Germany/Ausbildung strategy fallback; official/live sources own current legal/status facts.
- `projects/trendyol-print-automation.md` — last-confirmed fallback for the active Tampermonkey print/order automation project; live installed script is exact mutable owner when inspectable.
- `references/integrations.md` — stable live-owner/derived-surface contracts and verified connector quirks; never a mutable-state owner.
- `references/domain-routing.md` — canonical mapping from life/project domains to repo-local skills, current owners and live owners; controls multi-domain composition.
- `references/continuity-contract.md` — lossless migration/coverage contract; prevents orphaned domains/facts and semantic drift during compaction.
- `references/continuity-owner-registry.tsv` — explicit registry of current domain/project owners; prevents silent owner disappearance.
- `schemas/ron_os_db.sql` — schema artifact only; live Neon owns actual DB records and remains derived relative to upstream domain/live owners.
- `tests/continuity_coverage_guard.py` — executable structural + real-regression guard for owner registry/routing and previously observed continuity failures.
