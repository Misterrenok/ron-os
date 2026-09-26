# Streak + Pressure Profile v1

Policy refs:
- `system-execution-streak:v1`
- `system-pressure-profile:v1`

Activation: 2026-09-26 Europe/Istanbul

## Provenance

Ron explicitly said that he believes streaks are motivating for him and that the potential benefit of stronger punishment/commitment is worth the risk, then authorized the assistant to implement the version it considers most effective. The **decision to enable streaks and bounded punishment is Ron-authorized**. The exact operational parameters below are **assistant-selected working choices**, not claims that Ron specified them or that research establishes them as universal optima.

## Execution streak

The streak measures **kept planned execution days**, not arbitrary calendar attendance.

A day becomes streak-eligible when at least one of these occurs after policy activation:
1. System has a genuine `reminder.scheduled` execution window for a real visible Quest v2 on that local day;
2. a Challenge deadline falls on that day;
3. Ron produces verified Quest v2 execution on that day even without a prior reminder.

A day is secured by at least one verified `quest.progressed` or verified `quest.completed` event on a real visible Quest v2.

Rules:
- current streak increments once per secured eligible day;
- no execution obligation was scheduled and no execution occurred -> the day is neutral and does not break the streak;
- an eligible day that ends without verified execution breaks **current streak to 0**;
- a missed Challenge forces a streak break even if unrelated progress happened that day;
- best streak/history never reset;
- earned XP, Coins already owned, skills, achievements, levels and verified history are never deleted by a streak break;
- technical probes/tests never create streak obligations;
- a protected interruption may record `streak.excused` for the affected local day using one of the bounded reason classes `ILLNESS`, `SAFETY`, `EXTERNAL_DISRUPTION`, `SYSTEM_FAILURE`, `SCHEDULE_INVALIDATED`; an excused eligible day is neutral — it neither extends nor breaks the streak;
- `streak.excuse` is not a generic skip token and must not be used for ordinary avoidance, low motivation or convenience;
- if a Challenge becomes objectively unsafe/infeasible **before** its deadline, prefer cancelling the Challenge before expiry; an after-the-fact streak excuse may protect streak history but never restores a reward already forfeited or rewrites terminal Quest history;
- planned day remains `AT_RISK_TODAY` until the local day ends, so the System does not call an unfinished day a failure early.

Milestones are visible at 3 / 7 / 14 / 30 / 60 / 100 secured execution days. They do not mint routine XP/Coins.

## Bounded punishment / Challenge pressure

Challenge remains a special mode; ordinary quests are not automatically punished for existing.

Under Ron's explicit standing authorization in this slice, the controller may choose and create a **future** Challenge without a redundant per-quest confirmation only when every condition below is true:
- exact deadline and recovery contract are known before creation and are shown to Ron immediately after creation;
- it is a new Quest, never a retrofit of an existing Quest;
- at most one Challenge is active at a time;
- during the first calibration phase, at most **2 Challenge starts per rolling 7 days**;
- the task is a clear, safe, independently valuable MAIN/DAILY outcome with usable prerequisites and an actual feasible execution window;
- focused effort is approximately 15–90 minutes and uncertainty is low enough that failure mostly reflects execution rather than hidden prerequisites;
- no Challenge may pressure sleep, ordinary rest, food/water, medication/health care, physical safety, mandatory legal compliance, debt repayment, or a real external deadline (use HARD_EXTERNAL for the latter);
- the deadline is derived from a real available window and includes practical completion buffer rather than an arbitrary universal duration.

On a missed Challenge:
1. parent Quest expires and its **prospective** reward becomes unavailable;
2. current execution streak breaks;
3. the exact predeclared recovery Quest is created;
4. already earned progression is untouched.

Default recovery design for the initial calibration phase: one unscored bounded block that records the concrete cause of the miss and immediately performs the first **5 minutes / first physical restart step** of the intended action. Five minutes is an operational low-friction restart choice, not a scientifically optimal duration.

## Adaptive stop rules

This is an N-of-1 pressure experiment, not dogma.

After **6 Challenge outcomes or 21 days**, whichever occurs first, review:
- completion rate;
- time-to-start;
- reminders required;
- Challenge miss rate;
- recovery completion/time;
- streak continuity;
- evidence of gaming, avoidance, hiding from System, or excess maintenance burden.

Disable automatic Challenge selection before that review if:
- 3 of the last 5 Challenges are missed; or
- Ron directly reports that pressure is causing material avoidance, sleep/safety tradeoffs, dishonest logging or abandonment.

A softer mechanism wins whenever it produces higher expected real-world value. Harshness is not a goal.

## Reward policy

Do not add daily/streak Coin faucets. Streak is itself salient feedback and loss exposure. Coins remain scarce; achievements remain milestone history; XP remains irreversible progression.

## UI

The player UI should show:
- current streak;
- best streak;
- whether today is secured / at risk / neutral / broken;
- next streak milestone;
- Challenge results count.

This keeps the pressure legible without requiring manual bookkeeping.
