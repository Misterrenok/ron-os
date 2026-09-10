# Ron System Cloud Core v0.1

Candidate implementation of the approved cloud-first System. It is a derived RPG state service only; Ron OS and claim-specific live owners remain authoritative for real-world facts and execution.

## Runtime contract

- `DATABASE_URL` — Neon/PostgreSQL connection string. Required in production.
- `SYSTEM_BEARER_TOKEN` — bearer token for `/api/v1/*`. Required everywhere.
- `SYSTEM_ALLOW_EPHEMERAL=1` — explicit test/development-only in-memory ledger. Never use as the production owner.
- `PORT` — defaults to `8080`.

The event ledger is append-only and is the source for rebuildable System projections. The PWA and ChatGPT-facing API use the same service. LifeUp is not called by this core and may be offline.

## API v1

- `GET /healthz` — public liveness; reports whether persistence is PostgreSQL or explicit ephemeral dev mode.
- `GET /api/v1/capabilities` — supported actions and write constraints.
- `GET /api/v1/snapshot` — projection rebuilt from the event ledger.
- `GET /api/v1/events?limit=N` — ordered ledger read.
- `POST /api/v1/actions` — authenticated action endpoint. Requires `Idempotency-Key`.

Optional metadata headers: `X-System-Actor`, `X-System-Source`, `X-System-Source-Ref`.

Supported first-slice actions:
- `quest.create`
- `quest.complete` with `reported` or `verified` evidence
- `quest.cancel`
- `progression.award` only with `verified` evidence and a basis event

Quest completion never awards XP automatically. This prevents a UI completion or unverified report from silently becoming verified real-world execution. Reward/level calibration remains deliberately uninitialized until the project launch gate is satisfied.

## Local smoke

```bash
SYSTEM_ALLOW_EPHEMERAL=1 SYSTEM_BEARER_TOKEN=test-secret node src/server.mjs
curl http://127.0.0.1:8080/healthz
curl -i http://127.0.0.1:8080/api/v1/snapshot
curl -H 'Authorization: Bearer test-secret' http://127.0.0.1:8080/api/v1/snapshot
```

## Northflank target

Deploy this directory as a separate combined service from the same repository using `system/lifeup/cloud/Dockerfile`. It does not require Tailscale. Attach Neon via `DATABASE_URL`; keep bearer/database credentials in Northflank secrets only.

The existing `system/lifeup/northflank/` service remains the optional LifeUp sync bridge and is intentionally untouched by this slice.
