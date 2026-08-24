# Ron Nutrition — current-state canon

Updated: 2026-08-24 20:18 Europe/Istanbul
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

- 2026-08-20 product/data corrections remain representation/model fixes, not evidence that the diet started.
- Exact product label/manufacturer data override a donor for the same nutrient. A suitable full-profile donor may fill only unreported fields. Missing branded/custom nutrients are `UNKNOWN`, never physiological zero.
- Prefilled/future Cronometer entries are PLAN. After actual Day 1, logged rows may become execution evidence only after reconciliation with what Ron actually consumed.
- Dardanel current SKU is boneless; do not credit bone-derived calcium from a generic sardine donor.
- Current Cronometer implementation details/IDs belong to live Cronometer and `references/nutrition/product-data.md`; read live before diary mutations.
- Earlier analytical calorie/macro overlays are dated design estimates, not proof of actual intake and not authoritative live Cronometer output.

## Current pre-start stock-usage bridge — direction approved, execution design REOPENED

Ron explicitly chose on 2026-08-24 to use already-owned **oat flour, liquid pekmez, peanut butter and Fibrelle pea protein** before doing the full ideal-plan restock, provided nutrition quality, target accounting, timing, prep practicality, storage, transport, taste/adherence and total execution burden are preserved. The governing rule is **substitution, not addition**: these stock foods replace purchased calories/macros rather than being layered on top of the eventual ideal diet.

The live Cronometer target observed on 2026-08-24 was about **2971 kcal / 148.55 g protein / 99.03 g fat / 371.38 g carbs**. Live Cronometer remains authoritative and must be re-read at activation; these numbers are only the dated design basis.

### 2026-08-24 execution-audit correction

The earlier bridge sketch that used roughly oat flour 150 g, Fibrelle 40 g, peanut butter 40 g, pekmez 50 g, kefir 800 g, banana 240 g, eggs about 2, cooked rice 300 g, cooked chicken 100 g, vegetables 250 g, olive oil 25 g and whole-wheat bread 100 g produced an approximately correct macro total, but **it did not pass a full execution-surface audit and must not be treated as the ready diet**.

Material weaknesses exposed before activation included:
- daily transport/storage burden was not fully modeled (especially large kefir volume and perishable work food);
- two separate oat-flour eating blocks were accepted before optimizing batch preparation, texture/taste, containers and eating speed;
- oil/pekmez handling and leakage/mess friction were not fully designed;
- refrigeration/cold-chain availability at work was not verified and must not be silently assumed;
- cleanup, evening reset, replenishment and missed-prep recovery were not fully traced;
- a numerically correct macro/timing plan was prematurely described as practically ready.

Therefore the **direction** (consume existing stock economically while preserving nutrition) remains approved, but the **exact recipe/portion/timing implementation is reopened**. Do not activate or project the retired sketch into Cronometer/TickTick/Calendar as the final plan.

### Required execution-ready design standard

Before this bridge can be called ready, walk the actual normal day end-to-end using the current schedule and environment:
**acquire/replenish -> home storage -> batch prep -> cooling/storage -> morning pack -> commute/transport -> work storage -> each eating window -> pre-training compatibility -> post-training/sleep compatibility -> dishes/cleanup -> next-day reset**.

For every material step account for:
- active prep time and unattended cooking time;
- taste/texture and likely adherence over repeated days;
- number/weight/bulk of containers and liquids carried;
- leakage/mess risk;
- refrigeration or insulated transport requirement;
- food-safety/storage life;
- eating speed in the actual available window;
- reheating/equipment needs;
- cleanup burden;
- stock depletion/replenishment and substitution when one leftover runs out;
- recovery from at least one plausible disruption such as missed prep, no refrigeration, compressed meal window, depleted ingredient or skipped meal.

Any material burden discovered must be eliminated, compensated or left explicitly OPEN; otherwise nutrition remains not ready.

### Nutrition-quality invariants retained for the bridge

- Do not let the stock foods displace vegetables/fruit, calcium-containing food, iodized salt, or an EPA/DHA source.
- Birşah kefir stored product data = 120 mg calcium per 100 g; exact final kefir quantity is reopened rather than fixed at 800 g/day.
- Dardanel sardines remain a practical EPA/DHA candidate; stored product fact = 1420 mg EPA+DHA per 100 g. Exact sardine-day macro substitution must be reconciled rather than simply adding a can on top.
- Use iodized salt for normal cooking rather than forcing iodine by increasing total salt.
- Vitamin-D supplementation remains a separate explicit decision; this bridge does not silently activate D3/D3K2.
- Oat flour should not be assumed ready-to-eat raw; preparation must follow the actual product/food-safety route used in the final design.

## Pre-start design candidates — not yet committed as execution

1. Build a new stock-usage bridge that passes the full execution lifecycle above; do not resurrect the retired macro-only split by inertia.
2. Identify/reconcile the exact physical-label composition of the oat flour, peanut butter and liquid pekmez; exact macro totals remain approximate until then.
3. Finalize egg quantity/pattern from the complete plan rather than inheriting it from the retired sketch.
4. Finalize training-day carbohydrate timing for practicality, digestion and adherence using the current training owner/live schedule.
5. Any vitamin-D supplementation remains a separate explicit decision; no old D3K2/D3 proposal becomes active by inertia.
6. Sardine free-oil handling and sardine-day macro substitution must be finalized with explicit kcal/fat accounting if energy targets are meant to stay stable.
7. Calorie changes should ultimately adapt to repeated bodyweight/training/recovery observations after real execution starts, not to pre-start planned rows or single measurements.

## Activation gate

Before nutrition can be marked `ACTIVE`:

1. Final current plan is internally consistent and all materially relevant food/product quantities are resolved enough for reliable execution.
2. The plan passes the full execution-surface lifecycle and at least one relevant failure-path check; shopping/prep/storage/transport/eating/cleanup/replenishment are practical in the actual schedule.
3. Material physical-label/macronutrient uncertainty for the stock bridge is reconciled or explicitly bounded so it cannot invalidate the target.
4. Cronometer contains the intended plan without treating prefilled rows as already eaten.
5. Operational TickTick meal tasks are reviewed for the final plan; the paused meal project is reopened only at activation.
6. Calendar is used only for relevant timing and must not claim execution before Day 1.
7. Ron explicitly starts. Record the real Day 1 only then.
8. After activation, perform read-back/contradiction scan across canon -> Cronometer -> TickTick/Calendar projections.

## Durable modeling rules

- Cronometer is a composition/logging system, not a complete physiological model.
- For consequential diet changes, use `PROTOCOL.md` write rules before writes: reality snapshot -> exact before/after -> dependency/accounting checks -> commit -> read-back.
- Do not change the menu merely to make a stale model easier to reconcile.
- Publicly retrievable product facts should be checked directly before asking Ron to manually recover them.
- Product composition facts live in `references/nutrition/product-data.md`; scientific/method rationale lives in `references/nutrition/method.md`. Neither owns current execution state.

## Current OPEN / MONITOR

- **OPEN/READINESS:** produce and audit the replacement execution-ready stock bridge; nutrition remains NOT STARTED.
- **OPEN/EXECUTION:** work refrigeration/cold-chain route, real batch-prep format/time, taste/texture, carry burden, eating speed, cleanup/reset and disruption recovery are not yet fully verified.
- **OPEN/COMPOSITION:** identify/reconcile the exact physical-label composition of the oat flour, peanut butter and liquid pekmez; until then bridge macros are approximate.
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
- Do not propagate the retired 2026-08-24 stock-bridge split into operational projections as a final menu.
- TickTick/Calendar are operational projections, not nutrition-policy owners.

## Revoked states that must not return as current

- “Nutrition system started 2026-08-16.”
- “16–22.08 was a completed real observational baseline.”
- “The 23.08 retro is overdue and must be completed.”
- “Passing a planned date automatically adopts V2 or starts the diet.”
- “2026-08-27 is a confirmed medical/leave day.”
- “The first 2026-08-24 stock-bridge macro split is execution-ready/final.”
- Wednesday or any other weekday as an independently hardcoded training truth inside nutrition state.
- D3K2 1000 IU or any other supplement plan as active without explicit decision + execution evidence.
- A prefilled Cronometer supplement/food row as proof of ingestion.
- Missing branded micronutrients interpreted as zero.
- K2 as a mandatory automatic companion to D3.