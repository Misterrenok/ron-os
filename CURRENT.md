# Ron OS — current cross-domain state

Updated: 2026-08-26 Europe/Istanbul
Status: **PASS — GITHUB_CANONICAL / TOTAL-VALUE SEMANTIC + MASKED-KEY + USER-SUPPLIED FULL BLIND-SUITE CONTENT PASS; INDEPENDENT VALIDATION + CLOSED-LOOP PRODUCTION PENDING**

## Runtime routing
- Entry: `BOOTSTRAP.md` -> this file -> exact domain/project owner -> live owner if mutable.
- For nontrivial decisions/design/diagnosis/planning/optimization/self-correction, use `PROTOCOL.md`. Tiny/self-contained tasks remain proportional and may skip it.
- `Misterrenok/ron-os` is the single canonical file store for Ron OS continuity/current-state files.
- Native ChatGPT memory may hold only the durable bootstrap pointer; mutable Ron OS state must not live in memory.
- Old chats, Library, exports, and retired artifacts are evidence only for mutable/project state.
- Durable personal context: `PERSON.md`.
- Stable connector/derived-surface contracts: `references/integrations.md`.

## Reasoning architecture
`PROTOCOL.md` uses a **lean Adaptive Metareasoning Governor** rather than a growing rule stack.

Its explicit optimization objective is now: subject to Ron's explicit objectives, values, hard constraints and the feasible action set, prefer the course of action with the greatest total expected value across all materially relevant consequences and time horizons. `Value` is deliberately open-ended rather than limited to a predefined list of dimensions; the governor must discover material dimensions from the actual situation, carry opportunity costs/uncertainty/tail risk/option value/downstream effects and execution/reasoning cost when relevant, and avoid fake scalar precision for genuinely incommensurable trade-offs.

Core behavior:
1. optimize Ron's real total expected value rather than a local metric, fixed value ontology, proxy, or single time horizon;
2. compile the real success condition from Ron's compressed intent without silently changing his objective;
3. ground only decision-relevant mutable facts/premises in their real owners;
4. scale reasoning and verification depth to consequence, uncertainty, reversibility, and error cost;
5. choose task-specific representations/operators rather than imposing a named human method;
6. establish a decision-capable best-so-far result early and deepen only while information gain can change the decision;
7. challenge the chosen solution with the most plausible material failure and use a less-correlated verifier when worthwhile;
8. carry useful assistant-owned work through implementation/deployment and verify consequential actions by read-back or equivalent evidence;
9. audit remaining branches and stop when marginal cognition/deployment no longer pays.

For genuinely dynamic systems, deployed plans remain updateable policies driven by real outcome evidence; metrics are sensors/proxies rather than the objective.

Architecture hygiene rule: add or retain meta-rules only when they reduce a real class of consequential errors or materially improve completion. Remove duplication, ceremony, and rules whose overhead exceeds their protection.

Regression evidence remains in `tests/system_model_regression.md`, `tests/total_value_stress_test.md`, `tests/adversarial-cognition-v1/results-2026-08-26-total-value.md`, and Git history rather than being copied into this runtime index. Lean revalidation on 2026-08-25 passed cases A–S plus all 13 metamorphic checks. On 2026-08-26 the total-value objective passed a dedicated adversarial semantic audit: **30/30 adversarial cases + 10/10 metamorphic checks by governing-rule coverage**. A subsequent same-family behavioral probe added three masked/shuffled layers with **58/58 scored decisions** (26 randomized numeric, 20 metamorphic flip-pair decisions, 12 qualitative adversarial decisions). Two defective generated questions were rejected before scoring and repaired rather than laundered into the score. The pre-existing `adversarial-cognition-v1` prompts were then run with the evaluator key withheld until answers were fixed; conservative single-chat scoring was **68/72 = 3.78/4**, with the T01–T16 continuity/tool/authority core at **60/64 = 3.75/4 and no hard failure**. T15 also re-exercised a real GitHub create -> exact read-back -> cleanup path successfully.

Ron subsequently supplied the outputs from the requested fresh-chat runs. Scored against the pre-existing key, **T10–T16 = 28/28 = 4.00/4.00 with zero hard failures** and **T01–T09 = 36/36 = 4.00/4.00**. Combined T01–T16 content result: **64/64 = 4.00/4.00**, with no sampled cross-suite failure pattern.

Ron then supplied both ordinary-personalized and Temporary Chat outputs for T17 and T18. T17 ordinary remained proportional and no more elaborate than Temporary; both rejected overengineering a ~40-min/year process and favored lightweight standardization/reminders. T18 ordinary and Temporary both preserved the existing SEO asset, rejected destructive clean-slate framing, and recommended staged rebrand/migration rather than reflexive prohibition. Scored against the existing key, **T17 = 4/4 and T18 = 4/4**, and the paired requirement `personalized no worse than Temporary` passed for both.

Therefore the user-supplied full v1 blind-suite **content score is 72/72 = 4.00/4.00**, with **0 hard failures** and no sampled cross-suite failure pattern. This is strong isolated-behavior evidence. However this chat still cannot independently inspect source-chat isolation metadata or independently verify that the Temporary/ordinary labels came from those exact surfaces, so the result is recorded as **USER-SUPPLIED FULL BLIND-SUITE CONTENT PASS**, not independent proof.

A materially independent model evaluator is still unavailable in the current tool surface.

## Nutrition
Owner: `domains/nutrition.md`; live Cronometer owns live diary/log/target state.
Current execution state: **NOT STARTED / REVIEW — PERMANENT BASE PROXY-VALIDATED + PREFILLED / LAUNCH SHOPPING LAYER PARTIALLY LOCKED**.
- Live Cronometer read-back on 2026-08-26: today has **0 food entries / 0 kcal consumed**; effective target remains about **2971 kcal / 148.55 g protein / 99.03 g fat / 371.38 g carbs**.
- Stable non-fish base exact planning-template read-back: **2961.6 kcal / 148.8 P / 101.4 F / 371.9 C / 37.8 g fiber**; no workplace refrigerator required.
- Ron's preferred workflow remains **prefill ideal day -> delete anything not eaten**. The non-fish template is prefilled on 2026-08-27 as planning evidence only; no Day 1 exists yet.
- Preferred EPA/DHA rotation changed after live price/effort comparison: **100 g thawed/drained Atlantic mackerel 2 days/week by substitution**, with chicken **230 -> 150 g cooked** and olive oil **35 -> 27 g** on those days. Same-species evidence supports roughly **~2 g EPA+DHA per 100 g**; canned Dardanel sardines remain a shelf-stable fallback.
- Current large-stock oat flour + pekmez remain a substitution overlay: **+60 g oat flour +30 g pekmez; -90 g whole-wheat bread -50 g cooked rice -3 g oil** (proxy-level until exact labels are reconciled).
- Kitchen scale remains the main execution blocker. Selected sufficient candidate: **Kiwi KKS-1125, 5 kg / 1 g / tare**; purchase is not yet verified.
- Launch shopping candidates and a first transitional basket are now owned in `domains/nutrition.md`; mutable prices/availability remain live facts and are intentionally not stored in canon.
- Next work: acquire/verify the scale + basket, calibrate first raw-to-cooked yields, instantiate chosen mackerel/stock-overlay dates, validate real prep/transport, then explicit Day 1 start.

## Training
Fallback owner: `domains/training.md`; live Liftosaur owns exact mutable app state.
Last-confirmed fallback `AS_OF: 2026-08-18`: **Mon/Tue/Thu/Fri** = Lower A / Upper A / Lower B / Upper B. Exact current progression/session state is `UNKNOWN` until live access or newer explicit Ron evidence.

## Mobility / residence / Germany
Fallback owner: `domains/mobility.md`; current government/legal/status facts require current official/live evidence.
- Türkiye residence case remains an unresolved last-confirmed **CONFLICT** as of 2026-08-23; do not assert an outcome until official live status is checked.
- Germany direction remains **Fachinformatiker Systemintegration (Ausbildung)**; exact route/timing requires current evidence before acting.

## Active work/project pointers
- E-commerce / marketplace work -> `domains/ecommerce.md`; live platforms own order/stock/price/listing state.
- Trendyol Tampermonkey print/order automation -> `projects/trendyol-print-automation.md`; live installed script is exact mutable owner when inspectable.

## Live owners / integration surfaces
Use `references/integrations.md` for connector details and quirks.
- TickTick: tasks/reminders.
- Google Calendar: events/availability.
- Cronometer: nutrition diary/log/targets.
- Liftosaur: exact mutable training state when accessible.
- GitHub: repository/code/current Ron OS state.
- Trendyol Marketplace currently has no installed ChatGPT direct connector; official Marketplace API remains a possible capability-acquisition route. Credentials are sensitive and must not be stored in GitHub or pasted into public surfaces.
- Neon and other derived surfaces do not override upstream owners.
- Scheduled automations that depend on Ron OS state must bootstrap from GitHub owners.
- **2026-08-25 executor alignment:** active `Ночной аудит архитектуры`, `Еженедельный личный ретро`, and `Ежедневный рычаг` automations were re-aligned with the lean-governor architecture. Their prompts now act as task-specific executable projections that bootstrap current GitHub/live owners instead of carrying mutable snapshots or a second detailed process canon; live automation read-back confirmed all three changes.

## Open residue
- **OPEN / independent behavioral validation:** a materially independent evaluator and independent inspection of source-chat isolation metadata are not available in the current tool surface. The full v1 blind-suite content is user-supplied PASS, not independent proof.
- **OPEN / closed-loop production probe:** after a dynamic system is actually deployed, verify that real feedback can change policy without proxy capture/noise.
- **OPEN / non-blocking — native-memory physical hygiene:** complete enumeration/deletion/read-back of every legacy native-memory entry is not proven in the current tool environment.
- **OPEN / capability-bound — Liftosaur live state:** exact mutable state remains unavailable until live access or newer explicit Ron evidence.
- **OPEN / live-verification — Türkiye residence status:** exact current decision/status must be checked against the official live case status before consequential conclusions.

## Capture rule
Future substantial changes: write only to the proper owner/live source, read back, and update this file only when cross-domain/project continuation materially changed. Historical incident detail belongs in Git history/regression evidence, not this runtime index.