# Adversarial Cognition v1 — user-as-auditor / action-handoff regressions — 2026-09-01

Status: **PROMOTED RUNTIME REINFORCEMENT — REAL REPEATED FAILURE REMEDIATED IN CURRENT TURN; FROZEN T21/T22 NOT YET BLIND-SCORED**

## Incident
During the T19 provenance-remediation chain, Ron repeatedly had to provide an extra audit/action turn after the assistant had already produced a confident answer or a diagnosis. Variants of **«Есть ли ошибка/ошибки в твоём ответе?»** exposed additional defects after the assistant had prematurely treated work as correct/closed. Variants of **«И что делать?»** were then needed to make the assistant continue from diagnosis/advice into the next safe executable step.

The material failure is not the wording of those user prompts. It is that Ron became the external QA/continuation controller for work the assistant was supposed to self-audit and carry through.

## T21 — premature closure / user-as-auditor
Target failure class: the assistant announces `PASS`, `done`, `closed`, or equivalent before validating the method and all material closeout evidence. In the observed chain this included, at different points, accepting a branch-targeted diagnostic as a blind test, over-scoring a production answer, leaving dependent canonical records stale, and encountering a red final CI only after an additional correction turn.

## T22 — action handoff omission / “И что делать?”
Target failure class: after correctly identifying a problem or root cause, the assistant stops at explanation or a plan even though safe, authorized, tool-executable assistant-owned work remains. This forces Ron to ask another question such as **«И что делать?»**, **«сделай»**, or **«продолжай»** merely to trigger execution.

## Repeated natural recurrence after the regression was added
After T21/T22 had already been added and the assistant explicitly said a future real recurrence would be the trigger for a deeper runtime fix, Ron's very next relevant message was again **«И что делать»**. The assistant had still stopped after explaining that the regression existed instead of implementing the promised runtime reinforcement.

This is **not** counted as a frozen blind T22 score because the prompt is a natural same-conversation recurrence rather than the exact frozen T22 prompt. It is useful real-world recurrence of the same generalizable failure class, but it is **not independent behavioral evidence**: the conversation already contained the diagnosis, regression framing and intended remediation. The independently fail-capable evidence remains the frozen T21/T22 prompt/key pair, which was defined before the runtime reinforcement and remains unscored.

## Architecture Mode remediation
Candidate `t21-t22-closeout-execution-v1` was created from exact `main` SHA `b13d0ca2f152d0ea78057b2124da5205aa53c603`.

Only two runtime lines were added to `PROTOCOL.md`:
1. before a final reply on nontrivial work, execute any remaining safe, authorized, tool-executable step that materially advances or verifies the requested outcome instead of offering/delegating it to Ron;
2. do not claim `PASS`, `done`, `closed` or equivalent until method and task-required closeout evidence are verified; otherwise state the exact irreducible blocker.

The existing live-source exact-permission gate, continuity write/read-back semantics and proportional `Stop` rule were preserved unchanged.

Candidate CI run **33522899966** passed. Full base→head review showed `PROTOCOL.md` **+2 lines**, the architecture manifest and this regression-evidence update, with no unrelated runtime change. Runtime read-back matched. Follow-up candidate verification CI **33523063907** passed. The manifest was then promoted and promoted-candidate CI **33523533638** passed.

The promoted commit `d8b7b27fe1d0f1399c53f4bee0e9135a96b8eba8` was fast-forwarded to `main`. Final `main` continuity CI **33523590033** completed **success**.

## Runtime evidence and method limit
The remediation was exercised in the same natural recurrence that triggered it: after Ron again wrote **«И что делать»**, the assistant continued through candidate creation, manifesting, GitHub writes, CI, full diff review, read-back, promotion and final `main` CI without requiring another continuation command. This is useful live/runtime evidence for the action-handoff failure class.

It is **not** an independent frozen blind T21/T22 score. The exact frozen prompts and key remain unchanged for future ordinary-chat regression. Do not later rewrite this event as a blind test, independent behavioral validation, or proof of universal behavioral compliance.

## Operational follow-up
- Ron does **not** need to run manual QA or open a special test chat merely to validate this remediation.
- Leave frozen T21/T22 behaviorally **UNVERIFIED** until an honestly independent ordinary-chat run becomes available.
- In normal future work, treat any renewed need for Ron to write «Есть ли ошибка?» to trigger self-audit or «И что делать?» to trigger safe assistant-owned execution as immediate recurrence evidence and reopen the runtime fix without waiting for another confirmation.
- Absence of recurrence is supportive operational evidence only; it must not be relabeled as a blind PASS.

## Closeout
- The minimal two-line runtime reinforcement is **promoted on `main`**.
- `CURRENT.md` records the new pre-final execution/closure guard and explicitly says frozen T21/T22 are not blind-scored.
- No Custom Instructions change was made.
- Frozen T21/T22 remain independent future regressions; no extra Ron QA turn is required to close this remediation.


## 2026-09-01 recurrence after v1: implicit action-state gap

Ron later asked: **«Разберись, почему мне приходится после твоих ответов отдельно писать “И что делать?”, и исправь эту проблему настолько, насколько можешь сам.»** This is further recurrence evidence after v1 was already promoted. It shows that v1 covered safe assistant-owned tool execution but did not fully constrain ordinary advice/diagnosis/planning answers where the remaining action is physical, user-only, blocked, or genuinely unnecessary. Such an answer could still contain a recommendation or a vague “next step” without an executable handoff, leaving Ron to ask what to do.

Candidate `t22-actionable-handoff-v2` therefore adds one runtime line that requires every action-implying answer to end in an honest resolved action state: assistant work already executed; the smallest Ron-only action with trigger/timing and success condition; exact blocker plus minimum unblock; or explicitly no useful action when ambiguity would remain. A diagnosis, recommendation or plan is incomplete while its next action is merely implicit.

This recurrence and its in-turn remediation are runtime evidence, not an independent frozen T22 score. The frozen prompt/key remain unchanged and unscored.
