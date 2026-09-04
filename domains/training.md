# Ron Training — current-state canon

Updated: 2026-09-04
Status: **TEMPORARILY PAUSED / FOUR-DAY LAUNCH TARGET RECONFIRMED / LIVE SUBSCRIPTION-GATED**
AS_OF: **2026-09-04 direct Ron correction/reconfirmation of Mon/Tue/Thu/Fri launch schedule; 2026-09-03 direct Ron pause/restart condition; 2026-08-29 Ron-supplied Liftosaur export for exact program fallback**

## Ownership contract

This file is the single GitHub owner of current/last-confirmed training fallback state.

Liftosaur owns live mutable application state. Until subscription/live read is available, the newest Ron-supplied export is the exact dated fallback at its export moment. Ron edits Liftosaur manually; the assistant stores a sanitized dated snapshot, compares it with the previous export and updates this owner. No Liftosaur or other live-source mutation is authorized without Ron's explicit permission for the exact intended change.

Exact dated evidence and full audit: `snapshots/liftosaur/2026-08-29.md`. Full training-relevant snapshot, including program source/comments, both programs, all 30 history records, progression snapshots, measurements, gym/equipment data, custom exercises/notes and settings: `snapshots/liftosaur/2026-08-29.sanitized.json.gz.b64`. The archive is evidence, not a second mutable owner.

## Current execution transition — 2026-09-03 direct Ron report

- Ron has temporarily stopped going to the gym while the nutrition program is being finalized.
- This pause does **not** replace the intended training target/program.
- On the same day Ron begins executing the finished nutrition program, he intends to resume strength training.
- Therefore nutrition launch calculations should use the **TARGET/LAUNCH activity state** rather than the temporary no-gym NOW state.

## Target frequency correction/reconfirmation — 2026-09-04 direct Ron report

- Ron explicitly states that his ordinary gym schedule remains **Mon/Tue/Thu/Fri (four strength sessions per week)** and that he has **not made a decision to change it**.
- This latest direct statement supersedes the earlier same-day Ron OS entry that treated a permanent switch to three weekly sessions as confirmed.
- Therefore the **TARGET/LAUNCH activity state is four weekly strength sessions**, not the temporary zero-session pause and not a three-session target.
- The existing **3100 kcal/day** nutrition launch target was designed under the four-day training assumption and therefore remains aligned with the intended launch frequency, while still being a reversible calibration hypothesis rather than a measured TDEE.

## Exact active program at export

- Current program: `txfxzary`, **«Программа тренировок от Клода»**.
- Cloned 2026-07-29; selected current 2026-07-31; planner's last-modified marker is 2026-08-04 03:56 UTC.
- One week, four days, 43 exercise occurrences and **146 prescribed work sets/week**.
- Exact split: **Mon Lower A 36 / Tue Upper A 39 / Thu Lower B 37 / Fri Upper B 34**.
- `nextDay = 2` is only the app's sequential pointer. The source explicitly says to open the correct weekday manually because Liftosaur does not advance by calendar weekday.
- Archived/inactive program: `kmxuaopn`, **«3 раза в неделю фуллбади, Моя программа»**; do not edit it as the active program.
- Known stale premise: Mon/Tue/Wed/Fri is not current. The exported schedule Mon/Tue/Thu/Fri matches Ron's current intended launch weekday placement, but the export remains dated evidence for exact post-export program contents.
- Exact current exercise names, targets, timers, supersets, technique comments and executable progression source are retained in the dated snapshot/audit, not duplicated here.

## Known downstream XMind projection drift — 2026-08-29
The live XMind muscle-gain note says gym 3 times/week. That is a downstream projection and now conflicts with Ron's newer direct Mon/Tue/Thu/Fri launch decision; it does not own current training frequency. No XMind mutation is authorized. Full evidence: `history/2026-08-29-xmind-full-audit.md`.

## Operating logic confirmed by the export

- 1–2 minutes jump rope, then two standalone movements with 180-second rest; later work is organized into circuits.
- 15 seconds means transition inside a circuit; 90/120 seconds marks the end of a round.
- Short-session minimum: two standalone movements plus circuit A. Omitted later circuits do not advance their progression.
- Ramp-in: weeks 1–2 Mon/Tue/Thu only; from week 3 all four days. This is dated exported program logic; Ron's latest direct launch-frequency statement owns the intended weekly schedule, so do not silently use this historical ramp-in to reduce the launch activity assumption.
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

Until then, this export can answer exact program/app state as of 2026-08-29. Any post-export manual app edit remains `UNKNOWN` unless Ron reports it. Current real-world execution is temporarily paused per the 2026-09-03 direct report; the intended launch state is Mon/Tue/Thu/Fri, four strength sessions per week, per Ron's latest 2026-09-04 direct correction/reconfirmation.