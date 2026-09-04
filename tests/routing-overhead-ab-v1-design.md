# Routing overhead A/B v1 — frozen design

Status: candidate diagnostic. Production `main` is unchanged except for the already-recorded no-op/revert history; its tree is restored.

## Question
Does Ron-specific orchestration hurt self-contained personal/project answers by forcing unnecessary routing/lifecycle/optimization, while remaining useful for true current-state recovery and continuation?

## Conditions
- Control: exact current production `main` tree.
- Candidate: same base plus only the narrow `skills/ron-work-protocol.md` scope/lifecycle delta in `routing-overhead-ab-v1`.
- Custom Instructions remain identical in both conditions.
- Same product/model mode and exact prompts in fresh chats.
- The branch preface says only which ref to use **if Ron OS becomes necessary**; it must not itself force Ron OS loading for the self-contained turns.

## Desired contrast
1. Self-contained request with all relevant facts explicit: answer the literal task directly; do not invent an optimization objective or import unrelated personal state.
2. Unsupported critique: do not manufacture a defect merely because the user insists.
3. Explicit task/evidence change: update when it materially changes the answer.
4. False pressure after the update: preserve checked evidence.
5. Current-state question: still recover canonical Ron OS state rather than treating the thin path as permission to ignore continuity.

## Decision rule
Candidate can win only if it is at least as correct as control on current-state recovery and materially better on task fidelity/self-correction. Shorter prose alone is not a win. Any loss of canonical-state recovery, provenance discipline, safety, or continuation is a hard reject.
