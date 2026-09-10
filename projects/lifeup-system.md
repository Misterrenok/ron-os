# LifeUp System — project owner

Updated: 2026-09-10 Europe/Istanbul
Status: **BUILDING / NORTHFLANK LIFEUP SERVICE + TAILSCALE SIDECAR CONNECTED / PUBLIC HEALTH CONFIRMED / ANDROID DNS BLOCKER RESOLVED / TAILNET REACHABILITY REPROBE NEXT / NO LIVE LIFEUP MUTATIONS YET**

## Outcome
Build a real-life RPG system inspired by the "System" interface from Solo Leveling: quests, attributes, skills, XP, ranks, achievements, coins/rewards and adaptive progression. The game layer must improve real-world execution rather than reward meaningless XP farming.

## Authority boundary
- Ron OS and claim-specific live owners remain authoritative for real-world facts, decisions and execution.
- LifeUp is a **derived RPG ledger + execution UI**, not a replacement source of truth for health, finance, schedule, nutrition, training, learning, mobility or other domains.
- A LifeUp task being scheduled/present does not prove the real action happened. Completion may become execution evidence only when it is a genuine user completion record and no stronger owner conflicts.
- No LifeUp/Cloud token, MCP bearer token, Tailscale credential or other private secret belongs in this repository.

## Locked technical decisions — 2026-09-09
1. Primary app: **LifeUp + LifeUp Cloud** on Android.
2. MCP implementation: **official `Ayagikei/LifeUp-SDK` MCP / `@lifeup/mcp`**, not the older third-party `derekprovance/lifeup-mcp` as the primary path.
3. Ron directly reports that **Northflank is available**.
4. Preferred always-on architecture: **Northflank stateful Streamable HTTP MCP -> Tailscale -> LifeUp Cloud on Android**. The PC is not an always-on dependency.
5. Northflank v1 uses **one replica** because official LifeUp MCP connection state is sessionful and the bridge currently keeps MCP sessions in process memory.
6. Current usable OpenAI client on Ron's Plus plan: **Codex** can connect to the remote Streamable HTTP MCP. Regular ChatGPT Plus chat does not currently provide full custom MCP write access; do not make the System dependent on that unavailable surface.
7. First live pass is **read-only discovery/baseline**. No quest/stat/shop mutation until the live LifeUp inventory is read and a bounded initial write set is explicitly authorized.

## Target runtime
`Ron OS -> Codex/System controller -> Northflank remote MCP -> Tailscale -> LifeUp Cloud -> LifeUp Android`

Northflank is transport/runtime infrastructure only. It does not become a truth owner.

## V1 mechanics
Canonical mechanics: `system/lifeup/SYSTEM_SPEC.md`.
- Core attributes: STR, VIT, INT, DISC, CHA.
- Domain skills are created only from actual active domains after current-state recovery; do not fabricate a current skill portfolio.
- Quest classes: DAILY, SIDE, MAIN, RECOVERY, HIDDEN/ACHIEVEMENT.
- Difficulty ranks: E, D, C, B, A, S.
- Exact XP/coin values remain uncalibrated until the live LifeUp baseline is read.
- Penalties are conservative game mechanics; harmful punishment is forbidden.
- Anti-farming: repeated trivial actions cannot generate unlimited progression.

## Promoted implementation
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

This verification proves the server image/runtime/auth boundary, not reachability of Ron's phone or a Northflank deployment.

## Android live setup — 2026-09-10
User screenshots directly confirm:
- LifeUp Cloud has the required overlay/background setup and battery optimization disabled;
- LifeUp data/Content Provider permission is granted;
- LifeUp Cloud server is running on its default port `13276` on the current local network;
- direct `/info` probes on Android succeed over localhost and the phone's current LAN address, confirming LifeUp Cloud is serving beyond loopback;
- Tailscale is installed and the Android device is visible in the Tailnet.

The exact LAN/Tailscale IP values are mutable live-network state and are deliberately not persisted here as canonical identifiers. Switching Wi-Fi/mobile networks may briefly interrupt the tunnel but should not be treated as a project-state change; total loss of internet makes the phone unreachable from Northflank until connectivity returns.

## Northflank live UI findings — 2026-09-10
- Free account project limit prevents creating a second Northflank-managed project; existing `Cronometer` project is the selected host for a separate LifeUp service.
- Ron created the separate **Life Up** Northflank combined service from `Misterrenok/ron-os` / `main` using `system/lifeup/northflank/Dockerfile`, one `nf-compute-10` instance, public HTTP port `8080`, and runtime `LIFEUP_HOST` + `MCP_BEARER_TOKEN` variables.
- Service creation/deployment is **CONFIRMED** from the Northflank UI.
- Public `/healthz` is **CONFIRMED** from Ron's browser screenshot returning `{ "ok": true, "service": "ron-lifeup-mcp" }`.
- Northflank project-level Tailscale settings use the correct `tag:northflank` auth-key tag.
- The first Tailscale OAuth client secret was exposed in a screenshot. Ron directly reports that he rotated/replaced that secret; the replacement must remain hidden.
- A later Tailscale Machines screenshot independently confirms a live Linux machine for the Northflank Life Up workload, tagged `tag:northflank`, alongside Ron's Android phone. This confirms the Northflank Tailscale sidecar successfully joined the Tailnet and the OAuth integration is accepted.
- A first Northflank -> Android `/info` probe timed out while the Android Tailscale client was not connected. The phone also timed out when opening its own Tailnet address, while localhost/LAN probes succeeded.
- Root cause of the Android Tailscale connectivity problem: Ron directly reports that a phone-level Private DNS/ad-blocker setting caused internet to disappear whenever Tailscale was enabled. Ron reports that he fixed that DNS setting. End-to-end Tailnet reachability after this fix is still **UNVERIFIED** until the probe is repeated.

## Live prerequisites — current state
1. Android LifeUp: **CONFIRMED**.
2. LifeUp Cloud + read permission + running service: **CONFIRMED**.
3. LifeUp Cloud local/LAN serving on port `13276`: **CONFIRMED** from `/info` probes.
4. Northflank managed project: existing `Cronometer` project hosts the separate LifeUp service.
5. LifeUp Northflank service creation/deployment: **CONFIRMED**.
6. Public Northflank `/healthz`: **CONFIRMED**.
7. Tailscale OAuth integration / Northflank sidecar join: **CONFIRMED** from live Tailscale Machines UI.
8. Northflank Tailscale `authKeyTags`: **CONFIRMED in UI as `tag:northflank`**.
9. Android Private-DNS/ad-blocker conflict that broke internet when Tailscale was enabled: **RESOLVED by Ron's direct report**.
10. Northflank -> Android LifeUp Cloud reachability after the DNS fix: **UNVERIFIED** until reprobed with Android Tailscale connected.
11. Secrets stay in Northflank/local environment only. Do not paste or show them in chat/screenshots.

## First live verification
1. Keep Android Tailscale connected and confirm ordinary internet remains usable after the Private DNS fix.
2. Reprobe the phone's Tailnet address `/info`; require the same LifeUp Cloud JSON seen on localhost/LAN.
3. Reprobe from the Northflank Life Up shell to the configured `LIFEUP_HOST`; require HTTP 200 / LifeUp Cloud JSON.
4. Verify unauthenticated public `/mcp` returns 401.
5. Read `get_info`, skills, tasks and coin/shop/achievement state as needed.
6. Record exact live baseline here without credentials.
7. Reconcile initial quests/stats/rewards against authoritative Ron OS owners.
8. Obtain explicit permission for the exact initial LifeUp mutation batch, execute, then read back.

## OPEN
- `OPEN`: Android Tailnet `/info` reprobe after Private DNS fix.
- `OPEN`: live Northflank -> Tailscale -> LifeUp Cloud reachability reprobe.
- `OPEN`: public `/mcp` unauthenticated 401 probe.
- `OPEN`: live read-only LifeUp baseline.
- `OPEN`: initial stat/skill mapping from current Ron OS domains.
- `OPEN`: calibrated XP/coin economy after observing the live app and early usage.

## CLOSED
- App selection: LifeUp selected over Do It Now for automation/API depth.
- MCP selection: official LifeUp MCP selected.
- Always-on host direction: Northflank selected; local Windows stdio is fallback/debug only, not target architecture.
- Candidate architecture/CI verification: **PASS**, including real Docker build and runtime health/auth smoke test.
- Android LifeUp/LifeUp Cloud prerequisite setup: **CONFIRMED 2026-09-10** from Ron's screenshots.
- LifeUp Cloud localhost/LAN serving: **CONFIRMED 2026-09-10** from direct `/info` browser probes.
- Separate free Northflank managed-project plan: **REJECTED** after live UI showed the Free managed-project limit; existing `Cronometer` project hosts a separate LifeUp service instead.
- Northflank LifeUp service creation: **CONFIRMED 2026-09-10** from live UI.
- Public Northflank `/healthz`: **CONFIRMED 2026-09-10** from live browser probe.
- Northflank Tailscale sidecar joined Tailnet: **CONFIRMED 2026-09-10** from live Tailscale Machines UI.
- Android internet-loss blocker when enabling Tailscale: **RESOLVED 2026-09-10 by Ron's direct report**; root cause was phone Private DNS configured through an ad blocker. End-to-end Tailnet reachability remains a separate open verification.
- Direct regular-Chat full-MCP assumption: rejected for current Plus plan; remote backend remains reusable for Codex now and other MCP clients later.
