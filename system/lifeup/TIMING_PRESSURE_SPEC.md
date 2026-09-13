# System Timing / Pressure v2

Status: **CANDIDATE**
Policy ref: `system-timing:v2`
Challenge ref: `system-challenge-contract:v1`
Legacy compatibility: `system-soft-target:v1`

## Modes
- `NONE` — no timing pressure. Default when timing adds no material value.
- `RECOMMENDED_WINDOW` — planning aid only. May remind before the window. Passing it never changes quest lifecycle or reward eligibility and must not leave a stale failure-like countdown.
- `HARD_EXTERNAL` — real external deadline. Missing it may expire the quest.
- `CHALLENGE` — voluntarily accepted artificial deadline with an exact predeclared recovery quest.

## New Quest v2 deadline contract
Any newly created Quest v2 with non-null `deadline_at` must declare `timing_mode` as `HARD_EXTERNAL` or `CHALLENGE`.

`HARD_EXTERNAL` requires no penalty contract. The controller must have defensible real-world evidence that the deadline is externally meaningful; the runtime field prevents accidental ambiguous hard deadlines but does not replace upstream evidence checks.

`CHALLENGE` requires a `challenge_contract` object with:
- `contract_id` — stable id;
- `recovery_title` — player-facing recovery quest title;
- `recovery_objective` — exact bounded objective text;
- optional `recovery_target` (default 1) and `recovery_unit` (default `session`).

The exact challenge deadline and recovery consequence must be accepted before quest creation. The recovery quest is deterministic follow-through from that accepted contract, has class `RECOVERY`, rank `E`, zero XP/coins by default, no deadline, and a stable derived quest id. It is created only after the challenged quest becomes terminal and only once.

## Recommended windows
New declarations use a `notification.push` event whose source ref begins:

`system-timing:v2?mode=RECOMMENDED_WINDOW&quest=<quest-id>&target=<iso-timestamp>`

The declaration itself may be shown as an informational planning message. Automation may send one idempotent pre-window reminder within one hour. There is no post-window missed warning.

Legacy `system-soft-target:v1` declarations remain immutable. For active quests they may be interpreted as legacy recommended-window evidence, but new controller actions must not create new Soft Target declarations.

## Deadline engine
- `HARD_EXTERNAL`: existing deadline reminder/expiry semantics remain.
- `CHALLENGE`: deadline reminders identify the challenge; after expiry, create exactly one predeclared recovery quest, then emit the terminal challenge notice.
- Legacy deadline-bearing quests without `timing_mode` remain reconstructable and continue under legacy hard-deadline behavior; only *new* deadline-bearing quests require explicit v2 timing semantics.

## Progress preservation
Timing/pressure automation may affect the prospective reward of the quest that is being resolved under its declared lifecycle. It never subtracts already awarded XP, coins, skill evidence, attributes, levels or achievements.

## Player projection
- Future recommended window: show `РЕКОМЕНДУЕМОЕ ОКНО`.
- Passed recommended window: show no stale timing countdown.
- `HARD_EXTERNAL`: show `СРОК`.
- `CHALLENGE`: show `ВЫЗОВ ДО` and visually distinguish it from an external deadline.
- Do not present the retired term `Мягкая цель` for new runtime state.
