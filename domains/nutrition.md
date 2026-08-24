# Ron Nutrition — current-state canon

Updated: 2026-08-24 21:06 Europe/Istanbul
Status: REVIEW — NOT STARTED / READY-PENDING

## Ownership contract

This file is the **single GitHub file owner of nutrition policy/current fallback state**. Live Cronometer/TickTick own their own exact current application state; Ron's latest explicit report owns real-world execution. A planned/recurring app row is not proof of execution.

Other nutrition files may contain durable method, product facts, or explicitly archived history. They **must not own current plan/state** and must not override this file.

If a current nutrition fact changes, update this canon first, then update only operational projections that actually need the fact, then read back both. Do not copy the same policy/rationale into multiple reference files.

## Current execution state

- **Ron has not yet started eating according to the Cronometer nutrition system.** This is the authoritative real-world execution fact reported explicitly on 2026-08-23.
- The previously planned 2026-08-16 through 2026-08-22 window did **not** become a real observational baseline. Cronometer entries, TickTick meal cards and calendar slots from that period are planning artifacts only.
- The old 2026-08-23 baseline-retro task is superseded/cancelled because its premise was false; it must not count as a completed retro or as evidence for V2.
- Nutrition will start only after the system is actually ready **and** Ron explicitly begins executing it. No calendar date, prefilled diary row, recurring task or automation may silently create Day 1.
- No future start date is currently committed.
- No new D3/D3K2 supplement is confirmed as started merely because it appears in a plan or diary row. Exact supplement execution requires explicit real-world evidence.
- Exact actual food intake remains outside this plan until Day 1; prepared meal recipes are future design, not current behavior.
- Training-day meal timing is derived from the current training owner/live source; do not hardcode an independent training schedule here.

## Current Cronometer/data-model state

- Live Cronometer read-back on 2026-08-24 showed **0 food entries / 0 kcal consumed** for that date and the same target through 2026-08-31: approximately **2971 kcal / 148.55 g protein / 99.03 g fat / 371.38 g carbs**. These are current app targets, not evidence of intake.
- 2026-08-20 product/data corrections remain representation/model fixes, not evidence that the diet started.
- Exact product label/manufacturer data override a donor for the same nutrient. A suitable full-profile donor may fill only unreported fields. Missing branded/custom nutrients are `UNKNOWN`, never physiological zero.
- Prefilled/future Cronometer entries are PLAN. After actual Day 1, logged rows may become execution evidence only after reconciliation with what Ron actually consumed.
- Dardanel current SKU is boneless; do not credit bone-derived calcium from a generic sardine donor.
- Current Cronometer implementation details/IDs belong to live Cronometer and `references/nutrition/product-data.md`; read live before diary mutations.
- Earlier analytical calorie/macro overlays are dated design estimates, not proof of actual intake and not authoritative live Cronometer output.

## Current pre-start stock-usage bridge — architecture validated, full-day integration still OPEN

Ron explicitly chose on 2026-08-24 to use already-owned **oat flour, liquid pekmez, peanut butter and Fibrelle pea protein** before doing the full ideal-plan restock, provided the resulting nutrition system remains globally good for his actual life rather than merely matching calories/macros. The governing accounting rule is **substitution, not addition**: stock foods replace purchased calories/macros rather than being layered on top of the eventual ideal diet.

### Retired bridge failure

The first bridge sketch produced an approximately correct macro total but was prematurely treated as practically ready. It is **retired as a final implementation**. Its exposed defects included work transport/storage burden, unresolved refrigeration/cold-chain assumptions, raw-oat-flour/preparation ambiguity, very large calorie load, taste/texture uncertainty, leakage/mess risk, cleanup/reset burden, and weak recovery behavior.

### Replacement stock unit — 2026-08-24 design decision

The preferred bridge architecture is now an **at-home cooked stock unit**, not a carried work shake and not a late-night/post-workout calorie bomb:

- oat flour **60 g**
- Fibrelle pea protein **20 g**
- peanut butter **20 g**
- liquid pekmez **30 g**
- water only as needed for cooking/texture; water does not change macros

Current proxy arithmetic gives approximately **518 kcal / 29.3 g protein / 15.9 g fat / 67.4 g carbs / 8.0 g fiber**. This is a design estimate until the exact physical oat-flour, peanut-butter and pekmez labels are reconciled. Fibrelle uses the current custom-label values in `references/nutrition/product-data.md`.

Preparation route: cook oat flour with water to a fully cooked hot porridge/pudding consistency rather than consuming raw flour; after cooking, mix in Fibrelle and finish with peanut butter + pekmez. The actual package cooking instruction overrides a generic timing prescription if it differs.

Placement: **at home, preferentially in the morning**, so the bridge does not depend on a work refrigerator, does not create carry/leakage burden, avoids a high-fat pre-workout bolus, and avoids pushing a large meal into the 21:00–22:00 pre-sleep window.

Execution/recovery rule: at most **one stock unit per day** while this bridge is being used. Missing a day does not create a debt: do not double the next serving or add the missed calories on top. When one stock ingredient is depleted, recompute the unit rather than compensating by arbitrarily increasing the remaining stock foods.

This unit is a **temporary stock-depletion bridge**, not yet the permanent long-term breakfast. Oat flour + peanut butter remain concentrated manganese sources and pekmez is a concentrated sugar source; temporary moderate portions are preferable to resurrecting the old 100 g flour / 50 g peanut-butter / 40 g protein / 40 g pekmez + 600 ml milk gainer. The permanent diet still needs diversification and full nutrient-source coverage.

### Why this architecture survives the system model

- **Transport/cold-chain dependency:** removed for the stock bridge by keeping it at home.
- **Raw flour / food-safety ambiguity:** resolved architecturally by requiring cooking; exact product instructions still override generic timing.
- **Carry/leakage burden:** removed.
- **Cleanup/reset:** reduced to one pot/bowl/spoon rather than a work shaker/container system.
- **Training compatibility:** morning placement avoids high fat immediately before training and avoids a huge post-workout pre-sleep load.
- **Macro robustness:** the unit is only ~17% of the current 2971-kcal target, so ordinary label variation in the three unresolved stock foods is not large enough to invalidate the architecture; exact labels are still required before final Cronometer precision.
- **Failure recovery:** missed prep does not cascade into double servings or forced catch-up.

### Remaining empirical gate for this unit

One real single-serving test is still needed before calling the **preparation form** proven: actual prep time, taste/texture, satiety/GI response and whether the 60/20/20/30 proportions are pleasant enough to repeat. This test is not Day 1 and does not activate the full nutrition system. If the test fails, change preparation form before changing the nutritional objective.

## Nutrition-quality invariants retained

- The stock bridge must not achieve cheaper calories by materially degrading nutrition quality, training/sleep compatibility or long-term adherence.
- Stock foods should not silently displace necessary nutrient sources merely because their calories/macros fit.
- Birşah kefir stored product data = 120 mg calcium per 100 g; exact final kefir quantity is reopened rather than fixed at 800 g/day.
- Dardanel sardines remain a practical EPA/DHA candidate; stored product fact = 1420 mg EPA+DHA per 100 g. Exact sardine-day macro substitution must be reconciled rather than simply adding a can on top.
- Use iodized salt for normal cooking rather than forcing iodine by increasing total salt.
- Vitamin-D supplementation remains a separate explicit decision; this bridge does not silently activate D3/D3K2.
- The permanent/full-day plan must preserve adequate calcium, EPA/DHA, fruit/vegetable/legume diversity and other high-value nutrient sources rather than letting the stock unit crowd them out.

## Pre-start design residue — not yet execution

- **Next highest-value nutrition step:** integrate the validated stock unit into a complete workday/rest-day system around the live ~2971-kcal target, explicitly preserving micronutrient coverage and real schedule feasibility rather than merely filling remaining macros.
- Reconcile the exact physical-label composition of the oat flour, peanut butter and liquid pekmez before final Cronometer precision; exact bridge totals remain approximate until then.
- Resolve work-food refrigeration/cold-chain only for foods that still need it after the full-day architecture is chosen. Do not force the stock bridge itself to depend on work refrigeration.
- Perform one real stock-unit preparation/taste test; this is an empirical design test, not system activation.
- Any vitamin-D supplementation remains a separate explicit decision; no old D3K2/D3 proposal becomes active by inertia.
- Calorie changes should ultimately adapt to repeated bodyweight/training/recovery observations after real execution starts, not to pre-start planned rows or single measurements.

## Activation gate

Before nutrition can be marked `ACTIVE`:

1. The final plan is sufficiently grounded in current product/app state and is internally consistent.
2. Under the `PROTOCOL.md` system-model standard, no known or reasonably discoverable unresolved factor remains that could materially change feasibility, health value, adherence or the recommended implementation; remaining uncertainty is explicitly bounded.
3. Cronometer contains the intended plan without treating prefilled rows as already eaten.
4. Operational TickTick meal tasks are reviewed for the final plan; the paused meal project is reopened only at activation.
5. Calendar is used only for relevant timing and must not claim execution before Day 1.
6. Ron explicitly starts. Record the real Day 1 only then.
7. After activation, perform read-back/contradiction scan across canon -> Cronometer -> TickTick/Calendar projections.

## Durable modeling rules

- Cronometer is a composition/logging system, not a complete physiological model.
- For consequential diet changes, use the current `PROTOCOL.md` reasoning/write architecture rather than a domain-local checklist.
- Do not change the menu merely to make a stale model easier to reconcile.
- Publicly retrievable product facts should be checked directly before asking Ron to manually recover them.
- Product composition facts live in `references/nutrition/product-data.md`; scientific/method rationale lives in `references/nutrition/method.md`. Neither owns current execution state.

## Current OPEN / MONITOR

- **OPEN/READINESS:** stock-unit architecture is validated, but full-day integration is not yet system-validated; nutrition remains NOT STARTED.
- **OPEN/EMPIRICAL:** one real 60/20/20/30 home preparation test is needed for prep time/taste/texture/GI repeatability.
- **OPEN/WORK LOGISTICS:** work refrigeration/cold-chain remains unverified for any eventual work foods that require it; the stock unit itself no longer depends on this unknown.
- **OPEN/COMPOSITION:** identify/reconcile the exact physical-label composition of oat flour, peanut butter and liquid pekmez before final Cronometer precision.
- Do **not** run adherence/baseline retro until a real execution period exists.
- Continue collecting any useful bodyweight/training observations only if they are actually measured; do not infer missing values.
- Resting BP access/measurement remains a monitor item when a practical validated upper-arm measurement route is available; it is not a prerequisite for declaring the food system ready unless a new evidence-based reason makes it one.
- The former 2026-08-27 leave/medical-day plan is **not active**. A future medical day exists only after Ron chooses an actual date.
- Exact task completion, purchase status, actual food intake and current Cronometer totals must be read live when they matter.

## Operational projection status

- Live TickTick contains a control task stating that nutrition is not started and starts only after readiness + explicit Ron execution.
- The old baseline-retro task and the 2026-08-27 leave/medical-day tasks were superseded/cancelled, not treated as successful execution.
- The TickTick meal-project is paused/closed to prevent recurring meal reminders from impersonating current behavior; preserve it as a reusable future plan until readiness review decides what to keep/change.
- Calendar meal descriptions may describe future timing structure but must state that the nutrition system is not yet active; calendar slots are not execution evidence.
- Do not propagate the stock unit into operational projections until the full-day plan passes the activation gate.
- TickTick/Calendar are operational projections, not nutrition-policy owners.

## Revoked states that must not return as current

- “Nutrition system started 2026-08-16.”
- “16–22.08 was a completed real observational baseline.”
- “The 23.08 retro is overdue and must be completed.”
- “Passing a planned date automatically adopts V2 or starts the diet.”
- “2026-08-27 is a confirmed medical/leave day.”
- “The first 2026-08-24 stock-bridge macro split is execution-ready/final.”
- The old 100 g oat flour + 50 g peanut butter + 40 g Fibrelle + 40 g pekmez + 600 ml milk gainer as the default stock bridge.
- Wednesday or any other weekday as an independently hardcoded training truth inside nutrition state.
- D3K2 1000 IU or any other supplement plan as active without explicit decision + execution evidence.
- A prefilled Cronometer supplement/food row as proof of ingestion.
- Missing branded micronutrients interpreted as zero.
- K2 as a mandatory automatic companion to D3.