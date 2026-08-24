# Deep migration audit — 2026-08-24

Status: **HISTORICAL / NON-AUTHORITATIVE FOR MUTABLE STATE**  
Audit window: old chats/artifacts from 2026-08-23 through 2026-08-24 plus live surfaces they referenced.  
Runtime truth remains: `BOOTSTRAP.md` -> `CURRENT.md` -> exact domain/live owner.

## Why this audit existed

After the Library/skill architecture was simplified into the GitHub-canonical Ron OS, Ron correctly suspected that semantic/process knowledge and live executors could have survived outside the new repository even if the GitHub files themselves looked clean. The audit therefore inspected not only repo files but also historical audit artifacts, live TickTick/Calendar, scheduled automations, current Cronometer code, live Neon, and the historical XMind integration.

## Migration gaps actually found

1. **Meta-governance semantics were partially lost during compaction.** The compact `PROTOCOL.md` initially lacked several durable rules present in the old working system: highest-useful transferable generalization rather than exact-trigger patching; explicit derived-view ownership/propagation; epistemic fact/model/UNKNOWN separation; baseline/coupled-change attribution integrity; and resource-aware ordinary-chat vs Work/Codex routing. These were restored compactly in the single GitHub process owner rather than reviving the old large protocol.

2. **Static correctness had previously been mistaken for production correctness.** The old system repeatedly passed package/file/self-tests while fresh-chat owner loading still failed. `PROTOCOL.md` now explicitly requires real end-to-end production-path evidence before a material PASS when retrieval/routing/tool loading is the risk.

3. **Session bloat was an uncarried reliability lesson.** A long remediation-heavy chat had become a source of context error before the assistant reacted. The new protocol now requires proactive owner checkpoint + clean handoff when the session itself becomes a material reliability risk.

4. **Live TickTick projections survived with Library-era routing.** The active system index still named `RON_WORK_PROTOCOL`, `RON_NUTRITION_CANON`, and `RON_TRAINING_CANON`; active nutrition projections also had timezone/routing residue. The live cards were rewritten to route through GitHub and exact/live owners. All active tasks in the checked nutrition project now read back with `Europe/Istanbul`.

5. **The weekly TickTick review carried obsolete experimental logic.** It could still apply the old weight-trend `±200 kcal` logic even though the supposed 16–22 Aug nutrition baseline never occurred. It was rewritten to use only real measurements, keep missing data `UNKNOWN`, avoid pre-Day-1 nutrition adjustment, and avoid attributing outcomes after coupled changes.

6. **XMind was dropped too aggressively.** In the validated 23 Aug architecture, live XMind file `SzWCLc5N` was the owner of the exact goal-map artifact. The compact GitHub migration omitted it entirely while the weekly workflow still targeted the map. Corrected contract: XMind owns the exact map artifact when live-accessible; facts/policies copied into the map are downstream projections and cannot override their upstream owners. No live XMind connector/plugin is available in the current environment, so exact current map contents are `UNVERIFIED` rather than reconstructed from historical counts.

7. **Active scheduled executors still bootstrapped the retired architecture.** `Ночной аудит архитектуры` still explicitly started from Library `RON_WORK_PROTOCOL.md`/`RON_HANDOFF.md`. It was rewritten to bootstrap from connected GitHub only and to audit live external projections/executors. `Еженедельный личный ретро` was likewise aligned to GitHub/live owners, real execution evidence, XMind ownership boundaries, and discriminating-information rules. Disabled old duplicate audits remain disabled.

8. **TickTick connector quirks had lost their home.** Stable connector facts such as Ron's canonical `Europe/Istanbul` versus server/profile `Asia/Ashgabat`, pre-read/read-back requirements, concurrent-write risk, and checklist-item replacement behavior did not belong in `PERSON`, `CURRENT`, or a domain owner. They now live in `references/integrations.md` with other integration contracts.

9. **A stale one-off TickTick card contained health-policy-like assertions as if authoritative.** Its useful action was retained (read the product label), while stale explanatory claims were removed; interpretation now routes to current owner/current sources.

10. **Durable personal trade-off priorities were lost in `PERSON.md` compaction.** A compact preference was restored: financial/long-term efficiency and health/nutrition quality rank highly, while taste/convenience/practical executability remain real constraints because a theoretically optimal system that is not followed is not successful.

## Deep checks that did NOT reveal an open migration defect

### Calendar
Live nutrition-related events were already consistent with `NOT STARTED`: future-slot wording, cancelled false baseline retro, and `Europe/Istanbul`. No Calendar write was required.

### Cronometer MCP code
Historical safety defects were rechecked against current `Misterrenok/cronometer-api-mcp`. Current code contains recurring DiaryGroup correction with read-back/rollback plus safety wrappers/tests for macro partial updates, weekly macro scheduling, macro-template deletion, and fasting cancellation/deletion. These should remain historical closed defects, not Ron OS OPEN items. Current repository exposes workflow definitions; no fresh independent workflow-run claim was made where run evidence was not returned.

### Neon
Live project `Ron OS DB` contained one governing system decision and two initialization/health events; the other Ron structural tables were empty. The governing decision explicitly says Neon is a derived integration/analytics layer and upstream live/domain owners remain authoritative. No stale second-owner data was found and no database mutation was needed.

### 2026-08-27 medical-day residue
Historical handoff evidence called this conditional/open. Live TickTick now shows the medical day and leave task as cancelled, so the old OPEN status is superseded and must not be migrated into `CURRENT.md`.

### Finance / Germany / work / e-commerce current-state owner
The 23–24 Aug material reviewed did not provide a sufficiently current mutable snapshot requiring a new GitHub domain owner. Durable background remains in `PERSON.md`; future current-state claims in these areas should use a relevant live owner/current user report or gain a domain owner only when real recurring continuity requires it.

## Blind/meta test evidence preserved

The paired behavioral benchmark discussed across the 23–24 Aug remediation used identical prompts in Temporary/baseline and personalized/Normal conditions. Recorded aggregate result: personalized **3.375/4** versus Temporary **2.75/4**, delta **+0.625**. It supported better frame-challenge/system-value behavior but also exposed overcorrection on a real-investment case and residual gaps around discriminating measurements, common-mode risk, rollback/exit cost, lifecycle burden, and implementation drift. This evidence motivated protocol changes but is not proof of universal superiority; sampled tests remain sampled tests.

The later frozen `tests/adversarial-cognition-v1` suite is separate historical evidence and must not be rewritten post hoc to validate new protocol wording.

## Residue after this audit

- Native-memory **physical hygiene** is not proven. Runtime authority is safe because memory cannot override GitHub owners, but every old saved-memory entry has not been independently enumerated/deleted/read back in the current tool context.
- TickTick profile/server preference still returns `Asia/Ashgabat`; no account-timezone mutation is exposed. Concrete Ron OS tasks use and were checked against `Europe/Istanbul`; treat the profile value as a connector quirk unless a concrete task is wrong.
- XMind exact current map state is capability-bound `UNVERIFIED` until live XMind access returns.
- Liftosaur exact mutable state remains capability-bound until live access or a newer explicit Ron report.
- Nutrition remains a domain execution/readiness issue, not a migration issue: no real Day 1 yet.

## Architectural lesson

A migration is not complete when the new canonical files are correct. It is complete only when **rules, durable preferences, live executors, projections, scheduled jobs, integration contracts, regression evidence, and the actual runtime retrieval path** no longer depend on the retired architecture. Future redesigns must audit those outgoing edges, not only the storage graph.
