# LifeUp System — project owner

Updated: 2026-09-09 Europe/Istanbul
Status: **BUILDING / NORTHFLANK REMOTE PATH IMPLEMENTED AS CANDIDATE / LIVE LIFEUP NOT CONNECTED / NO LIVE MUTATIONS YET**

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
3. Ron directly reports that **Northflank is available**. Exact existing Northflank project/service identifiers and current deployment state remain `UNVERIFIED` until read from Northflank itself.
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

## Candidate implementation
Branch: `lifeup-system-v1`
Base main SHA: `0c7ba0046b0cf68c896bdddc4ceef1d25e3476b5`
Pinned official LifeUp SDK commit: `f057ea4fcd2c6c6f38a51d092c29026f344b7c4b`.

Implemented candidate artifacts:
- `skills/lifeup-system.md` — thin Ron OS router/procedure.
- `system/lifeup/AGENTS.md` — System agent operating contract.
- `system/lifeup/SYSTEM_SPEC.md` — RPG mechanics v1.
- `system/lifeup/northflank/server.mjs` — authenticated stateful Streamable HTTP adapter around the official LifeUp MCP server factory.
- `system/lifeup/northflank/Dockerfile` — reproducible Northflank image using the pinned official SDK commit.
- `system/lifeup/northflank/README.md` — Northflank/Tailscale/runtime setup contract.
- `tests/lifeup_system_guard.py` — routing/authority/security regression guard.
- `.github/workflows/lifeup-system-ci.yml` — static guard + real Docker build in GitHub Actions.
- `architecture/changes/2026-09-09-lifeup-system-v1.json` — candidate architecture manifest.

## Live prerequisites — user-only / external account state
1. Android: install/open **LifeUp**, **LifeUp Cloud**, and **Tailscale**.
2. LifeUp Cloud: grant **Read LifeUp Data**.
3. Tailscale: phone must join the Tailnet that Northflank will be allowed to access.
4. Northflank: exact project/service must be selected/created and the candidate Dockerfile deployed with one replica, public HTTP 8080, Tailscale project access and runtime secrets.
5. Secrets stay in Northflank/local environment only. Do not paste them into Ron OS.

## First live verification
1. Northflank `/healthz` -> 200.
2. `/mcp` without bearer -> 401.
3. Codex connects to the Northflank `/mcp` endpoint using bearer-token env indirection.
4. LifeUp MCP `connect` reaches `LIFEUP_HOST=<phone-tailnet-fqdn>:13276`.
5. Read `get_info`, skills, tasks and coin/shop/achievement state as needed.
6. Record exact live baseline here without credentials.
7. Reconcile initial quests/stats/rewards against authoritative Ron OS owners.
8. Obtain explicit permission for the exact initial LifeUp mutation batch, execute, then read back.

## OPEN
- `BLOCKER / EXTERNAL`: Northflank has no connected tool/plugin in this ChatGPT session, so the service cannot be deployed from here without Northflank UI/API access. Plugin directory search returned no Northflank connector.
- `BLOCKER / USER-ONLY`: LifeUp + LifeUp Cloud + Tailscale installation/configuration on Android is not yet confirmed.
- `OPEN`: GitHub candidate CI / Docker build result.
- `OPEN`: live read-only LifeUp baseline.
- `OPEN`: initial stat/skill mapping from current Ron OS domains.
- `OPEN`: calibrated XP/coin economy after observing the live app and early usage.

## CLOSED
- App selection: LifeUp selected over Do It Now for automation/API depth.
- MCP selection: official LifeUp MCP selected.
- Always-on host direction: Northflank selected; local Windows stdio is fallback/debug only, not target architecture.
- Direct regular-Chat full-MCP assumption: rejected for current Plus plan; remote backend remains reusable for Codex now and other MCP clients later.
