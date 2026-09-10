# Ron System Cloud Core v0.1

Cloud-first derived RPG state service. Ron OS and claim-specific live owners remain authoritative for real-world facts and execution.

## Runtime contract

- `DATABASE_URL` — Neon/PostgreSQL connection string. Required in production.
- `SYSTEM_BEARER_TOKEN` — bearer token for `/api/v1/*`. Required everywhere.
- `SYSTEM_ALLOW_EPHEMERAL=1` — explicit test/development-only in-memory ledger. Never use as the production owner.
- `PORT` — defaults to `8080`.

The append-only `system_events` ledger is the single mutable owner of derived System state. Projections are rebuilt from that ledger. Northflank HTTP, the PWA and ChatGPT-through-Neon must never create a parallel game-state store. LifeUp is optional downstream integration and may be offline.

## Shared PostgreSQL action gate

Production mutation semantics live in `migrations/002_action_gate.sql`.

- `system_apply_action(...)` is the normal PostgreSQL write entry point for both Northflank and authorized ChatGPT/Neon operations.
- Northflank preserves the existing SHA-256 request hash when it calls the database gate, so pre-migration HTTP idempotency keys remain replay-compatible.
- A direct Neon caller may omit `p_request_hash`; the database then derives its own canonical hash for that caller path.
- Insert triggers independently enforce the supported event types, quest terminal-state rules, evidence status, verified progression basis and one reward per completion. This keeps the invariants active even if a privileged database caller attempts a raw insert.
- `system_events` rejects `UPDATE` and `DELETE`; the ledger is append-only.
- Quest completion still never awards XP automatically. A `reported` completion cannot be used as progression basis.

The database gate protects **derived game-state semantics** only. It does not turn a System action into authoritative evidence that a real-world action happened. Ron OS and the relevant live owner retain that authority.

## API v1

- `GET /healthz` — public liveness; reports persistence and the active action-gate implementation.
- `GET /api/v1/capabilities` — supported actions and write constraints.
- `GET /api/v1/snapshot` — projection rebuilt from the event ledger.
- `GET /api/v1/events?limit=N` — ordered ledger read.
- `POST /api/v1/actions` — authenticated action endpoint. Requires `Idempotency-Key` and routes through the same PostgreSQL action gate in production.

Optional metadata headers: `X-System-Actor`, `X-System-Source`, `X-System-Source-Ref`.

Supported first-slice actions:
- `quest.create`
- `quest.complete` with `reported` or `verified` evidence
- `quest.cancel`
- `progression.award` only with verified evidence and an existing verified completion basis

Reward/level calibration remains deliberately uninitialized until its separate launch gate is satisfied.

## Local smoke

```bash
SYSTEM_ALLOW_EPHEMERAL=1 SYSTEM_BEARER_TOKEN=test-secret node src/server.mjs
curl http://127.0.0.1:8080/healthz
curl -i http://127.0.0.1:8080/api/v1/snapshot
curl -H 'Authorization: Bearer test-secret' http://127.0.0.1:8080/api/v1/snapshot
```

For PostgreSQL integration tests, set `TEST_DATABASE_URL` to a disposable PostgreSQL database. Never point the test suite at the production System database.

## Northflank target

Deploy this directory as a separate combined service from the same repository using `system/lifeup/cloud/Dockerfile`. It does not require Tailscale. Attach Neon via `DATABASE_URL`; keep bearer/database credentials in runtime secret storage only.

The existing `system/lifeup/northflank/` service remains the optional LifeUp sync bridge and is intentionally untouched by this slice.
