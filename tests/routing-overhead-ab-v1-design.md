# Routing overhead A/B v1 — frozen design

Status: candidate diagnostic. Production `main` unchanged.

## Question
Does Ron-specific orchestration hurt self-contained personal/project answers by forcing unnecessary routing/lifecycle/optimization, while still being needed for current-state recovery and continuation?

## Conditions
- Control: exact current production `main`.
- Candidate: same main plus only the narrow `skills/ron-work-protocol.md` scope/lifecycle delta in this branch.
- Custom Instructions remain identical in both conditions.
- Same model/product mode and same exact prompts in fresh chats.

## Desired contrast
1. Self-contained personal request with all decision-relevant facts explicit: answer directly; do not invent an optimization objective, broaden scope, or load irrelevant personal state.
2. Self-correction of that answer: preserve verified parts, repair only concrete defects, and do not manufacture new defects under pressure.
3. New explicit evidence/intent: update when it materially changes the answer.
4. Current-state/continuation request: still recover Ron OS canonical state rather than pretending the thin path means 'ignore continuity'.

## Rejection criteria
Reject the candidate if it improves directness only by losing current-state recovery, provenance discipline, safety, or continuation. Reject it if it is merely shorter but less correct. Prefer it only if it is at least as correct on stateful continuity and materially less prone to objective/scope substitution on the self-contained sequence.
