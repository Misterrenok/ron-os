# Adversarial Cognition v1 — user-as-auditor / action-handoff regressions — 2026-09-01

Status: **RUNTIME REINFORCEMENT PROMOTING — REAL REPEATED FAILURE REMEDIATED IN CURRENT TURN; FROZEN T21/T22 NOT YET BLIND-SCORED**

## Incident
During the T19 provenance-remediation chain, Ron repeatedly had to provide an extra audit/action turn after the assistant had already produced a confident answer or a diagnosis. Variants of **«Есть ли ошибка/ошибки в твоём ответе?»** exposed additional defects after the assistant had prematurely treated work as correct/closed. Variants of **«И что делать?»** were then needed to make the assistant continue from diagnosis/advice into the next safe executable step.

The material failure is not the wording of those user prompts. It is that Ron became the external QA/continuation controller for work the assistant was supposed to self-audit and carry through.

## T21 — premature closure / user-as-auditor
Target failure class: the assistant announces `PASS`, `done`, `closed`, or equivalent before validating the method and all material closeout evidence. In the observed chain this included, at different points, accepting a branch-targeted diagnostic as a blind test, over-scoring a production answer, leaving dependent canonical records stale, and encountering a red final CI only after an additional correction turn.

## T22 — action handoff omission / “И что делать?”
Target failure class: after correctly identifying a problem or root cause, the assistant stops at explanation or a plan even though safe, authorized, tool-executable assistant-owned work remains. This forces Ron to ask another question such as **«И что делать?»**, **«сделай»**, or **«продолжай»** merely to trigger execution.

## Repeated natural recurrence after the regression was added
After T21/T22 had already been added and the assistant explicitly said a future real recurrence would be the trigger for a deeper runtime fix, Ron's very next relevant message was again **«И что делать»**. The assistant had still stopped after explaining that the regression existed instead of implementing the promised runtime reinforcement.

This is **not** counted as a frozen blind T22 score because the prompt is a natural conversation recurrence rather than the exact frozen T22 prompt. It is independent real-world recurrence of the same generalizable failure class and satisfied the failure-driven threshold for a minimal Architecture Mode candidate.

## Architecture Mode remediation
Candidate `t21-t22-closeout-execution-v1` was created from exact `main` SHA `b13d0ca2f152d0ea78057b2124da5205aa53c603`.

Only two runtime lines were added to `PROTOCOL.md`:
1. before a final reply on nontrivial work, execute any remaining safe, authorized, tool-executable step that materially advances or verifies the requested outcome instead of offering/delegating it to Ron;
2. do not claim `PASS`, `done`, `closed` or equivalent until method and task-required closeout evidence are verified; otherwise state the exact irreducible blocker.

The existing live-source exact-permission gate, continuity write/read-back semantics and proportional `Stop` rule were preserved unchanged.

Candidate CI run **33522899966** passed. Full base→head review showed `PROTOCOL.md` **+2 lines**, the architecture manifest, and this regression-evidence update only. Runtime read-back matched. A follow-up candidate verification CI run **33523063907** also passed.

## Runtime evidence and method limit
The remediation was exercised in the same natural recurrence that triggered it: after Ron again wrote **«И что делать»**, the assistant continued through candidate creation, manifesting, GitHub writes, CI, full diff review and read-back without requiring another continuation command. This is useful live/runtime evidence for the action-handoff failure class.

It is **not** an independent frozen blind T21/T22 score. The exact frozen prompts and key remain unchanged for future ordinary-chat regression. Do not later rewrite this event as a blind test or claim universal behavioral compliance from this single remediation run.

## Remediation decision
- Promote the minimal two-line runtime reinforcement through Architecture Mode after promoted-candidate CI.
- Update `CURRENT.md` because the pre-final execution/closure gate materially changes future continuation behavior.
- Make no Custom Instructions change.
- Preserve T21/T22 as independent future regressions; no user QA turn is required merely to complete this current remediation.
