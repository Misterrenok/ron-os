# Ron OS — current cross-domain state

Updated: 2026-08-28 Europe/Istanbul
Status: **PASS — GITHUB_CANONICAL / CURRENT OWNERS ROUTED**

## Runtime routing
- Entry: `BOOTSTRAP.md` -> this file -> `references/domain-routing.md` -> selected thin domain skills + exact owners -> live owners if mutable.
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

Cross-domain decision-identity guard added 2026-08-28 after a real silent-substitution incident: before search/optimization, decisions are separated into **LOCKED / VARIABLE / UNKNOWN** fields; candidates differing on LOCKED fields are explicit substitutions, never silent improvements. The continuity contract now preserves identity-bearing selected/rejected objects during compaction, and regression Case T tests the rule across products, recipients, addresses, configurations, versions and schedules.

Domain-package routing activated 2026-08-28: `references/domain-routing.md` maps each sphere to a thin procedural skill, one Ron OS owner and claim-specific live owners. Cross-domain requests load the smallest causally complete union; skills no longer own mutable snapshots. Local skills were refactored accordingly, with dedicated routers added for schedule, finance, e-commerce and mobility.

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
- Restored because the current Ron OS had **no finance owner**, creating a real continuity gap.
- Last-confirmed fallback: salary **35,000 TL/month**; employer meal cash **600 TL/workday**, historically ~26 workdays/month = **15,600 TL/month**, combined model ~**50,600 TL/month**.
- Old recurring-obligation/debt figures are retained only as **dated fallback**, not live truth. Any consequential budget/investment/debt answer must refresh mutable amounts first.
- No account/card/credential data belongs in Ron OS.

## Nutrition
Owner: `domains/nutrition.md`; live Cronometer owns exact diary/log/target state when accessible.

Current execution state: **READY — NOT STARTED / PURCHASE PENDING / NO-SCALE PROXY READY**.
- `STARTED` only after basket actually purchased/received + Ron begins execution. No fixed Day 1 yet.
- Last verified target: about **2971 kcal / 148.55 P / 99.03 F / 371.38 C**.
- Stable non-fish planning template: **2961.6 kcal / 148.8 P / 101.4 F / 371.9 C / 37.8 g fiber**.
- Current oat flour + pekmez stock overlay: **+60 g oat flour +30 g pekmez; -90 g whole-wheat bread -50 g cooked rice -3 g oil**.
- Preferred fatty-fish rotation: Atlantic mackerel 100 g twice/week by substitution.
- No kitchen scale does not block eventual launch; owner contains proxy ratios.

### Restored operational layer — 2026-08-26
Recovered from persistent pre-hygiene/HANDOFF evidence and promoted only where consistent with newer evidence:
- **Workweek Mon–Sat; Saturday is a normal workday.**
- **06:00 wake; only ~30 min total for breakfast + getting ready; 06:30 leave; 06:30–07:30 commute; 07:30–18:00 physical work in Eminönü.**
- Historical workload ~**10–12k steps/day**.
- **17:30–18:00 shop closing is busy; work food should be finished by ~17:30.**
- Current Calendar uses **18:00–19:30 commute home**; day-level Calendar remains authoritative for exact timing.
- Last-confirmed gym fallback **Mon/Tue/Thu/Fri 19:30–21:00**.
- Historical weekly logistics still useful as defaults: **Sat ~19:30 groceries / ~19:50 unpack; Sun ~07:00 short batch cook / 07:30 breakfast / 08:00 admin / 09:00–18:00 Rami Library**. This does not revive the old menu.
- On **2026-08-13 Ron moved to a neighboring shop with a refrigerator and viewed the move as likely temporary**; therefore the fridge is not guaranteed infrastructure.
- Current workplace: **no microwave; may eat when desired; shared fridge optional/strategically fragile; large free ayran from Çaycı available.**
- Boss gives **600 TL cash every workday for breakfast + lunch**, leftovers remain Ron's and cash can be spent freely. Historical normal spend **80 TL yarım ekmek kaşarlı tost + 150 TL köri soslu tavuklu pilav = 230 TL**, leaving **~370 TL/day**.
- Bulk grocery delivery defaults to **home**, not work, because carrying a bulk order home is operationally poor.
- Do not resurrect old August diet/baseline/gainer/calorie state from the recovery files; those archives are provenance only.

Current purchase strategy remains: primary basket via **CarrefourSA online**, frozen mackerel via **Migros/Migros Toptan**, cheap bread via **İstanbul Halk Ekmek** when convenient; A101/BİM/ŞOK opportunistically when cheaper/on-route.
Next: optimize bought work food vs home food using the **600 TL opportunity cost**, finalize basket, buy/receive basket -> Ron confirms execution start -> record Day 1 -> reconcile actual intake -> later calibrate yields with scale.

## Training
Fallback owner: `domains/training.md`; live Liftosaur owns exact mutable app state.
Last-confirmed fallback `AS_OF: 2026-08-18`: **Mon/Tue/Thu/Fri** = Lower A / Upper A / Lower B / Upper B. Exact current progression/session state remains `UNKNOWN` until live access or newer explicit Ron evidence.
- **Recovered mechanics correction 2026-08-26:** `references/training/program-mechanics.md` had drifted to an unsupported `two consecutive failures` shorthand. Persistent 2026-08-23 fallback evidence confirms last-known **`stall = 3 -> ~60% -> ~90% -> working load`**, with `stall` counting sessions without progression and `min(completedWeights)` where applicable. Reference fixed and must not regress to `2 failures` without newer live evidence.

## Mobility / residence / Germany
Fallback owner: `domains/mobility.md`; official/live sources own mutable legal/status facts.
- Türkiye residence case remains a last-confirmed **CONFLICT** as of 2026-08-23; do not assert an outcome until official live status is checked.
- Germany direction remains **Fachinformatiker Systemintegration (Ausbildung)**; exact route/timing requires current evidence before acting.

## Active work/project pointers
- E-commerce / marketplaces -> `domains/ecommerce.md`; live platforms own orders/stock/price/listing state.
- Trendyol Tampermonkey print/order automation -> `projects/trendyol-print-automation.md`; live installed script is exact mutable owner when inspectable.

## Live owners / integration surfaces
See `references/integrations.md`.
- TickTick: tasks/reminders.
- Google Calendar: events/availability.
- Cronometer: nutrition diary/log/targets.
- Liftosaur: training state when accessible.
- GitHub: Ron OS/code/current project files.
- Neon and other derived surfaces do not override upstream owners.
- Trendyol Marketplace has no installed direct connector; official Marketplace API remains a possible capability route. Never store credentials in GitHub/public surfaces.
- Scheduled automations depending on Ron OS must bootstrap from GitHub owners.

## Open residue
- Protocol A/B v1 is **CLOSED**; Lean is the active runtime protocol and the result is recorded at `tests/protocol-ab-v1/result.md`.
- Closed-loop production probe remains open for actually deployed dynamic systems.
- Native-memory physical hygiene is non-blocking and not fully proven.
- Liftosaur exact live state remains capability-bound.
- Türkiye residence exact current status remains live-verification pending.

## Capture rule
Future substantial changes: write only to the proper owner/live source, read back, and update this file only when cross-domain/project continuation materially changed. Historical incident detail belongs in Git history/regression evidence, not this runtime index.
