# LifeUp System v1

This folder is the runtime profile for Ron's real-life RPG System using Ron OS + LifeUp.

## Target architecture

```text
Ron OS (truth / rules / current owners)
        |
        v
Codex / System controller
        |
        | HTTPS + bearer
        v
Northflank stateful Streamable HTTP MCP
        |
        | Tailscale
        v
LifeUp Cloud on Android :13276
        |
        v
LifeUp app
(quests / XP / skills / coins / achievements / shop)
```

LifeUp is a **derived game/execution surface**. It must not overwrite stronger real-world owners in Ron OS.

The PC is not an always-on server in the target architecture. Local stdio remains a fallback/debug path only.

## Why Northflank

Ron already has Northflank available. Northflank can run the MCP continuously and officially supports project-level Tailscale access to devices in a Tailnet. The bridge therefore does not need to expose LifeUp Cloud itself to the public internet.

Northflank deployment files:

```text
system/lifeup/northflank/
```

## Why Codex instead of regular ChatGPT Chat right now

As of 2026-09-09, regular ChatGPT Plus does not provide full custom MCP write access. Codex supports Streamable HTTP MCP servers, including bearer-token indirection, so the Northflank endpoint is usable now without designing a throwaway backend.

If ChatGPT later exposes the required custom MCP surface on Ron's plan, the remote backend can be reused rather than rewritten.

## Phone prerequisites

1. Install/open **LifeUp**.
2. Install/open **LifeUp Cloud**.
3. In LifeUp Cloud grant **Read LifeUp Data**.
4. Install/sign into **Tailscale**.
5. Put the phone in the Tailnet Northflank is allowed to access.
6. Keep secrets out of GitHub. A LifeUp API token, if enabled, lives only in runtime/local secret storage.

The preferred `LIFEUP_HOST` is the phone's full Tailscale FQDN plus `:13276`.

## Northflank setup

Follow:

```text
system/lifeup/northflank/README.md
```

V1 constraints:
- exactly one replica;
- public HTTP port 8080;
- `/healthz` for health;
- `/mcp` for MCP;
- `MCP_BEARER_TOKEN` required;
- `LIFEUP_HOST=<phone-tailnet-fqdn>:13276` required;
- Tailscale access enabled for the service.

## Codex registration

After Northflank gives the service an HTTPS hostname:

```powershell
$env:RON_LIFEUP_MCP_TOKEN = '<same secret stored in Northflank>'
codex mcp add lifeup --url 'https://<northflank-host>/mcp' --bearer-token-env-var RON_LIFEUP_MCP_TOKEN
codex mcp list
```

Do not store the actual bearer value in the Codex config.

## First probe — read only

```text
Use LifeUp MCP. Connect to LIFEUP_HOST if needed, then get info and read skills, tasks and coin state. Do not mutate LifeUp. Compare the result only against authoritative Ron OS owners and report the baseline.
```

## First-live success condition

The System is considered connected only after all are verified:

1. Northflank `/healthz` returns 200.
2. Unauthenticated `/mcp` returns 401.
3. Codex initializes an MCP session with the Northflank endpoint.
4. LifeUp MCP reaches LifeUp Cloud over Tailscale.
5. `get_info` returns LifeUp/Cloud version data.
6. task/skill/coin reads return live data (an empty list is valid only if the live app is genuinely empty).
7. No credential was committed to GitHub.

Only after that baseline do we design and authorize the initial LifeUp writes.

## Local fallback

For debugging on a computer that is on the same LAN as the phone, the official MCP can still be used directly:

```powershell
codex mcp add lifeup-local -- npx -y "@lifeup/mcp"
```

This is not the target always-on architecture.

## Primary upstream

Official implementation: `Ayagikei/LifeUp-SDK`, package `@lifeup/mcp`.

Primary upstream tool flow:

```text
discover / connect -> list_tasks / list_data -> complete_task / add_task / reward / call_api
```

The older `derekprovance/lifeup-mcp` is not the primary dependency for this project.
