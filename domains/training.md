# Ron Training — current-state canon

Updated: 2026-10-21
Status: **TRAINING RESUMED / LIVE LIFTOSAUR VERIFIED / ARCHIVED EXPORT FALLBACK RETAINED**
AS_OF: **2026-10-21 live Liftosaur read-back / 2026-10-19 recorded workouts / dated 2026-08-29 export for prior fallback only**

## Ownership contract

This file is the single GitHub owner of current/last-confirmed training fallback state.

Liftosaur owns live mutable application state. Until subscription/live read is available, the newest Ron-supplied export is the exact dated fallback at its export moment. Ron edits Liftosaur manually; the assistant stores a sanitized dated snapshot, compares it with the previous export and updates this owner. No Liftosaur or other live-source mutation is authorized without Ron's explicit permission for the exact intended change.

Exact dated evidence and full audit: `snapshots/liftosaur/2026-08-29.md`. Full training-relevant snapshot, including current program source/comments, history records, progression snapshots, measurements, gym/equipment data, custom exercises/notes and settings: `snapshots/liftosaur/2026-08-29.sanitized.json.gz.b64`. The archive is evidence, not a second mutable owner.

## Live state — 2026-10-21

- Liftosaur is currently **accessible through the connected read/write integration** for scoped, explicitly permitted edits. This observation supersedes the prior historical app-access gate; it does not establish account subscription or billing status.
- Live active program **`txfxzary`**, **«Программа тренировок от Клода»**: four upper/lower days, **146 prescribed working sets/week** (Mon 36, Tue 39, Thu 37, Fri 34). The Oct 21 edit preserved existing exercise identities, order, current weights, sets, repetitions, timers, and superset markers; live read-back matched the written Liftoscript.
- Live history contains **two recorded Oct 19, 2026 sessions** in the active program, Mon Lower A and Tue Upper A. These are app workout records and supersede the prior real-world-pause inference; recorded work sets are not proof that every prescribed rep/weight target was met.
- **User-authorized correction 2026-10-21:** custom progression tracks the highest total completed reps at the same working weight. Increasing total reps resets the no-progress counter despite an incomplete prescribed target; after a baseline and three consecutive no-improvement sessions, the existing staged deload (~60% -> ~90% -> working load) applies. Normal full-success weight progression remains. Exercising under a changed working weight restarts the comparison. Simulations verified improvement, three stagnant sessions, deload, normal squat progression, and capped small-muscle progression *before* the change; live program was read back identically afterward. No real-world hypertrophy/recovery benefit has yet been proven.
- **Safety/convenience:** large automatic jumps (>20% of the working weight) are held for External Rotation, Neck Curl, Neck Extension, Neck Side Bend, Y Raise, and Tibialis Raise; choose any feasible smaller step manually rather than forcing a large jump. Program descriptions clarify flexible 15-second transitions, longer rest where technique suffers, and safer cues for Bulgarian Split Squat, chest fly, shoulder rotation, leg curl, neck exercises, and shrug grip. Targeted exercise notes were also refreshed and verified in live Liftosaur.
- Workout descriptions include **video preview links**, not verified native uploaded exercise images. The connected Liftosaur API does not expose native media upload. Do not label native-image completion as done. A custom Cable Hip Adduction card was preserved instead of deleting or merging it, because history linkage must not be lost.
- Live Liftosaur remains authoritative for all subsequent mutable goals, progress counters, notes, and recorded training; this section is a dated execution result only.

## OPEN — native exercise illustrations (Work handoff, 2026-10-21)

**Goal:** finish the exercise-media task in the actual Liftosaur web UI, without touching working program structure or training history. Ron delegated this remaining scoped task for ChatGPT Work. Completion requires evidence that each relevant exercise card really shows its own **native image/GIF/animation** on the exercise-detail/workout screen. Markdown preview thumbnails or YouTube hyperlinks in Liftoscript are not proof of native media.

**Current evidence:** live Liftosaur connector verified active program `txfxzary` («Программа тренировок от Клода»), existing progression corrections and descriptions; the connector has no native custom exercise media upload action. Live connected `list_custom_exercises` returned seven custom entries:
- `ufxplgko` Cable Hip Adduction (cable hip-adduction demonstration);
- `tsazcvcw` External Rotation (single-arm cable external shoulder rotation, elbow beside torso; do both sides);
- `uoxbafww` Neck Curl (controlled neck flexion);
- `qrmwybon` Neck Extension (controlled neck extension);
- `xkciirmt` Neck Side Bend (controlled unilateral lateral neck flexion);
- `aknnfbos` Tibialis Raise (correct selected bodyweight or weighted version);
- `aoschbqy` Y Raise (correct incline/face-down Y raise).
Inspect the newly substituted `Seated Calf Raise, Dumbbell` card as well; it has a linked video preview in workout instructions, but its native illustration remains unverified. Check for other conspicuously imageless entries in the actual four-day program only if naturally revealed by the inspection, not as a reason to redesign.

**Work execution plan:**
1. Open Liftosaur in Work's browser/computer, use the user's existing authorized login if available (otherwise let Ron perform any necessary sign-in; never ask to transmit credentials in chat).
2. Inspect native exercise-card media of the seven custom exercises and seated dumbbell calf raise; record which are already adequate. Do **not** assume the images are missing just because the read-only connector lacks media fields.
3. For verified gaps only, use the UI's supported image/GIF/video attachment mechanism if it exists, with accurately matching technique and legitimately usable source assets; avoid deceptive mismatched images or unrelated exercises. If the app does not support native user media for a card, document the exact UI limitation and use the existing explanatory link where appropriate—do not claim native completion.
4. Read back each modified card in the actual UI and, where feasible, its workout presentation. Give Ron a concise by-exercise completion report with screenshots/evidence or exact blockers.
5. Record the result in this owner through a GitHub PR with required `continuity` CI and merge, then read `main` back.

**LOCKED:** Program identity, day order, 146 work sets/week (Mon 36, Tue 39, Thu 37, Fri 34), weights/reps/timers/supersets/progression, custom exercise IDs and names, unilateral settings, and workout history must not be altered, deleted, merged, or replaced for this media-only job. The 2026-10-21 progression/technique/notes work and PR #162 are done; do not redo them. Do not create a TinyFish profile or consume its wallet for this Work task. The only permitted change is adding or correcting native technique media on existing exercise cards, or a safe description-only link fallback if native media cannot be provided. Stop and surface any authentication, UI-permission, asset-licensing, or unsupported-upload blocker.

### Work UI verification — 2026-10-22: PARTIAL / UPLOAD BLOCKED

- Authentication succeeded in the Work browser. All eight requested entries were inspected in the live UI; no program, progression, settings, notes or completed-history writes were made.
- **Already adequate, retained:** `aknnfbos` Tibialis Raise displays a native two-position wall/bodyweight dorsiflexion illustration (heels planted, toes raised). `Seated Calf Raise, Dumbbell` displays the correct built-in seated dumbbell calf-raise illustration, also present in the current workout preview.
- **Still missing:** `tsazcvcw` External Rotation, `uoxbafww` Neck Curl, `qrmwybon` Neck Extension, `xkciirmt` Neck Side Bend, `aoschbqy` Y Raise, `ufxplgko` Cable Hip Adduction. Each relevant custom card/list lacks native media; detail screens say “No exercise image”.
- **Native upload exists:** Edit → Add image → From Image Library / From Camera / From Photo Library. The library contains the uploaded Tibialis Raise and built-in assets; “external” has no match, “adduct” offers only the leverage-machine Hip Adductor, which is unsuitable for cable adduction.
- **Concrete Work blocker:** supported file chooser selected a downloaded cable-adduction GIF, but `setFiles` failed with `Protocol error (DOM.setFileInputFiles): No node found for given backend id`. No image was attached; Save remained disabled and the editor was closed without saving. DOM inspection found no file input. Upstream [imagePicker.ts](https://github.com/astashov/liftosaur/blob/c7076d88dd7c16eaa99759e3a960f7c4d5088d3b/src/utils/imagePicker.ts) creates an input and clicks it without attaching it to the document; this explains the detached-input incompatibility with the available browser uploader. Its web path also rasterizes non-PNG files to JPEG, so a GIF is not guaranteed to retain animation. No hidden-state/API workaround was attempted.
- **Asset check:** rejected the previously prepared `cable_hip_adduction_2x3.png` because the cuff is on the leg farther from the pulley and does not reliably demonstrate resisted adduction. A replacement [TrainAI demonstration](https://www.trainaiapp.com/exercises/cable-hip-adduction/) was downloaded and four animation phases visually checked: cuff stays on the near leg, which moves across the planted leg against the cable. The source explicitly offers branded media downloads; branding was retained. Upload is **not completed**.
- **Next safe step:** use a browser file-selection mechanism compatible with detached inputs, or have Ron select the prepared file in the native picker, then save and reopen the card. Remaining five missing-image assets still require matching and visual verification. Do not repeat program analysis or substitute unrelated library images.
- **Incidental UI state — CLEANED 2026-10-22:** clicking the next-workout exercise label unexpectedly started a blank Thu Lower B session (00:00; every exercise 0 completed sets). Ron explicitly confirmed deletion in the follow-up “Да продолжай”. Deleted only this ONGOING blank session through its menu and confirmation. Independent UI read-back shows “Next workout” again; the week total remains 75 sets / 25125 kg. No completed workout was saved or deleted. The page exposes no WebMCP tools, so no alternative native-media action is available there; detached-input upload remains BLOCKED pending compatible file selection/manual intervention.

## Historical execution transition — September 2026 (superseded)

- Ron has temporarily stopped going to the gym while the nutrition program is being finalized.
- This pause does **not** replace the intended training target/program.
- On the same day Ron begins executing the finished nutrition program, he intends to resume his ordinary training program.
- Therefore nutrition launch calculations should use the **TARGET/LAUNCH activity state** with the ordinary training program active, rather than the temporary no-gym NOW state.
- Current training frequency for planning and nutrition calculations is **four strength-training days per week**.


## Direct Ron clarification — 2026-09-22

- Ron directly confirms that the current four-day program was already deliberately optimized as far as practical for his constraints, including the use of supersets/circuits to compress session time.
- This is consistent with the current exported source: first two movements are standalone, the remaining work is organized in circuits, transitions inside a circuit are ~15 s, and round rests are 90/120 s.
- Therefore the old 2026-08-03 active-program session duration of 145 min wall / 132 min active must **not** be used as evidence that the current optimized program cannot fit the intended evening window; the planner/source was modified after that session.
- Default assumption for cross-domain planning: **do not shorten or redesign the training program merely from the old duration record**. Use the already-optimized current source as the intended baseline; only reopen training-time architecture if new post-optimization execution evidence shows a material schedule failure.

## Dated program at 2026-08-29 export (historical evidence)

- Current program: `txfxzary`, **«Программа тренировок от Клода»**.
- Cloned 2026-07-29; selected current 2026-07-31; planner's last-modified marker is 2026-08-04 03:56 UTC.
- One week, four days, 43 exercise occurrences and **146 prescribed work sets/week**.
- Exact split: **Mon Lower A 36 / Tue Upper A 39 / Thu Lower B 37 / Fri Upper B 34**.
- `nextDay = 2` is only the app's sequential pointer. The source explicitly says to open the correct weekday manually because Liftosaur does not advance by calendar weekday.
- Confirmed schedule is **Mon/Tue/Thu/Fri**.
- Exact current exercise names, targets, timers, supersets, technique comments and executable progression source are retained in the dated snapshot/audit, not duplicated here.

## Operating logic confirmed by the export

- 1–2 minutes jump rope, then two standalone movements with 180-second rest; later work is organized into circuits.
- 15 seconds means transition inside a circuit; 90/120 seconds marks the end of a round.
- Short-session minimum: two standalone movements plus circuit A. Omitted later circuits do not advance their progression.
- Pick the exercise's working weight in the first set and hold it unless technique breaks.
- Custom progression uses completed work and `min(completedWeights)`; three sessions without progression trigger approximately **60% -> 90% -> working load**.
- Only explicit non-zero current counter in source: **Mon Lying Leg Curl `stall = 1`**. No explicit exercise is at deload stage 1 or 2.
- Repeated Thu/Fri exercises without another `progress:` clause inherit progression from the earlier occurrence; inspect both appearances before a manual edit.
- Barbell kg configuration is `bar = 0`; program/logged barbell weight means plates only. Available barbell plates are 20/10/5/2.5 kg, giving a practical 5 kg total-load step.

## Dated history and measurements

- 30 workout records from 2026-05-18 through 2026-08-03; one is under the current program and the remainder predate it.
- Active-program history: **2026-08-03 Mon Lower A, 36/36 work sets completed**, 145 minutes wall-clock and 132 recorded active minutes.
- All history: 683/713 completed set objects; five records contain an incomplete set.
- Median recorded duration is about 98.5 minutes wall-clock / 86.5 active. The 2026-06-01 record at ~707/693 minutes is a timer anomaly, not a real duration estimate.
- No workout record exists after 2026-08-03 in this export. This is app-history evidence only, not an adherence judgment and not evidence that the integrated personal system has started.
- Liftosaur bodyweight field is 67 kg; dated app measurements are 68 kg then 67 kg on 2026-07-31. These do not own current bodyweight outside that date.
- At export, Google Health workout/measurement sync flags and the public-profile flag are enabled. Recorded only; no setting change is authorized.

## Post-session/manual-source differences

The planner was modified after the only active-program session, so current source wins over that session snapshot. Recorded differences include Seated -> Lying Leg Curl on Monday, Seated Calf reset from the post-session 25 kg/stall-1 result to current 40 kg/no non-zero stall, Triceps Extension 25 -> 30 kg, and a Hip Adductor equipment-identity change. Treat these as manual-source deltas, not automatic errors.

## Historical subscription/export protocol (pre-live access)

Ron will buy/restore Liftosaur subscription only after the rest of the integrated live system is ready. Do not prompt him to change that decision or treat the gate as an execution failure.

When Ron supplies a newer export:
1. verify and hash it;
2. sanitize account identifiers without dropping training-relevant data;
3. diff active/current program, exact source/targets, progression state, next-day pointer, history, measurements, equipment and custom exercises;
4. add a new dated snapshot without overwriting this one;
5. update this AS_OF/current fallback and read it back.

Until then, the export can answer exact state as of 2026-08-29. Any post-export manual app edit remains `UNKNOWN` unless Ron reports it. Current real-world execution is temporarily paused per the 2026-09-03 direct report; the intended launch state is resumption of the ordinary four-day program. Do not cut the program roughly in half from estimated duration alone; first obtain real session-duration, performance and recovery evidence and run the normal impact check.

## Gym equipment — direct sightings

- **2026-10-20 — Lat Pulldown / Lat Pull machine**: observed at Ron's current gym in his photo of the machine labeled `LAT PULL`. Availability observation only; not an approved T-Bar Row Leverage Machine substitute and not a request to edit the Liftosaur program.
