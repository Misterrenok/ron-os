# Ron OS — bootstrap

This repository is the canonical file store for Ron OS continuity/current-state.

## When to use Ron OS
Use Ron OS only when the request materially depends on Ron's current personal/project/app state, prior decisions, or continuation of past work.
For self-contained/general questions, skip current-state/owner orchestration. If the task itself is a nontrivial or consequential decision/optimization, direct mode still uses the lean reasoning layer (`PROTOCOL.md` and, when triggered, `skills/total-value-optimizer.md`) without loading owners/live state unless they are actually needed.

A native ChatGPT memory entry may serve only as a durable pointer telling a future chat to start here. That memory entry must not carry mutable Ron OS state.

## Canonical access and recovery
- Primary repository read path is the connected GitHub route to `Misterrenok/ron-os` on current `main`.
- If that connected GitHub read path fails or is unavailable, and the repository is currently public/reachable, read the exact same `main` path through raw/public GitHub. This is a transport fallback to the same canonical files, not a second owner, and it must not add routine dual-reading when the primary path works.
- If neither connected GitHub nor raw/public GitHub can read the canonical repository, the newest dated Ron OS recovery snapshot may be used only as `FALLBACK/ARCHIVE_EVIDENCE`. Treat mutable/current claims as `UNVERIFIED` until their canonical/live owner is available; never promote architecture or perform a canonical write from snapshot evidence alone.

## Runtime route
1. Start here and determine the smallest mode that can answer the request. For a self-contained/general request whose material facts are already explicit, use **direct mode**: do not load `CURRENT.md`, domain owners, or live sources merely because the task is personal. If the direct task is nontrivial/consequential reasoning, still load `PROTOCOL.md`; if it is materially multidimensional optimization/choice, also load `skills/total-value-optimizer.md`. Tiny/obvious/reversible direct tasks need neither.
2. For current-state, prior-decision, or continuation work, read `references/domain-routing.md`, select the smallest complete union of primary/supporting domain packages, then **read every selected package's exact repo-local `skills/*.md` file before its owner(s)**. Skill paths are runtime requirements, not descriptive labels; never silently skip this layer.
3. Read `CURRENT.md` only when the request materially depends on a cross-domain/global continuation checkpoint, unresolved system-wide maintenance/architecture state, or a checkpoint not discoverable from the selected exact owner(s). `CURRENT.md` is an index/checkpoint surface, not a mandatory pre-read for ordinary domain recovery.
4. If the work is nontrivial and requires decision, design, diagnosis, planning, optimization, self-correction, migration/hygiene, or other reasoning where method/representation/omitted context could materially change the result, read `PROTOCOL.md` and use its **Adaptive Metareasoning Governor**. Tiny/current-state fact lookups may skip this step.
5. Read `system/lifeup/STRATEGIC_LIFE_TRAJECTORY_PLAN_V1.md` when the request materially requires choosing among life trajectories, allocating scarce resources across strategic directions, an open-ended System Pulse, or selecting/replacing execution focus/quest across materially different directions. Do **not** load it merely for ordinary System status/profile/XP/current-quest lookup, a self-contained task, or a decision whose material strategic context is already fixed.
6. Follow the selected exact owner path(s) named by the router/current state. If a claim is mutable and a live app/source owns it, read the live owner before asserting current state.
7. Treat saved memory content beyond the bootstrap pointer, old chats, ChatGPT Library files, exports, and archive material as leads/evidence only; they cannot override the current owner.
8. If a required skill, owner or live owner cannot be read, return `ROUTING GAP` or `UNVERIFIED/UNKNOWN` as appropriate rather than guessing or bypassing the missing layer.
9. If Ron says a previously supplied continuity-relevant fact is missing, or a current owner unexpectedly lacks a domain that older evidence shows mattered, treat that as a **continuity defect**: recover the strongest available historical evidence, reconcile it against newer evidence, repair the proper owner, and read back rather than asking Ron to repeat recoverable information.
10. For Ron System endpoint/navigation questions, use the canonical public System Core locator declared below in Supporting files; do not rediscover or infer a different URL from memory unless a later verified runtime change explicitly supersedes it.

## Meta-objective mode
When Ron explicitly delegates an open-ended top-level life objective, treat the latest explicit objective as a working objective and evidence of current preference, not automatically as terminal ground truth; for consequential life-shaping optimization, apply `skills/total-value-optimizer.md` preference epistemics before locking it.
Ron OS supplies context, provenance, and routing to authoritative current sources; it is not itself necessarily the strongest source for every mutable fact. Ordinary procedural decomposition must not constrain the agent's framing, search space, method or solution.
Legacy `ron-continuity` and other non-authoritative continuity surfaces must not govern framing, method, or current state in meta-objective mode.
If an important choice turns on uncertain personal values or preferences, first use existing evidence and proportionate reversible preference discovery; ask Ron only for material first-person evidence that cannot be recovered otherwise. Existing action permissions remain unchanged.

## Core execution rules
- Plan/prefill/projection != real-world execution. Ron's explicit execution report owns execution facts unless a stronger live execution record exists.
- For writes: identify the owner -> write there -> read back -> update `CURRENT.md` only if cross-domain continuation materially changed.
- When Ron OS is already loaded for the request, resolve materially relevant residue exposed by the selected exact owners. If `CURRENT.md` is loaded, also resolve materially relevant residue it exposes: execute only safe authorized assistant-owned fixes with verification; otherwise surface the exact proposed delta/blocker. Never load Ron OS solely to hunt maintenance on an unrelated self-contained request. Never load `CURRENT.md` solely to hunt maintenance when selected exact owners suffice.
- Do not create duplicate current-state owners or mirrors.
- **Architecture changes** that alter authority, routing, owners, snapshot/provenance/rollback, write gates or executor semantics must use `references/architecture-change-contract.md`: candidate branch -> preservation manifest -> adversarial probes -> old+new behavior tests -> base/head review -> verified promotion.
- **Migration/hygiene/compaction must be lossless for continuity, not merely internally clean.** Before deleting, compacting, retiring, deduplicating, or making a legacy continuity surface non-authoritative, read `references/continuity-contract.md` and disposition every materially useful fact/state edge to OWNER, LIVE_OWNER, SUPERSEDED, ARCHIVE_EVIDENCE, SENSITIVE_EXCLUDED, or justified IRRELEVANT.
- **No orphan state:** a mutable fact that is too dated for a current assertion but still potentially decision-relevant and has no live owner must be preserved as a clearly dated fallback in a proper domain owner; `too stale -> silently drop` is forbidden.
- `references/continuity-owner-registry.tsv` is the explicit set of current domain/project owners. Creating or retiring an owner must update that registry deliberately; the regression guard rejects unregistered new owners and registered owners that disappear.
- Semantic distillation must preserve exact triggers/counts/units/provenance unless newer evidence explicitly changes them.
- After architecture/migration/hygiene changes, run the relevant architecture/continuity guards when an executable repo environment is available; GitHub CI also runs them. Fix failures before treating the change as PASS.
- Keep internal implementation details out of user-visible replies unless Ron asks or they are needed to explain a blocker.

## Supporting files
- `CURRENT.md` — cross-domain/global continuation index and material system-wide checkpoint surface; not a mandatory pre-read for ordinary domain recovery.
- `PROTOCOL.md` — adaptive metareasoning governor plus continuity/write/failure/self-correction rules for nontrivial work.
- `PERSON.md` — durable facts/preferences only.
- `skills/*.md` — repo-local procedural domain skills; selected skill files must be loaded before their owners.
- `domains/finance.md` — dated finance fallback; mutable amounts must be refreshed before consequential decisions.
- `domains/health.md` — general health/sleep/medical fallback; live measurements and clinical evidence own current facts.
- `domains/learning.md` — learning/language-system fallback; live execution/tasks and official requirements own mutable facts.
- `domains/skill-capital.md` — current skill-capital portfolio owner; concrete study/application evidence remains with learning/work/live sources.
- `domains/social-capital.md` — professional/opportunity network-strategy owner; ordinary relationships and live contact/message details remain with their real owners.
- `domains/nutrition.md` — nutrition current-state owner/fallback.
- `domains/training.md` — training last-confirmed fallback; live Liftosaur owns exact mutable state.
- `domains/ecommerce.md` — marketplace-working constraints + small current content residue; live platforms own orders/stock/price/listing state.
- `domains/mobility.md` — last-confirmed Türkiye residence conflict + Germany/Ausbildung strategy fallback; official/live sources own current legal/status facts.
- `projects/lifeup-system.md` — current cloud-first Ron System project owner; ChatGPT is the intended controller, Neon owns derived RPG state, LifeUp is retired/rollback-only. **Canonical public System Core locator:** `https://p01--system-core--yh2fvbyd9vfg.code.run/`. Treat this endpoint as stable continuity data unless a later verified runtime change supersedes it.
- `projects/trendyol-print-automation.md` — last-confirmed fallback for the active Tampermonkey print/order automation project; live installed script is exact mutable owner when inspectable.
- `references/integrations.md` — stable live-owner/derived-surface contracts and verified connector quirks; never a mutable-state owner.
- `references/domain-routing.md` — canonical mapping from life/project domains to repo-local skills, current owners and live owners; controls multi-domain composition.
- `references/architecture-change-contract.md` — candidate-branch preservation/contra-test/promotion contract for architecture changes that can remove capabilities.
- `references/continuity-contract.md` — lossless migration/coverage contract; prevents orphaned domains/facts and semantic drift during compaction.
- `references/continuity-owner-registry.tsv` — explicit registry of current domain/project owners; prevents silent owner disappearance.
- `system/lifeup/STRATEGIC_LIFE_TRAJECTORY_PLAN_V1.md` — frozen approved strategic-life decision baseline; load only under the conditional strategic route above.
- `schemas/ron_os_db.sql` — schema artifact only; live Neon owns actual DB records and remains derived relative to upstream domain/live owners.
- `tests/architecture_change_guard.py` — executable validator for Architecture Mode preservation manifests.
- `tests/continuity_coverage_guard.py` — executable structural + real-regression guard for owner registry/routing and previously observed continuity failures.
- `tests/capital_system_guard.py` — executable regression guard for Skill Capital/Social Capital registration, scope boundaries and legacy-route preservation.
