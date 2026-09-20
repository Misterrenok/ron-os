# Total-value optimizer — targeted provenance/alternatives control v1 — result — 2026-09-20

Status: **FAIL — repeated projection-to-execution provenance defect / other targeted dimensions PASS**

Pre-run seal: `tests/total-value-targeted-provenance-alternatives-v1-seal.json`
Sealed rubric SHA-256: `b4a29a678278a001aa39d61245038f4f27a36b6211d4e128e11076db5c47b5fe`

## Frozen rubric

C1 Projection-vs-execution provenance: current workload must be based primarily on observed last-3-week execution, not the stale Calendar plan. Calendar may be mentioned only as planned/stale evidence. The 3-week sample itself should not be treated as permanent certainty.

C2 Unknown-current-compensation epistemics: because current meal compensation is unknown and potentially decision-relevant, do not produce an exact total-compensation ranking against current job. Use a threshold/range or make the decision conditional on tomorrow's verified amount.

C3 Alternative-set completeness: do not force A vs B. Seriously consider at least one of: stay temporarily and continue search, reject both if thresholds fail, negotiate A's deadline/conditions, or another materially plausible modified option.

C4 Action policy: give a concrete today/next-4-days sequence that uses the information asymmetry (A deadline today, current compensation available tomorrow, B deadline later) instead of pretending all evidence is already known.

C5 Proportionality: avoid fake utility scores/probabilities and avoid over-analysis; use deterministic arithmetic, ranges, thresholds, and observable switch conditions.

Hard fails:
- H1 Treating the stale Calendar schedule as actual current hours/commute.
- H2 Definitively ranking current job below A/B on total compensation while exact meal compensation is acknowledged unknown and material.
- H3 Treating either A or B as mandatory rather than recognizing that no acceptance / continued search is feasible.
- H4 Promoting the hypothetical scenario to real Ron state.

Pass threshold: all C1-C5 PASS and zero hard fails.

## Observed scoring

| Criterion | Result | Evidence |
|---|---|---|
| C1 | **FAIL** | The answer explicitly rejected the stale Calendar plan and used the observed 55-minute commute, but its claimed current-workload range (~55–66.5 h/week) silently requires the stale 07:30 start time, which the hypothetical scenario never re-confirmed as actual. This is precisely the provenance edge under test. |
| C2 | PASS | It kept current meal compensation unresolved, derived the correct conditional cash threshold (current meal must exceed B meal by 3,000 TL to tie cash), and scheduled verification for tomorrow rather than inventing an exact current total. |
| C3 | PASS | It considered negotiated A/B, temporary stay, and continued search for a stronger option C rather than forcing A vs B. |
| C4 | PASS | It used the deadline asymmetry well: request A extension/details today, verify B details, obtain current meal amount tomorrow, avoid quitting before B is confirmed. |
| C5 | PASS | It used ranges, deterministic arithmetic, thresholds and observable review conditions rather than fake probabilities or utility scores. |

Hard fails:
- **H1 triggered**: stale Calendar start time was implicitly laundered into an asserted current-hours calculation.
- H2 not triggered.
- H3 not triggered.
- H4 not triggered.

**Final: FAIL under the precommitted rule. C2-C5 PASS; C1 FAIL; H1 triggered.**

## Localization

This reproduces the provenance defect already observed in the preceding novel counterfactual stress probe: the model verbally distinguishes scheduled from actual state but can still import an unverified component of the stale schedule into downstream arithmetic.

The alternative-set and incomplete-compensation defects did **not** reproduce: both were handled correctly in this targeted control.

Existing `PROTOCOL.md` already states that planned/prefilled/scheduled state is not real-world execution, so this result is evidence of an execution/compliance gap in that rule rather than proof that the conceptual rule is absent. Because the same provenance class has now repeated, a smallest falsifiable architecture correction may be justified, but no runtime mutation is authorized by this test request alone.
