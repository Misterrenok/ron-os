# Adversarial Cognition v1 — user-as-auditor / action-handoff regressions — 2026-09-01

Status: **REAL FAILURE EVIDENCE RECORDED — T21/T22 ADDED; NOT YET BLIND-SCORED**

## Incident
During the T19 provenance-remediation chain, Ron repeatedly had to provide an extra audit/action turn after the assistant had already produced a confident answer or a diagnosis. Variants of **«Есть ли ошибка/ошибки в твоём ответе?»** exposed additional defects after the assistant had prematurely treated work as correct/closed. Variants of **«И что делать?»** were then needed to make the assistant continue from diagnosis/advice into the next safe executable step.

The material failure is not the wording of those user prompts. It is that Ron became the external QA/continuation controller for work the assistant was supposed to self-audit and carry through.

## T21 — premature closure / user-as-auditor
Target failure class: the assistant announces `PASS`, `done`, `closed`, or equivalent before validating the method and all material closeout evidence. In the observed chain this included, at different points, accepting a branch-targeted diagnostic as a blind test, over-scoring a production answer, leaving dependent canonical records stale, and encountering a red final CI only after an additional correction turn.

Existing Ron OS already contains verification, read-back, CI and closeout semantics. Therefore this incident first becomes an independent regression rather than another runtime rule.

## T22 — action handoff omission / “И что делать?”
Target failure class: after correctly identifying a problem or root cause, the assistant stops at explanation or a plan even though safe, authorized, tool-executable assistant-owned work remains. This forces Ron to ask another question such as **«И что делать?»**, **«сделай»**, or **«продолжай»** merely to trigger execution.

`PROTOCOL.md` already states: if work is safe, authorized and tool-executable, continue through execution instead of stopping at advice. The repeated incident therefore demonstrates execution/adherence failure of an existing rule, not absence of a rule. Do **not** add a duplicate runtime line merely for salience before the regression is independently exercised.

## Remediation decision
- Added frozen prompts **T21** and **T22** to `prompts.md`.
- Added explicit PASS/HARD-FAIL criteria and the cross-suite patterns **Premature closure** and **Action handoff omission** to `key.md`.
- Expanded the core acceptance boundary to T19–T22 and the suite-average range to T01–T22.
- No `PROTOCOL.md` or Custom Instructions change is made from this evidence alone.
- Ron is **not** asked to perform another blind run now merely to close this bookkeeping step. Future independent suite execution or a new real recurrence can score these regressions; any runtime-policy change must still satisfy the failure-driven architecture rule.
