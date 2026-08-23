# Ron Nutrition — current-state canon

Updated: 2026-08-23 21:20 Europe/Istanbul
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

## Pre-start design candidates — not yet committed as execution

The previous “post-retro V2” framing is retired because no real baseline occurred. These remain design candidates to evaluate before activation, only if they improve the final ready plan:

1. Egg quantity/pattern should be finalized from the complete plan rather than inherited from the abandoned baseline framing.
2. Training-day carbohydrate choice should be finalized for practicality, nutrition and adherence before Day 1.
3. Any vitamin-D supplementation remains a separate explicit decision; no old D3K2/D3 proposal becomes active by inertia.
4. Sardine free-oil handling may be finalized before Day 1 only with explicit kcal/fat accounting if energy targets are meant to stay stable.
5. Calorie changes should ultimately adapt to repeated bodyweight/training/recovery observations after real execution starts, not to pre-start planned rows or single measurements.

## Activation gate

Before nutrition can be marked `ACTIVE`:

1. Final current plan is internally consistent and all materially relevant food/product quantities are resolved.
2. Required shopping/prep/transport/storage steps are practical enough to execute.
3. Cronometer contains the intended plan without treating prefilled rows as already eaten.
4. Operational TickTick meal tasks are reviewed for the final plan; the paused meal project is reopened only at activation.
5. Calendar is used only for relevant timing and must not claim execution before Day 1.
6. Ron explicitly starts. Record the real Day 1 only then.
7. After activation, perform read-back/contradiction scan across canon → Cronometer → TickTick/Calendar projections.

## Durable modeling rules

- Cronometer is a composition/logging system, not a complete physiological model.
- For consequential diet changes, use `PROTOCOL.md` write rules before writes: reality snapshot → exact before/after → dependency/accounting checks → commit → read-back.
- Do not change the menu merely to make a stale model easier to reconcile.
- Publicly retrievable product facts should be checked directly before asking Ron to manually recover them.
- Product composition facts live in `references/nutrition/product-data.md`; scientific/method rationale lives in `references/nutrition/method.md`. Neither owns current execution state.

## Current OPEN / MONITOR

- **OPEN/READINESS:** finish the pre-start readiness audit and resolve only blockers that materially prevent reliable Day 1 execution.
- Do **not** run adherence/baseline retro until a real execution period exists.
- Continue collecting any useful bodyweight/training observations only if they are actually measured; do not infer missing values.
- Resting BP access/measurement remains a monitor item when a practical validated upper-arm measurement route is available; it is not a prerequisite for declaring the food system ready unless a new evidence-based reason makes it one.
- The former 2026-08-27 leave/medical-day plan is **not active**. A future medical day exists only after Ron chooses an actual date.
- Exact task completion, purchase status, actual food intake and current Cronometer totals must be read live when they matter.

## Operational projection status

- Live TickTick now contains a control task stating that nutrition is not started and starts only after readiness + explicit Ron execution.
- The old baseline-retro task and the 2026-08-27 leave/medical-day tasks were superseded/cancelled, not treated as successful execution.
- The TickTick meal-project is paused/closed to prevent recurring meal reminders from impersonating current behavior; preserve it as a reusable future plan until readiness review decides what to keep/change.
- Calendar meal descriptions may describe future timing structure but must state that the nutrition system is not yet active; calendar slots are not execution evidence.
- TickTick/Calendar are operational projections, not nutrition-policy owners.

## Revoked states that must not return as current

- “Nutrition system started 2026-08-16.”
- “16–22.08 was a completed real observational baseline.”
- “The 23.08 retro is overdue and must be completed.”
- “Passing a planned date automatically adopts V2 or starts the diet.”
- “2026-08-27 is a confirmed medical/leave day.”
- Wednesday or any other weekday as an independently hardcoded training truth inside nutrition state.
- D3K2 1000 IU or any other supplement plan as active without explicit decision + execution evidence.
- A prefilled Cronometer supplement/food row as proof of ingestion.
- Missing branded micronutrients interpreted as zero.
- K2 as a mandatory automatic companion to D3.
