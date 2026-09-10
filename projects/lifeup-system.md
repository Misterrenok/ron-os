# LifeUp System — project owner

Updated: 2026-09-10 Europe/Istanbul
Status: **BUILDING / CLOUD-FIRST CORE CANDIDATE IMPLEMENTED + CI PASS / LIVE DEPLOYMENT NOT YET VERIFIED / LEGACY NORTHFLANK -> TAILSCALE -> LIFEUP CLOUD BRIDGE CONFIRMED / NO LIVE LIFEUP MUTATIONS YET**

## Outcome
Build a real-life RPG system inspired by the "System" interface from Solo Leveling: quests, attributes, skills, XP, ranks, achievements, coins/rewards and adaptive progression. The game layer must improve real-world execution rather than reward meaningless XP farming.

## Authority boundary
- Ron OS and claim-specific live owners remain authoritative for real-world facts, decisions and execution.
- LifeUp is a **derived RPG ledger + execution UI**, not a replacement source of truth for health, finance, schedule, nutrition, training, learning, mobility or other domains.
- A LifeUp task being scheduled/present does not prove the real action happened. Completion may become execution evidence only when it is a genuine user completion record and no stronger owner conflicts.
- No LifeUp/Cloud token, MCP bearer token, Tailscale credential or other private secret belongs in this repository.

## Approved target direction — 2026-09-10
Ron explicitly approved moving from a phone-dependent LifeUp-first runtime to a **cloud-first System**.

Required target properties:
1. **ChatGPT-first control surface:** Ron should be able to operate the System through ChatGPT as the primary conversational controller: inspect status, quests, attributes, skills, XP/level, coins, achievements/rewards and perform authorized System actions without manually operating the backend.
2. **Always-on cloud core:** Northflank + Neon/PostgreSQL (or an equivalent verified cloud runtime) own the System's derived game state and must continue operating when Ron's phone is offline or powered off.
3. **LifeUp becomes optional integration/sync:** the already-working Northflank -> Tailscale -> LifeUp Cloud bridge remains useful, but loss of Android/LifeUp Cloud must not stop the core System. Offline LifeUp sync should queue/reconcile rather than block core operation.
4. **Rich System UI:** provide a polished, dark futuristic RPG HUD/menu inspired by the functional feel of Solo Leveling's System while using an original visual design. Core views should include STATUS, QUESTS, SKILLS, ATTRIBUTES, LEVEL/XP, COINS, ACHIEVEMENTS, SHOP/REWARDS, NOTIFICATIONS and SYSTEM LOG/HISTORY.
5. **In-chat presentation + dedicated visual surface:** ChatGPT responses should present concise System-style status/cards when the client supports it; a dedicated mobile-first PWA/web interface is the guaranteed interactive visual surface for richer menus, animations and navigation when arbitrary custom in-chat UI is unavailable.
6. **One backend, multiple surfaces:** ChatGPT, the PWA and optional LifeUp integration must operate against the same System Core/API and event ledger rather than creating separate mutable game-state owners.
7. **Safety/authority remains unchanged:** Ron OS/live owners still own real-life truth; System state is derived. Any consequential live-source mutation still follows the existing explicit mutation gate.

## Legacy v1 technical decisions — 2026-09-09
1. Primary app prototype: **LifeUp + LifeUp Cloud** on Android.
2. MCP implementation: **official `Ayagikei/LifeUp-SDK` MCP / `@lifeup/mcp`**, not the older third-party `derekprovance/lifeup-mcp` as the primary path.
3. Ron directly reports that **Northflank is available**.
4. Prototype always-on architecture: **Northflank stateful Streamable HTTP MCP -> Tailscale -> LifeUp Cloud on Android**. The PC is not an always-on dependency, but the phone/LifeUp Cloud is; this phone dependency is the reason for the approved cloud-first redesign.
5. Northflank v1 uses **one replica** because official LifeUp MCP connection state is sessionful and the bridge currently keeps MCP sessions in process memory.
6. Existing prototype client path: **Codex** can connect to the remote Streamable HTTP MCP. Do not make the target System dependent on a client surface that cannot perform the required actions.
7. First live LifeUp pass remains **read-only discovery/baseline**. No quest/stat/shop mutation until the live LifeUp inventory is read and a bounded initial write set is explicitly authorized.

## Target runtime
```text
Ron OS + live owners
        |
        v
ChatGPT / System controller
        |
        v
Northflank System Core / API / MCP
        |
        +------> Neon/PostgreSQL derived game state + event ledger
        |
        +------> mobile-first System PWA
        |
        +------> optional LifeUp sync bridge -> Tailscale -> LifeUp Cloud -> LifeUp Android
```

Northflank and Neon are transport/runtime + derived game-state infrastructure only. They do not become owners of underlying real-world facts.

## V1 mechanics
Canonical mechanics: `system/lifeup/SYSTEM_SPEC.md`.
- Core attributes: STR, VIT, INT, DISC, CHA.
- Domain skills are created only from actual active domains after current-state recovery; do not fabricate a current skill portfolio.
- Quest classes: DAILY, SIDE, MAIN, RECOVERY, HIDDEN/ACHIEVEMENT.
- Difficulty ranks: E, D, C, B, A, S.
- Exact XP/coin values remain uncalibrated until the live LifeUp baseline is read.
- Penalties are conservative game mechanics; harmful punishment is forbidden.
- Anti-farming: repeated trivial actions cannot generate unlimited progression.

## Cloud-first core candidate — 2026-09-10
Architecture candidate: `system-cloud-core-v1` from exact base `da875a618a9ebc13148564a5a5d5f05dc002ae0b`.
Architecture evidence: `architecture/changes/2026-09-10-system-cloud-core-v1.json`.

Implemented in `system/lifeup/cloud/`:
- append-only PostgreSQL/Neon `system_events` ledger with event id, actor, source/source reference, per-event claim status, idempotency key, request hash and JSON payload;
- deterministic projection reducer; empty progression stays explicitly `UNCALIBRATED` with level/rank/attributes/skills uninitialized rather than fabricated;
- authenticated HTTP API: `/healthz`, `/api/v1/capabilities`, `/api/v1/events`, `/api/v1/snapshot`, `/api/v1/actions`;
- first action slice: `quest.create`, `quest.complete`, `quest.cancel`, `progression.award`;
- quest completion may be `reported` or `verified` but never auto-awards progression; `progression.award` requires an existing **verified** `quest.completed` basis event and a basis can be rewarded only once;
- idempotent writes: exact retry replays the original event; reusing one key for a different request is rejected;
- production persistence requires `DATABASE_URL`; in-memory persistence exists only behind explicit `SYSTEM_ALLOW_EPHEMERAL=1` for tests/development;
- original mobile-first PWA/HUD with STATUS, QUESTS, SKILLS, ACHIEVEMENTS, SHOP and SYSTEM LOG views, all reading the same cloud-core snapshot; bearer is kept only in browser `sessionStorage` in this first slice;
- Docker image and dedicated `.github/workflows/system-cloud-ci.yml`.

Verification on candidate before this owner checkpoint:
- model tests: **PASS (6/6)**;
- cloud Docker/runtime smoke: **PASS**, including core boot with no Android/LifeUp dependency, `/healthz` 200, unauthenticated System API 401, authenticated snapshot 200, PWA shell 200, create 201, exact retry 200, conflicting idempotency-key reuse 409 and invalid reward basis 400;
- Ron OS continuity/architecture CI: **PASS**;
- existing LifeUp static contract + Docker build/runtime regression on the latest cloud-code commit: **PASS**;
- base -> candidate review: additive-only cloud slice at that checkpoint; existing LifeUp bridge and unrelated Ron OS owners were not rewritten.

This is **candidate code**, not a claim that Neon/Northflank production deployment is live. Promotion and live cloud deployment/probes remain separate gates.

## Promoted implementation — legacy LifeUp bridge
Architecture evidence: `architecture/changes/2026-09-09-lifeup-system-v1.json`.
Original candidate branch: `lifeup-system-v1`.
Base main SHA: `0c7ba0046b0cf68c896bdddc4ceef1d25e3476b5`.
Pinned official LifeUp SDK commit: `f057ea4fcd2c6c6f38a51d092c29026f344b7c4b`.

Implemented artifacts:
- `skills/lifeup-system.md` — thin Ron OS router/procedure.
- `system/lifeup/AGENTS.md` — System agent operating contract.
- `system/lifeup/SYSTEM_SPEC.md` — RPG mechanics v1.
- `system/lifeup/northflank/server.mjs` — authenticated stateful Streamable HTTP adapter around the official LifeUp MCP server factory.
- `system/lifeup/northflank/Dockerfile` — reproducible Northflank image using the pinned official SDK commit.
- `system/lifeup/northflank/README.md` — Northflank/Tailscale/runtime setup contract.
- `tests/lifeup_system_guard.py` — routing/authority/security regression guard.
- `.github/workflows/lifeup-system-ci.yml` — static guard + Docker build + runtime health/auth smoke test.

Verified before promotion:
- full Ron OS continuity/architecture regression: **PASS**;
- LifeUp static contract: **PASS**;
- Docker image build against pinned official SDK: **PASS**;
- container startup: **PASS**;
- `/healthz` -> 200 and unauthenticated `/mcp` -> 401: **PASS**.

This verification proved the server image/runtime/auth boundary. Live Northflank -> Android reachability is separately confirmed below.

## Android live setup — 2026-09-10
User screenshots directly confirm:
- LifeUp Cloud has the required overlay/background setup and battery optimization disabled;
- LifeUp data/Content Provider permission is granted;
- LifeUp Cloud serves on default port `13276` when its server process is running;
- direct `/info` probes on Android succeed over localhost and the phone's LAN address, confirming LifeUp Cloud serves beyond loopback;
- Tailscale is installed and the Android device is visible in the Tailnet.

Ron also directly reports that Android later killed/stopped the LifeUp Cloud server in the background. This explains the later connection-refused probe while Tailscale itself was healthy. This remains a reliability issue for optional LifeUp sync, but it is no longer allowed to be a blocker for the cloud-first core.

The exact LAN/Tailscale IP values are mutable live-network state and are deliberately not persisted here as canonical identifiers. Switching Wi-Fi/mobile networks may briefly interrupt the optional LifeUp bridge; total loss of phone internet or a stopped LifeUp Cloud server must not stop cloud-core operation.

## Northflank / Tailscale live findings — 2026-09-10
- Free account project limit prevents creating a second Northflank-managed project; existing `Cronometer` project hosts the separate LifeUp service.
- Ron created the separate **Life Up** Northflank combined service from `Misterrenok/ron-os` / `main` using `system/lifeup/northflank/Dockerfile`, one `nf-compute-10` instance, public HTTP port `8080`, and runtime `LIFEUP_HOST` + `MCP_BEARER_TOKEN` variables.
- Service creation/deployment is **CONFIRMED** from the Northflank UI.
- Public `/healthz` is **CONFIRMED** from Ron's browser screenshot returning `{ "ok": true, "service": "ron-lifeup-mcp" }`.
- Northflank project-level Tailscale settings use the correct `tag:northflank` auth-key tag.
- The first Tailscale OAuth client secret was exposed in a screenshot. Ron directly reports that he rotated/replaced that secret; the replacement must remain hidden.
- Tailscale Machines confirmed a live Linux machine for the Northflank Life Up workload, tagged `tag:northflank`, alongside Ron's Android phone; the Northflank Tailscale sidecar successfully joined the Tailnet and OAuth integration is accepted.
- A phone-level Private DNS/ad-blocker setting initially caused ordinary internet to disappear whenever Tailscale was enabled. Ron directly reports that he fixed that DNS setting.
- A subsequent Northflank shell probe to the Android LifeUp Cloud `/info` endpoint returned **HTTP 200** and LifeUp Cloud JSON while Tailscale and the LifeUp Cloud server were running. This directly confirms **Northflank -> Tailscale -> Android LifeUp Cloud reachability**.
- The prior phone-side `ERR_CONNECTION_REFUSED` self-probe is explained by Ron's direct report that Android had killed the LifeUp Cloud server; it is not evidence of a remaining Tailnet-routing failure.

## Live prerequisites — current state
1. Android LifeUp: **CONFIRMED**.
2. LifeUp Cloud + read permission: **CONFIRMED**.
3. LifeUp Cloud local/LAN serving on port `13276` while running: **CONFIRMED**.
4. Northflank managed project: existing `Cronometer` project hosts the separate LifeUp service.
5. LifeUp Northflank service creation/deployment: **CONFIRMED**.
6. Public Northflank `/healthz`: **CONFIRMED**.
7. Tailscale OAuth integration / Northflank sidecar join: **CONFIRMED**.
8. Northflank Tailscale `authKeyTags`: **CONFIRMED in UI as `tag:northflank`**.
9. Android Private-DNS/ad-blocker conflict that broke internet with Tailscale: **RESOLVED by Ron's direct report**.
10. Northflank -> Android LifeUp Cloud `/info` over Tailnet: **CONFIRMED HTTP 200** from live Northflank shell screenshot.
11. Android keeping LifeUp Cloud server alive unattended: **UNVERIFIED / currently unreliable**, but this is now an optional-sync reliability issue rather than a core-runtime dependency.
12. Cloud-first System Core schema/API/PWA candidate: **IMPLEMENTED + CI PASS / NOT YET PROMOTED OR LIVE-DEPLOYED**.
13. Production Neon database for System Core: **NOT YET LIVE-VERIFIED**.
14. Production Northflank System Core service: **NOT YET LIVE-VERIFIED**.
15. Secrets stay in Northflank/local environment only. Do not paste or show them in chat/screenshots.

## Next execution — cloud-first redesign
1. Complete candidate promotion gate: final read-back, architecture manifest promotion evidence and candidate CI after manifest/owner closeout.
2. Promote the verified cloud-core candidate to `main` only if all required checks remain green.
3. Provision/connect production Neon/PostgreSQL and a separate Northflank System Core service using `system/lifeup/cloud/Dockerfile`; no Tailscale dependency for this core.
4. Verify production `/healthz`, API auth, durable create/restart/read behavior and PWA independently while Android/LifeUp Cloud is unavailable.
5. Establish the actual ChatGPT-facing integration path against the same System API without creating another game-state owner.
6. Preserve the existing LifeUp MCP bridge as optional sync and implement queued reconciliation for phone-offline periods.
7. Only after cloud core is live/stable, read the live LifeUp baseline and define the exact optional sync/stat/skill mapping and XP/coin calibration.

## OPEN
- `OPEN`: cloud-core candidate promotion to `main`.
- `OPEN`: production Neon/PostgreSQL System database + durable live probe.
- `OPEN`: production Northflank System Core deployment independent of Android + restart persistence probe.
- `OPEN`: ChatGPT client integration path against System API.
- `OPEN`: PWA live deployment + device-level UX verification/polish.
- `OPEN`: optional LifeUp sync queue/reconciliation design and implementation.
- `OPEN`: public `/mcp` unauthenticated 401 live probe for the legacy LifeUp bridge.
- `OPEN`: live read-only LifeUp baseline through the remote MCP.
- `OPEN`: initial stat/skill mapping from current Ron OS domains.
- `OPEN`: calibrated XP/coin economy after observing the live app and early usage.

## CLOSED
- App selection prototype: LifeUp selected over Do It Now for automation/API depth.
- MCP selection prototype: official LifeUp MCP selected.
- PC dependency: removed from the working LifeUp bridge via Northflank.
- Legacy LifeUp candidate architecture/CI verification: **PASS**, including real Docker build and runtime health/auth smoke test.
- Android LifeUp/LifeUp Cloud prerequisite setup: **CONFIRMED 2026-09-10** from Ron's screenshots.
- LifeUp Cloud localhost/LAN serving: **CONFIRMED 2026-09-10** from direct `/info` browser probes.
- Separate free Northflank managed-project plan: **REJECTED** after live UI showed the Free managed-project limit; existing `Cronometer` project hosts a separate LifeUp service instead.
- Northflank LifeUp service creation: **CONFIRMED 2026-09-10** from live UI.
- Public Northflank `/healthz`: **CONFIRMED 2026-09-10** from live browser probe.
- Northflank Tailscale sidecar joined Tailnet: **CONFIRMED 2026-09-10** from live Tailscale Machines UI.
- Android internet-loss blocker when enabling Tailscale: **RESOLVED 2026-09-10 by Ron's direct report**; root cause was phone Private DNS configured through an ad blocker.
- Northflank -> Tailscale -> Android LifeUp Cloud reachability: **CONFIRMED 2026-09-10** by live Northflank shell `HTTP 200` `/info` probe.
- Cloud-first redesign direction: **APPROVED 2026-09-10 by Ron**; LifeUp is optional integration rather than required System core.
- Cloud-first core data model/event ledger candidate: **IMPLEMENTED 2026-09-10** on `system-cloud-core-v1`.
- First ChatGPT-facing System HTTP API/action contract candidate: **IMPLEMENTED 2026-09-10** with auth, idempotency and evidence gates.
- First mobile-first System PWA/HUD candidate: **IMPLEMENTED 2026-09-10** against the same snapshot API.
- Cloud-core phone-independent Docker/model verification: **PASS 2026-09-10** on candidate; this is build/runtime evidence, not production deployment evidence.
