# Nutrition product-data owner

Updated: 2026-08-21
Scope: durable product composition/model facts known at packaging time. This file does **not** own current intake, menu, schedule, purchase status or supplement policy.

## Modeling rule

Physical label/manufacturer fields override donor values for the same nutrient. A high-quality donor may fill unreported fields. Missing branded fields remain UNKNOWN. Re-check live Cronometer before mutation because row/food IDs can change.

## Current known product facts

- Nimet Tam Buğday Ekmeği 350 g: 223 kcal, fat 0.3 g, carbs 38.2 g, fiber 7.9 g, protein 11.8 g, salt 0.9 g per 100 g.
- Birşah Sade Kefir 1 L: 52 kcal, fat 3.2 g, carbs 3.2 g, protein 2.7 g, calcium 120 mg per 100 g.
- Salina iodized salt: manufacturer specification uses potassium iodate (KIO3) 25–40 mg/kg; do not treat that number as elemental iodine mass.
- Dardanel Çanakkale Sardalya 125 g: boneless. Manufacturer per 100 g: 213 kcal, fat 13.76 g, saturated fat 3.9 g, carbs 0.4 g, protein 21.76 g, salt 1.7 g, EPA+DHA 1420 mg. Product-specific calcium is not established by the manufacturer data stored here.
- Fibrelle Bezelye Proteini: public manufacturer identity = pea protein, about 85–86% protein. Current private Cronometer custom-food fields previously verified per 100 g: 414 kcal, protein 85 g, fat 9.2 g, carbs 0.1 g, fiber 3.3 g, sodium 600 mg, saturated fat 1.5 g. Treat these as app/private-label fields until a newer physical label corrects them.

## Cronometer model identifiers last verified 2026-08-20

These are implementation aids, not eternal IDs. Read live before writes.

- Kefir donor: food 457991 / serving 1036723.
- Milk donor: food 456332 / serving 1028472.
- Bread donor: food 450731 / serving 998144.
- Sardine full-profile donor: food 462637 / serving 1060398; generic donor bone-calcium must not be attributed to the boneless Dardanel SKU.
- Dardanel whole-can label correction: custom food 80211142 / serving 291177558.
- Fibrelle custom food last verified: 79110821.
