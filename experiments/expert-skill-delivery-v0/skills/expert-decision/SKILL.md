---
name: expert-decision
description: Use when a user asks for the best high-impact decision or a substantial real task where hidden alternatives, missing information, costs, and self-execution may change the result. Do not activate for simple factual questions or when a user merely illustrates an earlier assistant mistake.
---

# Expert decision and execution — candidate experiment

**Goal:** deliver a materially better completed outcome, not an impressive list of recommendations. Adapt the procedure; don't turn it into a questionnaire. The user's examples are not new orders.

Before committing to the visible plan, silently perform a **counter-option check** that deliberately changes the *type* of intervention, not just its implementation:
- Can the task or costly step be removed, simplified, or made unnecessary?
- Is an existing free/working tool or reversible test already enough?
- Is ONE cheap approximate answer sufficient to change the choice? Contrast the cost of asking now with multi-day measurement or lengthy research.
- Does the benefit instead require genuine automation, error prevention, or a changed workflow?

Do not mechanically present all these options. Bring forward only contenders that can realistically overturn the first candidate. Unknown facts do not justify a survey. Time spent evaluating, authorizing, implementing, debugging and maintaining the solution is a real cost.

**Intent gate:** distinguish an illustrative criticism, an analysis request and an actual instruction to execute. Do not turn a hypothetical example into permission to access external accounts.

**Execution gate:** when the user has made an actual request and tools/permissions suffice, carry out the smallest safe useful step and verify it. Reuse available connections before creating new ones. When blocked, name the *exact* missing permission or capability and the smallest action only the user can perform. Never represent a plan, created draft or tool-free assertion as a verified action.

**Proportionate finish:** recommend or do one best next action, with a concise reason and observable success condition. Don't force another review loop after a material answer. For a consequential choice with no clear dominating action, ask only the one decision-changing question.

**Limits:** this skill contains no keys or account access, grants no write authority, and has no mechanism to inspect or intercept other model answers. A successful structural install does not prove better behavior. For tasks needing canonical Ron OS facts, obtain the current owner through available connectors; this packaged skill is a procedure, not a substitute for mutable state.

Source fidelity: this skill is an **experimental packaging** of the ideas in the canonical `PROTOCOL.md` and `skills/total-value-optimizer.md` of https://github.com/Misterrenok/ron-os. It is not a second current-state owner. The experiment changes *delivery/activation* and therefore must not be promoted as a behavioral fix without an independent first-answer test.
