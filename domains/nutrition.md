# Ron Nutrition — current-state canon

Updated: 2026-08-25 Europe/Istanbul
Status: **REVIEW — NOT STARTED / FULL-DAY DESIGN READY-PENDING**

## Ownership contract
This file is the single GitHub owner of nutrition policy/current fallback state. Live Cronometer owns exact diary/target state; TickTick/Calendar own operational projections; Ron's explicit real-world report owns actual execution. Planned/prefilled rows never prove intake.

## Current execution state
- Nutrition has **not started**. No Day 1 exists until Ron explicitly begins executing the ready system.
- Live Cronometer read-back on 2026-08-25: **0 food entries / 0 kcal consumed**; effective target **2971 kcal / 148.55 g protein / 99.03 g fat / 371.38 g carbs**.
- D3/D3K2 or any other supplement is not active by inertia; vitamin-D supplementation remains a separate explicit decision.
- Calorie/macro targets are control proxies, not the final objective; after real execution begins, adjust from repeated bodyweight/training/recovery evidence rather than planned rows or single measurements.

## Temporary stock-depletion phase
Already-owned oat flour, liquid pekmez, peanut butter and Fibrelle pea protein are used by **substitution, not addition**. This phase is temporary; when a stock ingredient is depleted, recompute rather than increasing the other stock foods arbitrarily.

### At-home stock unit — max one/day
- oat flour **60 g**
- Fibrelle pea protein **20 g**
- peanut butter **20 g**
- liquid pekmez **30 g**
- water as needed

Using current verified proxies: approximately **518 kcal / 29.3 P / 15.9 F / 67.4 C / 8.0 g fiber**.

Preparation: cook oat flour with water to a fully cooked porridge/pudding consistency; mix Fibrelle after cooking; finish with peanut butter + pekmez. Physical package instructions override generic cooking timing. Prefer morning/home placement. Missing a serving does not create a calorie debt and is not doubled later.

## Full-day non-fish design — proxy-validated
This design deliberately avoids any requirement for a work refrigerator. All work foods are shelf-stable until eaten; cooked/perishable foods stay at home.

Daily quantities:
- stock unit above: **1 serving**
- Birşah plain kefir: **600 g**
- Nimet whole-wheat bread: **150 g**
- plain white bread/somun: **100 g**
- roasted chickpeas/leblebi: **40 g**
- additional Fibrelle: **40 g** mixed with water at work
- cooked lentils: **100 g cooked weight**
- rice: **230 g cooked weight**
- olive oil: **42 g**
- eggs: **2**
- banana: **120 g edible portion**
- orange: **~200 g edible portion**
- mixed vegetables: **300 g/day**, default cheap mix = carrot + cabbage + tomato; equivalent seasonal substitutions are allowed if nutrient coverage is preserved
- iodized salt for ordinary cooking; do not increase total salt merely to chase iodine

Current proxy arithmetic: approximately **2954 kcal / 148.7 g protein / 98.6 g fat / 373.2 g carbs**. This is intentionally close rather than forcing false gram-level precision around a 2971-kcal app target.

### Default timing without work cold-chain
**Morning at home**
- stock unit
- 2 eggs
- ~400 g kefir
- ~15 g of the daily olive oil used with the home meal

**Work — split across the day**
- 150 g whole-wheat bread
- 100 g plain white bread/somun; place most/all of this toward the late-afternoon/pre-training window when useful
- 40 g leblebi
- 40 g Fibrelle + water
- banana 120 g
- orange ~200 g
- ~15 g of the daily olive oil can be used with bread if practical; otherwise keep that oil at home

**Home evening meal**
- rice 230 g cooked
- lentils 100 g cooked
- vegetables 300 g
- remaining kefir (~200 g)
- remaining olive oil

Meal-clock times are not hardcoded here; if training timing changes, move the late work carbohydrate portion rather than changing the whole menu. Avoid making the final pre-sleep meal unnecessarily larger when calories can be eaten earlier.

## Sardine variant — 2 days/week baseline
Dardanel Çanakkale Sardalya 125 g is used as an EPA/DHA/B12-rich substitution, not an addition.

On a sardine day:
- add **1 whole 125 g can** Dardanel sardines
- reduce the **additional work Fibrelle from 40 g -> 10 g**
- reduce olive oil **42 g -> 26 g**
- keep the rest of the day unchanged

Current proxy arithmetic: approximately **2954 kcal / 150.4 P / 97.0 F / 373.6 C**. One 125 g can provides about **1.78 g EPA+DHA** from the stored manufacturer value; two cans/week average about **0.51 g/day** across the week. The SKU is boneless, so generic bone-calcium must not be credited to it.

If sardines are disliked, unavailable or materially more expensive, reopen the omega-3 source rather than simply deleting it from the system.

## Nutrition-quality guardrails
- Kefir + eggs + legumes/grains + vegetables/fruit are kept to protect calcium, B12/choline, iron/folate, potassium and broad micronutrient coverage while stock is depleted.
- Orange plus carrot/cabbage/tomato is the default low-complexity vitamin-C/A/K coverage pattern; seasonal equivalents are acceptable.
- Fiber is relatively high on the current proxy model (~50 g/day). If the real single-day test causes bloating, pain, major stool change or training discomfort, reduce legumes/fiber temporarily and replace the removed calories with lower-fiber rice/bread rather than abandoning the calorie/protein objective.
- The permanent post-stock diet should use less reliance on pea protein and should re-diversify protein sources according to cost, adherence and micronutrient value.
- D3/D3K2 remains separate; no supplement starts from this food-plan update alone.

## Remaining gates before ACTIVE
1. **Physical labels:** reconcile the exact oat-flour, peanut-butter and pekmez labels; current stock-unit totals remain proxies until then. Exact selected white-bread/leblebi entries should also be resolved before final Cronometer precision.
2. **Empirical stock-unit test:** prepare one real 60/20/20/30 serving and report prep time, taste/texture, satiety/GI response and whether it is repeatable. This test is design evidence, not Day 1.
3. **Cronometer implementation:** once labels/design survive the test, enter the intended plan without presenting it as already eaten; verify day-level macros/micros by read-back.
4. **Operational activation:** review/reopen only the meal reminders/tasks that serve the final system; do not let TickTick/Calendar imply execution before Day 1.
5. **Explicit start:** Ron explicitly starts; only then record Day 1 and begin the feedback loop.

## Feedback policy after start
- Do not change calories from one noisy weight reading.
- Use repeated morning bodyweight plus training/recovery/appetite/digestion evidence.
- If repeated evidence shows weight/performance/recovery moving outside the intended direction, adjust primarily via rice/bread/oil quantities while preserving protein and micronutrient guardrails, then verify again.
- Missed meals are not repaid by doubling the next serving.

## Revoked states that must not return
- “Nutrition started 2026-08-16.”
- “16–22 Aug was a real baseline.”
- Any prefilled Cronometer row as proof of intake.
- The retired large carried gainer as the default bridge.
- A work-fridge assumption as a requirement for the current design.
- Sardines added on top without macro substitution.
- D3K2 or any supplement activated without an explicit decision + execution evidence.
