# Nutrition product-data owner

Updated: 2026-08-24
Scope: durable product composition/model facts known at packaging time plus explicitly labeled temporary composition proxies. This file does **not** own current intake, menu, schedule, purchase status or supplement policy.

## Modeling rule

Physical label/manufacturer fields override donor/proxy values for the same nutrient. A high-quality donor may fill unreported fields. Missing branded fields remain UNKNOWN. Re-check live Cronometer before mutation because row/food IDs can change.

## Current known product facts

- Nimet Tam Buğday Ekmeği 350 g: 223 kcal, fat 0.3 g, carbs 38.2 g, fiber 7.9 g, protein 11.8 g, salt 0.9 g per 100 g.
- Birşah Sade Kefir 1 L: 52 kcal, fat 3.2 g, carbs 3.2 g, protein 2.7 g, calcium 120 mg per 100 g.
- Salina iodized salt: manufacturer specification uses potassium iodate (KIO3) 25–40 mg/kg; do not treat that number as elemental iodine mass.
- Dardanel Çanakkale Sardalya 125 g: boneless. Manufacturer per 100 g: 213 kcal, fat 13.76 g, saturated fat 3.9 g, carbs 0.4 g, protein 21.76 g, salt 1.7 g, EPA+DHA 1420 mg. Product-specific calcium is not established by the manufacturer data stored here.
- Fibrelle Bezelye Proteini: public manufacturer identity = pea protein, about 85–86% protein. Current private Cronometer custom-food fields previously verified per 100 g: 414 kcal, protein 85 g, fat 9.2 g, carbs 0.1 g, fiber 3.3 g, sodium 600 mg, saturated fat 1.5 g. Treat these as app/private-label fields until a newer physical label corrects them.

## Temporary stock-bridge composition proxies — verified live 2026-08-24

These are **not claims about Ron's exact physical stock products**. They make the current bridge arithmetic reproducible until the actual package labels are available; exact physical-label values override them.

- Oat flour proxy: Cronometer/NCCDB `Oat Flour, Whole Grain`, food **464823**, gram measure **1072978**. Per 100 g: **386 kcal, protein 13.17 g, fat 6.31 g, carbs 69.92 g, fiber 10.5 g**.
- Peanut-butter proxy: Cronometer `Peanut Butter, Smooth Style, without Salt`, food **2911**, gram measure **8680**. Per 100 g: **598 kcal, protein 22.21 g, fat 51.36 g, carbs 22.31 g, fiber 5.0 g**.
- Liquid-pekmez proxy: Cronometer/CRDB `Koska, Grape Molasses`, food **6228305**, gram measure **15838765**. Per 100 g: **280 kcal, protein 0 g, fat 0 g, carbs 70 g, fiber 0.1 g**. This is a sparse label-style entry; unreported micronutrients are UNKNOWN rather than zero.
- Fibrelle bridge arithmetic uses the verified custom-label fields above: 414 kcal / P85 / F9.2 / C0.1 / fiber 3.3 per 100 g.

Using these proxies, the current at-home stock unit in `domains/nutrition.md` (60 g oat flour + 20 g Fibrelle + 20 g peanut butter + 30 g liquid pekmez) calculates to approximately **518 kcal / 29.34 g protein / 15.90 g fat / 67.43 g carbs / 7.99 g fiber**.

## Cronometer model identifiers last verified 2026-08-20 unless dated otherwise

These are implementation aids, not eternal IDs. Read live before writes.

- Kefir donor: food 457991 / serving 1036723.
- Milk donor: food 456332 / serving 1028472.
- Bread donor: food 450731 / serving 998144.
- Sardine full-profile donor: food 462637 / serving 1060398; generic donor bone-calcium must not be attributed to the boneless Dardanel SKU.
- Dardanel whole-can label correction: custom food 80211142 / serving 291177558.
- Fibrelle custom food last verified: 79110821.
- 2026-08-24 temporary bridge proxies: oat flour 464823 / 1072978; peanut butter 2911 / 8680; grape molasses 6228305 / 15838765.
