# System Timing / Pressure v2

Status: **CANDIDATE**
Policy ref: `system-timing:v2`
Challenge target ref: `system-challenge-contract:v1`
Legacy compatibility: `system-soft-target:v1`

## Runtime activation in this slice
Active write modes: `NONE`, `HARD_EXTERNAL`.

`RECOMMENDED_WINDOW` is an additive planning declaration on an existing active quest. `CHALLENGE` is part of the approved target architecture but remains **fail-closed for new writes** until its quest + contract persistence can be made atomic and verified. The controller must not present Challenge as live before that later slice is promoted.

## Modes
- `NONE` — no timing pressure. Default when timing adds no material value.
- `RECOMMENDED_WINDOW` — planning aid only. May remind before the window. Passing it never changes quest lifecycle or reward eligibility and must not leave a stale failure-like countdown.
- `HARD_EXTERNAL` — real external deadline. Missing it may expire the quest.
- `CHALLENGE` — target behavior: voluntarily accepted artificial deadline with an exact predeclared recovery quest; not activated in this slice.

## New Quest v2 deadline contract
Any newly created Quest v2 with non-null `deadline_at` must declare `timing_mode`. This slice accepts only `HARD_EXTERNAL`; `CHALLENGE` is explicitly rejected until atomic contract persistence is verified.

`HARD_EXTERNAL` requires no penalty contract. The controller must have defensible real-world evidence that the deadline is externally meaningful; the runtime field prevents accidental ambiguous hard deadlines but does not replace upstream evidence checks.

Target Challenge contract fields remain reserved for the later activation slice: `contract_id`, `recovery_title`, `recovery_objective`, optional `recovery_target`, and optional `recovery_unit`. No Challenge quest may be created merely because those fields are structurally understood by helper code.

## Recommended windows
New declarations use a `notification.push` event whose source ref begins:

`system-timing:v2?mode=RECOMMENDED_WINDOW&quest=<quest-id>&target=<iso-timestamp>`

The declaration itself may be shown as an informational planning message. Automation may send one idempotent pre-window reminder within one hour. There is no post-window missed warning.

Legacy `system-soft-target:v1` declarations remain immutable. For active quests they may be interpreted as legacy recommended-window evidence, but new controller actions must not create new Soft Target declarations.

## Deadline engine
- `HARD_EXTERNAL`: existing deadline reminder/expiry semantics remain.
- `CHALLENGE`: helper design may exist in candidate code/tests, but production write activation is forbidden until a later atomic-persistence slice is promoted.
- Legacy deadline-bearing quests remain reconstructable and continue under legacy hard-deadline behavior.

## Progress preservation
Timing/pressure automation may affect the prospective reward of the quest being resolved under its declared lifecycle. It never subtracts already awarded XP, coins, skill evidence, attributes, levels or achievements.

## Player projection
- Future recommended window: show `РЕКОМЕНДУЕМОЕ ОКНО`.
- Passed recommended window: show no stale timing countdown.
- `HARD_EXTERNAL`: show `СРОК`.
- Do not present the retired term `Мягкая цель` for new runtime state.
- Challenge-specific player UI waits for Challenge activation; do not imply it is live early.
