# Nutrition — complete micronutrient closure audit

Date: 2026-09-19 Europe/Istanbul
Status: COMPLETE AUDIT / BASELINE REVISED / EXECUTION NOT YET VERIFIED

## Purpose
Close the gap that should have been addressed before calling the launch diet nearly complete: quantitatively audit the full 7-day pattern against established adult-male dietary reference values, identify both deficiency and excess risks, and revise the menu with the smallest high-ROI changes.

## Evidence/model
- Current 7-day Ron menu quantities were averaged over the week.
- Generic composition fields used USDA FoodData Central Foundation/SR Legacy when exact product labels do not publish the nutrient.
- Türkiye-specific composition used TürKomp where available.
- Iodine was treated separately because ordinary databases/labels are weak for it. Decision-relevant evidence: Aslan Çin & Özçelik 2023, DOI 10.33076/2023.BDD.1758, ICP-MS analysis of 6 cow-milk and 10 dairy samples in Türkiye.
- Missing nutrient fields are not treated as physiological zero.
- Results are planning estimates, not laboratory measurements of the exact Moova/Mis/Dardanel batches.

## Baseline audit before correction
Approximate daily 7-day average:
- Energy ~3128 kcal
- Protein ~154.6 g in the full nutrient model
- Fiber ~44 g
- Calcium ~1811 mg
- Iron ~17.9 mg
- Magnesium ~655 mg
- Phosphorus ~2776 mg
- Potassium ~5147 mg
- Sodium ~1779 mg before discretionary additions / product-label deviations
- Zinc ~15.4 mg
- Copper ~2.32 mg
- Manganese ~8.76 mg
- Selenium: US grain data misleadingly produced a much higher number; Türkiye-specific TürKomp correction puts the plan around ~99 µg/day, not ~240 µg/day
- B1 ~2.14 mg
- B2 ~3.20 mg
- Niacin ~28.4 mg
- B5 ~10.3 mg
- B6 ~3.25 mg
- Biotin ~51 µg
- Folate ~518 µg
- B12 ~5.28 µg
- Choline ~655 mg
- Vitamin A ~1147 µg RAE-equivalent in the model
- Vitamin C ~138 mg
- Vitamin D ~9.5 µg/day
- Vitamin E ~23 mg
- Vitamin K model ~98 µg/day
- Omega-6: adequate from nuts/oil/grains/animal foods
- ALA omega-3: likely borderline vs 1.6 g/day male AI despite good EPA/DHA from sardines.

### Material findings
1. **Vitamin D was below the 15 µg / 600 IU adult reference intake from food alone.**
2. **Vitamin K was borderline below the 120 µg/day adult-male AI in the conservative K1-centered model.**
3. **ALA was not robustly above the 1.6 g/day male AI.** Sardines solve EPA/DHA exposure but do not replace the ALA reference target.
4. **Iodine was the opposite of the prior concern: excess exposure, not deficiency, is the more important uncertainty.**
   - Turkish study: half-fat milk mean 76.1 µg iodine/100 g, observed 71.3–82.3.
   - full-fat yogurt mean 73.2 µg/100 g, observed 45.9–90.5.
   - UHT milk overall mean 73.1 µg/100 mL, observed 53.3–92.7.
   - At the original 500 mL milk + 300 g yogurt, dairy alone can plausibly approach or exceed the European 600 µg/day adult UL before eggs/fish.
   - Therefore **do not add iodine supplement or purposeful extra iodized salt for iodine**.
5. Choline is **not** a gap: ~655 mg/day vs 550 mg/day AI.
6. Selenium is **not** a gap and does not need Brazil nuts/supplementation after Türkiye-specific correction.

## Revised long-term baseline — minimal changes
Keep the architecture/menu, but change these quantities:

1. **UHT yarım yağlı milk: 500 -> 400 mL/day**
   - practical split: ~250 mL breakfast + ~150 mL evening.
2. **Tam yağlı yogurt: 300 -> 150 g/day**
   - keep three 50 g uses on ordinary workdays; exact distribution can vary.
3. **Dry pasta: 500 -> ~640 g/week**
   - ~107 g dry on the six pasta days instead of ~83 g.
4. **Cooked chicken: 850 -> ~950 g/week**
   - easiest implementation: add ~20 g to the 16:45 chicken portion on the five ordinary chicken-workdays (50 -> 70 g).
5. **Fresh parsley: add ~15 g/day (~105 g/week)**
   - can be folded into tomato/pepper/sandwich/lentil meals; this is part of the existing vegetable rotation, not a second menu.
6. **Ground flaxseed (öğütülmüş keten tohumu): add 5 g/day (~35 g/week)**
   - add to breakfast oats.
   - store ground flax airtight/cool; whole seed can be ground in small batches.
7. **Vitamin D3: 400 IU / 10 µg per day**
   - purpose is to bring total food+supplement intake around the standard 600 IU / 15 µg reference intake, not to use therapeutic/high-dose vitamin D.
   - no automatic K2 supplement.
   - no iodine supplement.
   - no multivitamin required.

## Revised modeled daily result
Approximate:
- Energy **~3099 kcal**
- Protein **~153 g**
- Fat **~100 g**
- Carbohydrate **~404 g**
- Fiber **~47 g**
- Calcium **~1527 mg**
- Iron **~19.2 mg**
- Magnesium **~665 mg**
- Phosphorus **~2618 mg**
- Potassium **~4915 mg**
- Sodium **~1680 mg** before product-label/discretionary variation
- Zinc **~15.1 mg**
- Copper **~2.44 mg**
- Manganese **~9.1 mg**
- Selenium **~101 µg/day** on Türkiye-adjusted model
- B1 **~2.14 mg**
- B2 **~2.83 mg**
- Niacin **~30.2 mg**
- B5 **~10.3 mg**
- B6 **~3.35 mg**
- Folate **~522 µg**
- B12 **~4.1 µg**
- Choline **~658 mg**
- Vitamin A **~1161 µg RAE-equivalent**
- Vitamin C **~166 mg**
- Vitamin D **~17 µg / ~680 IU food+400-IU supplement**
- Vitamin E **~23.3 mg**
- Vitamin K **~153 µg/day conservative model**
- ALA: +~0.855 g/day from only 5 g flax, on top of walnuts/olive oil/other foods; robustly clears 1.6 g/day.
- EPA/DHA: maintained through sardines twice weekly.

## Iodine after dairy correction
Using the Turkish study's observed ranges as a sensitivity analysis, not exact brand measurements:
- 400 mL half-fat milk: roughly 285–329 µg/day.
- 150 g full-fat yogurt: roughly 69–136 µg/day.
- dairy subtotal roughly 354–465 µg/day.
- eggs/fish add iodine, but the revised dairy load gives materially more headroom than the old 500 mL + 300 g pattern.
- This is why the system deliberately avoids adding an iodine supplement. Exact personal iodine status cannot be proven from menu tables alone.

## Full adequacy disposition
### Covered by revised baseline
Energy for current launch target; protein/indispensable amino acids; carbohydrate; total fat; linoleic acid; ALA; EPA/DHA pattern; fiber; vitamins A, C, D, E, K, B1, B2, B3, B5, B6, B7, B9, B12; choline; calcium, iron, magnesium, phosphorus, potassium, zinc, copper, manganese, selenium.

### Managed separately / not meaningfully 'closed' by a food table
- **Iodine:** adequate-looking but high-variance and potentially high; manage by avoiding extra iodine and keeping revised dairy quantity rather than chasing a numerical target.
- **Sodium/chloride:** sodium is adequate and below the usual 2300-mg CDRR in the model; product labels remain decisive. Do not add salt merely for iodine.
- **Fluoride:** mostly water/dental-exposure issue, not a reason to add a food/supplement.
- **Chromium:** food databases and requirement evidence are weak; no evidence-based reason for chromium supplementation.
- **Molybdenum:** legumes/oats/grains supply it; no supplement needed.
- **Water/electrolytes:** dynamic with heat/sweat/training; use thirst/conditions and the existing hydration rule rather than a rigid lifetime volume.

## Long-term rule
This revised menu can serve as a long-term core pattern. "Long-term" does **not** mean freezing 3100 kcal or every gram forever. Recalibrate energy when bodyweight/waist/training/work changes; rotate fresh produce seasonally while preserving the nutrient functions; update the plan if medical state, medications, labels, food availability or labs materially change.

## Remaining uncertainty
No conventional nutrient deficit is known after the revisions. Remaining uncertainty is dominated by:
- exact iodine content of Ron's actual dairy/fish brands and batches;
- real intake/adherence/GI tolerance, especially with ~47 g fiber;
- actual bodyweight/performance response to ~3100 kcal;
- product-label differences from composition-database donors.

Do not reopen the whole architecture without evidence of a material implementation problem.
