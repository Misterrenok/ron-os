# LifeUp System v1

This folder is the runtime profile for a real-life RPG system using Ron OS + LifeUp.

## Architecture

```text
Ron OS (truth/rules)
        |
        v
Codex running this project
        |
        v
official @lifeup/mcp (stdio)
        |
        v
LifeUp Cloud on Android (HTTP API)
        |
        v
LifeUp app (quests / XP / skills / coins / achievements / shop)
```

LifeUp is a derived game/execution surface. It must not overwrite stronger real-world owners in Ron OS.

## Why Codex instead of regular ChatGPT Chat right now

As of 2026-09-09, full custom MCP write access in regular ChatGPT is not available on the current Plus plan. Codex is included with ChatGPT plans and supports local stdio MCP servers, so it is the practical OpenAI route for the official LifeUp MCP today.

## Phone setup

1. Install/open **LifeUp**.
2. Install/open **LifeUp Cloud**.
3. In LifeUp Cloud grant **Read LifeUp Data**.
4. Keep the phone and Windows PC on the same LAN for first setup.
5. API token is optional. If you enable one, keep it local; never paste it into this repo.

The official MCP can use `discover` to find one LifeUp Cloud instance automatically on the LAN. If discovery fails, `LIFEUP_HOST=<phone-ip>:13276` can be supplied locally.

## Windows/Codex setup

Prerequisites:
- Node.js / `npx`
- Codex signed in with the same ChatGPT account

From PowerShell:

```powershell
.\system\lifeup\setup-windows.ps1
```

Equivalent manual registration:

```powershell
codex mcp add lifeup -- npx -y "@lifeup/mcp"
codex mcp list
```

Then open Codex from this repository/folder and perform the first probe **read-only**:

```text
Use the LifeUp MCP. Run discover, then read get_info, list_skills, list_tasks and coin state. Do not mutate LifeUp yet. Compare only against the authoritative Ron OS owners and report the baseline.
```

## First-live success condition

The setup is considered connected only after all of these are true:

1. `codex mcp list` shows `lifeup`.
2. `discover` sees LifeUp Cloud.
3. `get_info` returns LifeUp/Cloud version data.
4. `list_tasks` and `list_skills` return live data (an empty list is valid if the app is genuinely empty).
5. No credential is committed to GitHub.

Only after that baseline do we create the initial System attributes, quests, achievements and shop rewards.

## Primary upstream

Official implementation: `Ayagikei/LifeUp-SDK`, package `@lifeup/mcp`.

Primary tool flow documented upstream:

```text
discover -> list_tasks / list_data -> complete_task / add_task / reward / call_api
```

The older `derekprovance/lifeup-mcp` is not the primary dependency for this project.
