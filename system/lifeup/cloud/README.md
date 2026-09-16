# Ron System Cloud Core

Status: **ACTIVE CLOUD RUNTIME / QUEST V2 / POSTGRES EVENT LEDGER / RUSSIAN-FIRST PWA / PUBLIC-URL ACCESS**

Cloud-first derived RPG state service. Ron OS and claim-specific live owners remain authoritative for real-world facts and execution. LifeUp is retired from the target runtime.

## Runtime contract

- `DATABASE_URL` — Neon/PostgreSQL connection string; required in production.
- No bearer token, password, login or device-session secret is required. Possession of the canonical System Core URL is sufficient for PWA/API access.
- `SYSTEM_ALLOW_EPHEMERAL=1` — test/development-only in-memory ledger; never production state.
- `PORT` — defaults to `8080`.
- `DEADLINE_SWEEP_INTERVAL_MS` — scheduler interval; defaults to 30 seconds and is clamped to at least 5 seconds.
- Web Push configuration is optional. Without it, in-app deadline automation remains active while device push reports disabled.

The append-only `system_events` ledger is the single mutable owner of derived System state. Projections rebuild from that ledger. Northflank HTTP, the PWA and controller operations must never create a parallel game-state store.

## Access model

Ron System intentionally uses **public URL access**. There is no authentication/identity boundary inside System Core: a client that knows the canonical URL may read the System API and call mutation endpoints.

This deliberately removes the old `SYSTEM_BEARER_TOKEN` and signed device-session architecture. Git history retains that implementation for rollback evidence only; it is not part of the active runtime.

This access choice does **not** remove integrity rules. Idempotency keys, supported-action validation, PostgreSQL constraints/functions, evidence requirements, quest lifecycle rules and other System policy checks remain authoritative for whether a requested mutation is valid.

## Shared PostgreSQL action gate

Production mutations go through the shared System action function. Database constraints/triggers enforce supported event types, quest lifecycle, evidence status, verified progression basis, one reward per completion, calibration provenance, shop rules and notification transitions. The event ledger is append-only under the normal state model.

The database gate protects derived game-state semantics only. It never upgrades a System claim into authoritative real-world evidence.

## API

URL-accessible with no credentials:
- `GET /healthz` — liveness/runtime capabilities summary.
- `GET /api/v1/capabilities`
- `GET /api/v1/snapshot`
- `GET /api/v1/events?limit=N`
- `POST /api/v1/actions` — idempotent System action endpoint.
- `GET /api/v1/push/public-key`
- `POST /api/v1/push/subscriptions`
- `DELETE /api/v1/push/subscriptions`

Compatibility only:
- `POST /api/v1/session`
- `GET /api/v1/session`
- `DELETE /api/v1/session`

The compatibility session route does not authenticate, mint a cookie or alter access; it exists only so already-cached pre-public PWA code can transition without breaking.

Supported action families include:
- quests: `quest.create`, `quest.progress`, `quest.reveal`, `quest.complete`, `quest.resolve`, `quest.cancel`, `quest.fail`, `quest.expire`;
- progression: `progression.award`;
- profile: `profile.calibrate`, `attribute.set`, `skill.upsert`, `achievement.unlock`;
- shop: `shop.item.upsert`, `shop.redeem`;
- notifications: `notification.push`, `notification.ack`.

## Quest timing automation

The deadline engine performs a startup sweep and periodic sweeps. Hard-deadline quests can receive bounded reminders and become `EXPIRED` when their actual deadline passes. Idempotency prevents duplicate lifecycle/reminder events across restarts or overlapping ticks.

Soft targets are non-terminal orientation; missing them does not forfeit the quest reward. Device push is optional infrastructure and never the owner of quest/notification truth.

## PWA

Canonical player surface:
- root serves `public/index-v2.html`;
- application bundle `public/app-v2.js`;
- service worker `public/sw-v2.js`.

A fresh device opens the canonical URL and loads the live System immediately. There is no password/token-entry step. The remaining hidden session DOM stubs are temporary backward-compatibility hooks for cached pre-public client code and do not contain a credential UI.

The old English v1 static shell (`index.html`, `app.js`, `sw.js`) is retired and removed from the active tree by the 2026-09-13 cleanup; it remains recoverable from Git history. Do not restore it as a parallel UI.

## Local smoke

```bash
SYSTEM_ALLOW_EPHEMERAL=1 node src/server-v2.mjs
curl http://127.0.0.1:8080/healthz
curl http://127.0.0.1:8080/api/v1/snapshot
curl http://127.0.0.1:8080/api/v1/capabilities
```

For PostgreSQL integration tests, use a disposable database through `TEST_DATABASE_URL`; never point tests at the production System database.

## Deployment

Deploy `system/lifeup/cloud/Dockerfile` to the Northflank System Core service and attach production Neon through the runtime environment. `SYSTEM_BEARER_TOKEN` and `SYSTEM_SESSION_TTL_DAYS` are no longer runtime requirements and should not be reintroduced as access dependencies.

`system/lifeup/northflank/` is **retired LifeUp rollback code**, not an optional current sync bridge. It must not participate in normal deployment/readiness unless Ron explicitly reopens that architecture.
