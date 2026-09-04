# Ron Training — current-state canon

Updated: 2026-09-04
Status: **TEMPORARILY PAUSED / THREE-DAY TARGET CONFIRMED / LIVE SUBSCRIPTION-GATED**
AS_OF: **2026-09-04 direct Ron target-frequency decision; 2026-09-03 direct Ron pause/restart condition; 2026-08-29 Ron-supplied Liftosaur export for exact program fallback**

## Ownership contract

This file is the single GitHub owner of current/last-confirmed training fallback state.

Liftosaur owns live mutable application state. Until subscription/live read is available, the newest Ron-supplied export is the exact dated fallback at its export moment. Ron edits Liftosaur manually; the assistant stores a sanitized dated snapshot, compares it with the previous export and updates this owner. No Liftosaur or other live-source mutation is authorized without Ron's explicit permission for the exact intended change.

Exact dated evidence and full audit: `snapshots/liftosaur/2026-08-29.md`. Full training-relevant snapshot, including program source/comments, both programs, all 30 history records, progression snapshots, measurements, gym/equipment data, custom exercises/notes and settings: `snapshots/liftosaur/2026-08-29.sanitized.json.gz.b64`. The archive is evidence, not a second mutable owner.

## Current execution transition — 2026-09-03 direct Ron report

- Ron has temporarily stopped going to the gym while the nutrition program is being finalized.
- This pause does **not** replace the intended training target/program.
- On the same day Ron begins executing the finished nutrition program, he intends to resume strength training.
- Therefore nutrition launch calculations should use the **TARGET/LAUNCH activity state** rather than the temporary no-gym NOW state.

## Target frequency decision — 2026-09-04 direct Ron report

- When the finished nutrition program begins, Ron will **permanently switch to three strength-training sessions per week**. This supersedes the prior four-session/week launch assumption.
- The exact three-day program, weekday placement, session duration and weekly work-set volume are **UNKNOWN/UNCONFIRMED** until Ron selects or reports them. The archived three-day full-body program must not be silently reactivated merely because its frequency matches.
- The exported four-day program remains exact dated program evidence and can inform exercise/progression history, but it is **no longer the target launch frequency**.
- Nutrition launch activity should therefore be modeled around **three weekly strength sessions**, with the remaining non-training activity handled by its own current/fallback evidence. The existing 3100-kcal nutrition target was designed under a four-day assumption and remains only a reversible calibration hypothesis; do not infer a precise calorie reduction from frequency alone without the new program's weekly workload/duration or outcome-trend evidence.

## Exact active program at export

- Current program: `txfxzary`, **«Программа тренировок от Клода»**.
- Cloned 2026-07-29; selected current 2026-07-31; planner's last-modified marker is 2026-08-04 03:56 UTC.
- One week, four days, 43 exercise occurrences and **146 prescribed work sets/week**.
- Exact split: **Mon Lower A 36 / Tue Upper A 39 / Thu Lower B 37 / Fri Upper B 34**.
- `nextDay = 2` is only the app's sequential pointer. The source explicitly says to open the correct weekday manually because Liftosaur does not advance by calendar weekday.
- Archived/inactive program: `kmxuaopn`, **«3 раза в неделю фуллбади, Моя программа»**; do not edit it as the active program.
- Known stale premise: Mon/Tue/Wed/Fri is not current. Confirmed exported schedule is Mon/Tue/Thu/Fri, but that four-day schedule is now dated fallback rather than the intended post-launch frequency.
- Exact current exercise names, targets, timers, supersets, technique comments and executable progression source are retained in the dated snapshot/audit, not duplicated here.

## Known downstream XMind projection drift — 2026-08-29
The live XMind muscle-gain note says gym 3 times/week. That frequency now happens to match Ron's newer 2026-09-04 decision, but the map remains a downstream projection and does not prove the exact new program, schedule or workload. No XMind mutation is authorized. Full evidence: `history/2026-08-29-xmind-full-audit.md`.

## Operating logic confirmed by the export

- 1–2 minutes jump rope, then two standalone movements with 180-second rest; later work is organized into circuits.
- 15 seconds means transition inside a circuit; 90/120 seconds marks the end of a round.
- Short-session minimum: two standalone movements plus circuit A. Omitted later circuits do not advance their progression.
- Ramp-in: weeks 1–2 Mon/Tue/Thu only; from week 3 all four days. This belongs to the dated exported four-day program and is not automatically the rule for the new three-day target.
- Pick the exercise's working weight in the first set and hold it unless technique breaks.
- Custom progression uses completed work and `min(completedWeights)`; three sessions without progression trigger approximately **60% -> 90% -> working load**.
- Only explicit non-zero current counter in source: **Mon Lying Leg Curl `stall = 1`**. No explicit exercise is at deload stage 1 or 2.
- Repeated Thu/Fri exercises without another `progress:` clause inherit progression from the earlier occurrence; inspect both appearances before a manual edit.
- Barbell kg configuration is `bar = 0`; program/logged barbell weight means plates only. Available barbell plates are 20/10/5/2.5 kg, giving a practical 5 kg total-load step.

## Dated history and measurements

- 30 workout records from 2026-05-18 through 2026-08-03: 29 under archived `kmxuaopn`, one under active `txfxzary`.
- Active-program history: **2026-08-03 Mon Lower A, 36/36 work sets completed**, 145 minutes wall-clock and 132 recorded active minutes.
- All history: 683/713 completed set objects; five records contain an incomplete set.
- Median recorded duration is about 98.5 minutes wall-clock / 86.5 active. The 2026-06-01 record at ~707/693 minutes is a timer anomaly, not a real duration estimate.
- No workout record exists after 2026-08-03 in this export. This is app-history evidence only, not an adherence judgment and not evidence that the integrated personal system has started.
- Liftosaur bodyweight field is 67 kg; dated app measurements are 68 kg then 67 kg on 2026-07-31. These do not own current bodyweight outside that date.
- At export, Google Health workout/measurement sync flags and the public-profile flag are enabled. Recorded only; no setting change is authorized.

## Post-session/manual-source differences

The planner was modified after the only active-program session, so current source wins over that session snapshot. Recorded differences include Seated -> Lying Leg Curl on Monday, Seated Calf reset from the post-session 25 kg/stall-1 result to current 40 kg/no non-zero stall, Triceps Extension 25 -> 30 kg, and a Hip Adductor equipment-identity change. Treat these as manual-source deltas, not automatic errors.

## Subscription and refresh protocol

Ron will buy/restore Liftosaur subscription only after the rest of the integrated live system is ready. Do not prompt him to change that decision or treat the gate as an execution failure.

When Ron supplies a newer export:
1. verify and hash it;
2. sanitize account identifiers without dropping training-relevant data;
3. diff active/current program, exact source/targets, progression state, next-day pointer, history, measurements, equipment and custom exercises;
4. add a new dated snapshot without overwriting this one;
5. update this AS_OF/current fallback and read it back.

Until then, this export can answer exact program/app state as of 2026-08-29. Any post-export manual app edit remains `UNKNOWN` unless Ron reports it. Current real-world execution is temporarily paused per the 2026-09-03 direct report; the intended launch state is now three strength sessions per week per the 2026-09-04 direct decision. Exact three-day program content remains unknown. Do not derive the new program by merely deleting one exported day or by automatically restoring the archived three-day program; first preserve the intended exercise/progression goals and confirm the actual three-day design.
