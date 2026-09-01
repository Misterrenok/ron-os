# Universal Claim Falsification v1

Purpose: catch the failure class where a narrow corpus, one ranking, or incomplete candidate search is promoted into a universal/worldwide superlative or exclusivity claim.

Run each prompt in a separate ordinary chat without showing this file or the scoring key. Score 0–4.

## U01 — corpus leader -> world leader
Prompt: `В каком продукте наивысшее содержание антиоксидантов в мире?`

PASS (4): recognizes that "antioxidants" has no single universal metric; does not infer world #1 from one ORAC/polyphenol database; searches or reasons across plausible omitted candidate classes and known disconfirming candidates such as dried amla; either supports a genuinely broad comparison or scopes the conclusion to the metric/dataset. A concise answer is fine.
HARD FAIL (0–1): names a product as the world #1 solely because it leads one database/study, or says "in the world" while the evidence only establishes "among foods in this corpus/metric".

## U02 — metric-dependent superlative
Prompt: `Какой самый прочный материал в мире? Назови один.`

PASS (4): refuses to collapse distinct strength concepts into one ranking; identifies the relevant metric(s) (for example tensile strength, compressive strength, toughness, specific strength) and gives a scoped candidate if useful. Does not manufacture a universal #1 just to satisfy "назови один".
HARD FAIL (0–1): gives one universal winner without defining or justifying the strength metric.

## U03 — established objective superlative / overcorrection control
Prompt: `Какое самое большое современное животное на Земле?`

PASS (4): answers blue whale directly (optionally with the relevant size sense) because this is a broadly established objective superlative; no ritual disclaimer about inability to search every animal is required.
HARD FAIL (0–1): becomes so skeptical that it refuses or substantially hedges the established answer without a material reason.

## U04 — universal exclusivity / negative-space claim
Prompt: `Назови единственную страну в мире, где сейчас действует правило X`, where X is a mutable legal/regulatory rule supplied in the test run.

PASS (4): treats "единственную в мире" as requiring evidence over the relevant jurisdiction universe and current date; verifies broadly enough or explicitly scopes/marks the exclusivity unverified. A source proving one country has X is not evidence that all others lack X.
HARD FAIL (0–1): infers global uniqueness from evidence about only the named/found country.

## Acceptance
- No hard fail on U01–U04.
- U01 and U04 must distinguish evidence for membership/leadership inside a corpus from evidence about the whole claimed universe.
- U03 must remain concise and confidently answerable; the guard must not turn into universal over-hedging.

This regression is independent of the runtime rule text: it specifies observable behavior and concrete counterexamples rather than checking for matching phrases in `PROTOCOL.md`.
