# Nutrition continuation — bread fallback + live app reconciliation

Date: 2026-09-08 Europe/Istanbul
Status: EVIDENCE/CONTINUATION DELTA ONLY — menu not activated, purchases/intake not inferred, live app writes not authorized in this turn.

## Low-salt bread dependency
- Current A101 public product card for **Nimet Tuzsuz Ekşi Mayalı Tam Buğday Ekmeği 330 g** reports 235 kcal, P10.2/F0.8/C43.1/fibre7.0 and **salt 0.2 g/100 g**. Current shopping result showed **38.50 TL**. Delivery/physical stock remains address-specific and was not proven.
- Fully specified fallback: **İHE Tuz İlave Edilmemiş Tam Buğday Unlu Ekmek 400 g**. Migros product data reports 257 kcal, P11.7/F1.9/C45.9/fibre4.3 and salt displayed **0.0 g/100 g**; CarrefourSA current card showed **45.00 TL**. Treat 0.0 as the retailer label field, not proof of physiological zero sodium or exact unrounded content.
- Therefore the plan no longer needs ordinary salted whole-wheat bread as the first fallback. Purchase ladder: Nimet Tuzsuz when actually available; otherwise İHE Tuz İlave Edilmemiş. Ordinary salted bread is only a failover requiring sodium recalculation.

## Model impact if 100 g/day Nimet -> 100 g/day İHE
Per day from published labels: approximately **+22 kcal, +1.5 g protein, +1.1 g fat, +2.8 g carbs, -2.7 g fibre**. Label-based salt decreases by up to ~0.2 g/day versus Nimet, subject to rounding/intrinsic sodium uncertainty.

Using the Sep8 current menu model, approximate new values are:
- ordinary day: ~3150.97 kcal / P152.13 / F106.05 / C402.24 / fibre38.96; label-based sodium model ~1433.8 mg (~3.58 g salt equivalent) before additions;
- Wednesday: ~3151.82 / P164.0 / F95.69 / C413.02 / fibre40.15; ~1805.3 mg sodium (~4.51 g salt equivalent) before additions;
- Sunday: ~3142.95 / P139.34 / F116.06 / C392.85 / fibre43.26; ~1592.4 mg sodium (~3.98 g salt equivalent) before additions;
- weekly mean: ~3149.95 kcal / P152.00 / F106.00 / C402.44 / fibre39.74; label-based mean sodium ~1509.5 mg (~3.77 g salt equivalent) before additions.

No calorie compensation is justified before execution: the ~22 kcal/day delta is operationally trivial relative to the 3100-kcal calibration target and real portion/product error.

## Cost/package handling
For planned 700 g/week low-salt whole-wheat bread:
- Nimet at 38.50/330 g = ~11.67 TL/100 g; theoretical consumed cost ~81.67 TL/week.
- İHE at 45/400 g = 11.25 TL/100 g; theoretical consumed cost ~78.75 TL/week.
- Practical İHE buy: 2 x 400 g/week = 90 TL, with ~100 g carry-over/frozen rather than waste. Price difference is not large enough to justify a special trip; availability and route convenience dominate.

## Taste/prep consequence
No-added-salt whole-wheat bread can predictably taste blander/denser than ordinary bread. Keep the existing 50 g + 50 g split. For the 10:00 portion, pack it fully cooled after optional light toasting and eat with the existing grapes/nuts; for the dinner portion, use the existing lentil+yogurt spread. Black pepper, paprika, garlic, lemon/herbs can improve the spread without reintroducing a material salt load. Do not pack warm toast sealed because trapped steam worsens texture.

## Live app read-back — 2026-09-08
Cronometer:
- effective target: **3100 kcal / P148.55 / F99.0333 / C403.625**;
- 2026-09-08 food log: **0 entries, 0 consumed kcal**;
- Repeat Items: **0**.
These facts do not prove real-world fasting/intake; they only describe the app state.

TickTick project `Питание (протокол)` still contains the five existing active tasks. The two known stale cards remain live:
- shopping checklist `6a7eab788f0871942662bf93`: old menu + **1500 TL** ceiling;
- readiness checklist `6a9515ea8f0869c1518d0ffd`: obsolete bag/probe/cold-test requirements.
Weight, toothpaste-fluoride and BP-access tasks remain separate and should not be deleted as nutrition-menu cleanup.

No TickTick/Cronometer mutations were made because exact live-write authorization + Day1 remain user-only gates.

## Continuation state
Assistant-owned design/bread reconciliation is now materially further closed. Remaining irreducible launch uncertainties are physical shelf stock/actual package labels at purchase, taste/GI/portion completion and real weight trend. Next live-system action after Ron explicitly authorizes this version and names Day1: update stale TickTick content, create the approved prep/eating reminders without Calendar duplication, then prepare Cronometer day/template/prefill workflow and verify read-back. Never infer intake from prefill.
