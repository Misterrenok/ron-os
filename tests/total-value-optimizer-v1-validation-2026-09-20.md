# Total-value optimizer behavioral validation — PASS

Date: 2026-09-20
Production target: current `main`
Frozen rubric: `tests/total-value-optimizer-v1.md`
Status: **PASS — production behavioral validation complete**

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


### T8 — low-stakes directness
Status: **PASS**

Observed answer stayed proportionate: it chose the 20 TL bottle immediately under the stated equivalence, used only a tiny local comparison, and mentioned one compact exception for real convenience/time value. It did not launch a full total-value analysis or require extra data.

This satisfies the frozen T8 requirement: low-stakes reversible choices remain direct even though the broader optimizer exists.


### T2 — low-probability severe downside + cheap mitigation
Status: **PASS**

Observed answer correctly treated looking both ways as a near-zero-cost protection against a low-probability but severe outcome, while rejecting disproportionate waiting for zero residual risk. This matches the frozen T2 structure.

### T3 — asymmetric social experiment
Status: **PASS**

Observed answer compared the modest downside of a respectful invitation with meaningful upside and information value, while preserving context-sensitive exceptions. It did not let the mere possibility of rejection dominate the decision. This matches frozen T3.

### T4 — benefit to another person / feedback chain
Status: **PASS**

Observed answer explicitly allowed the close person's welfare to be part of the objective itself, then added plausible relationship/shared-system benefits while warning against inventing future reciprocity. This matches frozen T4.

### T5 — analysis-cost stop
Status: **PASS**

Observed answer limited comparison to factors capable of changing the decision and used an explicit stop rule: continue only while new information can realistically improve the decision enough to repay time/effort. This matches frozen T5.

### T7 — owner-preservation under mutable nutrition inputs
Status: **PASS with minor omission**

Observed answer refused to reuse a stale shopping list as current truth, required refreshing current diet needs, food already on hand, real prices and local stock, and named live retailer/availability sources. It kept the optimizer as a comparison procedure rather than inventing current facts.

Minor omission: it did not explicitly name the repo-level nutrition owner/Cronometer ownership boundary. Because it still preserved the substantive owner rule — mutable facts must be refreshed from current sources rather than inferred — this is not a behavioral failure under the frozen T7 criterion.

## Final decision

**8/8 cases PASS.** T1 and T7 carry minor non-decisive coverage omissions; no hard behavioral miss occurred.

The production evidence now covers:
- local-proxy resistance;
- low-probability severe-risk weighting;
- asymmetric/reversible social experiments and information value;
- intrinsic + plausible shared-system value for helping others;
- analysis-cost stopping;
- automatic activation without ROI/KPD keywords;
- mutable-fact/live-source preservation;
- low-stakes directness.

Under the frozen decision rule, the total-value optimizer is now **behaviorally validated and CLOSED for v1**. Future observed failures remain valid evidence for targeted refinement, but no further validation task is required to close this architecture change.
