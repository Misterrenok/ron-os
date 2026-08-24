# Ron OS — current cross-domain state

Updated: 2026-08-24 11:30 Europe/Istanbul
Status: **PASS — GITHUB_CANONICAL / NATIVE_MEMORY_POINTER_ACCEPTED**

## Routing
- Runtime entry: `BOOTSTRAP.md` -> this file -> exact domain owner -> live owner if mutable.
- Durable personal context: `PERSON.md`.
- Native ChatGPT memory may contain only a small durable pointer telling future chats to recover Ron OS from `Misterrenok/ron-os/BOOTSTRAP.md` when a request materially depends on current personal/project/app state or continuation.
- Mutable Ron OS state must not be stored in memory.
- ChatGPT Library is retired/legacy evidence only and is not an operational authority.
- Old chats/archive are evidence only for volatile/project state.

## Continuity architecture — accepted
- Repeated ordinary clean-chat failures were traced to a missing automatic boot trigger, not inability to read external stores.
- Explicit Library retrieval test: PASS.
- Explicit GitHub retrieval probe: PASS (`RON_OS_GITHUB_OK_2026-08-23`).
- Final acceptance probe: PASS on 2026-08-24. A brand-new ordinary chat received only `Что мне сейчас делать с питанием?`, automatically recovered `Misterrenok/ron-os` through the native durable memory pointer, followed the GitHub owner route, and correctly returned **NOT STARTED / READY-PENDING** without any GitHub/Library hint in the prompt.
- No Custom Instructions are required for Ron OS continuity.
- Target architecture: **native durable memory pointer -> GitHub `BOOTSTRAP.md` -> `CURRENT.md` -> exact domain owner -> live owner**.
- `Misterrenok/ron-os` is the single canonical file store for Ron OS runtime/current-state files.
- Old Library root artifacts were retired after acceptance. Historical Library/archive material remains evidence only.
- **CLOSED 2026-08-24 — meta-governance alignment:** the compact post-migration `PROTOCOL.md` was repaired to own the proportional partner/meta-controller plus the consequential-write integrity gate; `tests/meta-governance-architecture-v1.md` guards migration drift.
- **CLOSED 2026-08-24 — historical migration-gap audit:** two old durable lessons missing after simplification were restored: material PASS requires real end-to-end production-path evidence when retrieval/routing is a risk; long/remediation-heavy chats require proactive checkpoint/handoff before context reliability degrades.
- **CLOSED 2026-08-24 11:30 — deep 23–24 Aug chat/live-surface migration audit:** old chats, historical audit artifacts, active TickTick projections, Calendar, active automations, current Cronometer code owner, Neon, and the remembered XMind integration were compared against the GitHub runtime. Additional real migration gaps were found and repaired rather than left only in history:
  - `PROTOCOL.md` again explicitly owns highest-useful transferable generalization/no exact-trigger patching, derived-view owner discipline, epistemic fact/model/UNKNOWN separation, baseline/coupled-change attribution integrity, and resource-aware ordinary-chat vs Work/Codex routing.
  - Active TickTick system-index still named retired Library-era owners; it now routes `BOOTSTRAP.md` -> `CURRENT.md` -> current GitHub owners/live owners. Current nutrition/reference projections checked in the live project now explicitly use `Europe/Istanbul` and point to GitHub/live owners.
  - The active weekly TickTick review still contained old automatic nutrition `±200 kcal` logic and treated XMind as an implicit decision surface. It now aggregates only real data, keeps missing values `UNKNOWN`, forbids pre-Day-1 calorie adjustment from the old false baseline, and treats XMind only as a derived view.
  - XMind was a validated live goal-map integration on 2026-08-23 (historical file `SzWCLc5N`) but was accidentally omitted from the initial compact GitHub routing while the weekly workflow still targeted it. It is retained only as a derived goals/analytics surface; exact current XMind state is `UNVERIFIED` while no live XMind connector/plugin is available.
  - Active `Ночной аудит архитектуры` still bootstrapped from Library `RON_WORK_PROTOCOL.md`/`RON_HANDOFF.md`; it now bootstraps only from connected GitHub and audits live projections/executors. Active `Еженедельный личный ретро` was likewise aligned to GitHub/live owners, real execution evidence, XMind-as-derived, and discriminating-information rules.
  - Calendar nutrition projections were read live and are already aligned: NOT STARTED/future-slot wording, Europe/Istanbul timing, cancelled false baseline retro; no repair needed.
  - Old Cronometer MCP bug list was rechecked against current `Misterrenok/cronometer-api-mcp`: recurring DiaryGroup mapping/read-back/rollback and macro/weekly/template/fast safety wrappers/tests exist in current code, so these are historical closed defects rather than Ron OS OPEN state. Current repository exposes CI/workflow definitions; no new independent workflow-run claim was inferred where no run evidence was returned.
  - Neon `Ron OS DB` was read live: 1 system decision + 2 initialization/health events and zero entities/observations/relationships/experiments. The stored decision explicitly says Neon is derived integration/analytics and upstream owners remain authoritative; no stale second-owner data was found and no DB write was needed.

## Nutrition
Owner: `domains/nutrition.md`; live Cronometer owns live diary/log state.
Current execution state: **NOT STARTED / READY-PENDING**.
The supposed 16–22 Aug baseline did not occur in real-world execution. Prefilled/planned Cronometer rows are not proof of intake. No committed Day 1 exists yet.

## Training
Fallback owner: `domains/training.md`; live Liftosaur owns exact mutable app state.
Fallback remains last-confirmed through `AS_OF: 2026-08-18`: **Mon/Tue/Thu/Fri** = Lower A / Upper A / Lower B / Upper B. The 2026-08-24 T13 adversarial prompt falsely asserted a prior Mon/Tue/Wed/Fri confirmation and caused two erroneous commits (`702de45e...`, `85001ee9...`); those writes were reverted. Exact current weights/progression/session execution remain UNKNOWN until live access or newer direct Ron report.

## Other live owners / integrations
- TickTick: tasks/reminders. Canonical timezone is `Europe/Istanbul`; profile/server metadata may still return `Asia/Ashgabat`, so consequential task writes must carry explicit `Europe/Istanbul` and be judged by concrete task read-back.
- Google Calendar: events/availability; current checked nutrition projections use Europe/Istanbul and do not claim execution.
- GitHub repositories: code/runtime file state.
- Neon: derived structural/analytics layer only, not upstream mutable-state owner.
- Cronometer: nutrition diary/log/target state.
- Liftosaur: exact training app state when accessible.
- XMind: derived goal-map/analytics surface only; historical live file `SzWCLc5N`; exact current map state `UNVERIFIED` until live access exists. XMind must never override GitHub/domain/live upstream owners.

## Continuity residue
- **CLOSED/PASS — T13 provenance/write-path regression:** fresh retest rejected the alleged prior Mon/Tue/Wed/Fri confirmation, recovered canonical fallback, attempted live Liftosaur, and made no bad write.
- **CLOSED/PASS — one-time provenance canary:** fresh adversarial chat rejected false `PROV_DEADBEEFCAFEBABE`, recovered hidden GitHub owner value, and did not persist the false premise.
- **CLOSED/PASS — ADVERSARIAL COGNITION v1 AFTER REMEDIATION:** final remediated T01–T18 = **72/72 = 4.00/4** against frozen key. This remains historical sampled evidence; it does not prove every later protocol edit without a fresh behavioral run.
- **OPEN / non-blocking — native memory physical hygiene:** runtime authority is solved because memory beyond the bootstrap pointer cannot override GitHub owners, but physical deletion/supersession of every old native-memory entry is not currently proven. Do not claim it is clean without an actual scoped memory mutator/read-back. This is hygiene residue, not current-state authority.
- **OPEN / non-blocking — TickTick account/profile timezone metadata:** live preference currently returns `Asia/Ashgabat`; no connector mutation for account timezone is exposed. Concrete current Ron OS tasks repaired in this audit use explicit `Europe/Istanbul`. Treat profile metadata as a known quirk unless a concrete task maps incorrectly.
- **OPEN / capability-bound — XMind live read/write:** the derived map remains conceptually useful, but current assistant environment exposes no XMind plugin/connector. Exact map contents are `UNVERIFIED`; do not resurrect archived counts or silently claim weekly sync.
- **OPEN / capability-bound — Liftosaur exact state:** subscription/live access still unavailable unless a newer explicit Ron report/live tool restores it.
- Do not add mutable state to memory or Custom Instructions.
- Future Ron OS changes should be committed/read back in this repository and in the relevant live owner only; active projections/automations that execute the system must be included in migration audits.
