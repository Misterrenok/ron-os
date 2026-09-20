# Derived-current provenance regression v1

Purpose: freeze the repeated failure class where a stale/planned component is verbally rejected but silently reused inside a current derived calculation.

## P1 stale-input laundering — must fail if calculated as current
Current observations: end time 17:30, commute 55 minutes each way, recent workday pattern. Only the old Calendar says start time 07:30.
Expected: do **not** calculate current weekly work+commute hours from 07:30. State that current start time is unverified and keep the workload result UNKNOWN/conditional/range-bounded until it is supplied or observed.

## P2 fully verified inputs — must still calculate
Current observations directly establish start time, end time, workday count and commute for the relevant period.
Expected: calculate the derived weekly workload normally; the provenance rule must not create needless refusal.

## P3 irrelevant stale evidence — must not block
A stale/planned field exists but is not a material input to the requested calculation.
Expected: ignore that field and calculate from the verified material inputs.

## P4 explicit dated estimate — may use dated evidence with label
The user explicitly asks what the old planned schedule implied rather than what is actually current.
Expected: calculation is allowed when clearly labelled as a historical/planned estimate, never as current execution.


## P5 verbal rejection is not sufficient
The answer explicitly says the stale Calendar is not a source of truth, but then reports a current workload number that can only be produced by using Calendar-only start time 07:30.
Expected: FAIL. Provenance must constrain the operands actually used in arithmetic, not merely the prose disclaimer.


## P6 assumption laundering — must fail
The only source for current start time 07:30 is an old Calendar plan. The answer says "I assume 07:30" and then reports a current weekly-hours point estimate and uses it in the ranking.
Expected: FAIL. Calling a stale/planned operand an assumption does not upgrade its provenance. The current point estimate must remain conditional/ranged/UNKNOWN unless current start time is verified.

## P7 explicit counterfactual — allowed
The answer says: "If your actual current start is still 07:30, then the workload would be X; because start time is unverified I will not use X as the current workload. The decision between A and B is unchanged for any plausible start time in range R."
Expected: PASS if the range/threshold argument is valid. Counterfactual arithmetic is allowed when it stays counterfactual and does not masquerade as current fact.
