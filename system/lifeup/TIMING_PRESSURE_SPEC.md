# System Timing / Pressure v2

Status: **PROMOTED / CHALLENGE CONTRACT V1 ACTIVE**
Policy ref: `system-timing:v2`
Challenge ref: `system-challenge-contract:v1`
Legacy compatibility: `system-soft-target:v1`

## Runtime activation
Writable timing behavior:
- `NONE` on ordinary Quest v2;
- `HARD_EXTERNAL` on ordinary Quest v2 with a defensible real external deadline;
- `CHALLENGE` only through the compound `challenge.create` action with an exact preaccepted recovery contract.

`RECOMMENDED_WINDOW` remains an additive planning declaration on an existing active quest. Passing it never changes quest lifecycle or reward eligibility.

## Modes
- `NONE` — no timing pressure. Default when timing adds no material value.
- `RECOMMENDED_WINDOW` — planning aid only. May remind before the window. Passing it never changes quest lifecycle or reward eligibility and must not leave a stale failure-like countdown.
- `HARD_EXTERNAL` — real external deadline. Missing it may expire the quest.
- `CHALLENGE` — voluntarily accepted artificial deadline with an exact predeclared recovery contract. It is optional and never inferred merely because urgency might help.

## Evidence interpretation

Timing/Pressure v2 is a safety/consistency contract, not a claim that artificial deadlines are generally optimal.

- Current evidence on commitment devices and artificial deadlines is heterogeneous. A 2020 student field experiment (Bisin & Hyndman, DOI 10.1016/j.geb.2019.11.010) found demand for deadlines without improved completion, and a 2026 replication (Hyndman & Bisin, DOI 10.1177/09567976261460772) did not reproduce the classic deadline-performance advantage.
- The frequently cited Ariely & Wertenbroch (2002) deadline article is retracted and is not a valid evidence anchor for new System policy.
- No universal artificial deadline duration (including 24 hours), reminder frequency, or recovery duration is treated as research-established.
- Therefore `NONE` remains the default; `CHALLENGE` remains voluntary and preaccepted; any Ron-specific artificial timing is an N-of-1 intervention whose benefit must be judged against completion, delay-to-start, friction, annoyance/threat, recovery and abandonment/gaming signals.
- Reminder count is not assumed to have a monotonic dose-response. Recommended windows retain the bounded one-reminder behavior below; higher-frequency reminder configurations outside this timing contract must be treated as explicit user preference/experiment, not as the System evidence default.

## New Quest v2 deadline contract
Any ordinary `quest.create` with non-null `deadline_at` must declare `timing_mode=HARD_EXTERNAL`. Direct `quest.create` with `timing_mode=CHALLENGE` remains fail-closed because it could persist the deadline without the exact recovery contract.

`HARD_EXTERNAL` requires no recovery contract. The controller must have defensible real-world evidence that the deadline is externally meaningful; the runtime field prevents accidental ambiguous hard deadlines but does not replace upstream evidence checks.

A Challenge is created only through `challenge.create`, which must include:
- a visible Quest v2 with explicit `quest_id` and future `deadline_at`;
- canonical UUID `contract_id`;
- exact `recovery_title`;
- exact `recovery_objective`;
- optional positive `recovery_target` (default `1`);
- optional `recovery_unit` (default `count`).

The Challenge contract and parent Quest persist atomically. Challenge v1 cannot retrofit an already-created Quest. The recovery contract is accepted before the deadline, never invented after a miss.

## Challenge miss semantics
When the deadline of an active Challenge passes:
1. the parent Quest becomes `EXPIRED` and its prospective reward is unavailable under normal Quest lifecycle semantics;
2. the exact preaccepted unscored `RECOVERY` Quest is created in the same PostgreSQL transaction;
3. already awarded XP, Coins, verified skills, attributes, achievements, levels and other durable progress are not subtracted;
4. recovery creation does not write `quest.focused` or automatically steal execution focus;
5. no Challenge reward multiplier or extra progression award is created by the label itself.

Create/expiry child identities are deterministic from `contract_id`, and repeated calls replay idempotently rather than creating duplicate declarations, expiry events or recovery Quests.

## Recommended windows
New declarations use a `notification.push` event whose source ref begins:

`system-timing:v2?mode=RECOMMENDED_WINDOW&quest=<quest-id>&target=<iso-timestamp>`

The declaration itself may be shown as an informational planning message. Automation may send one idempotent pre-window reminder within one hour. There is no post-window missed warning.

Legacy `system-soft-target:v1` declarations remain immutable. For active quests they may be interpreted as legacy recommended-window evidence, but new controller actions must not create new Soft Target declarations.

## Deadline engine
- `HARD_EXTERNAL`: existing reminder/expiry semantics remain.
- `CHALLENGE`: reminders explicitly identify the commitment as an `Испытание`; a miss routes through the atomic Challenge recovery action before emitting the recovery notification.
- `RECOMMENDED_WINDOW`: pre-window informational reminder only; never terminalizes the Quest.
- Legacy deadline-bearing quests remain reconstructable and continue under legacy hard-deadline behavior.

The engine must never route a Challenge miss through ordinary `quest.expire` alone, because that could leave the parent terminal without its accepted recovery Quest.

## Progress preservation
Timing/pressure automation may affect only prospective reward under the Quest's declared lifecycle. It never subtracts already awarded XP, Coins, skill evidence, attributes, levels or achievements.

## Player projection
- Future recommended window: show `РЕКОМЕНДУЕМОЕ ОКНО`.
- Passed recommended window: show no stale timing countdown.
- `HARD_EXTERNAL`: show `СРОК`.
- `CHALLENGE`: show `ИСПЫТАНИЕ` plus the accepted recovery title/consequence; do not expose internal contract IDs.
- Do not present the retired term `Мягкая цель` for new runtime state.

## Authorization boundary
Challenge capability being runtime-active does not authorize the System to convert an existing Quest or choose an artificial deadline/recovery consequence on Ron's behalf. A concrete Challenge requires the player-facing controller to have an explicit accepted deadline and exact recovery contract under current System authorization. Engineering/maintenance may implement and verify the capability but may not play it for Ron.
