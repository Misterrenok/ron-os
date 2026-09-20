# Ron OS — current cross-domain state

Updated: 2026-09-20 Europe/Istanbul
Status: **PASS — GITHUB_CANONICAL / CURRENT OWNERS ROUTED**

## Runtime routing
- Entry: `BOOTSTRAP.md` -> `references/domain-routing.md` -> selected thin domain skills + exact owners -> live owners if mutable. Load this file only when the request materially depends on a cross-domain/global continuation checkpoint, unresolved system-wide maintenance/architecture state, or a checkpoint not discoverable from the selected exact owner(s).
- For nontrivial decisions/design/diagnosis/planning/optimization/self-correction, use `PROTOCOL.md`.
- For migration/hygiene/compaction/dedup or any continuity-loss incident, use `references/continuity-contract.md`; `references/continuity-owner-registry.tsv` is the explicit domain/project-owner registry; `tests/continuity_coverage_guard.py` is the executable regression backstop and GitHub CI runs it.
- `Misterrenok/ron-os` is the canonical continuity/current-state file store.
- Native memory, old chats, Library and exports are leads only for mutable state.
- Durable personal context: `PERSON.md`.
- Stable connector contracts: `references/integrations.md`.

## Reasoning architecture
`PROTOCOL.md` now owns the **lean reasoning protocol**, promoted on 2026-08-27 from the frozen candidate after Protocol A/B v1.

Final blinded behavioral result: **Lean 31/32 vs previous Current 30/32; 0 hard failures for both**. The precommitted replacement rule passed: Lean had zero hard fails, `Qlean >= Qcurrent`, and no slot where Lean was worse by 2 or more points. Full provenance and contamination/rerun notes: `tests/protocol-ab-v1/result.md`; frozen candidate remains at `tests/protocol-ab-v1/candidate-lean.md`.

The first execution had cross-condition state contamination in write-capable slots, so affected pairs were rerun against isolated frozen branches before scoring. The final result combines uncontaminated original pairs with corrected isolated reruns. This validates the protocol comparison; it does **not** establish a universal numeric quality score for Ron OS.

**2026-09-19 total-value optimizer architecture:** the former open-ended total-value objective is restored in compact form without reverting the 2026-08-27 Lean Protocol. `PROTOCOL.md` carries the global invariant; `skills/total-value-optimizer.md` is an optional cross-cutting procedure selected by `references/domain-routing.md` only when multidimensional optimization can materially change the decision. It never owns mutable state, does not override domain/live owners, and explicitly prices analysis itself so "consider everything" cannot become an infinite checklist. Regression surface: `tests/total-value-optimizer-v1.md` plus `tests/total_value_optimizer_guard.py`.

**2026-09-20 derived-current provenance closure:** two production stress probes reproduced a narrower failure where stale/planned data were verbally rejected but one stale component was still reused inside a present-tense calculation. `PROTOCOL.md` now requires derived current claims to inherit the weakest provenance of every material input and forbids filling a missing current input from stale/planned evidence; uncertain results stay UNKNOWN/conditional/threshold/range-bound until the material input is verified. Regression surface: `tests/derived-provenance-v1.md` + `tests/derived_provenance_guard.py`. PR #65 merged; structural/CI verification passed. A fresh ordinary-chat replay remains the behavioral confirmation of the production fix.

Cross-domain decision-identity guard added 2026-08-28 after a real silent-substitution incident: before search/optimization, decisions are separated into **LOCKED / VARIABLE / UNKNOWN** fields; candidates differing on LOCKED fields are explicit substitutions, never silent improvements. The continuity contract now preserves identity-bearing selected/rejected objects during compaction, and regression Case T tests the rule across products, recipients, addresses, configurations, versions and schedules.

Outcome-system boundary guard added 2026-08-28 after repeated object-first nutrition errors: a named product/artifact is treated as one component of the shortest lifecycle that can change real success, not as the solution boundary. Regression Case W now fails product-only recommendations that discover operational stages only after commitment and answer each miss with another local rule.

Domain-package routing activated 2026-08-28: `references/domain-routing.md` maps each sphere to a thin procedural skill, one Ron OS owner and claim-specific live owners. Cross-domain requests load the smallest causally complete union; skills no longer own mutable snapshots. The live XMind top-level life areas now provide an independent coverage check: every area has a dedicated, composed or strategy-only disposition, while relationship edges are only candidates for supporting domains. Dedicated thin routers now include schedule, finance, e-commerce, mobility, general health and learning.

**2026-09-04 routing-overhead A/B:** matched fresh-chat control/candidate evidence found production control **8/10 with one hard fail** versus the narrowed-orchestration candidate **10/10 with zero hard fails**. The promoted direction is: self-contained personal/project requests with all material facts explicit may answer directly; full Ron OS orchestration remains required when current state, prior decisions, continuation, or consequential multi-factor planning materially matters. Current-state nutrition recovery remained intact in the same frozen test. Evidence: `tests/routing-overhead-ab-v1-result-2026-09-04.md` and `architecture/changes/2026-09-04-routing-overhead-ab-v1.json`.

**2026-09-13 conditional CURRENT routing:** promoted after structural CI plus behavioral screening. Ordinary owner-sufficient single-domain recovery no longer pre-reads `CURRENT.md`; cross-domain/global and architecture checkpoint requests still load it. Fresh-chat P1/P6/P7 probes passed, and the remaining frozen cases passed a read-only composite adversarial run with **0 hard fails**, control **35/40** vs candidate **40/40**, and unnecessary `CURRENT.md` reads across P1–P5 reduced from **5/5 to 0/5**. This is screening evidence, not universal superiority evidence. Evidence: `tests/current-routing-overhead-ab-v1-screening-2026-09-13.md` and `architecture/changes/2026-09-13-current-routing-overhead-v1.json`.

**2026-09-09 Skill/Social Capital architecture:** two dedicated domain packs now own (1) selection/proof/review of compounding skills and (2) professional/opportunity network strategy. They preserve concrete learning execution under learning/live sources and ordinary family/friendship/romantic relationship work under XMind/context/direct evidence. Both portfolios start intentionally uninitialized rather than inferring current priorities or contacts. Regression coverage: `tests/capital_system_guard.py`; architecture evidence: `architecture/changes/2026-09-09-skill-social-capital-v1.json`.

**2026-09-12 System ↔ XMind strategy bridge:** promoted and live as a strictly read-only strategy-reference layer for Quest v2. XMind continues to own map structure and strategic intent; Ron OS plus claim-specific live owners continue to own current real-world truth; Neon continues to own only derived RPG state. A quest may carry an optional concrete file/sheet/topic reference only after a fresh XMind check, `CLEAR` conflict status and at least one upstream owner reference; otherwise the link remains `UNVERIFIED`. There is no automatic sync, XMind write path, second state store or compatibility break for existing quests. Architecture evidence: `architecture/changes/2026-09-12-system-xmind-strategy-bridge-v1.json`; runtime contract: `system/lifeup/XMIND_STRATEGY_BRIDGE_SPEC.md`.

## Personal skills global installation — 2026-08-28

Root cause confirmed: repo-local `skills/*.md` files and runtime-mounted `/root/.codex/skills/*` packages do **not** by themselves create user-visible personal skills across chats. The durable user skill directory is the personal Skills store.

Current personal-skill state was reconfirmed by Ron from the Skills UI on 2026-09-13: personal `ron-continuity` and personal `Ron Work Protocol` are not installed. Installed visible skills are Marketplace Ürün Görselleri, Nutrition, Ron XMind, Liftosaur Training, Ron Mobility, Ron E-commerce, Ron Finance, Ron Schedule, Ron Learning, Ron Health and Ron Context. This supersedes the earlier 2026-08-28 active-skill inventory. Repo-local `skills/ron-work-protocol.md` remains part of canonical ordinary routing and is distinct from the removed personal Skill.

Autonomous composition/capture confirmed by Ron on 2026-08-28: Ron is not the routing operator and never needs to name skills or separately request continuity capture. For requests that materially depend on current state, prior decisions, continuation, or consequential multi-factor planning, the orchestrator must recover confirmed goals and constraints, infer the primary domain, add every causally necessary supporting package, identify the real bottleneck and return one concise outcome-first pragmatic answer. If a request is self-contained and all material personal/project facts needed to answer are already explicit in the current conversation, answer it directly instead of forcing full Ron OS orchestration. Default optimization criteria are truth, safety, health/longevity, total expected value, money, time, autonomy, reversibility, adherence and short/long-horizon downside; Ron's explicit values override assistant taste.

Adaptive causal-completeness contract strengthened by Ron on 2026-08-28: for nontrivial/consequential personal/project work where omitted stages can materially change success, define the real outcome and shortest complete lifecycle, then scan material paths through personal/live evidence, current authoritative science/statistics, time, money, regional availability, tools, logistics, preparation/use/storage/transport/maintenance/cleanup, taste/usability/adherence, safety/interactions/failure modes and short/long-term/second-order effects. The orchestrator deepens research/tool checks only where a plausible factor can change the decision, compares a strong alternative and tests key-unknown sensitivity. If decision-critical data remain inaccessible after owner/tool/alternative recovery, it asks Ron only for the minimum user-only input or connection; noncritical gaps stay explicit `UNKNOWN` and do not block a safe reversible next step. This is adaptive causal coverage, not an infinite checklist or permission to substitute analysis volume for decision quality.

Adaptive causal stress test v1 completed 2026-08-28: five of six independent read-only scenarios passed behaviorally; the conflict scenario exposed one hard infrastructure failure in Cronometer biometric date interpretation. Windowed `get_biometrics` can carry the last pre-range value to `start_date`, so exact biometric event dates now route through raw `get_biometrics_export`. The MCP source, regression tests, live deployment, global/repo nutrition rules and integration contract were all corrected and read back; the live probe now returns an explicit boundary-seed warning. Dated raw test evidence was 64 kg on 2026-03-29 and 68 kg on 2026-07-03; this evidence does not own current bodyweight. Full results: `tests/adaptive-causal-stress-v1.md`.

Mandatory closeout confirmed by Ron on 2026-08-28: before finishing any continuity-relevant work, reread affected owners; record every factual delta, decision, completed/open/cancelled item, exact stop point, blocker and next step in the exact owner; delete or replace superseded runtime data; then read back every write. Skills and native memory do not own mutable state. If there was no continuity-relevant delta and no continuation point, do not fabricate a log entry. Ron grants standing authorization for this Ron OS continuity capture; unrelated purchases, payments, messages, publications, deletions and live-system side effects still require authority from the actual task.

**2026-09-01 provenance regression closure:** blind T19 initially hard-failed at **0/4** by promoting the historical/modelled finance range into a current figure; one provenance Custom Instruction improved it to **1/4** but still produced a synthetic `14,650 TL` working figure. Architecture Mode candidate `t19-provenance-runtime-v2` added one line to `PROTOCOL.md` preserving provenance/status per claim and forbidding stale mutable inputs from being collapsed into precise current/working values. Candidate CI passed and full diff review found only that one protocol line plus the manifest. A branch-targeted fresh-chat diagnostic then returned `UNKNOWN/UNVERIFIED`, but it is **not counted as a frozen blind T19 score** because the prompt explicitly disclosed the Ron OS branch/test context. After promotion to `main` and successful main CI, Ron ran a new ordinary personalized chat using only the exact frozen T19 prompt; it returned current surplus `UNKNOWN/UNVERIFIED`, kept `14.5–14.8k TL/month` only as a previous modelled estimate, synthesized no precise current surplus, and scored **3/4 PASS** under the frozen key because it also described the historical ~`50,600 TL/month` combined inflow model as the current calculated income structure. That adjacent wording error did not reconstruct a current surplus and is not a T19 hard failure. T20 remains **4/4 PASS** and unchanged. Evidence: `tests/adversarial-cognition-v1/results-2026-09-01-provenance-closeout.md` and `architecture/changes/2026-09-01-t19-provenance-runtime-v2.json`. The valid production T19 run used the current production Custom Instructions plus the promoted protocol line, so the combined production configuration passes the targeted failure class; isolated causal contribution was not separately measured.

**2026-09-01 T19 input-provenance closure candidate:** the remaining 3/4 wording defect was localized to a stale mutable input (~50,600 TL historical inflow model) being called the current income structure even though the requested current surplus correctly remained `UNKNOWN/UNVERIFIED`. The finance domain procedure now requires provenance/status to remain attached to every mutable input of a current derived value; withholding the output no longer licenses relabelling an input as current. Frozen T19 prompt/key remain unchanged. Candidate CI passed; production T19 remains scored **3/4** until a new post-promotion exact-prompt blind run independently earns 4/4. Evidence: `architecture/changes/2026-09-01-t19-input-provenance-closure-v1.json`.

**2026-09-01 T21/T22 execution/closeout reinforcement:** repeated natural failures showed Ron still had to act as an external QA/continuation controller through follow-ups such as «Есть ли ошибка?» and «И что делать?». Architecture Mode candidate `t21-t22-closeout-execution-v1` adds a two-line pre-final gate to `PROTOCOL.md`: execute any remaining safe, authorized, materially useful tool step before replying, and do not claim `PASS`/`done`/`closed` until task-required closeout evidence is verified. The repeated natural T22 recurrence was remediated in the current runtime sequence through candidate creation, CI, full diff review and read-back without another continuation command. Frozen T21/T22 remain **not blind-scored**; this is runtime evidence and a promoted guardrail, not proof of universal behavioral compliance. Evidence: `tests/adversarial-cognition-v1/results-2026-09-01-user-auditor-action-handoff.md` and `architecture/changes/2026-09-01-t21-t22-closeout-execution-v1.json`.

**2026-09-01 T22 actionable-handoff v2:** a further recurrence showed the v1 tool-execution gate did not fully cover advice/diagnosis/planning where the remaining step is Ron-only, blocked or unnecessary. `PROTOCOL.md` now requires every action-implying answer to resolve the action state before finalizing: execute assistant-owned work; otherwise give the smallest Ron-only action with trigger/timing and success condition; state the exact blocker and minimum unblock; or explicitly say no useful action remains when ambiguity would otherwise persist. This is a promoted runtime guardrail with structural/runtime verification, not a frozen blind T22 score. Evidence remains in the same T21/T22 result plus `architecture/changes/2026-09-01-t22-actionable-handoff-v2.json`.

Active personal `nutrition` cleanup completed and read back on 2026-08-28: nine stale mutable August snapshot/reference files and the obsolete audit script were removed from the runtime skill. Its active tree now contains only procedural `SKILL.md`, UI metadata and icon; current nutrition truth remains in Ron OS/live owners, while Git history is provenance only.

**CLOSED 2026-09-13:** the prior legacy-personal-skill conflict is resolved at the personal Skills layer: Ron removed both `ron-continuity` and personal `Ron Work Protocol`. Do not treat either as an active installed personal skill. Repo-local `skills/ron-work-protocol.md` remains part of canonical ordinary routing. The rollback path is preserved in GitHub issue #26; `ron-continuity` is not automatically restored by that rollback.

## Continuity-loss root fix — 2026-08-26
A cross-domain audit after a real recall failure found that the 2026-08-24 migration/hygiene had a **coverage-blindness** defect: it could make surviving owners internally correct while allowing useful facts to fall between owner categories or be semantically altered during distillation. Concrete losses included finance ownership, personal-profile detail, work/nutrition logistics and training progression semantics.

Systemic fix now active:
- lossless disposition contract at `references/continuity-contract.md`;
- explicit current-owner registry at `references/continuity-owner-registry.tsv`; registered owners cannot silently disappear and new domain/project owners cannot remain unregistered;
- no `too stale -> silently drop` class: potentially useful mutable historical state with no live owner becomes a dated fallback owner;
- all `domains/*.md` and `projects/*.md` owners must route from both `BOOTSTRAP.md` and `CURRENT.md`;
- semantic fidelity checks protect triggers/counts/units/provenance during compaction;
- executable `tests/continuity_coverage_guard.py` + `.github/workflows/continuity-guard.yml` check owner registry/routing and real regression anchors;
- material migrations require a peripheral-domain probe rather than testing only the migration's focal domains.

This reduces the class of silent-compaction/owner-orphan errors. It is a guardrail, not a mathematical guarantee that no future unknown failure mode can ever exist.

## Durable personal context restoration — 2026-08-26
`PERSON.md` was audited against the old persistent personal-context export. Useful non-sensitive durable facts that had been over-compressed were restored: last-confirmed language levels, exact university/program background, and roughly three years of e-commerce experience. Identifying document numbers, exact home address and other unnecessary identifiers remain deliberately excluded from GitHub continuity files.

## Finance
Owner: `domains/finance.md`.
- Last-known planning income structure: salary **35,000 TL/month** + employer food cash **600 TL/workday**, with the historical ~26-workday assumption yielding **15,600 TL/month** and a historical combined inflow model of ~**50,600 TL/month**. Refresh workdays/meal cash and any changed income terms before treating the combined figure as current.
- Employment is **unofficial**, income is received as **physical TRY cash**, and Ron's bank profile is **foreign student**; source-of-funds/KYC friction is material for banking/investment execution.
- Current savings are approximately **USD 600 equivalent**; current sister-debt planning balance is **~USD 1,532**, directly reconfirmed 2026-09-01. Sister is indifferent to repayment currency, so the debt is not a hard USD-matching liability.
- Historical modeled free cash after food/other expenses was roughly **14.5–14.8k TL/month**, but this is not a live surplus fact until underlying expenses are refreshed.
- Investment objective: **highest practical risk-adjusted return with as little ongoing involvement as possible**. Germany capital must remain liquid/low-risk enough for departure before **2027-07-27**; current rates/inflation/FX/taxes must be refreshed before execution.
- **No final portfolio allocation is approved.** The recent ~50% PPF / ~50% EUR split was an assistant candidate, not Ron's locked decision.
- No account/card/credential data belongs in Ron OS.

## General health

Owner: `domains/health.md`; live devices/laboratory reports/medical documents/direct symptom evidence own current facts.
- Covers sleep, recovery, general medical care, symptoms, pressure, cognitive health and psychological health without absorbing nutrition or training.
- Durable preferred sleep window remains approximately **22:00–06:00**; recent sleep duration/adherence/latency and any current medical state are `UNKNOWN` without newer evidence.
- Exact health goals, scores and relationships remain live XMind projections; scheduled measurements are not completed measurements.

## Nutrition
- **New-chat handoff requested Sep8:** resume from `domains/nutrition.md` -> `New-chat continuation checkpoint — 2026-09-08`. Next assistant-owned work is the unresolved low-salt bread/basket feasibility and final app-content reconciliation; do not restart the design or infer activation.
Owner: `domains/nutrition.md`; live Cronometer owns diary/log/targets.
- Current proposal saved in same userfile identity version3; full evidence `history/2026-09-08-nutrition-local-recipes-milk.md`. Actual dish assembly, independentshopcomparison, fishdaysodiumfix and A1/A2 evidence through2026 added; noactivation/intakeinferred.
- LocalMarketFiyati Sep8 checkSUCCEEDED using recoveredprioraddress/adjacentgeocoderpoint,1km18branches. FormerusageblockerCLOSED. Pricesaredatedlocaloffers, notphysicalstockcounts; exactNimetTuzsuz/remainingbasketnotallverified. Do notaskrepeataddressorcopyprivateaddress/coordsintorepo.
- Finance: USD250ceiling;~8435TRYfoodconsumption/~10800withreserves;firstpacks~2690, optionalD3bottle263.50extra. D3only600IU/dayproposedwithoutunnecessaryroutinescreen;K2notmandatory;iodinedeficiencynotestablishedbyemptyDB. Nopurchaseorintake.
- AppdeploymentstillrequiresRonsexactauthorization+Day1underexistinggate; oldSep7manifestmustincorporateSep8changedfishdaybread/yogurtbeforewrite. Actualtaste/brandlabels/weighttrendremainunverified.

## Training
Fallback owner: `domains/training.md`; live Liftosaur owns post-export mutable app state.

Fresh Ron-supplied export promoted on 2026-08-29:
- exact export-backed AS_OF is **2026-08-29**; any later manual app change is `UNKNOWN` until the next export;
- active program `txfxzary` («Программа тренировок от Клода»), **Mon/Tue/Thu/Fri**, 43 exercise occurrences and **146 sets/week = 36/39/37/34**;
- exact program source, targets, progression counters, 30 workout records, measurements, equipment and custom exercises are retained in the sanitized dated snapshot and audit under `snapshots/liftosaur/`;
- only explicit non-zero current progression counter is Mon Lying Leg Curl `stall = 1`; no explicit exercise is at deload stage 1/2;
- active-program history contains one session: 2026-08-03 Mon Lower A, 36/36 sets;
- Ron edits Liftosaur manually; new exports are hashed, sanitized, diffed and appended. No live Liftosaur mutation without exact permission.

Subscription remains deferred until the rest of the integrated system is ready. This export is dated app evidence, not proof that the integrated system has started.

## Learning and languages

Owner: `domains/learning.md`; live XMind owns goals/scores, TickTick/Calendar own exact tasks/time, and direct/app execution owns completed study.
- German baseline is **A0 / effectively never studied**, directly corrected by Ron on 2026-09-09; the older June-start execution claim is superseded. Later progress requires new direct/app evidence.
- Nicos Weg + commute audio + Anki + grammar/speaking remain a proposed stack, not evidence of executed study.
- Mobility/legal/education owners and current official sources retain authority over visa, university, Ausbildung and certificate requirements.

## Skill capital
Owner: `domains/skill-capital.md`.
- `domains/skill-capital.md` owns the 2026-09-13 broad ROI review: primary allocation is UNDER REVIEW, German is a conditional candidate, and recovering controllable time is the next bounded investigation candidate. No measured global winner or new study activation; A0 remains the last direct German baseline.
- Default architecture: one primary build skill -> deliberate practice/application -> proof of capability -> monthly/material-milestone review; concrete study execution remains with learning/live sources.

## Social capital
Owner: `domains/social-capital.md`.
- System status: **ACTIVE / NETWORK INVENTORY UNINITIALIZED**.
- No contact inventory or trusted-relationship count has been inferred/imported. Target circles remain `UNKNOWN` until a current opportunity/network task requires them.
- This domain covers professional/opportunity networking only; ordinary family/friendship/romantic relationships remain outside its ownership. Specific contact/message state stays with direct/live sources and outreach still requires exact task authority.

## Mobility / residence / Germany

- **2026-09-13 Ron correction:** Germany is a means to pragmatic life improvement, not a locked end; Au Pair/Ausbildung is not an exhaustive choice. Updated conditional comparison and timing risks are in `domains/mobility.md`; skill implications are in `domains/skill-capital.md`. No route or live action newly activated.

- **2026-09-13 verified near-term deadline:** Topkapı önlisans course selection is September 14–15 and 19–20; personal OİS completion is UNKNOWN. Official source, user-only next action and conditional Germany-route triage are in `domains/mobility.md`.
Fallback owner: `domains/mobility.md`; Ron's direct report owns his confirmed approval outcome, while official/live sources own unreported current legal/process details.
- Residence-permit renewal approval is **CONFIRMED**. Ron-supplied e-İkamet evidence shows planned student-permit validity **2026-09-25 through 2027-07-27**; use **2027-07-27 as the outer migration/finance planning deadline** unless newer official evidence differs. Card production/PTT delivery/physical receipt remain `UNKNOWN`.
- Ron wants to leave Türkiye for Germany **before that deadline**, with operational buffer rather than aiming at the last legal day. Historical September 2028 timing is superseded.
- Work makes regular university attendance impractical; likely loss of student status from continued non-attendance is a material risk/forecast, not yet an executed expulsion fact. Future planning must not assume another Turkish student-residence renewal will be available.
- University change is not established as impossible: current Turkish rules can preserve a student residence for an uninterrupted same-province university change with timely notification. However, exact transfer/admission eligibility and the effect of Ron's already-used Turkish-preparatory period remain **UNVERIFIED**.
- Germany direction remains **Fachinformatiker Systemintegration**. Direct Ausbildung vs Au Pair bridge remains **OPEN**; direct Ausbildung normally needs a concrete place and around B1, while Au Pair can structurally permit earlier entry with lower language threshold if all route conditions are met.

## Active work/project pointers
- E-commerce / marketplaces -> `domains/ecommerce.md`; live platforms own orders/stock/price/listing state.
- System / real-life RPG -> `skills/system-controller.md` + `projects/lifeup-system.md` -> Neon/PostgreSQL `system_events` for mutable derived RPG state. ChatGPT is the intended interactive controller; LifeUp is retired/rollback-only. **Do not duplicate current ledger counts, active quest state or exact deployed release here**; refresh `projects/lifeup-system.md` and Neon whenever current System state matters.
- Trendyol Tampermonkey print/order automation -> `projects/trendyol-print-automation.md`; live installed script is exact mutable owner when inspectable.

## Live owners / integration surfaces
See `references/integrations.md`.
- TickTick: tasks/reminders.
- Google Calendar: events/availability.
- Cronometer: nutrition diary/log/targets.
- Liftosaur: training state when accessible.
- Neon/PostgreSQL `system_events`: mutable derived RPG state for the System; ChatGPT controls interaction through the shared action gate; never overrides stronger real-world owners.
- LifeUp Cloud/official MCP/Tailscale: **legacy/retired System integration only** unless Ron explicitly reopens it as a target architecture decision.
- GitHub: Ron OS/code/current project files.
- Other derived surfaces do not override upstream owners.
- Trendyol Marketplace has no installed direct connector; official Marketplace API remains a possible capability route. Never store credentials in GitHub/public surfaces.
- Scheduled automations depending on Ron OS must bootstrap from GitHub owners.

Historical 2026-08-29 live-system build/scaffolding assertions are no longer runtime state. Their useful operational rules are owned by `PROTOCOL.md`, `references/integrations.md`, domain/project owners and live sources; incident/provenance remains recoverable in Git history and `history/2026-09-13-current-system-dedup.md`.

## Open residue
- Native-memory physical hygiene is non-blocking and not fully proven.
- Physical cleanup of the stale personal XMind `map-anatomy.md` remains capability-bound; canonical behavior is guarded meanwhile.
- Liftosaur exact live state remains capability-bound.
- Residence renewal approval and planned **2027-07-27** validity endpoint are established; only exact card production/PTT delivery/physical receipt remains open.
- Ron System-specific OPEN work is owned only by `projects/lifeup-system.md`; do not duplicate its mutable quest/ledger/release state here.

## Capture rule
Future substantial changes: write only to the proper owner/live source, read back, and update this file only when cross-domain/project continuation materially changed. Historical incident detail belongs in Git history/regression evidence, not this runtime index.
