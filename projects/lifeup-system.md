# LifeUp System — project owner

Updated: 2026-09-11 Europe/Istanbul
Status: **BUILDING / CLOUD-FIRST SYSTEM CORE LIVE / POSTGRES ACTION GATE LIVE / PROFILE-DOMAIN V0.2 PROMOTED + PRODUCTION DB MIGRATED / CURRENT PROFILE VALUES INTENTIONALLY UNCALIBRATED / LIFEUP OPTIONAL SYNC**

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
Northflank System Core / HTTP API
        |
        +------> mobile-first System PWA
        |
        +------> optional LifeUp sync bridge -> Tailscale -> LifeUp Cloud -> Android
```

There is one mutable derived-state owner: `system_events`. ChatGPT, HTTP/PWA and future LifeUp sync must share it rather than maintain parallel state.

## Production cloud checkpoint — 2026-09-11
### Repository / CI
Current promoted profile-domain head before this owner-only closeout: `8f381bf04f088e764a5008b8fbba42914b711f15`.

Architecture evidence:
- `architecture/changes/2026-09-10-system-cloud-core-v1.json`
- `architecture/changes/2026-09-10-system-db-action-gate-v1.json`
- `architecture/changes/2026-09-11-system-profile-domain-v1.json`

Post-promotion main verification for the profile-domain head:
- `system-cloud-ci` run `34558428683`: **PASS** — model, Docker, real PostgreSQL action gate and HTTP-through-Postgres smoke all passed.
- `continuity-guard` run `34558428698`: **PASS**.
- `lifeup-system-ci` run `34558428694`: **PASS** — legacy LifeUp static contract + Docker/runtime regression survived.

The profile-domain base->head review changed only System cloud runtime, additive migration, PWA, tests, cloud CI, README and its architecture manifest. Ron OS routing/PROTOCOL, unrelated owners and the legacy LifeUp bridge were not rewritten.

### Live Northflank / Neon
- Production System Core on Northflank is **LIVE and phone-independent**.
- Ron screenshot on 2026-09-11 directly confirmed public `/healthz` returned `ok=true`, `service=ron-system-core`, `persistence=postgres`, `action_gate=postgres-function`, `phone_dependency=false`.
- Production Neon/PostgreSQL is **LIVE** and durable persistence was previously verified across deployment/restart.
- ChatGPT-through-Neon write path is **LIVE**: a prior integration probe created and cancelled `chatgpt-gate-probe` through `system_apply_action`; no XP/coins were awarded.
- Legacy pre-gate idempotency remained compatible: `persist-probe` replayed through the DB gate with its old SHA-256 request hash and original event id.
- Production contra-probe rejected progression based on `quest.created` because reward basis must be a verified `quest.completed` event.
- After the 2026-09-11 profile-domain promotion, Northflank startup applied additive migration `003_profile_domain.sql` to production Neon: the profile evidence helper and all four profile-domain indexes are present.
- Immediate production read-back after that deployment: **3 existing integration events, 0 profile-domain events**. No test level, rank, attribute, skill, achievement, shop or notification value was written to production.
- Production live contra-probe for the new action layer rejected `profile.calibrate` without `evidence.ref`, proving the deployed DB gate enforces calibration provenance without writing an event.
- A public `model_version:"profile-v1"` HTTP read-back has not been independently fetched by the assistant because the Northflank `code.run` endpoint is not reachable from the available web/container network. The database migration/read-back proves the new startup path executed; keep the HTTP marker as a small runtime-verification tail rather than fabricating a direct probe.

## System Core v0.2 capabilities
### Event ledger and write gate
`system/lifeup/cloud/` owns the cloud runtime.
- `system_events` is append-only; `UPDATE`/`DELETE` are rejected.
- Every event stores provenance fields, idempotency key, request hash, claim status and JSON payload.
- `system_apply_action(...)` is the shared mutation gate for Northflank HTTP and authorized ChatGPT-through-Neon writes.
- Exact retry replays the original event; reuse of one idempotency key for a different request is rejected.
- A raw privileged SQL insert still passes trigger validation and cannot bypass core evidence/transition rules.

### Quest / progression semantics
- Actions: `quest.create`, `quest.complete`, `quest.cancel`, `progression.award`.
- Completion may be `reported` or `verified`.
- Completion never auto-awards XP/coins.
- Progression requires an existing **verified** `quest.completed` basis.
- One completion basis can be rewarded only once.
- Current XP/coin economy and level/rank thresholds remain uncalibrated.

### Profile / attributes
- Action: `profile.calibrate`.
- Calibration requires verified evidence plus an explicit provenance reference.
- Calibration is partial: omitted fields remain unknown instead of being default-filled.
- `level`, `rank`, `xp_to_next` stay `null` until calibrated.
- `economy_status` stays `UNCALIBRATED` until explicitly calibrated.
- Attributes remain `STR`, `VIT`, `INT`, `DISC`, `CHA`.
- Action: `attribute.set`; verified evidence + provenance + an explicit `scale_ref` are mandatory.
- Current production attribute values remain **UNKNOWN / UNINITIALIZED**.

### Skills
- Action: `skill.upsert`.
- Only skills supported by authoritative current domains/evidence may be initialized.
- A skill can exist with `level=null`; a numeric level requires an explicit scale reference.
- Current production skill portfolio/levels remain **UNINITIALIZED**; candidate test values never reached production.

### Achievements
- Action: `achievement.unlock`.
- Unlock requires verified provenance and is unique by achievement id.
- Current production achievements remain empty until real verified milestones are mapped.

### Shop / rewards
- Actions: `shop.item.upsert`, `shop.redeem`.
- Item coin cost may remain `null` while economy is uncalibrated.
- Redemption is blocked until the economy and item cost are calibrated, the item is active and the derived coin balance is sufficient.
- Non-repeatable rewards cannot be redeemed twice.
- Shop redemption is only an internal System event; it never performs a purchase, payment or other external real-world mutation.

### Notifications
- Actions: `notification.push`, `notification.ack`.
- Explicit `UNREAD -> READ` transition lives in the ledger.
- Severity/kind metadata are supported.

### PWA
The same Northflank service hosts the mobile-first dark System HUD against `/api/v1/snapshot`.
Current sections:
- STATUS / level / rank / XP / coins
- attributes with calibration/provenance metadata
- QUESTS
- SKILLS
- ACHIEVEMENTS
- SHOP / REWARDS
- NOTIFICATIONS with unread count
- SYSTEM LOG

Unknown values render as unknown/uninitialized rather than synthetic defaults. Browser bearer remains session-only and API responses are not service-worker cached.

## Current production game state
Do **not** infer values from candidate/test probes.
- Profile initialized: **NO**.
- Level: **UNKNOWN / null**.
- Rank: **UNKNOWN / null**.
- XP-to-next: **UNKNOWN / null**.
- Economy: **UNCALIBRATED**.
- STR/VIT/INT/DISC/CHA: **UNKNOWN / null**.
- Skills: **not initialized**.
- Achievements: **none initialized**.
- Reward shop: **none initialized**.
- Notifications: **none initialized by the profile-domain release**.
- The ledger currently contains only the three earlier integration-probe events; these are infrastructure provenance, not a calibrated player profile.

Temporary Neon branch `system-profile-domain-v1-test` (`br-shy-glade-ay5euzz7`) contains disposable candidate probe events only. It is not authoritative and must never be read as Ron's current state. Deleting that branch is a cleanup action that requires an explicit destructive-action confirmation through the Neon connector; leaving it in place does not affect production.

## Optional LifeUp bridge — current state
Legacy implementation remains under `system/lifeup/northflank/` and is optional downstream integration.

Confirmed historical/live infrastructure facts:
- Android LifeUp + LifeUp Cloud read permission: **CONFIRMED**.
- LifeUp Cloud serves on port `13276` while its process is alive: **CONFIRMED**.
- Northflank LifeUp service exists in the existing `Cronometer` Northflank project because the free managed-project limit prevented a second project.
- Public legacy LifeUp `/healthz`: **CONFIRMED**.
- Tailscale OAuth/Northflank sidecar join: **CONFIRMED**.
- Northflank -> Tailscale -> Android LifeUp Cloud `/info`: **CONFIRMED HTTP 200** while LifeUp Cloud is running.
- Android Private-DNS/ad-blocker issue that broke ordinary internet with Tailscale: **RESOLVED** by Ron.
- Android keeping LifeUp Cloud alive unattended: **UNRELIABLE / UNVERIFIED**. This is only an optional-sync reliability issue now.
- The first Tailscale OAuth secret was exposed in a screenshot and Ron directly reported rotating/replacing it. Never reuse or persist the exposed credential.
- No live LifeUp mutation has been authorized/performed by this System project yet; first baseline remains read-only.

## Mechanics that are still deliberately uncalibrated
Canonical mechanics reference: `system/lifeup/SYSTEM_SPEC.md`.
- Attributes: STR, VIT, INT, DISC, CHA.
- Quest classes: DAILY, SIDE, MAIN, RECOVERY, HIDDEN/ACHIEVEMENT.
- Difficulty ranks: E, D, C, B, A, S.
- Harmful punishment is forbidden.
- Anti-farming remains required: trivial repetition cannot generate unlimited progression.
- Exact XP awards, coin awards, level thresholds, rank thresholds, attribute scales and skill scales are **not yet canonical**.

## Next execution
1. Define the smallest defensible calibration contract for level/rank, STR/VIT/INT/DISC/CHA, skill levels and XP/coin economy; scales must have explicit meaning and must not manufacture precision from weak evidence.
2. Recover only current authoritative domain evidence needed for calibration. Initialize fields/skills only where evidence supports them; leave unresolved fields `null`.
3. Seed the first real System profile through the same `system_apply_action` gate with provenance on every calibration event.
4. Configure a small reversible starter reward shop only after economy calibration is fixed; no external purchases/actions from redemption.
5. Verify the live PWA on Ron's device, including STATUS/SKILLS/ACHIEVEMENTS/SHOP/NOTIFICATIONS and session unlock UX.
6. Then implement optional LifeUp outbound queue/reconciliation for phone-offline periods and perform the read-only LifeUp baseline before defining exact sync mappings.

## OPEN
- `OPEN`: public HTTP read-back of `model_version:"profile-v1"` after the 2026-09-11 deploy; DB migration/read-back is already verified.
- `OPEN`: explicit profile/attribute/skill scale design and first authoritative production calibration.
- `OPEN`: calibrated XP/coin economy and level/rank thresholds.
- `OPEN`: starter reward-shop configuration after economy calibration.
- `OPEN`: device-level PWA UX verification/polish.
- `OPEN`: optional LifeUp sync queue/reconciliation.
- `OPEN`: public legacy `/mcp` unauthenticated 401 live probe.
- `OPEN`: live read-only LifeUp baseline through the remote MCP.
- `OPEN`: exact optional LifeUp stat/skill mapping after baseline.
- `OPEN`: cleanup of disposable Neon test branch after explicit destructive-action confirmation.

## CLOSED
- LifeUp selected as the optional Android execution/sync prototype over Do It Now.
- Official `Ayagikei/LifeUp-SDK` / `@lifeup/mcp` selected for the legacy bridge.
- PC dependency removed from the legacy bridge through Northflank.
- Northflank/Tailscale -> Android LifeUp Cloud reachability verified.
- Cloud-first redesign approved 2026-09-10; Android/LifeUp no longer blocks the core.
- Cloud System Core v0.1 event ledger/API/PWA implemented, promoted and live.
- Production Neon/PostgreSQL durable persistence verified.
- Production Northflank System Core independent of Android verified.
- Shared PostgreSQL `system_apply_action` gate implemented and live for HTTP + ChatGPT-through-Neon.
- Legacy SHA-256 idempotency replay compatibility preserved.
- Profile-domain v0.2 model, additive DB gate migration, PWA views and CI implemented and promoted 2026-09-11.
- Profile-domain candidate verified on a Neon child branch with positive/contra tests before promotion.
- Production profile-domain migration verified with **0 fabricated production profile events**.
- Post-promotion System cloud, continuity and legacy LifeUp regressions all PASS.
