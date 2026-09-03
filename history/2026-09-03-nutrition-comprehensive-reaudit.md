# Nutrition comprehensive re-audit — 2026-09-03

Status: **AUDIT EVIDENCE / PROGRAM NOT YET RE-LOCKED**

Purpose: preserve the evidence and open decisions from the 2026-09-03 full nutrition-system review without silently changing `domains/nutrition.md` or any live executor. Current nutrition owner remains authoritative until the missing user-only inputs are resolved and the plan is explicitly re-locked.

## Runtime verification
- Live Google Calendar still marks the nutrition system as **NOT STARTED / future meal slots paused**. Work/schedule structure remains compatible with the owner: work Mon–Sat 07:30–18:00; training slots Mon/Tue/Thu/Fri 19:30–21:00; wind-down through 22:00.
- The future Sunday cooking placeholder is only 30 min, while the current nutrition owner requires roughly **60–90 min for the first batch**. This is not a current execution conflict because the nutrition events are paused, but it must be reconciled on activation.
- The future 21:00 nutrition Calendar event still contains obsolete `gainer` wording; the current owner instead uses the post-training dinner. Reconcile on activation.
- Live Cronometer read failed on 2026-09-03 with an MCP 404; exact current app targets/diary are therefore **UNVERIFIED**.
- Live Liftosaur read is subscription-gated; post-2026-08-29 training state remains **UNKNOWN** beyond the dated owner/export.

## Current plan: what remains strong
- Keep **3100 kcal / 148.55 P / 99.03 F / 403.63 C** only as a calibrated starting hypothesis, not measured TDEE.
- Keep the body-mass feedback loop: two adherent weeks at launch; adjust by ~150 kcal only from weight/waist trend, not day-to-day noise.
- Protein is already more than sufficient if bodyweight remains near the last-confirmed ~68 kg; evidence does not justify raising it further.
- Food-safety architecture remains strong: cold chain, two cold sources, probe thermometer, refrigerator-first lunch, early-week refrigerated portions plus later frozen portions, cooked poultry >=74 C, fallback bought lunch.
- Fruit/vegetable quantity, legumes, oats, olive oil, fermented dairy and fish make the base nutritionally strong.
- Employer meal cash is economically fungible; optimize total expected value, not grocery spend alone.

## Material gaps / uncertainties found
1. **Energy requirement is not directly known.** Current weight, current training execution and actual mass trend are not live-verified.
2. **Micronutrients are not fully closed.** The last complete model suggested vitamin D likely low, iodine uncertain, vitamin E low, magnesium/vitamin K near target. Exact current 3100-kcal composition needs reconciliation once Cronometer works or labels/quantities are available.
3. **Hydration/electrolytes are not designed yet.** Use an individualized sweat-rate/body-mass method rather than a fixed high water target.
4. **Taste and sensory adherence are unverified.** The plan exceeds ~2 kg food/day and relies on a cold chicken/rice/lentil lunch; no real cold-meal taste test has been confirmed.
5. **Repetition/plant diversity can improve.** Rotate part of the 300 g vegetables through leafy greens, red/purple vegetables and alliums; consider partial rice↔bulgur/other-grain rotation without reducing calories.
6. **Daily white-rice exposure is high.** FDA notes rice accumulates arsenic more readily than other grains; variety across grains is a sensible long-run robustness measure. Excess-water cooking can reduce inorganic arsenic but also removes enriched nutrients, so grain rotation is preferable as the default design lever unless there is a product-specific reason otherwise.
7. **Three eggs/day are not a closed longevity optimum.** Short-term data in young healthy adults show 3 eggs/day can raise LDL-C while not necessarily raising ApoB; observational evidence at high egg intakes is mixed. Keep this as an open trade-off until taste/cost and future lipid/ApoB data are available; do not call it harmful or fully cleared.
8. **Vitamin-E repair needs exact dosing.** NIH lists ~7.4 mg vitamin E per 28 g dry-roasted sunflower seeds. If the prior modeled gap (~4.7 mg/day) persists, roughly 15–20 g edible kernels is the relevant food-first range; reconcile calories by reducing some olive oil rather than simply adding calories.
9. **Vitamin D remains an open gap-specific decision.** Do not auto-start the previously deferred D3/K2 plan without the separate supplement/clinical decision or new lab evidence.
10. **Iodine requires the actual iodized-salt label/amount.** Do not infer iodine adequacy from generic salt.
11. **Clinical personalization is incomplete.** No confirmed post-2026-08-27 blood panel exists in recovered evidence; latest general-health owner has no verified current diagnosis/medication/lab state.

## Fresh market evidence — 2026-09-03
Time-sensitive; refresh again at purchase.
- ŞOK Mis full-fat yogurt 3000 g page: **192 TL**.
- ŞOK Anadolu Çiftliği M eggs 30-pack: **149 TL**.
- CarrefourSA Lezita chicken fillet page currently: **215.90 TL/kg**; the previously stored 179.90 TL/kg promotion is not currently visible.
- ŞOK Balık Dünyası Atlantic mackerel fillet: page shows **129 TL**, 500 g gross, **250 g drained weight**.
- ŞOK Balık Dünyası frozen sardines: page shows **59 TL**, 500 g gross, **400 g drained weight**. This is a major cost-per-edible-gram candidate if taste/prep/stock are acceptable.
- Both Atlantic mackerel and sardine are on FDA's lower-mercury `Best Choices` list. NIH omega-3 data supports both as rich EPA+DHA sources.
- Because multiple grocery prices and local stock are dynamic, the old all-in weekly/basket total is **not current truth**. Reprice the exact basket immediately before purchase.

Public sources consulted:
- WHO Healthy diet, updated 2026-01-26: https://www.who.int/news-room/fact-sheets/detail/healthy-diet
- Morton et al., BJSM 2018 protein meta-analysis: https://bjsm.bmj.com/content/52/6/376
- Helms et al., Sports Med Open 2023 energy-surplus trial: https://pubmed.ncbi.nlm.nih.gov/37914977/
- NIH ODS Vitamin D / Vitamin E / Iodine / Omega-3 fact sheets: https://ods.od.nih.gov/
- FDA arsenic-in-rice guidance: https://www.fda.gov/food/environmental-contaminants-food/what-you-can-do-limit-exposure-arsenic
- USDA food-safety basics: https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/steps-keep-food-safe
- FDA/EPA fish advice: https://www.fda.gov/food/consumers/advice-about-eating-fish
- AHA fish/omega-3 guidance: https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/fish-and-omega-3-fatty-acids

## User-only inputs needed before final lock
Only ask for items not recoverable from current owners:
1. Current morning bodyweight (ideally 3 consecutive mornings if available) and current waist if measurable.
2. Actual training during the last 2 weeks: how many sessions/week, whether the 4-day plan is truly running, and whether 10–12k workday steps still roughly holds.
3. Taste/adherence: foods disliked/liked; tolerance for cold chicken/rice/bulgur/lentils/fish; preferred spice/sauce profiles; appetite/fullness and whether large meals are hard.
4. Current drinks: approximate water/day plus tea, coffee, ayran, sweet drinks/energy drinks.
5. Work logistics right now: fridge still usable; any employer warning/change; current status of insulated bag, two cold sources, probe thermometer and food container.
6. Kitchen equipment actually available: stove, oven/air fryer, pots/pan, rice cooker, blender, kitchen scale.
7. Since 2026-08-18: any new diagnosis, medication, allergy/intolerance or GI problem; any completed lab report can be supplied as a photo/PDF.
8. Exact local-shopping anchor (nearest metro/landmark or mahalle; no street address needed), whether online grocery delivery is acceptable, and any hard monthly food-budget ceiling.
9. Photos of the owned oat-flour and pekmez labels, iodized-salt label if already owned, and approximate volume/photo of the free work ayran glass if it is still available.

## Candidate architecture pending those answers
- Preserve 3100 kcal only for the launch calibration rather than changing it from formulas.
- Likely protein simplification after current weight is known: aim near ~1.8–2.0 g/kg/day rather than spending money/food volume to exceed what is useful; if weight is still ~68–70 kg, a practical candidate is roughly **135–145 g/day**.
- Add **15–20 g/day edible unsalted sunflower kernels** as a food-first vitamin-E candidate, offsetting roughly equivalent oil calories after exact label reconciliation.
- Keep two weekly fatty-fish servings, but choose **sardine vs Atlantic mackerel** using total value: sardine currently wins price/yield, mackerel fillet may win convenience/taste.
- Rotate part of the daily vegetables and some rice into other plants/grains for micronutrient/microbiome/contaminant robustness without lowering total calories.
- Build hydration from measured sweat loss and real thirst/environment rather than a rigid liters/day prescription.
- Before full batch launch, a single chilled-at-home sample of the intended work lunch is the cheapest way to test the biggest sensory failure mode without exposing the employer/workplace system.

No Calendar, TickTick, Cronometer, Liftosaur, XMind or other live-source mutation was authorized or performed.