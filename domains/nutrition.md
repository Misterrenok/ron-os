# Ron Nutrition — current-state canon

Updated: 2026-08-26 Europe/Istanbul
Status: **REVIEW — NOT STARTED / PERMANENT BASE PROXY-VALIDATED + PREFILLED / LAUNCH SHOPPING LAYER PARTIALLY LOCKED**

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
- extra-virgin/ordinary olive oil: **35 g**
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
- **Vitamin D:** non-fish template ~302 IU; fatty-fish rotation helps but food alone may still not guarantee the target. Supplementation remains a separate explicit decision.
- **Iodine:** Cronometer estimate ~89 µg has low confidence because generic database foods poorly capture iodized salt/fortification. Use ordinary iodized salt rather than adding excess salt to chase a database number.
- **Long-chain omega-3:** non-fish template has ~1.07 g total omega-3 but does not guarantee adequate EPA/DHA; keep the fatty-fish rotation below.

## Frozen Atlantic mackerel variant — 2 days/week preferred
Frozen Atlantic mackerel is now preferred over canned sardines because the freezer already exists, frozen fillets are lower-cost per effective EPA/DHA serving, and preparation remains simple.

Preferred purchase candidate: **Balık Dünyası Dondurulmuş Uskumru Fileto 500 g** (Scomber scombrus). Exact current price is mutable and must be checked live at purchase time; do not store price here.

Evidence model:
- Dardanel's Scomber scombrus frozen fillet label: ~285 kcal / 19.6 P / 23 F per 100 g and **2000 mg EPA+DHA per 100 g**.
- Cronometer CNF/USDA Atlantic mackerel (same species) is ~205 kcal / 18.6 P / 13.89 F per 100 g with roughly **0.898 g EPA + 1.401 g DHA = 2.30 g EPA+DHA per 100 g**.
- Balık Dünyası label is ~209 kcal / 19.05 P / 15 F per 100 g. It does not publish EPA/DHA on the visible label, so **~2 g EPA+DHA per 100 g is a species-level proxy, not a product-specific lab claim**.

On a mackerel day, relative to the permanent non-fish base:
- add **100 g thawed/drained Atlantic mackerel fillet**
- reduce cooked chicken thigh **230 g -> 150 g**
- reduce olive oil **35 g -> 27 g**
- keep the rest unchanged

Approximate day after this substitution using the Balık Dünyası macro label + the verified base arithmetic:
- **~2957 kcal**
- **~148.1 g protein**
- **~101.9 g fat**
- carbs essentially unchanged

Two 100 g edible servings/week conservatively target about **4 g EPA+DHA/week (~0.57 g/day averaged across the week)** under the species-level proxy.

Practical handling: thaw only the portion needed, discard surface/glaze water, then weigh **100 g edible/drained fish**. Cook fully. Do not refreeze a thawed portion. A 500 g frozen pack should last roughly 2+ weeks at this cadence depending on actual glaze/yield; calibrate from the first pack once the kitchen scale exists.

### Sardine fallback
Dardanel Zeytinyağlı/Çanakkale Sardalya 125 g remains a valid shelf-stable fallback if mackerel is unavailable or convenience dominates. The previously verified whole-can model is about 266 kcal / 27.2 P / 17.2 F and ~1.78 g EPA+DHA per can. If using one can instead of mackerel, reduce cooked chicken by about **110 g** and olive oil by about **8 g** relative to the non-fish base. Do not add sardines on top of the full base.

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

If the oat/pekmez overlay and mackerel variant occur on the same day, combine both substitutions rather than adding either on top: chicken **150 g cooked**, olive oil **24 g**, whole-wheat bread **30 g**, cooked rice **360 g total**, plus 60 g oat flour + 30 g pekmez and 100 g thawed/drained mackerel.

Because Fibrelle and peanut butter are now low-stock, they are depletion-only ingredients. Do not automatically repurchase them. The old 60 g oat + 20 g Fibrelle + 20 g peanut butter + 30 g pekmez unit is retained only as historical arithmetic evidence (~518 kcal / 29.3 P / 15.9 F / 67.4 C); it is **not** an active daily anchor under the new permanent base unless a matching substitution is explicitly recomputed.

## Nutrition-quality guardrails
- Yogurt + eggs + chicken + lentils + grains + vegetables/fruit protect calcium, protein quality, B12/choline, iron/folate, potassium and broad micronutrient coverage without powder dependence.
- Orange plus carrot/cabbage/tomato is the default low-complexity vitamin-C/A/K pattern; seasonal equivalents are acceptable.
- Fiber on the new non-fish base is moderate-high (~38 g/day), lower than the old ~50 g proxy. If real execution causes bloating, pain, major stool change or training discomfort, reduce legumes/fiber temporarily and replace removed calories with lower-fiber rice/bread rather than abandoning the calorie/protein objective.
- D3/D3K2 remains separate; no supplement starts from this food-plan update alone.

## Launch purchase layer — candidate, not owned yet
Current-price research is intentionally not copied into canon because prices and availability are live mutable facts. Product identities/quantities below are launch candidates only until Ron actually buys them.

### Main hardware blocker
- **Kitchen scale candidate: Kiwi KKS-1125** — 5 kg capacity, 1 g resolution, tare, auto-off; sufficient for this plan. Do not pay materially more for cosmetic features. Purchase is not yet verified.

### High-impact food SKU candidates
- full-fat plain yogurt: **Carrefour Tam Yağlı Yoğurt 1.5 kg** or an equivalent cheaper full-fat plain yogurt with roughly similar macros
- eggs: cheapest **30-pack M-size** available
- rice: **Carrefour Kırık Pirinç 1 kg** or equivalent cheap broken/pilav rice; premium Baldo is not nutritionally worth the price premium for this use
- lentils: **Carrefour Kırmızı Mercimek 1 kg** or equivalent cheaper red lentils
- chicken: **skinless boneless thigh**; current candidate Lezita Tabaklı But Izgara Derisiz, but brand is not important if an equivalent cut is cheaper
- olive oil: cheapest reputable olive oil suitable for routine cooking; current candidate Carrefour Riviera 1 L
- fatty fish: **Balık Dünyası Dondurulmuş Uskumru Fileto 500 g**; Dardanel frozen Atlantic mackerel is the higher-price evidence-backed fallback
- bread and produce: **do not lock brand**; buy the cheapest fresh/label-compatible option because brand choice has low decision value here
- iodized table salt: any ordinary iodized salt if none is already at home

### First transitional basket after the kitchen scale is available
Designed around daily oat+pekmez stock depletion and two mackerel days/week. Quantities are starting purchase amounts, not a claim of exact weekly depletion until first-cook yields are measured.
- yogurt: **3 x 1.5 kg** (4.5 kg; ~9 days at 500 g/day)
- eggs: **30** (~10 days at 3/day)
- rice: **1 kg dry** to start; measure actual cooked yield
- red lentils: **1 kg dry**; measure actual cooked yield
- raw skinless boneless chicken thigh: **~2 kg** to start; after cooking, record cooked yield because the target is cooked weight
- olive oil: **1 L**
- frozen Atlantic mackerel: **1 x 500 g pack**
- whole-wheat bread: enough for **~210 g/week** during the stock-overlay phase
- white bread/somun: enough for **~560 g/week**
- bananas: about **1 kg/week purchased weight**
- oranges: about **1.5 kg/week purchased weight**
- carrots: **~0.7 kg/week**
- cabbage: **~0.7 kg/week**
- tomatoes: **~0.7 kg/week**
- iodized salt if absent
- do **not** buy more oat flour, pekmez, pea protein or peanut butter yet

Once the first batch is cooked and weighed, replace raw-to-cooked guesses with the actual observed yield; that one calibration is more valuable than repeatedly estimating from generic factors.

## Remaining requirements before ACTIVE
Assistant-owned branches should proceed without ceremony; only user-only facts should be handed back.

1. **Acquire/verify the kitchen scale.** This is now the main execution-enabling blocker for the gram-based plan.
2. **Purchase the launch basket or verify equivalent cheaper local SKUs.** Product availability is location-dependent and must be checked live at purchase time.
3. **Stock-label precision:** cheaply reconcile the exact oat-flour and pekmez labels when possible; this improves the temporary overlay but does not block the permanent base.
4. **Operational fit:** validate morning prep, work transport, evening batch cooking/freezing, storage and cleanup in real execution.
5. **Cronometer implementation:** the ideal non-fish template is already prefilled on 2026-08-27 and verified. Mackerel-day and stock-overlay rows should be instantiated only when their dates are chosen; prefill remains planning evidence until reconciled.
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
- Sardines or mackerel added on top without macro substitution.
- D3K2 or any supplement activated without an explicit decision + execution evidence.
