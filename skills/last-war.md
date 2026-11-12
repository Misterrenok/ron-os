# Skill — Last War

Scope: recurring, Ron-authorized interactive play of the external mobile game Last War through the existing A55 + Oracle Phoenix Admin path. This is not the internal Ron System/LifeUp game layer.

## Authority and sources

- Read this skill first, then `projects/last-war.md`, then TickTick task `6ae4df4e8f0847e165baa705` (project `6ad83dfa8f086e43495bde94`) and only its latest 8–12 relevant comments. The TickTick NOTE owns Ron's detailed gameplay contract and execution checkpoints; the newest explicit Ron correction wins.
- The live A55 game UI owns current Daily points, chest receipts, energy, troops, marches, resources, builders, events, trucks, train, battle schedule and shield state. Historical comments and screenshots are dated evidence, never current game state.
- Oracle Phoenix Admin is the existing execution surface. ChatGPT is the sole interactive executor; Hermes only delivers the ping. Do not invoke Hermes inference, Codex, Work, n8n, another model, a second game process or new automation.
- Do not route ordinary Last War play through the internal System controller, LifeUp or Neon `system_events`. Add that supporting route only if Ron explicitly asks to link a game outcome to the internal Ron System.

## Mandatory preflight — before any game input

1. Confirm no other owner is using the VD or game session. Inspect the existing `lastwar-vd-client.service`, `lastwar-vd-desktop.service`, scrcpy/Xvfb processes and SSH listener for `127.0.0.1:15037`. Never interrupt another executor or start a second session because a new ping arrived.
2. Query the remote ADB server only through `ADB_SERVER_SOCKET=tcp:127.0.0.1:15037`; enumerate devices each session and require exactly one ONLINE `SM_A556E`. Use the serial returned in that same session; it is volatile. The ordinary local ADB server on port 5037 is not authoritative.
3. Independently read back `mCallState=0`, no active GSM/Telecom call, audio mode, Android thermal status below `4`, and game AppOps. `MODE_NORMAL` is allowed. `MODE_IN_COMMUNICATION` is allowed only with exact `PLAY_AUDIO: ignore` and `TAKE_AUDIO_FOCUS: ignore` for `com.fun.lastwar.gp` plus a proven isolated VD. Any unknown or changed gate means STOP.
4. Inspect the exact `Display #0` activity block and ensure no Last War activity is on the physical display. A `topResumedActivity` line without its display ID is insufficient. If Last War is on `display0`, mark `SKIP_MANUAL_GAME`; never interact with, force-stop or relaunch it.
5. Use only the one existing guarded VD on Xvfb `:98`, with one verified new enabled `mDisplayId` and the existing scrcpy configuration confirming `--new-display`, `--no-audio`, and `--no-power-on`. Never send input to `display0`, change Discord/audio/microphone settings, or start a second VD. If any check or tool is denied, do not bypass it.

## Recovery and visual interaction

- If the owned client is ACTIVE and its journal reports the bounded ADB/VD recovery states, pause all input and observe read-only state for no more than the existing 7-minute recovery window. Do not stop that client just because the first frame is black/offline. After recovery, re-check the single ONLINE device, calls, audio/AppOps, thermal status, new enabled VD ID and a fresh nonblack frame before any input.
- If an in-session ADB command times out while the frame remains visible, pause all input; do not repeat the click or infer the cause. Follow the existing bounded recovery/cleanup contract. A 2026-11-12 incident recorded in TickTick comment `HERMES_LASTWAR_NUDGE_5981589` recovered idle ADB after stopping the owned client, but the cause remained UNKNOWN.
- If the owned client and desktop are both inactive with MainPID=0 and no other VD owner, a new session may use only the existing service after a full fresh preflight. Never create a new script/service/process or bypass a tool denial.
- Capture from the currently verified X11 window on `:98`; never reuse old window geometry, display IDs or coordinates after reconnect. Perform one visible click -> fresh UI read-back. For screen transitions, allow the UI to settle about 0.9–1.1 seconds; if unclear, take another frame without clicking. A black frame after a confirmed Base/World transition permits at most two additional read-only frames; otherwise STOP.
- At the end, stop only the session you own and independently verify the client and desktop are INACTIVE with MainPID=0. Respect the existing 53-minute session limit and reserve the final 3 minutes for read-back and cleanup; do not wait artificially for another ping.

## Gameplay dispatch — always follow the latest TickTick contract

- Start with the live Daily screen. While below 200, choose the fastest permitted free READY action, read back its effect, and separately verify each of the five 40/80/120/160/200 chest claims. An open chest icon is not a claim receipt. Do not recheck proven DONE items without a reset/new signal. Do not disturb the four active gold marches.
- Total energy expenditure from every source is at most **300 energy per game day**; inventory-sourced energy is at most **100 energy from inventory**, included inside that 300. If today's prior spend is unknown and a new action could exceed the cap, do not spend energy.
- No purchases, paid speedups or premium currency except the narrowly authorized Mega Update for searching only verified UR Secret Command Post tasks. Verify the cost and result; do not infer UR rarity.
- Research only current technologies with the game's red/green 👍 recommendation. For buildings, 👍 is priority, but a free, feasible ordinary-resource upgrade may use an otherwise idle builder even without 👍. Collect completed work first; after every new process, request free alliance help when available and help allies only through the free button.
- Collect finished barracks, hospital, treatment and rescue queues before restarting ordinary free work. Rescue available lost soldiers using ordinary resources only. Use every free builder for a feasible lawful upgrade; never touch the gear factory.
- Board the alliance train only when a suitable free seat is visibly available and doing so does not disrupt another march. Otherwise record the exact blocker.
- Own trucks: dispatch only UR with visible UR shards; reroll only with existing tickets, never buy diamonds. Foreign trucks: attack only UR with visible UR shards after checking current first-squad strength and selected guard; never attack bases or same-server players.
- Secret Command Post: only verified UR personal/alliance/other tasks. Stealing under “Other Tasks” requires live proof that both the user's server and selected owner's server are visible and different; otherwise do not steal. Mega Deployment is only for sending an eligible UR task.
- Invest in heroes only after live confirmation that each hero is in squad 1 or 2. Use profession skills at READY cooldown; co-research/co-build only through the personal chat with `[MiRz]Denivito` and its explicit game button.
- Sweep available free daily/weekly/VIP/season/event rewards and permitted event tasks, including all event subtabs and scrollable lists; Alert Tower's Tank/Aircraft/Missile branches; Wanted Boss, crystal boss, **5 zombies** and **10 Fatal Elites**. Do not buy attempts or exceed the energy cap. Stop before a known losing fight.
- Friday defense: use only the live VS battle timer and server timezone. At exactly the authorized 60-minute window, if not already protected, buy one 24-hour shield only with ordinary Alliance Shop points, then activate and read back the shield. If the timer, coverage or price is unknown, or the item requires premium currency, mark UNKNOWN/BLOCKED and do not buy.
- The gear factory is an absolute no-touch area absent separate explicit Ron permission: no production, collect, dismantle, merge, disassemble or claim.

## Evidence and closeout

- For each action: target -> one visible click -> fresh frame -> verify the exact state change. Classify each section DONE, BLOCKED with exact cause, OPEN with the next concrete step, or UNKNOWN. Never claim a reward, troop increase, dispatch, theft, shield or spend without independent UI evidence.
- After the first confirmed gameplay delta and each materially new group, append a concise checkpoint to the existing TickTick Last War NOTE with the HERMES marker and read-back. Do not write a comment for a no-delta audit or repeat an unchanged STOP.
- End when no useful permitted READY remains, a safety stop occurs, or the existing session limit requires cleanup.
