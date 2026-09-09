# Northflank deployment — LifeUp remote MCP

This is the preferred always-on path for the LifeUp System.

## Runtime

```text
Codex / future remote MCP client
        |
        | HTTPS + Bearer
        v
Northflank service :8080/mcp
        |
        | Tailscale project integration
        v
Android phone Tailscale IP/FQDN :13276
        |
        v
LifeUp Cloud -> LifeUp
```

The PC does not need to stay online after the Northflank service is deployed.

## Northflank service

Create a deployment/combined service from `Misterrenok/ron-os`, branch `lifeup-system-v1` while this is still a candidate.

Build file:

```text
system/lifeup/northflank/Dockerfile
```

Runtime requirements:
- exactly **1 replica** for v1 because MCP sessions are held in memory;
- public HTTP port `8080`;
- health endpoint `/healthz`;
- MCP endpoint `/mcp`;
- do not scale horizontally until session routing/persistence is added.

### Secrets / variables

Required:

```text
MCP_BEARER_TOKEN=<random high-entropy secret>
LIFEUP_HOST=<phone-tailnet-fqdn>:13276
```

Recommended once the public Northflank hostname is known:

```text
MCP_ALLOWED_HOSTS=<generated-northflank-hostname>
```

Optional, only if LifeUp Cloud itself has an API token enabled:

```text
LIFEUP_TOKEN=<LifeUp Cloud raw token>
```

Never put either token in GitHub.

Generate the MCP bearer token locally, for example:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToHexString($bytes).ToLower()
```

Store that value as a Northflank secret and locally as `RON_LIFEUP_MCP_TOKEN` when configuring Codex.

## Tailscale

Northflank supports a project-level Tailscale integration. Enable it in the Northflank project and allow this service to access the Tailnet.

On Android:
1. Install/sign into Tailscale.
2. Keep the phone in the same Tailnet Northflank is authorized to access.
3. Open LifeUp Cloud and grant **Read LifeUp Data**.
4. Keep LifeUp Cloud available while using the System.

Use the phone's full Tailscale FQDN where possible, for example:

```text
phone-name.<tailnet-id>.ts.net:13276
```

Northflank documents access to Tailnet devices by Tailscale IP or full device FQDN.

## Codex remote registration

After Northflank gives the service its HTTPS hostname:

```powershell
$env:RON_LIFEUP_MCP_TOKEN = '<same bearer token stored in Northflank>'
codex mcp add lifeup --url 'https://<northflank-host>/mcp' --bearer-token-env-var RON_LIFEUP_MCP_TOKEN
codex mcp list
```

Do not put the actual token in the Codex config; Codex reads it from the named environment variable.

## First probe

The first interaction is read-only:

```text
Use LifeUp MCP. Connect to LIFEUP_HOST if needed, then get info and list skills/tasks/coin state. Do not change anything.
```

Expected success:
- Northflank `/healthz` returns HTTP 200;
- unauthenticated `/mcp` returns 401;
- Codex initializes an MCP session;
- LifeUp `connect` succeeds over Tailscale;
- `get_info` and list tools return live LifeUp data.

## Known limits in v1

- One Northflank replica only; sessions are in process memory.
- Phone/LifeUp Cloud must remain reachable.
- Android battery management may suspend LifeUp Cloud or Tailscale; verify only after a real live probe.
- Regular ChatGPT Plus chat cannot currently use full custom MCP write actions. Northflank still gives us a reusable remote backend for Codex now and other MCP clients later.
