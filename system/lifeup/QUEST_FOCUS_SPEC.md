# Ron System — Open Quest / Execution Focus v1

Status: **ARCHITECTURE CANDIDATE**
Policy ref: `system-quest-focus:v1`

## Objective

Let the System remember several legitimate real-world obligations without making Ron actively juggle them. Quest lifecycle and execution attention are different concerns: the ledger may contain several OPEN Quest v2 records, while the player surface presents at most one execution FOCUS.

## State model

Quest v2 has two independent axes.

### Lifecycle
- `ACTIVE` = OPEN / non-terminal. Multiple Quest v2 records may be OPEN at once.
- `COMPLETED`, `CANCELLED`, `FAILED`, `EXPIRED` remain terminal exactly as before.
- Lifecycle still owns objective progress, evidence, timing, completion and rewards.

### Execution focus
- `FOCUSED` = the one OPEN quest the System currently presents as the execution target.
- `BACKGROUND` = a legitimate OPEN quest remembered by the System but not competing for immediate attention.
- `NONE` = terminal/non-v2 or no current execution focus.
- At most one OPEN Quest v2 may project as `FOCUSED`.

Focus is not completion, priority truth, reward, deadline or evidence. It is scarce execution attention.

## Creation and continuity

- Creating another OPEN quest is allowed while a focused quest exists.
- Creation never steals an existing focus.
- Outcome-key/cadence duplicate protection remains independent and can still reject redundant scored quests.
- A legacy ledger with no `quest.focused` event preserves continuity by projecting the earliest still-OPEN Quest v2 as `FOCUSED`. This is a read-time compatibility rule and writes no event.
- Once explicit focus history exists, the latest explicit focus target owns focus only while it remains OPEN. If it terminates, focus becomes empty rather than silently moving to an arbitrary background quest.

## Focus selection

When focus is empty and OPEN quests remain, use Strategic Context Orchestration to compare the current real-world situation again. Do not use FIFO, newest-first, highest XP, nearest recommended window, or game reward as an automatic priority rule.

Mandatory reality gates may preempt discretionary strategy: safety, health/legal constraints, hard external deadlines, genuinely blocking obligations and stronger current-owner conflicts. Verified XMind alignment remains the default long-horizon prior among discretionary alternatives.

`quest.focus` is the append-only System action that records an explicit focus change. Its target must exist, be Quest v2 and still be OPEN. Re-focusing the already focused quest is rejected as a no-op. Focus changes use normal internal authorization; maintenance automation cannot choose gameplay focus for Ron.

## Background quest behavior

A BACKGROUND quest remains a real quest:
- hard external deadlines still apply;
- reported/verified progress may be recorded;
- it may complete, cancel, fail or expire under the normal lifecycle gates;
- it keeps its canonical reward if otherwise eligible;
- it may emit deadline notifications under the existing timing policy.

Being background never lowers difficulty/reward, fabricates progress, pauses a real external deadline, or weakens evidence requirements.

## Player surface

- Home/focus card shows only the projected `FOCUSED` quest.
- Quest list may show all visible OPEN quests and labels the focused one `В ФОКУСЕ`; other OPEN quests are `В ФОНЕ`.
- If OPEN quests exist but focus is empty, the home card must show that the System is re-evaluating/selecting focus, not arbitrarily display one background quest.
- The player should normally receive one clear next action from the focused quest.

## Interaction with other policies

- `system-quest-difficulty:v1`: unchanged. Score real-world outcome first; focus never inflates rank/reward.
- `system-quest-reward:v1`: unchanged.
- `system-timing:v2`: unchanged. Recommended windows remain planning-only; `HARD_EXTERNAL` remains the only currently writable deadline-bearing mode.
- `system-outcome-key:v1`: unchanged. Multiple OPEN quests do not bypass duplicate-outcome protection.
- `system-strategic-context:v1`: chooses/recommends the best execution direction when focus is absent or legitimately reconsidered.
- `system-events`: remains the single mutable owner of derived RPG state; PWA remains projection-only.

## Non-goals

This slice does not create Daily/Routine quest automation, Challenge persistence, arbitrary auto-preemption, a fixed quest queue, a second state store or a generic priority score. Those require separate evidence and architecture work if later justified.
