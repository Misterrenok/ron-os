# Ron Nutrition — current-state canon

Updated: 2026-08-26 Europe/Istanbul
Status: **REVIEW — NOT STARTED / PERMANENT BASE PROXY-VALIDATED + PREFILLED**

## Ownership contract
This file is the single GitHub owner of nutrition policy/current fallback state. Live Cronometer owns exact diary/target state; TickTick/Calendar own operational projections; Ron's explicit real-world report owns actual execution.

Cronometer workflow preference: it is intentionally allowed to contain the **ideal planned day in advance** because this minimizes daily logging friction. Ron deletes foods/servings that were **not** eaten. Prefilled rows by themselves do not prove intake before reconciliation; the remaining reconciled rows are intended to become the practical execution record.

## Current execution state
- Nutrition has **not started**. No Day 1 exists until Ron explicitly begins executing the ready system.
- Live Cronometer read-back on **2026-08-26**: today has **0 food entries / 0 kcal consumed**; effective target remains **2971 kcal / 148.55 g protein / 99.03 g fat / 371.38 g carbs**.
- A planning-only template was prefilled on **2026-08-27** and read back. This is implementation evidence, not evidence that the food was eaten or that Day 1 began.
- D3/D3K2 or any other supplement is not active by inertia; supplementation remains a separate explicit decision.
- Calorie/macro targets are control proxies, not the final objective. After real execution begins, adjust from repeated bodyweight/training/recovery/appetite/digestion evidence rather than planned rows or single measurements.

## Current user-only operational facts — last direct report 2026-08-25
- **Oat flour:** large remaining stock; exact grams unknown. Product identity: **İpek Değirmen 5 Kg Doğal Yulaf Unu**. Exact label values remain unresolved.
- **Liquid grape pekmez:** large remaining stock; exact grams unknown. Product identity: **Sabıroğlu Üzüm Pekmezi 5 KG**. Exact label values remain unresolved.
- **Pea protein:** only a small amount remains. Product: **Fibrelle Bezelye Proteini Tozu 1 kg**. Do not build the permanent diet around it or automatically repurchase it.
- **Peanut butter:** only a small amount remains. Product: **Deva Çiftliği / Richnut şekersiz-katkısız %100 fıstık ezmesi**. Do not build the permanent diet around it or automatically repurchase it.
- Other foods in the permanent design have **not yet been confirmed purchased**.
- **No kitchen food scale currently available.** Exact gram-based execution therefore requires acquiring a cheap scale or deliberately accepting lower precision.
- **No bodyweight scale currently available.** Do not prescribe home morning weigh-ins as if the hardware exists.
- **No waist tape currently available.** Waist tracking is unavailable until a tape/equivalent is acquired.
- **Microwave/reheating capability and freezer are available.** Batch cooking + freezing is feasible and preferred when it saves meaningful total effort.

Operational objective: optimize **total pragmatic cost**, not sticker price alone. Time, preparation, cleanup, storage, transport, adherence and cognitive load count.

## Permanent non-fish base — current best design
This is the stable post-stock base. It does **not** structurally depend on Fibrelle, peanut butter, oat flour or pekmez. It deliberately avoids any need for a workplace refrigerator.

Daily quantities:
- plain whole-milk yogurt: **500 g**
- eggs: **3 large / ~150 g edible**
- cooked white rice: **410 g total**
- whole-wheat bread: **120 g**
- plain white bread/somun: **80 g**
- roasted skinless chicken thigh meat: **230 g cooked**
- cooked lentils: **200 g cooked**
- extra-virgin olive oil: **35 g**
- banana: **120 g edible**
- orange: **200 g edible**
- vegetables: **300 g/day**, default low-complexity mix = carrot 100 g + cabbage 100 g + tomato 100 g; seasonal equivalents are allowed when broad nutrient coverage is preserved
- iodized salt for ordinary cooking; do not increase total salt merely to chase iodine

### Default timing without work cold-chain
**Morning at home**
- yogurt 500 g
- 3 eggs
- rice 200 g cooked
- olive oil 15 g

**Work — split across the day**
- whole-wheat bread 120 g
- white bread/somun 80 g
- banana 120 g
- orange 200 g

**Home evening meal**
- chicken thigh 230 g cooked
- lentils 200 g cooked
- rice 210 g cooked
- vegetables 300 g
- olive oil 20 g

Meal-clock times are not hardcoded. If training timing changes, move carbohydrate portions rather than redesigning the entire menu.

### Cronometer verification — 2026-08-27 planning template
Exact live read-back of the above generic-food implementation:
- **2961.6 kcal**
- **148.8 g protein**
- **101.4 g fat**
- **371.9 g total carbs**
- **37.8 g fiber**

This is close enough to the 2971-kcal target to avoid false precision. Do not contort the menu to eliminate a ~9 kcal database delta.

Major read-back coverage was strong: calcium ~1181 mg, potassium ~4336 mg, iron ~17.7 mg, magnesium ~396 mg, zinc ~16.8 mg, selenium ~172 µg, vitamin C ~186.6 mg, folate ~873 µg, B12 ~4.48 µg and choline ~841 mg. The main remaining food-pattern gaps are:
- **Vitamin D:** non-fish template ~302 IU; sardine rotation helps but food alone may still not guarantee the target. Supplementation remains a separate explicit decision.
- **Iodine:** Cronometer estimate ~89 µg has low confidence because generic database foods poorly capture iodized salt/fortification. Use ordinary iodized salt rather than adding excess salt to chase a database number.
- **Long-chain omega-3:** non-fish template has ~1.07 g total omega-3 but does not guarantee adequate EPA/DHA; keep the sardine rotation below.

## Sardine variant — 2 days/week baseline
Dardanel Çanakkale Sardalya 125 g remains the preferred EPA/DHA-rich rotation from the previously verified manufacturer-backed model. It is a substitution, not an addition.

On a sardine day, relative to the permanent non-fish base:
- add **1 whole 125 g can** Dardanel sardines
- reduce cooked chicken thigh **230 g -> 120 g**
- reduce olive oil **35 g -> 27 g**
- keep the rest unchanged

Why this substitution: the previously verified whole-can model is approximately equivalent to the removed **110 g chicken + 8 g oil**, so day-level calories/macros remain essentially unchanged while adding about **1.78 g EPA+DHA per can**. Two cans/week average about **0.51 g EPA+DHA/day** across the week.

The Dardanel SKU is boneless; do not credit generic bone-calcium from canned-sardine database entries to this product. If sardines are disliked, unavailable or materially more expensive, reopen the omega-3 source rather than silently deleting it.

## Temporary oat-flour + pekmez stock overlay
Owned oat flour and pekmez are used by **substitution, not addition**. Permanent food structure remains the base above.

Current proxy overlay for one at-home serving:
- add oat flour **60 g**
- add grape pekmez **30 g**
- remove whole-wheat bread **90 g** from that day
- remove cooked rice **50 g** from that day
- remove olive oil **3 g** from that day

Using current database proxies for oats + grape molasses, the resulting day is approximately **2952 kcal / 148.7 P / 100.2 F / 373.9 C**. This is operationally adequate, but it is explicitly **proxy-level** until the exact İpek Değirmen and Sabıroğlu label values are reconciled. Do not claim gram-perfect precision from the proxy.

Preparation: cook oat flour with water to a fully cooked porridge/pudding consistency; add pekmez after cooking. Prefer at-home placement. Missing a serving does not create a calorie debt and is not doubled later.

Because Fibrelle and peanut butter are now low-stock, they are depletion-only ingredients. Do not automatically repurchase them. The old 60 g oat + 20 g Fibrelle + 20 g peanut butter + 30 g pekmez unit is retained only as historical arithmetic evidence (~518 kcal / 29.3 P / 15.9 F / 67.4 C); it is **not** an active daily anchor under the new permanent base unless a matching substitution is explicitly recomputed.

## Nutrition-quality guardrails
- Yogurt + eggs + chicken + lentils + grains + vegetables/fruit protect calcium, protein quality, B12/choline, iron/folate, potassium and broad micronutrient coverage without powder dependence.
- Orange plus carrot/cabbage/tomato is the default low-complexity vitamin-C/A/K pattern; seasonal equivalents are acceptable.
- Fiber on the new non-fish base is moderate-high (~38 g/day), lower than the old ~50 g proxy. If real execution causes bloating, pain, major stool change or training discomfort, reduce legumes/fiber temporarily and replace removed calories with lower-fiber rice/bread rather than abandoning the calorie/protein objective.
- D3/D3K2 remains separate; no supplement starts from this food-plan update alone.

## Remaining requirements before ACTIVE
Assistant-owned branches should proceed without ceremony; only user-only facts should be handed back.

1. **Measurement hardware:** a kitchen scale is now the main execution-enabling item for the gram-based plan. Bodyweight scale and waist tape are valuable feedback tools but separate from the food-prep blocker.
2. **Purchase/SKU lock:** select actual yogurt, bread, chicken, lentils, rice, fruit/veg and iodized-salt SKUs using current price/availability and total pragmatic cost; do not store mutable prices here.
3. **Stock-label precision:** cheaply reconcile the exact oat-flour and pekmez labels when possible; this improves the temporary overlay but does not block the permanent base.
4. **Operational fit:** validate morning prep, work transport, evening batch cooking/freezing, storage and cleanup in real execution.
5. **Cronometer implementation:** the ideal non-fish template is already prefilled on 2026-08-27 and verified. Fish-day and stock-overlay rows should be instantiated only when their dates are chosen; prefill remains planning evidence until reconciled.
6. **Operational activation:** reminders/tasks should serve the final system and must not imply execution before Day 1.
7. **Explicit start:** Ron explicitly starts; only then record Day 1 and begin the feedback loop.

## Feedback policy after start
- Do not change calories from one noisy weight reading.
- Use the best repeatable bodyweight method actually available; if a home scale is acquired, morning after-toilet/pre-food measurements are preferred for lower noise.
- Combine weight trend with training/recovery/appetite/digestion and, once available, waist trend.
- If repeated evidence shows weight/performance/recovery moving outside the intended direction, adjust primarily via rice/bread/oil while preserving protein and micronutrient guardrails, then verify again.
- Missed meals are not repaid by doubling the next serving.

## Revoked states that must not return
- “Nutrition started 2026-08-16.”
- “16–22 Aug was a real baseline.”
- Treating a merely prefilled Cronometer row as proof that food was eaten before reconciliation.
- Forcing a log-from-zero workflow when prefill + delete-uneaten is the confirmed lower-friction method.
- The retired large carried gainer as the default bridge.
- A work-fridge assumption as a requirement.
- Fibrelle/peanut butter as permanent structural foods by inertia.
- Sardines added on top without macro substitution.
- D3K2 or any supplement activated without an explicit decision + execution evidence.
