# Universal-claim falsification — 2026-09-01

## Incident
The assistant answered `В каком продукте наивысшее содержание антиоксидантов в мире?` by promoting a leader from a limited comparative corpus into a world-level #1 claim. Ron supplied dried amla as a counterexample; follow-up research showed that the original universal wording was not justified.

Root cause: evidence scope and claim scope were not coupled. The existing verification rule preferred falsifiable checks but did not explicitly require coverage of the claimed universe/metric before an absolute superlative or exclusivity assertion.

## Candidate
Branch: `universal-claim-falsification-v1`
Base: `a481ae02ca7899347fb6ccfd570e565fd1ff861b`

Runtime delta: one verification paragraph in `PROTOCOL.md` requiring universe/metric coverage for absolute/worldwide superlatives or exclusivity claims, active search for plausible disconfirming candidates where decision-relevant, and scoping/UNVERIFIED when universal coverage is not established. It explicitly preserves direct answers for well-established broad-consensus superlatives.

Independent behavioral regression: `tests/universal-claim-falsification-v1.md` with four cases:
- U01 reproduces the antioxidant/dried-amla failure;
- U02 checks metric-dependent superlatives;
- U03 is an overcorrection control using the blue whale;
- U04 checks global exclusivity/negative-space claims.

## Architecture sequencing correction
The first candidate was written as multiple Contents API commits. CI run 33545965788 failed at the Architecture Mode change gate because the later architecture-sensitive `PROTOCOL.md` push did not carry its manifest in the same push range. That failure is valid evidence.

The candidate branch was then rebuilt from the exact base as one atomic commit (`ad9a05bedfdf960c57194cb6c924d55abe76d70d`) containing the manifest, runtime delta and focused regression together. No failed run is counted as PASS.

## Behavioral status
The current in-turn diagnosis supports the targeted rule and the U01/U02/U04 failure logic; this is same-model runtime evidence, not an independent blind score. U03 is included specifically to detect over-hedging. A future fresh-chat run may score the focused suite independently; no universal guarantee is claimed from this remediation alone.

## Production closeout
Candidate full-workflow CI passed on run `33546269164`; the promoted-manifest candidate recheck passed on run `33546348375`. `main` was fast-forwarded to promoted commit `dd93a49ffd360db17d6fc496492f7c347f4480ed`, and production workflow run `33546394704` completed with `success`.

This remediation materially reduces the observed failure class but cannot prove that no analogous mistake will ever occur on an untested formulation. The focused regression remains the falsifiable guard for future recurrences.

## Live same-chat stress test — 2026-09-02
Ron requested an immediate test after promotion. This was intentionally treated as a same-chat runtime probe, not as an independent blind score.

Observed behavior:
- U01-style antioxidant question: PASS. The response logic no longer treats Phenol-Explorer's clove lead among 452 foods as proof of a world #1. Dried amla was explicitly checked as a plausible omitted countercandidate and studies report very high total phenolics/antioxidant activity for dried amla. Crucially, the amla GAE assays and Phenol-Explorer's summed-individual-polyphenol metric are not directly commensurate, so these numbers cannot be used to crown either food globally; the correct conclusion is that the universal ranking is unverified unless a common metric and sufficiently broad candidate universe are established.
- U02-style strongest-material question: PASS. The response logic distinguishes tensile strength from toughness, hardness, compressive strength and theoretical predictions; graphene can be named only under a defined tensile-strength scope, while theoretical carbyne claims do not justify an unqualified world #1.
- U03 overcorrection control: PASS. Blue whale is answered directly as the largest living animal because the superlative is broadly established by authoritative zoological sources; no ritual universal-uncertainty disclaimer is needed.
- U04-style exclusivity check: PASS on instantiated case `only country without an official capital`: UNCTAD directly states Nauru is the only country in the world without an official capital, so the exclusivity claim is supportable rather than reflexively hedged.

Result: 4/4 same-chat behavioral probe PASS. This is useful regression evidence but remains weaker than a future fresh-chat blind run because the current conversation contains the remediation context.
