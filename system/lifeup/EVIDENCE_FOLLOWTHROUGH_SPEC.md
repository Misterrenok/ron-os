# Evidence Follow-through v1

Policy ref: `system-evidence-followthrough:v1`

Purpose: make the normal player loop `execution -> evidence -> verified resolution -> visible growth -> next safe continuation` happen with the least manual ceremony possible, without weakening real-world truth, reward integrity, strategic agency, or external-write boundaries.

## Scope

This policy is controller/runtime orchestration only. It creates no new mutable owner and no generic evidence warehouse. Ron OS and claim-specific live owners still own real-world truth. Neon `system_events` remains the single mutable owner of derived RPG state. Existing `quest.resolve` remains the only routine atomic scored-completion write.

Ron explicitly authorized autonomous deterministic follow-through for the live Ron System on 2026-09-16. This authorization is revocable at any time. It does not authorize external writes or strategic choices.

## Evidence contract

For every required Quest v2 objective, classify the strongest available current evidence:

- `VERIFIED`: the objective claim is supported by Ron's authoritative direct execution report for that claim class, a stronger claim-specific live record, or a controller-checked artifact/test whose contents actually establish the objective.
- `REPORTED`: an execution/progress claim exists but has not yet passed the objective's verification requirement.
- `MISSING`: no qualifying current evidence exists.

Never upgrade evidence merely because a System event, schedule, plan, timer, notification, or projection exists. Calendar/TickTick scheduledness is not execution. A live app completion flag may prove app completion but not necessarily learning/quality; when the quest explicitly contains a recall/performance objective, that objective still needs its own evidence.

## Same-value verification upgrade

Numeric progress remains monotonic. One special transition is allowed:

`same numeric value + previous claim REPORTED + new claim VERIFIED -> allowed`

This is an evidence-status upgrade, not new progress. It exists so a user-originated report can later be independently verified without fabricating a larger number. Equal-value REPORTED duplicates, equal-value VERIFIED duplicates, and all decreases remain invalid.

## Resolution state machine

Use the executable oracle `system/lifeup/cloud/src/followthrough-policy.mjs`.

1. Read live System state and the relevant real-world owner/live owner.
2. Match evidence to each required objective.
3. If a required objective is `MISSING`, return `NEEDS_EVIDENCE` and ask only for the minimum evidence that can resolve that objective.
4. If a required objective is only `REPORTED`, return `NEEDS_VERIFICATION`; do not award XP/coins.
5. If verified evidence can finish or upgrade every required objective, prepare one atomic `quest.resolve` payload. Do not split routine scored completion into separate progress/completion/reward writes.
6. Execute `quest.resolve` immediately as deterministic non-choice follow-through under Internal System authorization; no redundant confirmation is required.
7. Read back the ledger/snapshot. Only the read-back proves completion/reward.
8. Evaluate deterministic achievement eligibility immediately after a verified rewarded completion and unlock only if the existing achievement policy says eligible.

## Autonomous continuation gate

After verified completion, the controller may automatically create and focus a next quest without another prompt only when **all** of these are true:

- exactly one candidate remains after current authoritative context is applied;
- it is a direct continuation of the same already-approved trajectory/domain outcome, not a materially different life direction;
- Strategic Decision Envelope does not return mandatory preemption, resource allocation, reversible-test uncertainty, or another state requiring Ron's choice;
- there is no safety, health, legal, hard-deadline, financial, or other mandatory-reality conflict;
- every source that materially determines the continuation is sufficiently fresh/verified for the decision;
- the candidate passes normal Quest v2 difficulty, duplicate/outcome-key, evidence, timing, and safety gates;
- no external live-source write is required to create/focus the internal quest;
- the choice is genuinely non-material: Ron is not being committed to a materially different allocation of time, money, risk, identity, or strategic direction.

If any condition fails, return `ASK_RON` or `STOP`; do not hide a real choice behind automation.

When autonomous continuation is allowed, apply the smallest internal sequence needed: create the validated continuation and focus it if no other valid focused quest should remain. Read back afterward. Do not create a queue of speculative future quests.

## Automation boundary

A System automation may perform this deterministic follow-through only from qualifying user-originated or stronger live evidence already available to it. It may not invent evidence, mark an objective verified because time passed, simulate the task, choose among materially different directions, spend/redeem, or perform external writes. Engineering/maintenance work remains separate from gameplay; the automation may process evidence, but may not manufacture success.

## Player UX

The player-facing flow should minimize ceremony:

- if evidence is sufficient: resolve, reward, show growth, continue;
- if one evidence item is missing: ask for exactly that item;
- if a real strategic choice exists: present the choice rather than silently selecting it.

For learning quests, an app completion can establish the completion objective while a short recall/performance check can establish learning. Do not require redundant proof once both layers are already verified.
