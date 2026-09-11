# LifeUp System — project owner

Updated: 2026-09-11 Europe/Istanbul
Status: **BUILDING / CLOUD-FIRST SYSTEM CORE LIVE / POSTGRES ACTION GATE LIVE / CALIBRATION V1 LIVE / PRODUCTION PLAYER LAUNCHED / LEVEL 1 / ECONOMY CALIBRATED / CHATGPT-ONLY TARGET CONTROLLER / LIFEUP RETIRED FROM TARGET RUNTIME**

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
- candidate controller/routing repair: `architecture/changes/2026-09-11-chatgpt-system-controller-v1.json`

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
- STR/VIT/INT/DISC/CHA: **UNKNOWN / null**; no attribute event exists.
- Skills: `Turkish` Tier **3** and `Marketplace Operations` Tier **3**, both under `system-skill-competency5:v1`.
- Achievements: **none initialized**.
- Reward shop: **none initialized**.
- Profile-domain notifications: **none initialized**.
- Production ledger: **6 total events** at immediate post-launch read-back: 3 historical infrastructure/integration + 1 profile launch + 2 skill events; 0 progression awards and 0 attribute events.
- Infrastructure residue: `persist-probe` remains an ACTIVE unscored SIDE quest; it is not a genuine player quest and requires separate exact production-mutation permission to neutralize.

## Cloud core capabilities
`system/lifeup/cloud/` owns runtime implementation.
- append-only `system_events`; `UPDATE`/`DELETE` rejected;
- `system_apply_action(...)` shared by HTTP and authorized ChatGPT-through-Neon writes;
- exact idempotent retry replay; conflicting key reuse rejected;
- DB triggers constrain privileged raw inserts;
- actions: quest create/complete/cancel, progression award, profile calibrate, attribute set, skill upsert, achievement unlock, shop item/redeem, notification push/ack;
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
- stale recovery/routing documents still pointed at LifeUp before this candidate fix;
- quest v1 lacks structured objectives/progress/deadlines/recurrence/failure/hidden reveal mechanics;
- E-S quest difficulty assignment lacks a reproducible controller rubric;
- completion and progression are separate writes rather than one resolved flow;
- PWA is mostly read-only and has an XP progress-bar math bug;
- notifications are ledger-visible but not proactively delivered;
- shop content/pricing, achievement detection and attribute onboarding are unfinished;
- current live-source connector coverage is partial.

## Current candidate — ChatGPT System Controller v1
Branch: `system-controller-v1`.

Target:
1. repair every recovery route so System work resolves to `skills/system-controller.md` + this owner + Neon `system_events`;
2. retire LifeUp from the target runtime while preserving legacy code/history;
3. establish a natural-language controller intent contract;
4. add routing regression enforcement;
5. only after this architecture slice passes, continue into Quest v2 / scoring / PWA interaction work.

## Next execution
1. Finish and verify `system-controller-v1` candidate with architecture/continuity regression and base->head diff review.
2. Promote only after candidate verification satisfies Architecture Mode; do not mutate production player state as part of this architecture promotion.
3. Build Quest v2 with structured objectives/progress/deadline/cadence/failure/hidden conditions and backward compatibility.
4. Define a reproducible E-S difficulty rubric and adaptive controller policy before routine scored quests.
5. Add atomic/composite quest resolution or deterministic reconciliation for completion + reward.
6. Fix/upgrade PWA and proactive System delivery.
7. Calibrate starter reward shop, achievement rules and evidence-based attribute onboarding.
8. Neutralize `persist-probe` only after exact production mutation permission.
9. Run end-to-end adversarial natural-language acceptance tests before declaring daily-driver readiness.

## OPEN
- `OPEN`: `system-controller-v1` candidate verification/promotion.
- `OPEN`: Quest v2 data/behavior model.
- `OPEN`: reproducible quest E-S difficulty classification.
- `OPEN`: atomic/reconciled completion + reward flow.
- `OPEN`: device-level PWA UX/correctness/interactions; XP bar bug.
- `OPEN`: proactive System notification delivery.
- `OPEN`: starter reward-shop design and exact candidate write-set review.
- `OPEN`: achievement detection/content policy.
- `OPEN`: evidence-supported STR/VIT/INT/DISC/CHA calibration; unresolved values remain null.
- `OPEN`: later evidence-supported skill additions/changes; do not initialize weakly evidenced skills merely for completeness.
- `OPEN`: production `persist-probe` neutralization after exact permission.
- `OPEN`: optional public `/healthz` read-back showing `model_version:"calibration-v1"`.
- `OPEN`: cleanup of disposable Neon test branches after explicit destructive-action confirmation.

## CLOSED
- LifeUp originally selected as an Android execution/sync prototype over Do It Now.
- Official `Ayagikei/LifeUp-SDK` selected for the historical bridge.
- Cloud-first System Core + PWA implemented and live.
- Production Neon durable persistence verified across restart.
- Shared PostgreSQL `system_apply_action` gate live for HTTP + ChatGPT-through-Neon.
- Profile-domain v0.2 implemented/promoted/live with zero fabricated profile events.
- System Calibration v1 policy implemented, candidate-tested on real Neon child branch, promoted non-force to main and migrated live in production.
- Level/XP, deterministic quest rewards, attribute/skill scales and Rank review gate are canonical and versioned.
- Post-promotion cloud, continuity and legacy LifeUp regressions passed for the calibration release.
- Calibration v1 production migration verified with **0 player-profile mutations** before launch.
- First-launch dry-run verified the bounded profile launch, Turkish Tier 3, Marketplace Operations Tier 3 and exact idempotent replay while production remained untouched.
- First real production player launch completed 2026-09-11 through the bounded three-event write set and verified by immediate production read-back: Level 1, Rank null, 500 XP-to-next, calibrated economy, exactly two Tier-3 skills, zero attributes and zero progression awards.
- 2026-09-11 architecture decision: Ron chose ChatGPT as the exclusive interactive System surface; LifeUp retired from the target runtime architecture while legacy code/history is preserved.
