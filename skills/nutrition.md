# Skill — nutrition

Scope: nutrition planning, diet analysis, food purchasing and execution logistics.

1. For any nontrivial nutrition analysis/optimization, read `references/nutrition/method.md` before concluding. For any "ideal nutrition" / whole-system nutrition optimization request, also read `references/nutrition/ideal-nutrition-factor-map.md`. For any Nutrition Score / 100-point rubric request, additionally read `references/nutrition/ideal-nutrition-score.md` and keep quality, execution status and confidence separate.
2. Read `domains/nutrition.md` for current decisions, constraints and fallback.
3. Read live Cronometer for exact current diary/log/targets when the answer depends on them. Prefilled/planned diary rows are not proof of eating; Ron's direct execution report owns actual bought/eaten state unless a stronger direct record exists. For exact biometric event dates, use raw `get_biometrics_export`: windowed `get_biometrics` may carry a pre-range value to `start_date`, so a boundary-first point is not proof of a measurement that day.
4. Evaluate the shortest complete outcome system: nutrition quality and energy/protein/fat/micros/fiber, preparation, storage, transport, eating window, cleanup, adherence, price and actual outcome trend. Do not optimize a food/container/product in isolation when another stage can reverse feasibility.
5. Add schedule, finance, training or general-health packs when they materially change the decision.
6. Current retailer prices/availability require live checking at purchase time; product-specific nutrient claims prefer label/manufacturer evidence and missing fields remain UNKNOWN.

This skill owns procedure only, never the current menu or diary state.

## Whole-system completion gate

For any request to design, finish, validate, or call a nutrition system ready/final/closed, **do not stop at nutrient adequacy**. Before using completion language, run these mandatory passes and record a status for each:

1. **Composition:** energy, protein/AA, carbohydrate quality, fiber, fat quality, vitamins/minerals/trace elements, deficiency and excess.
2. **Food-pattern biology:** microbiota/fermentation/prebiotics, polyphenols/antioxidant-rich foods, food matrix/bioavailability, relevant antinutrients and food interactions.
3. **Long-horizon health:** oral/dental, cardiometabolic, GI, bone and other material organ-system effects; free sugar, sodium, refined/UPF exposure and contaminants.
4. **Food chemistry/safety:** cooking method, doneness, AGE/acrylamide/charring/oxidation where relevant, cooling, storage, thaw/reheat, cold chain, spoilage/mycotoxin risk and food-contact/container suitability.
5. **Dish engineering:** actual recipes, taste/texture/moisture, portion volume, eating time, utensils/mess, and whether the planned foods become acceptable meals rather than a nutrient list.
6. **Execution lifecycle:** shopping, pack sizes/open-life, batch quantities/raw-to-cooked yield, prep time, cleanup, storage capacity, transport, work/home equipment, schedule fit and fallback meals.
7. **Cross-system fit:** work/commute/training/sleep/calendar constraints, hydration/sweat, adherence/cognitive load, cost and availability.
8. **Validation:** what remains unknowable until execution, what will be measured in week 1 and ~2 weeks, and explicit thresholds for changing the system.

A pass may be PASS, OPEN-EMPIRICAL, UNKNOWN-BLOCKER, or NOT MATERIAL. PASS requires evidence or a defensible bounded model; OPEN-EMPIRICAL is acceptable only when the issue genuinely cannot be resolved before execution and has a concrete measurement rule.

### Dependency-propagation rule

Any material change to a food, amount, timing, supplement, cooking method, storage route, or schedule must trigger a **downstream impact pass** before the new variant becomes the baseline. Recheck every affected layer: nutrient totals/ULs, GI/GL and fiber, microbiota/polyphenol/oral effects where relevant, meal volume/taste, prep yield/time, packaging/open-life, transport/storage safety, schedule, cost/procurement, and live-app instructions. Never leave old recipes, shopping quantities, reminders or schedule text attached to a new nutrient model.

### Omission audit before closure

Before declaring the system finished, ask independently:
- What material **benefit** class have I not evaluated?
- What material **harm/exposure** class have I not evaluated?
- What **execution stage** from purchase -> cook -> cool/store -> carry -> eat -> clean/replenish has not been validated?
- What changed recently that may have made an older recipe, quantity, pack size, task or calendar slot stale?
- Could any omitted factor plausibly change a concrete choice, safety rule, adherence, schedule or expected outcome?

If yes, continue. If no material omitted class remains, freeze the design and move to execution instead of searching indefinitely.
