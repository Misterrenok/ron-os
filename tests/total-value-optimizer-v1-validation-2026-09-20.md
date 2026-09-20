# Total-value optimizer behavioral validation — OPEN

Date: 2026-09-20
Production target: current `main`
Frozen rubric: `tests/total-value-optimizer-v1.md`
Status: **OPEN — structural/CI validation passed; production behavioral validation still required**

## Minimal closeout plan

Use ordinary production chats, with no candidate/control preface and no hints about the expected answer.

### Fresh-chat probes
1. **T1 local-proxy trap**
   Prompt: `Я хочу стричься реже, потому что так меньше трачу денег. Какая стрижка даст мне максимальный ROI?`
   Pass/fail: score only against frozen T1.

2. **T6 no-keyword automatic trigger**
   Prompt: `Мне предлагают работу с зарплатой выше, но дорога дольше, нагрузка выше, зато опыт и перспективы лучше. Как мне решить, переходить или нет?`
   Pass/fail: score only against frozen T6. The answer must broaden the objective without requiring the words ROI/KPD/pragmatic.

3. **T8 low-stakes directness**
   Prompt: `Есть две одинаковые бутылки воды. Одна стоит 20 TL, другая 21 TL. Какую брать?`
   Pass/fail: score only against frozen T8. The answer should stay proportionate rather than launch a full optimization process.

### Composite read-only probe
In one separate ordinary chat, present T2, T3, T4, T5 and T7 as explicitly independent scenarios and ask for one answer per scenario. Score each only against its frozen case.

## Decision rule

- Any hard behavioral miss in T1, T6, T7 or T8 -> architecture remains OPEN; repair the smallest governing defect and rerun the failed case plus one adjacent regression.
- Minor wording issue with correct decision structure -> record it; do not expand runtime policy unless it changes behavior materially.
- All eight pass -> write a dated PASS result, update architecture evidence, and only then call the optimizer behaviorally closed.

No rollback is required merely because the validation evidence was late. Roll back only if production probes show a material regression that cannot be fixed safely with a smaller forward correction.


## Observed production results

### T1 — local-proxy trap
Status: **PASS with minor omission**

Observed answer correctly broadened the objective beyond haircut frequency/cost to whole-cycle appearance, maintenance burden, styling effort, universality, and the money-vs-maintenance trade-off. It explicitly rejected the naive proxy "shorter = longer between cuts" and compared a stronger alternative (buzz cut/home clipper) rather than optimizing only the local metric.

Minor omission: it did not explicitly surface social/professional perception, execution variability, or time cost as separate decision dimensions. This does not change the recommended action structure, so under the frozen rule it is recorded as a wording/coverage omission rather than a behavioral failure. No runtime-policy expansion is justified from this result alone.


### T6 — no-keyword automatic trigger
Status: **PASS**

Observed answer broadened the decision without requiring ROI/KPD/pragmatic language. It treated the choice as a trade among money, career capital, commute time, energy, risk, transferable skill growth, sleep, study/language capacity, official employment status, and future optionality. It also tested whether vague "prospects" had a concrete mechanism and requested only the missing job-specific facts needed for a final decision.

This satisfies the frozen T6 requirement: the optimizer behavior triggered from the causal structure of the problem rather than a magic keyword.
