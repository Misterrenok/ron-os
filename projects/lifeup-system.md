# LifeUp System — project owner

Updated: 2026-09-11 Europe/Istanbul
Status: **BUILDING / CLOUD-FIRST SYSTEM CORE LIVE / POSTGRES ACTION GATE LIVE / CALIBRATION V1 PROMOTED + PRODUCTION DB MIGRATED / FIRST-LAUNCH DRY-RUN PASS / PRODUCTION PLAYER INTENTIONALLY NOT LAUNCHED / LIFEUP OPTIONAL SYNC**

## Outcome
Build a real-life RPG System inspired by the functional feel of Solo Leveling: quests, attributes, skills, XP, ranks, achievements, coins/rewards, notifications and adaptive progression. The game layer must improve real-world execution rather than reward meaningless XP farming.

## Authority boundary
- Ron OS and claim-specific live owners remain authoritative for real-world facts, decisions and execution.
- The cloud System owns only **derived RPG state** in its append-only event ledger.
- LifeUp remains a **derived RPG ledger + execution UI**, not a replacement source of truth.
- A System/LifeUp task being present or scheduled does not prove a real-world action happened.
- Completion may become execution evidence only when the provenance/claim contract permits it and no stronger owner conflicts.
- Northflank, Neon/PostgreSQL, PWA and LifeUp do not become owners of underlying health, finance, schedule, nutrition, training, learning, mobility or other real-world facts.
- No LifeUp/Cloud token, MCP bearer token, Tailscale credential or other private secret belongs in this repository.

## Current architecture
```text
Ron OS + claim-specific live owners
        |
        v
ChatGPT / System controller
        |
        +------> Neon/PostgreSQL system_apply_action(...)
        |               |
        |               v
        |        append-only system_events
        |               |
        |               v
        |        rebuildable projections
        |
        v
Northflank System Core / HTTP API / PWA
        |
        +------> optional LifeUp sync bridge -> Tailscale -> LifeUp Cloud -> Android
```

There is one mutable derived-state owner: `system_events`. ChatGPT, HTTP/PWA and future LifeUp sync must share it rather than maintain parallel state.

## Production checkpoint — System Calibration v1 — 2026-09-11
Promoted main head before this owner-only closeout: `f82ca196f1e0fc5beb4481d667cb2b5947a346f1`.

Architecture evidence:
- `architecture/changes/2026-09-10-system-cloud-core-v1.json`
- `architecture/changes/2026-09-10-system-db-action-gate-v1.json`
- `architecture/changes/2026-09-11-system-profile-domain-v1.json`
- `architecture/changes/2026-09-11-system-calibration-v1.json`

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

Therefore the calibration runtime/schema is live while Ron's player profile remains deliberately untouched. Promotion itself did not fabricate Level, Rank, attributes, skills, XP economy or achievements.

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

No attribute event was written in the dry-run. STR/VIT/DISC/CHA remain intentionally unresolved rather than guessed; INT also remains unresolved for the first launch unless a separate evidence review fully supports a tier. Other language/capability records were not initialized merely to fill the UI.

**Production remains untouched:** main still has no player-profile launch event, no calibrated economy event and no initialized skill/attribute events. The dry-run branch is test evidence only and never owns Ron's current player state.

Candidate bounded production write set after this dry-run:
1. `profile.calibrate`: Level `1`, Rank `null`, XP-to-next `500`, economy `CALIBRATED`;
2. `skill.upsert`: `Turkish`, Tier `3`;
3. `skill.upsert`: `Marketplace Operations`, Tier `3`;
4. no initial STR/VIT/INT/DISC/CHA events; keep all five `null` until separately defensible evidence exists.

This candidate is technically validated but **not yet authorized as a production mutation**. The live-mutation gate still requires Ron's explicit permission for this exact production write set. Disposable Neon branch cleanup also remains separately permission-gated because deletion is destructive.

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
`economy_status=CALIBRATED` means the issuance policy above is active. It does not mean the reward shop is configured. Shop redemption remains an internal System event and never authorizes a real purchase/payment.

## Current production player state
Do **not** infer current values from candidate/test probes or durable user memory.

- Profile launched: **NO**.
- System XP: **0 real calibrated XP**; existing ledger rows are infrastructure provenance, not player progression.
- Level: **UNKNOWN / null until bounded launch event**. Policy says a zero-XP launch will derive Level 1, but the launch has not happened yet.
- Rank: **UNKNOWN / null**.
- XP-to-next: **UNKNOWN / null until launch**.
- Economy: **UNCALIBRATED**.
- STR/VIT/INT/DISC/CHA: **UNKNOWN / null**.
- Skills: **not initialized in production**. Dry-run-only candidate: Turkish Tier 3 + Marketplace Operations Tier 3.
- Achievements: **none initialized**.
- Reward shop: **none initialized**.
- Profile-domain notifications: **none initialized**.
- Production ledger: **3 earlier infrastructure/integration events, 0 calibration-related player events** at the fresh first-launch preflight read-back.

## Cloud core capabilities
`system/lifeup/cloud/` owns runtime implementation.
- append-only `system_events`; `UPDATE`/`DELETE` rejected;
- `system_apply_action(...)` shared by HTTP and authorized ChatGPT-through-Neon writes;
- exact idempotent retry replay; conflicting key reuse rejected;
- DB triggers also constrain privileged raw inserts;
- actions: quest create/complete/cancel, progression award, profile calibrate, attribute set, skill upsert, achievement unlock, shop item/redeem, notification push/ack;
- production persistence is Neon/PostgreSQL; phone/LifeUp is not a core dependency;
- PWA reads the same event-derived snapshot.

## Optional LifeUp bridge — current state
Legacy implementation remains under `system/lifeup/northflank/` and is optional downstream integration.

Technical upstream remains official `Ayagikei/LifeUp-SDK` / `@lifeup/mcp`.

Confirmed:
- Android LifeUp + LifeUp Cloud read permission;
- LifeUp Cloud serving on port `13276` while its process is alive;
- Northflank/Tailscale sidecar joined Tailnet;
- Northflank -> Android LifeUp Cloud `/info` returned HTTP 200 while LifeUp Cloud was running;
- prior Private-DNS/ad-blocker internet-loss issue was resolved by Ron;
- Android keeping LifeUp Cloud alive unattended remains unreliable, but this affects optional sync only.

No live LifeUp mutation has yet been authorized/performed by this project. First LifeUp baseline remains read-only before defining exact optional sync mappings.

## Next execution — first real System launch
1. Candidate production write set is now dry-run validated: profile launch + Turkish Tier 3 + Marketplace Operations Tier 3; all five attributes remain null.
2. Obtain Ron's explicit permission for exactly that production write set; do not infer authorization from general build/continue language.
3. Immediately preflight production again: confirm no new player/progression event changed the derived launch values.
4. Apply the bounded writes through `system_apply_action` with unique production idempotency keys.
5. Read back all production events/snapshot and verify Level 1, Rank null, 500 XP-to-next, calibrated economy, only the two intended skills and no attribute initialization.
6. Only then configure a small reversible starter reward shop and begin real scored quests.
7. Verify PWA UX on Ron's phone and later implement optional LifeUp queue/reconciliation.

## OPEN
- `OPEN`: exact production launch permission for the dry-run-validated three-event write set.
- `OPEN`: first real profile launch and post-write production read-back.
- `OPEN`: evidence-supported STR/VIT/INT/DISC/CHA calibration; unresolved values remain null.
- `OPEN`: later evidence-supported skill additions/changes; do not initialize weakly evidenced skills merely for completeness.
- `OPEN`: starter reward-shop configuration after launch.
- `OPEN`: device-level PWA UX verification/polish.
- `OPEN`: optional LifeUp sync queue/reconciliation and read-only LifeUp baseline.
- `OPEN`: exact optional LifeUp stat/skill mapping after baseline.
- `OPEN`: optional public `/healthz` read-back showing `model_version:"calibration-v1"`.
- `OPEN`: cleanup of disposable Neon test branches after explicit destructive-action confirmation.

## CLOSED
- LifeUp selected as optional Android execution/sync prototype over Do It Now.
- Official `Ayagikei/LifeUp-SDK` selected for legacy bridge.
- Cloud-first System Core + PWA implemented and live.
- Production Neon durable persistence verified across restart.
- Shared PostgreSQL `system_apply_action` gate live for HTTP + ChatGPT-through-Neon.
- Profile-domain v0.2 implemented/promoted/live with zero fabricated profile events.
- System Calibration v1 policy implemented, candidate-tested on real Neon child branch, promoted non-force to main and migrated live in production.
- Level/XP, deterministic quest rewards, attribute/skill scales and Rank review gate are now canonical and versioned.
- Post-promotion cloud, continuity and legacy LifeUp regressions all PASS.
- Calibration v1 production migration verified with **0 player-profile mutations**.
- First-launch dry-run on `system-first-launch-dryrun` verified the bounded profile launch, Turkish Tier 3, Marketplace Operations Tier 3 and exact idempotent replay while production remained untouched.
