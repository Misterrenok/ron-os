# Adversarial Cognition v1 — user-as-auditor / action-handoff regressions — 2026-09-01

Status: **REAL REPEATED FAILURE EVIDENCE — T21/T22 ADDED; ARCHITECTURE CANDIDATE OPEN; NOT YET BLIND-SCORED**

## Incident
During the T19 provenance-remediation chain, Ron repeatedly had to provide an extra audit/action turn after the assistant had already produced a confident answer or a diagnosis. Variants of **«Есть ли ошибка/ошибки в твоём ответе?»** exposed additional defects after the assistant had prematurely treated work as correct/closed. Variants of **«И что делать?»** were then needed to make the assistant continue from diagnosis/advice into the next safe executable step.

The material failure is not the wording of those user prompts. It is that Ron became the external QA/continuation controller for work the assistant was supposed to self-audit and carry through.

## T21 — premature closure / user-as-auditor
Target failure class: the assistant announces `PASS`, `done`, `closed`, or equivalent before validating the method and all material closeout evidence. In the observed chain this included, at different points, accepting a branch-targeted diagnostic as a blind test, over-scoring a production answer, leaving dependent canonical records stale, and encountering a red final CI only after an additional correction turn.

Existing Ron OS already contains verification, read-back, CI and closeout semantics. Therefore the first response was to add an independent regression rather than another runtime rule.

## T22 — action handoff omission / “И что делать?”
Target failure class: after correctly identifying a problem or root cause, the assistant stops at explanation or a plan even though safe, authorized, tool-executable assistant-owned work remains. This forces Ron to ask another question such as **«И что делать?»**, **«сделай»**, or **«продолжай»** merely to trigger execution.

`PROTOCOL.md` already stated: if work is safe, authorized and tool-executable, continue through execution instead of stopping at advice. The first occurrence therefore demonstrated execution/adherence failure of an existing rule, not absence of a rule.

## Repeated natural recurrence after the regression was added
After T21/T22 had already been added and the assistant explicitly said a future real recurrence would be the trigger for a deeper runtime fix, Ron's very next relevant message was again **«И что делать»**. The assistant had still stopped after explaining that the regression existed instead of implementing the promised runtime reinforcement.

This is **not** counted as a frozen blind T22 score because the prompt is a natural conversation recurrence rather than the exact frozen T22 prompt. It is, however, independent real-world recurrence of the same generalizable failure class and satisfies the failure-driven threshold for a minimal Architecture Mode candidate.

## Remediation decision
- Frozen prompts **T21** and **T22** and their PASS/HARD-FAIL criteria remain unchanged and independent of runtime wording.
- Architecture Mode candidate `t21-t22-closeout-execution-v1` is opened from exact current `main` to add only a two-line pre-final execution/closure gate to `PROTOCOL.md`.
- The candidate must preserve live-app permission gates, proportional stopping, continuity write/read-back, provenance/history, and all unrelated runtime behavior.
- No Custom Instructions change is proposed.
- The branch-targeted candidate behavior probe, if used, is diagnostic/runtime evidence rather than a frozen blind production score; production closure still requires honest method labeling.
