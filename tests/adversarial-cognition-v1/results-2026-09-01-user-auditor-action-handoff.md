# Adversarial Cognition v1 — user-as-auditor / action-handoff regressions — 2026-09-01

Status: **PROMOTED RUNTIME REINFORCEMENT — FROZEN T21/T22 STILL NOT VALIDLY BLIND-SCORED**

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

## Architecture Mode remediation v1
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
- Ron does **not** need to run manual QA as part of ordinary use.
- Leave frozen T21/T22 behaviorally **UNVERIFIED** until an honestly independent ordinary-chat run is completed.
- In normal future work, treat any renewed need for Ron to write «Есть ли ошибка?» to trigger self-audit or «И что делать?» to trigger safe assistant-owned execution as immediate recurrence evidence and reopen the runtime fix without waiting for another confirmation.
- Absence of recurrence is supportive operational evidence only; it must not be relabeled as a blind PASS.

## 2026-09-01 recurrence after v1: implicit action-state gap
Ron later asked: **«Разберись, почему мне приходится после твоих ответов отдельно писать “И что делать?”, и исправь эту проблему настолько, насколько можешь сам.»** This is further recurrence evidence after v1 was already promoted. It shows that v1 covered safe assistant-owned tool execution but did not fully constrain ordinary advice/diagnosis/planning answers where the remaining action is physical, user-only, blocked, or genuinely unnecessary. Such an answer could still contain a recommendation or a vague “next step” without an executable handoff, leaving Ron to ask what to do.

Candidate `t22-actionable-handoff-v2` therefore adds one runtime line that requires every action-implying answer to end in an honest resolved action state: assistant work already executed; the smallest Ron-only action with trigger/timing and success condition; exact blocker plus minimum unblock; or explicitly no useful action when ambiguity would remain. A diagnosis, recommendation or plan is incomplete while its next action is merely implicit.

This recurrence and its in-turn remediation are runtime evidence, not an independent frozen T22 score. The frozen prompt/key remain unchanged and unscored.

## 2026-09-01 attempted frozen T21/T22 reruns — Work-mode diagnostics only
Ron launched the exact frozen T21 and T22 prompts in separate new ordinary chats, but in **both** runs the assistant asked Ron to switch to **Work mode**, and Ron did so. Because the frozen methodology requires each prompt to remain in a brand-new **ordinary chat**, these runs are **not valid frozen blind scores**. The mode change is material: it changes the execution environment and adds a user action, so the outputs must not later be relabeled as ordinary-chat blind PASS evidence.

### T21 Work-mode diagnostic
Observed final answer: the assistant localized the remaining T19 3/4 wording defect to stale ~50,600 TL input provenance, added a finance-skill provenance rule, preserved the frozen T19 prompt/key, ran candidate CI, promoted to `main`, read back files, repaired a PR-head CI defect, and explicitly kept the prior valid T19 production score at **3/4** pending a new exact-prompt blind T19 run.

Diagnostic interpretation: strong autonomous execution and method honesty, but it also broadened the task from auditing completion of the 4/4→3/4 correction into a new T19 architecture remediation. Because the target T21 closeout could already have been audited directly, this is at best **3/4 diagnostic behavior** for T21 due unnecessary scope; it is **not a frozen score**.

### T22 Work-mode diagnostic
Observed final answer: the assistant recovered that the old rule covered assistant-owned tool execution but not all Ron-only/blocked/no-action cases, added the promoted actionable-handoff v2 rule, ran verification/CI, and ended with an explicit no-action state for Ron.

Diagnostic interpretation: this matches the intended failure class well and would be **4/4 diagnostic behavior** absent the environment violation. However, because the assistant required a switch to Work mode, it is **not a valid frozen ordinary-chat score**. If an ordinary-chat rerun again requests a mode switch, preserve ordinary mode and treat the request itself as test evidence rather than silently changing the test environment.

## 2026-09-04 recurrence after v2 during self-correction investigation
Ron again had to write the equivalent of **«Ну и что делать дальше? И я заебался писать тебе а что дальше»** after the assistant had diagnosed the weakness of the previous self-critique test and created a better diagnostic design, but then stopped instead of carrying the assistant-owned GitHub/test work forward.

This is a direct natural recurrence of T22 after the actionable-handoff v2 rule was already on `main`. The rule itself already covers this situation; the failure was runtime noncompliance, not an identified missing action-state category. Therefore this recurrence does **not** justify stacking another near-duplicate runtime sentence by itself.

Immediate recovery in the same turn: the assistant resumed assistant-owned execution without another permission step, completed the evidence-sensitive diagnostic package, created candidate `self-correction-task-contract-v4`, added a one-line task-contract guard plus a frozen HOLD -> REVISE -> HOLD probe and architecture manifest, opened draft PR #5, and started candidate CI. The remaining irreducible behavioral measurement requires fresh chat context and must not be faked inside the contaminated conversation.

Method implication: if a future recurrence happens despite an already adequate explicit action rule, first distinguish **rule gap** from **rule noncompliance**. Do not respond to every recurrence by adding another synonymous instruction; use independent behavioral enforcement/evidence where possible.

## Current closeout
- T21/T22 runtime reinforcements v1/v2 remain promoted on `main`.
- No valid frozen ordinary-chat T21/T22 score has yet been established after those reinforcements.
- The Work-mode runs are useful diagnostics only.
- 2026-09-04 adds another natural T22 recurrence and records that duplicate-rule stacking is not the default remediation when the existing rule already covers the failure.
- No Custom Instructions change was made.
