# LifeUp System — project owner

Updated: 2026-09-09 Europe/Istanbul
Status: **BUILDING / LIVE LIFEUP NOT CONNECTED / NO LIVE MUTATIONS YET**

## Outcome
Build a real-life RPG system inspired by the "System" interface from Solo Leveling: quests, attributes, skills, XP, ranks, achievements, coins/rewards and adaptive progression. The game layer must improve real-world execution rather than reward meaningless XP farming.

## Authority boundary
- Ron OS and claim-specific live owners remain authoritative for real-world facts, decisions and execution.
- LifeUp is a **derived RPG ledger + execution UI**, not a replacement source of truth for health, finance, schedule, nutrition, training, learning, mobility or other domains.
- A LifeUp task being scheduled/present does not prove the real action happened. Completion may become execution evidence only when it is a genuine user completion record and no stronger owner conflicts.
- No LifeUp/Cloud token, credential or private network secret belongs in this repository.

## Locked technical decisions — 2026-09-09
1. Primary app: **LifeUp + LifeUp Cloud** on Android.
2. MCP implementation: **official `Ayagikei/LifeUp-SDK` MCP / `@lifeup/mcp`**, not the older third-party `derekprovance/lifeup-mcp` as the primary path.
3. Current usable OpenAI client on Ron's plan: **Codex local/desktop** with the official stdio MCP. ChatGPT Plus regular Chat does not currently provide full custom MCP write access, so do not build the architecture around that unavailable surface.
4. Windows is the current known desktop host class. Initial setup artifact: `system/lifeup/setup-windows.ps1`.
5. First live pass is **read-only discovery**. No quest/stat/shop mutation until the live LifeUp inventory is read and a bounded initial write set is explicitly authorized.

## Target runtime
`Ron OS -> Codex System profile -> official LifeUp MCP -> LifeUp Cloud -> LifeUp Android`

The Codex System profile lives under `system/lifeup/`. When operating from that project, it must recover Ron OS state through `BOOTSTRAP.md` before consequential personal decisions and use LifeUp only as the RPG surface.

## V1 mechanics
- Core attributes: STR, VIT, INT, DISC, CHA.
- Domain skills sit below/alongside core attributes and are created only from actual active domains after live/current-state recovery; do not fabricate a current skill portfolio.
- Quest classes: DAILY, SIDE, MAIN, EMERGENCY/RECOVERY, HIDDEN/ACHIEVEMENT.
- Difficulty ranks: E, D, C, B, A, S.
- Rewards: XP + coins + relevant skill XP; real-world reward shop items must respect the relevant finance/health constraints.
- Penalties are game-mechanical and conservative. Never use injury risk, sleep deprivation, food restriction, unsafe exercise, humiliating acts, forced spending or other harmful punishments.
- Anti-farming: repeated trivial actions cannot generate unlimited progression; evidence/real-world difficulty and diminishing returns matter.

## Current implementation
Candidate branch: `lifeup-system-v1`
Base main SHA: `0c7ba0046b0cf68c896bdddc4ceef1d25e3476b5`

Prepared/planned candidate artifacts:
- `system/lifeup/README.md` — installation/runtime path.
- `system/lifeup/AGENTS.md` — System agent operating contract.
- `system/lifeup/SYSTEM_SPEC.md` — RPG mechanics v1.
- `system/lifeup/setup-windows.ps1` — Codex MCP registration helper.

## Live prerequisites — user-only
1. Install/open LifeUp and LifeUp Cloud on the Android phone.
2. In LifeUp Cloud grant **Read LifeUp Data**.
3. Keep phone and Windows host on the same LAN for the first connection.
4. Do not send an API token in chat or commit it to GitHub. If a token is enabled, enter it only locally when configuring the MCP.

## Verification sequence after prerequisites
1. Run Windows setup helper or register `lifeup` with Codex manually.
2. Verify Codex sees the MCP (`codex mcp list`).
3. From Codex call `discover`.
4. Read `get_info`, `list_skills`, `list_tasks`, coin/shop/achievement state as needed.
5. Record exact live baseline here without copying credentials.
6. Design the initial quest/stat economy against actual Ron OS current owners.
7. Obtain explicit permission for the exact initial LifeUp mutations, execute them, then read back.

## OPEN
- `BLOCKER / USER-ONLY`: LifeUp + LifeUp Cloud have not yet been confirmed installed/configured, so the live MCP cannot be verified from here.
- `OPEN`: read-only live baseline.
- `OPEN`: initial stat/skill mapping from current Ron OS domains.
- `OPEN`: calibrated XP/coin economy after observing LifeUp's live version and existing state.
- `OPEN`: mobile-remote convenience path; do not depend on it until the host/client combination is verified.

## CLOSED
- App/MCP selection: official LifeUp MCP selected.
- Direct regular-Chat full-MCP assumption: rejected for current Plus plan; Codex local is the current practical OpenAI MCP client.
