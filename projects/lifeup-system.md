# LifeUp System — project owner

Updated: 2026-09-12 Europe/Istanbul
Status: **BUILDING / CLOUD-FIRST SYSTEM CORE LIVE / POSTGRES ACTION GATE LIVE / CALIBRATION V1 LIVE / PRODUCTION PLAYER LAUNCHED / LEVEL 1 / ECONOMY CALIBRATED / SYSTEM CONTROLLER V1 PROMOTED / QUEST V2 LIVE / ATOMIC QUEST RESOLUTION V1 PROMOTED / SHOP POLICY V1 LIVE / VIOLET SHADOW FULFILLMENT VERIFIED / ACHIEVEMENT POLICY V1 LIVE / ATTRIBUTE EVIDENCE V1 LIVE / PERSIST PROBE CLOSED / CHATGPT-ONLY TARGET / LIFEUP RETIRED FROM TARGET RUNTIME**

## Outcome
Build a real-life RPG System inspired by the functional feel of Solo Leveling: quests, attributes, skills, XP, ranks, achievements, coins/rewards, notifications and adaptive progression. The game layer must improve real-world execution rather than reward meaningless XP farming.

## Authority boundary
- Ron OS and claim-specific live owners remain authoritative for real-world facts, decisions and execution.
- The cloud System owns only **derived RPG state** in its append-only event ledger.
- Neon/PostgreSQL `system_events` is the one mutable owner of derived System state.
- ChatGPT is the sole intended interactive System controller: Ron talks to ChatGPT; ChatGPT recovers authoritative context, decides the System representation, writes authorized actions through the shared action gate and reads back.
- Northflank PWA is a projection/visual surface over the same ledger, not a second mutable owner.
- LifeUp is retired from the target runtime architecture after Ron chose ChatGPT-only interaction. Existing LifeUp bridge/MCP/Tailscale code remains legacy/rollback evidence only and is not a readiness dependency.
- A System task being present or scheduled does not prove a real-world action happened.
- Completion may become execution evidence only when the provenance/claim contract permits it and no stronger owner conflicts.
- Northflank, Neon/PostgreSQL and PWA do not become owners of underlying health, finance, schedule, nutrition, training, learning, mobility or other real-world facts.
- No runtime token/credential belongs in this repository.

## Current architecture
```text
Ron
 |
 v
ChatGPT / System Controller
 |
 +----> Ron OS + claim-specific live owners  (real-world truth)
 |
 +----> Neon/PostgreSQL system_apply_action(...)
              |
              v
       append-only system_events
              |
              v
       rebuildable projections
              |
              +----> Northflank PWA / read surfaces
```

There is one mutable derived-state owner: `system_events`. ChatGPT and every current/future UI must share it rather than maintain parallel state.

Legacy only, not runtime target:
```text
system/lifeup/northflank -> Tailscale -> LifeUp Cloud -> Android
```
This code/history is preserved for rollback evidence but normal System operation must not depend on it.

## Production checkpoint — System Calibration v1 — 2026-09-11
Promoted main head before this owner-only closeout: `f82ca196f1e0fc5beb4481d667cb2b5947a346f1`.

Architecture evidence:
- `architecture/changes/2026-09-10-system-cloud-core-v1.json`
- `architecture/changes/2026-09-10-system-db-action-gate-v1.json`
- `architecture/changes/2026-09-11-system-profile-domain-v1.json`
- `architecture/changes/2026-09-11-system-calibration-v1.json`
- `architecture/changes/2026-09-11-chatgpt-system-controller-v1.json` — promoted controller/routing architecture.

Canonical calibration policy:
- `system/lifeup/CALIBRATION_SPEC.md`
- runtime enforcement: `system/lifeup/cloud/src/calibration.mjs`
- production DB enforcement: `system/lifeup/cloud/migrations/004_calibration_v1.sql`

### Verified promotion gates
Candidate exact code head `5ab60f7d85d276a57d93367a3bc49fbc38cde1e2` passed on one SHA:
- `system-cloud-ci` run `34561138565`: **PASS** — model/unit, Docker, real PostgreSQL gate and HTTP-through-Postgres smoke.
- `continuity-guard` run `34561138559`: **PASS**.
- `lifeup-system-ci` run `34561138633`: **PASS** — legacy LifeUp contract + Docker/runtime regression.

Manifest-only promotion head `f82ca196f1e0fc5beb4481d667cb2b5947a346f1` then passed:
- candidate `system-cloud-ci` run `34561258611`: **PASS**.
- candidate `continuity-guard` run `34561258503`: **PASS**.

After non-force fast-forward to `main`, the same promoted head passed:
- `system-cloud-ci` run `34561312333`: **PASS**.
- `continuity-guard` run `34561312360`: **PASS**.
- `lifeup-system-ci` run `34561312376`: **PASS**.

Base -> promoted diff was reviewed. Changes were limited to calibration policy/spec, System cloud runtime/migration/tests/CI and the calibration architecture manifest. Unrelated Ron OS owners, PROTOCOL/routing and legacy LifeUp bridge code were not rewritten.

### Candidate Neon compatibility gate
Fresh production child branch `system-calibration-v1-test` (`br-raspy-darkness-ayhqtiv7`) was used only for disposable probes.

Verified there before promotion:
- zero-XP launch accepted exactly as Level `1`, `xp_to_next=500`;
- wrong launch Level rejected;
- C quest reward accepted only as `20 XP / 1 coin`;
- arbitrary reward amounts rejected;
- verified C completion + exact award produced cumulative 20 XP and helper-derived `Level 1 / 480 XP to next`;
- early Rank assignment rejected;
- wrong attribute/skill scale refs rejected;
- privileged raw-SQL arbitrary-reward bypass rejected.

No value from this child branch is authoritative for Ron's current state.

### Production Northflank / Neon read-back
Before promotion production contained exactly **3 earlier infrastructure/integration events**, **0 calibration-related player events**, and no calibration-v1 helper/trigger.

After Northflank redeployed promoted `main`, production Neon read-back confirmed:
- `system_level_snapshot_v1(bigint)`: **PRESENT**;
- `system_quest_reward_v1(text)`: **PRESENT**;
- `zz_system_events_calibration_v1`: **PRESENT**;
- event count: **still 3**;
- calibration-related player events: **still 0**.

Therefore the calibration runtime/schema was live while Ron's player profile remained deliberately untouched. Promotion itself did not fabricate Level, Rank, attributes, skills, XP economy or achievements.

A fresh public `model_version:"calibration-v1"` `/healthz` screenshot is still a small optional HTTP read-back tail; production DB startup migration proves the new Northflank startup path executed.

### First-launch dry-run — 2026-09-11
A previously created fresh production child branch `system-first-launch-dryrun` (`br-weathered-sea-ayc8wbdc`) was recovered after an interrupted chat. Before new dry-run writes it contained only the same three inherited infrastructure/integration events as production; no player event had been written there.

Fresh production read-only verification immediately before the dry-run still showed exactly those **3** events and no `progression.awarded` rows. `system_level_snapshot_v1(0)` returned exactly `Level 1 / xp_to_next 500`.

The dry-run then passed through the real PostgreSQL `system_apply_action(...)` gate:
- `profile.calibrate` accepted exactly `level=1`, `rank=null`, `xp_to_next=500`, `economy_status=CALIBRATED`;
- DB trigger added `level_policy_ref=system-level-xp:v1` and `reward_policy_ref=system-quest-reward:v1`;
- exact retry of the same action/key returned `replay=true` and reused the same event rather than duplicating launch state;
- `skill.upsert` accepted `Turkish`, Tier **3**, `system-skill-competency5:v1`, based on the durable C1 + June 2026 Türkçe Yeterlilik Sınavı evidence;
- `skill.upsert` accepted `Marketplace Operations`, Tier **3**, `system-skill-competency5:v1`, based on the durable multi-year hands-on marketplace-operations evidence.

No attribute event was written in the dry-run. STR/VIT/DISC/CHA remained intentionally unresolved rather than guessed; INT also remained unresolved for the first launch. Other language/capability records were not initialized merely to fill the UI.

At dry-run time production was still untouched; that historical state was superseded later the same day by the explicitly authorized production launch below. The dry-run branch remains test evidence only and never owns Ron's current player state.

### First production player launch — 2026-09-11
Ron explicitly authorized the exact three-event production write set after the dry-run review.

Immediate production preflight on `main` confirmed:
- total events: **3**;
- `progression.awarded`: **0**;
- `profile.calibrated`: **0**;
- `skill.upserted`: **0**;
- `attribute.set`: **0**.

The three writes were then applied atomically through production PostgreSQL `system_apply_action(...)`:
1. `profile.calibrate` -> `level=1`, `rank=null`, `xp_to_next=500`, `economy_status=CALIBRATED`;
2. `skill.upsert` -> `Turkish`, Tier **3**, `system-skill-competency5:v1`;
3. `skill.upsert` -> `Marketplace Operations`, Tier **3**, `system-skill-competency5:v1`.

Production read-back immediately after commit confirmed:
- total events: **6** = 3 prior infrastructure/integration events + 3 launch events;
- `progression.awarded`: **0**;
- `attribute.set`: **0**;
- skill events: exactly **2**;
- latest profile: Level **1**, Rank `null`, XP-to-next **500**, economy **CALIBRATED**;
- DB-attached refs: `system-level-xp:v1` + `system-quest-reward:v1`;
- `system_level_snapshot_v1(0)` still derives exactly Level **1** / XP-to-next **500**;
- initialized skills are exactly `Turkish` Tier 3 and `Marketplace Operations` Tier 3.

No unsupported STR/VIT/INT/DISC/CHA value was initialized. No XP, coin, achievement, shop or notification event was fabricated as part of launch.

## System Calibration v1 — canonical mechanics
### Versioned policy references
- Level: `system-level-xp:v1`
- Quest reward: `system-quest-reward:v1`
- Core attributes: `system-attribute-ordinal5:v1`
- Skills: `system-skill-competency5:v1`
- Rank review: `system-rank-review:v1`

Historical events must never be silently reinterpreted; future policy changes require new version refs.

### Unknown is not zero
`null` means not calibrated / insufficient current evidence. It is never auto-filled with zero, midpoint or a guessed value.

### Level
Level is only a game progression counter for verified System activity after launch, not a rating of Ron's worth or real-world competence.

No retroactive XP is granted for pre-System life history.

For `L >= 1`:
```text
XP from L to L+1 = 500 * L
minimum cumulative XP for L = 250 * L * (L - 1)
```

Initial zero-XP launch therefore derives `Level 1` and `xp_to_next=500`. Level and XP-to-next are derived from cumulative System XP and cannot be freely selected.

### Quest XP / coins
Deterministic `system-quest-reward:v1` table:

| Rank | XP | Coins |
|---|---:|---:|
| E | 5 | 0 |
| D | 10 | 0 |
| C | 20 | 1 |
| B | 40 | 2 |
| A | 80 | 4 |
| S | 160 | 8 |

Rules:
- scored quests require calibrated economy;
- ambiguous quests should be unscored rather than guessed;
- progression requires a verified completion basis;
- one completion basis can reward once;
- awarded amounts must exactly match the originating scored quest;
- E/D deliberately yield no coins;
- one real action cannot be split/duplicated to farm rewards;
- coins have no cash value and never authorize spending externally.

### STR / VIT / INT / DISC / CHA
Numeric values use a coarse ordinal evidence scale `1..5`, never scientific-looking fake precision:
1. demonstrated baseline;
2. functional/repeated;
3. reliable, with roughly 4+ weeks plus an objective benchmark/outcome;
4. advanced, with roughly 8+ weeks plus repeatedly demonstrated difficult/high-friction outcomes;
5. exceptional, with roughly 12+ weeks plus unusually strong independent/external validation or exceptional milestone.

Every numeric attribute requires verified provenance and exact scale ref `system-attribute-ordinal5:v1`. Unsupported attributes remain `null`.

### Skills
A real skill may exist with `level=null`. Numeric skill tiers use `system-skill-competency5:v1`:
1. guided;
2. basic independent;
3. reliable independent;
4. advanced;
5. expert evidence / repeated novel difficult cases with strong validation.

Numeric skill levels require verified provenance and the exact scale ref.

### Rank
Rank `E -> D -> C -> B -> A -> S` is separate from XP and never auto-promotes from Level.

The database blocks the first non-null Rank until at least:
- 20 verified rewarded completions;
- spanning at least 28 days.

The controller additionally requires cross-domain evidence, an anti-farming review and a cited evidence bundle. If evidence cannot defend a Rank, it stays `null`.

### Economy and shop
`economy_status=CALIBRATED` means only that the issuance policy above is active. It does not mean the reward shop is configured. Shop redemption remains an internal System event and never authorizes a real purchase/payment.

## Current production player state
Do **not** infer current values from candidate/test probes or durable user memory.

- Profile launched: **YES — 2026-09-11**.
- System XP: **0** real calibrated XP.
- Level: **1** under `system-level-xp:v1`.
- Rank: **UNKNOWN / null**; longitudinal review gate not yet met.
- XP-to-next: **500**.
- Economy: **CALIBRATED** under `system-quest-reward:v1`.
- Coins: **0**; no progression award has occurred.
- STR/VIT/INT/DISC/CHA: **UNKNOWN / null**; `system-attribute-evidence:v1` preflight is live, but production still has 0 attribute events and no numeric value has been authorized.
- Skills: `Turkish` Tier **3** and `Marketplace Operations` Tier **3**, both under `system-skill-competency5:v1`.
- Achievements: **none initialized**; under `system-achievement-ledger:v1` there are currently **0 eligible achievement candidates** because production has 0 verified progression awards.
- Reward shop: **none initialized**; 0 shop upserts and 0 redemptions in production.
- System notifications: expiry notification `expired-d6ddd1b74ab16d14e60f2aaeaf693449` is **READ / ACKNOWLEDGED** via production seq **12**; no unread CRITICAL residue from that expiry remains.
- Production ledger: **11 total events**, latest sequence **13**; historical sequence gaps remain. There are **0 progression awards**, **0 attribute events**, **0 achievement unlocks**, **0 shop upserts** and **0 shop redemptions**.
- Active player Quest v2: **none**.
- First player Quest v2 `qv2-german-nicos-weg-a1-day1-20260911`: **EXPIRED**, objective remained 0/1; deadline was **2026-09-11 19:30 Europe/Istanbul**; the unearned 10 XP / 0 coins reward was forfeited and no penalty balance was invented.
- Push delivery: **ENABLED**, with 1 active browser subscription verified in production at 2026-09-12 00:26 Europe/Istanbul.
- Legacy infrastructure quest `persist-probe`: **CANCELLED / NEUTRALIZED** via production seq **13**; it was never a genuine player quest and produced no progression.

## Persist-probe production neutralization — 2026-09-12
Status: **CLOSED / PRODUCTION VERIFIED**

Live preflight recovered the exact legacy infrastructure event at seq **1**:
- event id `da538d0d-c561-4600-910b-4aee7a749fbb`;
- `quest.created`, source `system-api`, claim `derived`, idempotency key `persist-probe-20260910`;
- exact payload: rank `E`, class `SIDE`, title `Persistence probe`, quest id `persist-probe`, `reward_xp:null`, `reward_coins:null`, empty description.

This matched the canonical checkpoint: an unscored legacy persistence probe, not a genuine player quest. Ron explicitly authorized its neutralization in the continuation request. The write then passed through production `system_apply_action(...)` as `quest.cancel` with source `system-controller`, source ref `projects/lifeup-system.md#persist-probe` and idempotency key `persist-probe-neutralize-20260912`.

Production result/read-back:
- seq **13**, event id `1f77dc5c-6fe7-47e3-a383-10a5ebc2bcef`;
- event type `quest.cancelled`, claim `derived`;
- reason: `Neutralize legacy infrastructure persistence probe; not a genuine player quest.`;
- exact re-read returns the original seq 1 create plus seq 13 cancel;
- production ledger after closure: **11 events / max seq 13 / 0 progression awards / 0 attribute events / 0 shop upserts / 0 shop redemptions**.

No XP, coin, achievement, attribute, skill or real-world execution claim was created by this cleanup.

## Cloud core capabilities
`system/lifeup/cloud/` owns runtime implementation.
- append-only `system_events`; `UPDATE`/`DELETE` rejected;
- `system_apply_action(...)` shared by HTTP and authorized ChatGPT-through-Neon writes;
- exact idempotent retry replay; conflicting key reuse rejected;
- DB triggers constrain privileged raw inserts;
- Quest v2 actions include create/progress/reveal/complete/resolve/cancel/fail/expire; `quest.resolve` is the routine verified scored-completion path and atomically commits final verified progress + completion + exact canonical reward inside one PostgreSQL transaction;
- existing separate quest/progression actions remain supported for compatibility and diagnostics;
- profile calibration, attribute, skill, achievement, shop and notification actions remain available under their existing validation gates;
- production persistence is Neon/PostgreSQL;
- PWA reads the same event-derived snapshot.

## Legacy LifeUp integration
`system/lifeup/northflank/`, official `Ayagikei/LifeUp-SDK`/MCP, Tailscale transport and Android LifeUp Cloud are preserved only as historical/rollback implementation evidence.

Historical connectivity evidence remains valid as history, but **LifeUp is no longer an OPEN runtime dependency, target sync path, readiness gate or normal mutation surface**. No further LifeUp baseline/mapping/queue/reconciliation work should be performed unless Ron explicitly reopens that architecture decision.

## Readiness audit — 2026-09-11
Full audit: `history/2026-09-11-system-readiness-audit.md`.

Verified strongest layers:
- durable ledger/provenance/idempotency;
- DB integrity for implemented event types;
- calibrated Level/XP/reward enforcement;
- production player baseline.

Blocking product layers discovered:
- stale recovery/routing documents still pointed at LifeUp before Controller v1 promotion;
- quest v1 lacks structured objectives/progress/deadlines/recurrence/failure/hidden reveal mechanics;
- E-S quest difficulty assignment lacks a reproducible controller rubric;
- completion and progression are separate writes rather than one resolved flow;
- PWA is mostly read-only and has an XP progress-bar math bug;
- notifications are ledger-visible but not proactively delivered;
- shop content/pricing, achievement detection and attribute onboarding are unfinished;
- current live-source connector coverage is partial.

## System Controller v1 promotion — 2026-09-11
Promoted main head: `e15383173c7e1e694a6735c96b0b3c88a7932c08`.

What changed:
1. current System routing now resolves to `skills/system-controller.md` + this owner + Neon/PostgreSQL `system_events`;
2. ChatGPT is canonicalized as the sole intended interactive System controller;
3. LifeUp is explicitly retired from target runtime/readiness while its bridge code remains preserved as rollback evidence;
4. natural-language controller intents were defined for status, quest creation/selection, completion/cancel, shop/redeem, skills/stats/achievements/log/why;
5. a routing regression guard prevents future recovery from silently making LifeUp primary again;
6. controller-architecture changes now trigger both cloud-core regression and legacy-LifeUp rollback regression.

Verification:
- exact base for architecture slice: `04a3b87cb3abae360f110b08445414eba9ade5fa`;
- exact verified pre-manifest candidate: `aed9bd746bccdbe84e7c787ad98fa6c2c08a43dc`;
- full base -> candidate diff reviewed: only intended routing/controller/owner/guard/workflow/manifest files; no cloud runtime code or production DB schema change;
- candidate CI at `aed9bd...`: continuity `34582407228` PASS, LifeUp legacy regression `34582407141` PASS, cloud core `34582407177` PASS;
- promoted candidate `e153831...`: continuity `34582639596` PASS, LifeUp legacy regression `34582639572` PASS, cloud core `34582639560` PASS;
- non-force fast-forward moved `main` to exact `e153831...`;
- post-promotion main CI on exact same SHA: continuity `34582702746` PASS, LifeUp legacy regression `34582702695` PASS, cloud core `34582702772` PASS;
- post-promotion production Neon read-only check remained exactly **6 total events / 0 progression awards / 0 attribute events**. No player-state mutation occurred.

One candidate-process defect was caught and repaired before promotion: an early `CURRENT.md` rewrite accidentally dropped 156 unrelated lines; full diff review rejected it, restored base exactly and reapplied only the intended 7-addition/6-deletion System routing delta. The promoted history therefore preserves unrelated continuity state.

## Quest v2 production promotion — 2026-09-11
Status: **CLOSED / PRODUCTION VERIFIED**

The initially authorized promotion commit `401007c35851445e189409a8e43760cadbef8832` was built and shown as deployed by Northflank as `understood-cast-549`, but the public runtime still returned `model_version:"calibration-v1"`. Production Neon simultaneously remained at exactly **6 events / 0 Quest v2 events** with neither migration 005 nor 006 present.

Root cause was concrete and cross-verified: `system/lifeup/cloud/Dockerfile` still executed `src/server.mjs`, while Quest v2 lived in `src/server-v2.mjs`; both Docker smoke and HTTP-through-PostgreSQL CI explicitly accepted the stale `calibration-v1` entrypoint, so the earlier green gates could not detect the production mismatch.

Corrective architecture slice:
- branch: `quest-v2-deploy-entrypoint-fix`;
- exact base: `401007c35851445e189409a8e43760cadbef8832`;
- verified implementation head: `d786754a32a9910ba5b481b4d231198be058f1fe`;
- verification-manifest head: `920c8b781de65fcbfde0362d4232f7575264243b`;
- authorized/promoted head: `e81ea1b152a15651d075d7a50b1796911b432de8`;
- evidence: `architecture/changes/2026-09-11-quest-v2-deploy-entrypoint-fix.json`.

The fix changes the Docker CMD to `src/server-v2.mjs` and makes both Docker and PostgreSQL HTTP smoke require `model_version:"quest-v2"`. Candidate and promoted-main `system-cloud-ci`, continuity and legacy-LifeUp regressions passed. `main` moved by non-force fast-forward to `e81ea1b...`.

Northflank automatically built/deployed `stormy-account-7879` from promoted `main`. Public read-back returned:
- `ok:true`;
- `persistence:"postgres"`;
- `action_gate:"postgres-function"`;
- `model_version:"quest-v2"`.

Production Neon read-back at `2026-09-11T11:16:03.054427Z` confirmed migration 005 function/trigger/all three indexes, migration 006 function/trigger and the Quest v2 `system_apply_action` wrapper are present. The ledger remained exactly **6 total events / 0 Quest v2 events**: no Quest v2 quest, lifecycle event, XP, coin, attribute, skill or other player event was created by promotion.

## Quest difficulty v1 controller promotion — 2026-09-11
Status: **VERIFIED / PROMOTED-READY**

Policy ref `system-quest-difficulty:v1` now defines a reproducible controller classification before routine scored Quest v2 creation:

- focused active-time buckets contribute `0..7` points;
- current individually anchored friction contributes `0..3`;
- concrete complexity contributes `0..3`;
- legitimate stakes contribute `0..2`;
- total `0..15` maps deterministically to E/S and then exactly to `system-quest-reward:v1`;
- missing anchors, low confidence, unsafe scope, artificial splitting, duplicate outcome or inflated effort returns `UNSCORED` with no XP/coins;
- value/priority is selected before reward scoring, and one independently valuable outcome receives one stable outcome key.

Exact base: `b0040b7897c82e9f743f4e59ec861165b30b1fbd`. Verified candidate: `50b8e1d66101ce49d0b4465ce4c3f5cda4c47cd5`. Candidate CI passed: system-cloud `34594597139`, continuity `34594597120`, legacy LifeUp `34594597130`. Base-to-head review found only the intended policy/classifier/tests/controller/CI/manifest files and no lifecycle, reward-table, database, PWA, unrelated owner or legacy-runtime change.

Quest difficulty promotion itself created no player state. Ron later explicitly authorized the separately reviewed first player-facing Quest v2 payload; its verified production creation is recorded below.

## First player-facing Quest v2 — 2026-09-11
Status: **EXPIRED / CLOSED / REWARD NOT EARNED**

Ron explicitly authorized the exact previously presented `quest.create` payload. Production preflight at `2026-09-11T15:41:17.952Z` showed **6 total events / 0 Quest v2 / 0 progression awards**. The write passed through production `system_apply_action(...)` with idempotency key `quest-create-german-nicos-a1-day1-20260911-v1` and policy provenance `system-quest-difficulty:v1`.

Created quest:
- quest id: `qv2-german-nicos-weg-a1-day1-20260911`;
- title: `Немецкий: первый урок Nicos Weg A1`;
- class/rank/reward metadata: `DAILY / D / 10 XP / 0 coins`;
- required objective: `finish-nicos-weg-a1-lesson-1`, target `1 lesson`, current progress `0/1`;
- visibility: `VISIBLE`;
- deadline: `2026-09-11T16:30:00Z` = **19:30 Europe/Istanbul**;
- safety boundary: use the screen only while safely seated, never while walking or standing.

Difficulty score was conservative and reproducible: effort `1` (30 focused minutes), friction `0` (no current evidence supporting an avoidance modifier), complexity `1` (first-course access plus full lesson), stakes `0`; total `2` -> rank D -> exact `system-quest-reward:v1` metadata `10 XP / 0 coins`. Importance to the Germany path did not inflate difficulty.

Read-back confirmed event `960e8026-d6ed-4eb2-b9fd-77f868c5c579` at ledger seq `8`; exact retry returned `replay=true` and reused the same event. Final snapshot query at `2026-09-11T15:42:37.586Z` showed **7 total events / 1 ACTIVE Quest v2 / 0 progression awards** at that time. The sequence has a historical gap, so row count 7 and latest seq 8 are not contradictory. No XP, coin, progress, completion or terminal event was written by creation. The quest later expired under Deadline Automation v1, as recorded below.

## Deadline automation v1 production closure — 2026-09-12
Status: **CLOSED / PRODUCTION VERIFIED**

The original defect was real: Quest v2 deadlines were metadata only and the first player quest remained ACTIVE after its deadline. The corrective architecture slice was isolated on `system-deadline-automation-v1`, implemented on `afd575c3279d9cfc99d2f25309cf545168657b97`, and promoted non-force to final head `9d753dcd2b9bab0c6a29bf2689d37813e1695522`.

Production behavior now:
- a startup sweep and recurring 30-second scheduler evaluate Quest v2 deadlines server-side;
- 24-hour, 1-hour and 15-minute reminders use deterministic idempotency keys;
- overdue ACTIVE quests converge through the shared action gate to one `quest.expired`;
- expiry forfeits only the unearned reward and emits one CRITICAL notification; it never fabricates XP, coin debt or real-world evidence;
- Web Push is enabled with one opted-in device subscription and a retrying non-authoritative outbox;
- the PWA shows OVERDUE immediately while waiting for ledger convergence.

Production read-back:
- public health: `quest-v2`, `deadline-v1`, `web_push:enabled`, PostgreSQL action gate;
- target expiry event: seq 9 at 2026-09-11T17:53:12.631667Z;
- target CRITICAL notification: seq 10 at 2026-09-11T17:53:12.721Z;
- ledger at closure: exactly 9 events, 0 progression awards, XP 0, coins 0;
- main CI on exact promoted deadline head: continuity `34629981313`, LifeUp rollback `34629981299`, cloud/PostgreSQL/Docker `34629981361` — all PASS.

The expiry notification was later acknowledged at seq 12; current notification state is recorded in `Current production player state` above.

## Russian HUD + persistent device session — 2026-09-12
Status: **CLOSED / PRODUCTION VERIFIED**

Ron explicitly selected a Russian-first, mobile, immersive System presentation inspired by Sung Jin-Woo while preserving evidence-based stats and deterministic rewards instead of inventing game state.

Promoted main head: `dbdf8949e556c4fcc3a93a7677c15496c699e120`.

Delivered:
- all static PWA navigation, player state, quest/status/reward text, errors, push controls, known event labels and future deadline notifications are Russian-first;
- a prominent current-quest panel, live countdown, objective progress, critical System banner, responsive attribute grid, stronger rank/level HUD and install affordance;
- one-time bearer exchange creates a signed 180-day `HttpOnly; Secure; SameSite=Strict` device session;
- the raw bearer is not written to localStorage/sessionStorage; an existing legacy session token is exchanged once and removed;
- Bearer authentication remains fully supported for ChatGPT/controller clients;
- cookie-authenticated writes require exact same-origin plus the PWA client header; CSP, frame denial, referrer and permissions policies are live;
- no schema migration and no player-state event are part of this release.

Verification:
- local: 55 tests total, 52 PASS and 3 PostgreSQL-only skipped; syntax + ephemeral HTTP session/CSRF/Bearer/Russian-shell smoke PASS;
- candidate: system-cloud `34649092006`, LifeUp rollback `34649091915`, final continuity `34649260588` — PASS;
- post-promotion main: continuity `34649319169`, LifeUp rollback `34649319128`, system-cloud `34649319127` — PASS;
- production public read-back: `interface_locale:ru-RU`, `device_session:signed-http-only-v1`, Russian HTML and no old English shell markers;
- production Neon after deployment: unchanged at 9 events / 0 progression awards / 1 target expiry / 1 CRITICAL notification / 1 active push subscription at that time.

## Atomic Quest resolution v1 — 2026-09-12
Status: **CLOSED / PRODUCTION VERIFIED**

The preceding hourly autonomous run opened Architecture Mode for the real `COMPLETED without reward` partial-state risk, but stopped after the design manifest. The implementation was then rebuilt from the current `main` base and completed as a code-only slice.

Promoted runtime head: `857edf50570311fee8c6cb4f535cfda1971130e6`.
Architecture evidence: `architecture/changes/2026-09-12-system-atomic-resolution-v1.json`.
Detailed closeout: `history/2026-09-12-system-atomic-resolution-v1-closeout.md`.

Promoted behavior:
- additive `quest.resolve` action for routine verified scored Quest v2 completion;
- one PostgreSQL transaction covers any final verified objective progress, verified completion and exact canonical progression award;
- required objectives must be complete with verified latest progress; reported-only progress cannot be laundered into XP;
- reward amounts are derived from the already-scored originating quest and `system-quest-reward:v1`, not accepted from the caller;
- exact retry replays the committed child set; changed root-key reuse conflicts; invalid resolution rolls back without partial events;
- existing separate quest/progression actions remain available;
- no migration 008, DDL, production schema mutation or player-state write was required for promotion.

Verification:
- candidate system-cloud `34653860426`: PASS;
- candidate LifeUp rollback `34653860398`: PASS;
- candidate continuity `34653744352`: PASS;
- promoted-manifest continuity `34653955105`: PASS;
- post-promotion main continuity `34653980672`: PASS;
- post-promotion main system-cloud `34653980557`: PASS;
- post-promotion main LifeUp rollback `34653980612`: PASS;
- Northflank build status for `system-core`: SUCCESS, build `opposite-coast-7126`;
- production Neon read-only check after promotion remained exactly **9 events / max seq 10 / 0 progression awards**, with latest event timestamp unchanged at `2026-09-11T17:53:12.721Z`.

Direct public read-back at `2026-09-12T02:08:43Z` closed the remaining deployment tail on the canonical Northflank route `https://p01--system-core--yh2fvbyd9vfg.code.run`:
- `/healthz` returned HTTP 200 with `persistence:"postgres"`, `action_gate:"postgres-function"`, `model_version:"quest-v2"`, `deadline_engine:"deadline-v1"`, `web_push:"enabled"`, `interface_locale:"ru-RU"` and `device_session:"signed-http-only-v1"`;
- `/runtime-capabilities.json` returned HTTP 200 with `system_model:"quest-v2"`, `quest_resolution:"atomic-v1"` and `production_schema_change_required:false`;
- the older short alias `https://2fvbyd9vfg.code.run` returned HTTP 502 and is not the canonical verification endpoint.

The production Neon ledger remained exactly **9 events / max seq 10 / 0 progression awards / 1 expiry** during this read-only verification. No player state, schema, secret, deployment setting or external resource was changed.

## System shop policy v1 — 2026-09-12
Status: **CLOSED / POLICY LIVE / PRODUCTION CATALOG EMPTY**

Promoted main head: `9be9ceeb4a8f5515c6a8cdaff0551dd3416543e6`.
Policy ref: `system-shop-economy:v1`.
Architecture evidence: `architecture/changes/2026-09-12-system-shop-policy-v1.json`.

The previous shop primitives could store and redeem items, but no calibrated policy defined what a safe reward was, how prices related to the existing coin issuance ladder, or whether the promised reward could actually be delivered. The policy now fails closed before any future item write:

- V1 accepts only non-repeatable cosmetic rewards fulfilled entirely inside the System;
- coins have no cash value and cannot authorize purchases, payments, subscriptions, bookings, messages or other external actions;
- sleep, ordinary rest, food, water, medication, health care, safety and mandatory work/education/legal duties can never be locked behind coins;
- starter prices are restricted to `1 / 2 / 4 / 8` coins, matching the existing C/B/A/S issuance ladder without converting coins to money or labor;
- planned effects remain inactive; activation needs a deployed and verified System effect, an exact verification reference, then Ron's separate permission for the exact `shop.item.upsert` payload;
- redemption remains a separate permission-gated player mutation and cannot perform an external side effect.

Executable policy: `system/lifeup/cloud/src/shop-policy.mjs`.
Specification: `system/lifeup/SHOP_SPEC.md`.
Inactive proposals: `system/lifeup/STARTER_SHOP_CANDIDATES.json` — profile title (1 coin), violet theme (2 coins), hunter frame (4 coins). The violet theme fulfillment is now `VERIFIED` but remains `active:false`; the title and hunter frame remain `PLANNED`. Production still has zero shop events.

Verification:
- local shop-policy tests: **5/5 PASS** plus syntax/JSON checks;
- implementation candidate `ed6564b2e1d659330521783974776c7f1d61af5f`: system-cloud `34669552519`, continuity `34669552432`, LifeUp rollback `34669552457` — PASS;
- promoted-manifest commit `9be9ceeb4a8f5515c6a8cdaff0551dd3416543e6`: system-cloud `34669638910`, continuity `34669638935`, LifeUp rollback `34669638914` — PASS before non-force fast-forward;
- full base-to-head review found only the intended policy/spec/proposal/validator/tests/controller/CI/runtime-marker paths and no migration, SQL gate, existing action, PWA projection, secret or unrelated owner change;
- Northflank build `makeshift-note-865`: SUCCESS;
- public read-back at `2026-09-12T03:12:57Z`: HTTP 200 with `shop_policy:"system-shop-economy:v1"` in both `/healthz` and `/runtime-capabilities.json`;
- production Neon remained exactly **9 events / max seq 10 / 0 progression awards / 1 expiry / 0 shop events**, latest event still `2026-09-11T17:53:12.721Z` at that checkpoint.

This policy release created no item, redemption, coin, quest, profile change, schema object, secret or external action. The exact production shop write set was deliberately empty.

## Violet Shadow cosmetic fulfillment v1 — 2026-09-12
Status: **CLOSED / IMPLEMENTED / VERIFIED / PROMOTED / NOT ACTIVATED**

First starter cosmetic fulfillment is implemented for `system-theme-violet-shadow-v1` / effect key `ui.theme.violet-shadow`.

Behavior:
- the PWA derives the effect strictly from ledger-derived shop state: the theme unlocks only when the item has `redemptions > 0`;
- no localStorage/local toggle can fabricate ownership;
- once redeemed, the cosmetic remains available even if the catalog item is later deactivated;
- the `violet-shadow` CSS theme is part of the durable PWA shell and service-worker cache generation `ron-system-shell-v6`;
- `STARTER_SHOP_CANDIDATES.json` now records this candidate fulfillment as `VERIFIED` with an exact verification ref, while preserving `active:false`.

Verification/promotion:
- implementation proof head `53f88f6ce130c6dde594306a1deb0fca5368c03b`; focused `system-pwa-ci` run `34676864296`: **PASS**;
- final candidate head `9fcab835d247d8ff2d22f26c3f2eaa39f855106d`: `system-cloud-ci` `34676907097` **PASS** and `continuity-guard` `34676907185` **PASS**;
- candidate base→head review from `9fa0b6176ac2b71b3a746ab003d3dbf7ed956cc1` found exactly the intended cosmetic assets/wiring/tests/shop-candidate metadata and no schema/action-gate/unrelated-owner changes;
- non-force fast-forward promoted exact head `9fcab835d247d8ff2d22f26c3f2eaa39f855106d` to `main`;
- post-promotion main: `system-cloud-ci` `34676926619` **PASS**, `system-pwa-ci` `34676926624` **PASS**, `continuity-guard` `34676926737` **PASS**;
- Northflank deployment status for this exact commit: **SUCCESS**, build `gainful-things-6824`.

The production catalog remains empty: live Neon read-back after deployment is **11 events / max seq 13 / 0 progression awards / 0 attribute events / 0 shop upserts / 0 shop redemptions**. No player-state mutation was part of the cosmetic code promotion.

Activation remains a separate permission-gated mutation under `system-shop-economy:v1`. The exact eligible payload is:
```json
{
  "type": "shop.item.upsert",
  "payload": {
    "item_id": "system-theme-violet-shadow-v1",
    "title": "Тема: Фиолетовая тень",
    "description": "Косметическая фиолетовая тема интерфейса Системы.",
    "cost_coins": 2,
    "active": true,
    "repeatable": false
  }
}
```
It has **not** been applied. Redemption would also remain a separate exact-permission player mutation and is currently impossible anyway because live coin balance is 0.

## Achievement policy v1 — 2026-09-12
Status: **CLOSED / POLICY LIVE / ZERO ELIGIBLE CANDIDATES / NO PLAYER MUTATION**

Policy ref: `system-achievement-ledger:v1`.
Promoted main head: `be5a375523dd5787826eb9314fa0d19f1d484483`.
Architecture evidence: `architecture/changes/2026-09-12-system-achievement-policy-v1.json`.
Specification: `system/lifeup/ACHIEVEMENT_SPEC.md`.
Executable evaluator: `system/lifeup/cloud/src/achievement-policy.mjs`.

V1 makes achievement eligibility deterministic from the immutable System ledger:
- only verified `quest.completed` events for Quest v2 count, and only when the completion event is the verified basis of a `progression.awarded` event;
- reported-only, unrewarded, legacy Quest v1, infrastructure-probe, expired/failed/cancelled and pre-System evidence cannot qualify;
- starter milestones are 1 verified rewarded Quest v2 completion (`Первый подтверждённый шаг`, E), 5 (`Пять подтверждённых побед`, D), and at least 20 spanning at least 28 days (`Доказанная устойчивость`, C);
- eligibility evidence is recomputable from stable completion event IDs using a deterministic SHA-256 reference;
- an already unlocked achievement is suppressed;
- detection creates only an exact permission-gated `achievement.unlock` candidate and never grants XP/coins or writes by itself.

Verification/promotion:
- implementation head `dde76a299ca746f044a47f5218d7dbdf1df090ac`: candidate `system-cloud-ci` `34677225665` PASS and `lifeup-system-ci` `34677225632` PASS; the initial continuity run correctly rejected the controller change because its Architecture Mode manifest had not yet been committed;
- candidate manifest head `843f1c6e5a3650f360c88990dcc2b2bd3a58954f`: continuity `34677312002` PASS;
- promoted-manifest head `be5a375523dd5787826eb9314fa0d19f1d484483`: candidate continuity `34677345964` PASS, then non-force fast-forward to `main`;
- post-promotion main: system-cloud `34677360052` PASS, continuity `34677360042` PASS, LifeUp rollback `34677360037` PASS;
- Northflank auto-deploy status: SUCCESS, build `pleasant-vessel-492`;
- production Neon read-back after promotion: **11 events / max seq 13 / 0 progression awards / 0 attribute events / 0 achievement unlocks / 0 shop upserts / 0 shop redemptions**.

Therefore current achievement eligibility is exactly **0 candidates**: the policy requires a verified rewarded Quest v2 completion and production currently has zero `progression.awarded` events. No achievement unlock is authorized or useful now.

## Attribute Evidence v1 — 2026-09-12
Status: **CLOSED / POLICY LIVE / PRODUCTION VERIFIED / NO PLAYER MUTATION**

Policy ref: `system-attribute-evidence:v1`.
Existing numeric scale remains `system-attribute-ordinal5:v1`.
Promoted main head: `5efdda3473c8037c027c56f32bd6e505027e24b2`.
Architecture evidence: `architecture/changes/2026-09-12-system-attribute-evidence-v1.json`.
Specification: `system/lifeup/ATTRIBUTE_EVIDENCE_SPEC.md`.
Evaluator: `system/lifeup/cloud/src/attribute-evidence.mjs`.
Detailed closeout: `history/2026-09-12-system-attribute-evidence-v1-closeout.md`.

Behavior:
- current domain/live owners remain authoritative for the underlying evidence; the System never upgrades or invents it;
- numeric proposals require explicit verified evidence with stable source/ref/timestamp/kind provenance;
- future-dated, stale (>180 days), unverified, malformed, wrong-attribute, or conflicting duplicate evidence fails closed;
- Level 1 needs >=1 verified baseline-or-stronger record;
- Level 2 needs >=2 records including repeated-execution-or-stronger;
- Level 3 needs >=3 records spanning >=28 days plus objective-benchmark-or-stronger;
- Level 4 needs >=4 records spanning >=56 days plus a benchmark and >=2 difficult-outcome-or-stronger records;
- Level 5 needs >=5 records spanning >=84 days plus a benchmark, >=2 difficult outcomes and external-validation-or-stronger;
- insufficient evidence returns `UNRESOLVED`; eligible evidence returns only an exact permission-gated `attribute.set` action plan with deterministic SHA-256 provenance;
- evaluator never writes, auto-increments, or substitutes a lower/midpoint value.

Verification/promotion:
- exact base `d00d5da425ccf4c6a74c1f521199b1988850b0be`;
- targeted evaluator tests: **12/12 PASS**;
- candidate cloud `34677866112` PASS and LifeUp rollback `34677866189` PASS;
- first continuity `34677866080` exposed only a push-range manifest bookkeeping issue; no product/test defect was present;
- manifest-in-range continuity `34678011396` PASS;
- promoted-manifest continuity `34678035645` PASS;
- full base→promoted diff: exactly five intended paths and no migration/SQL gate/projection/PWA/secret/unrelated-owner change;
- non-force fast-forward promoted exact head `5efdda3473c8037c027c56f32bd6e505027e24b2` to `main`;
- post-promotion main: continuity `34678056934` PASS, system-cloud `34678056947` PASS, LifeUp rollback `34678056962` PASS;
- Northflank `system-core` build `chunky-rock-242`: SUCCESS;
- production Neon read-back after promotion: **11 events / max seq 13 / 0 progression awards / 0 attribute events / 0 achievement unlocks / 0 shop upserts / 0 shop redemptions**.

The onboarding/evaluation machinery is therefore closed, but actual attribute calibration remains evidence- and permission-gated. All STR/VIT/INT/DISC/CHA values remain null until an upstream owner supplies current verified evidence, the evaluator returns `ELIGIBLE`, and Ron separately authorizes the exact resulting mutation.

## Hourly autonomous maintenance loop — 2026-09-12
Status: **ACTIVE / EXACT HOURLY / EUROPE-ISTANBUL**

Ron authorized a recurring autonomous engineering cycle for the System. Each run must recover current state from Ron OS and live read-only owners, select one highest-value bounded open defect or improvement, execute safe code-only work end-to-end, verify tests/CI/runtime, and perform continuity closeout.

Guardrails:
- no cosmetic churn, duplicate work or activity for its own sake;
- no invented player progress, stats, evidence, rewards or claims;
- no real quest/profile/progression/shop/achievement/push-subscription mutation, production Neon schema/data change, secret change, external message/payment or destructive action without separate exact authorization;
- safe code-only promotion is allowed only after full PASS, diff review and production read-back;
- if no material safe improvement exists, record no artificial delta; if blocked, preserve one exact checkpoint and the minimum real unblock.

## Next execution
1. Select the next highest-value feasible Quest v2 from current real-world owners; present its exact payload and request permission before creating it.
2. If shop configuration is desired, request exact permission for the verified violet-theme `shop.item.upsert` payload above; do not activate or redeem it implicitly.
3. For STR/VIT/INT/DISC/CHA, recover current evidence only from the correct domain/live owners, evaluate it through `system-attribute-evidence:v1`, and present an exact payload only when `ELIGIBLE`; do not auto-fill null values.
4. Continue safe code-only product work with real-device acceptance on the Russian HUD/session/cosmetic shell; all three starter cosmetic fulfillments are already VERIFIED.

## OPEN
- `OPEN`: next player Quest v2 selection and exact create authorization; no active player Quest v2 exists now.
- `OPEN`: production activation of verified violet-theme shop item is permission-gated; production has 0 shop events and the candidate remains `active:false`.
- `CLOSED`: all three starter cosmetic fulfillments are `VERIFIED`; title, violet theme and hunter frame remain inactive until separately configured and later redeemed under the existing permission gates.
- `OPEN`: per-attribute evidence gathering/evaluation and exact calibration authorization; STR/VIT/INT/DISC/CHA remain null until individually eligible and authorized.
- `OPEN`: later evidence-supported skill additions/changes; do not initialize weakly evidenced skills merely for completeness.
- `OPEN`: cleanup of disposable Neon test branches after explicit destructive-action confirmation.

## CLOSED
- Starter cosmetic fulfillment set: profile title `profile.title.first-step` verified by `04069fc06e75c56b626609be351c968b85df6baa` / `system-pwa-ci` 34678331752; hunter frame `profile.frame.hunter` verified by `9c14870b4311de9807b75ce9e9b3cc1a3e636555` / `system-pwa-ci` 34678609238; together with Violet Shadow, all three starter effects are ledger-redemption-driven and remain inactive with zero implicit player mutation.
- Attribute Evidence v1: `system-attribute-evidence:v1` fail-closed preflight is promoted and live on `5efdda3473c8037c027c56f32bd6e505027e24b2`; all candidate/post-promotion gates passed, Northflank built successfully, production stayed 11/max13 with 0 attribute events, and all five numeric attributes remain null until evidence + exact permission.
- Achievement policy v1: `system-achievement-ledger:v1` deterministically derives permission-gated candidates only from verified rewarded Quest v2 completions; promoted on `be5a375...`, all post-promotion gates passed, production remained 11/max13 with 0 progression and 0 achievement unlocks, so current eligibility is 0.
- Production `persist-probe` neutralization: exact seq 1 legacy SIDE/unscored payload matched the checkpoint, `quest.cancel` passed through `system_apply_action(...)`, seq 13 cancellation read back, and no progression/shop/attribute side effect occurred.
- Violet Shadow cosmetic fulfillment v1: effect is ledger-redemption-driven, tested, promoted on `9fcab835...`, Northflank deployment is successful, candidate fulfillment is VERIFIED but inactive, and production still has 0 shop events.
- System shop policy v1: `system-shop-economy:v1` restricts starter rewards to verified System-controlled cosmetics on the 1/2/4/8 coin ladder, protects basic needs and external authority, and is live on `9be9ce...`; production catalog remains deliberately empty.
- Atomic Quest resolution v1: `quest.resolve` atomically commits verified final progress + completion + exact canonical reward through the existing PostgreSQL action gate; runtime head `857edf50570311fee8c6cb4f535cfda1971130e6` passed candidate and post-promotion CI, production Neon remained unchanged, no schema migration was introduced, and the public `atomic-v1` marker is verified on the canonical Northflank route.
- Deadline automation v1: server-side reminders, idempotent automatic expiry, reward forfeiture and CRITICAL notification are live; the first expiry notification was later acknowledged at seq 12.
- Web Push delivery is enabled with one opted-in device subscription.
- Russian-first mobile System HUD and signed persistent device session are live on `dbdf8949...`.
- LifeUp originally selected as an Android execution/sync prototype over Do It Now.
- Official `Ayagikei/LifeUp-SDK` selected for the historical bridge.
- Cloud-first System Core + PWA implemented and live.
- Production Neon durable persistence verified across restart.
- Shared PostgreSQL `system_apply_action(...)` gate live for HTTP + ChatGPT-through-Neon.
- Profile-domain v0.2 implemented/promoted/live with zero fabricated profile events.
- System Calibration v1 policy implemented, candidate-tested on real Neon child branch, promoted non-force to main and migrated live in production.
- Level/XP, deterministic quest rewards, attribute/skill scales and Rank review gate are canonical and versioned.
- Post-promotion cloud, continuity and legacy LifeUp regressions passed for the calibration release.
- Calibration v1 production migration verified with **0 player-profile mutations** before launch.
- First-launch dry-run verified the bounded profile launch, Turkish Tier 3, Marketplace Operations Tier 3 and exact idempotent replay while production remained untouched.
- First real production player launch completed 2026-09-11 through the bounded three-event write set and verified by immediate production read-back: Level 1, Rank null, 500 XP-to-next, calibrated economy, exactly two Tier-3 skills, zero attributes and zero progression awards.
- 2026-09-11 architecture decision: Ron chose ChatGPT as the exclusive interactive System surface; LifeUp retired from the target runtime architecture while legacy code/history is preserved.
- ChatGPT System Controller v1 promoted to `main` on exact head `e15383173c7e1e694a6735c96b0b3c88a7932c08`; candidate and post-promotion cloud/continuity/legacy regressions all passed and production player ledger remained unchanged.
- Quest v2 structured lifecycle, hidden/reveal behavior, deadlines, failure/expiry, backward compatibility and the global one-active-player-quest invariant are promoted and live in production.
- Quest v2 deployment-entrypoint verification defect is closed: Docker/HTTP CI now reject the legacy model version, public runtime reports `quest-v2`, migrations 005/006 are present, and the production ledger remained 6 total / 0 Quest v2 events at that checkpoint.
- Quest difficulty v1 controller policy is verified: deterministic E-S bands, adaptive evidence anchors and fail-closed anti-farming/UNSCORED behavior are covered by executable tests.
- First player-facing Quest v2 lifecycle is closed: creation was idempotent, automatic expiry occurred once, its expiry notification was later acknowledged, and no unverified reward was issued.
