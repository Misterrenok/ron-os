# Ron System cleanup v1 — continuity disposition

Date: 2026-09-13 Europe/Istanbul
Base: `b7de9b73c708fef57f5d96ed7517f1e2d6bac65c`
Candidate: `system-cleanup-20260913-v1`

Purpose: remove stale active-tree surfaces that contradicted the cloud-first System while preserving current state and rollback evidence.

## Dispositions
- Old English `public/index.html` and `public/app.js`: **ARCHIVE_EVIDENCE**. Replaced by `index-v2.html` / `app-v2.js`; removed from active tree and recoverable from Git history.
- Legacy `public/sw.js`: **REPLACE**. Old v1 cache logic is replaced by a compatibility shim that loads `sw-v2.js`, so pre-v2 registrations converge onto current behavior instead of retaining stale caching.
- Stale LifeUp-current assertions in root README, agent instructions, mechanics and cloud runtime docs: **SUPERSEDED** by the current cloud-first architecture. Documents are rewritten in place; no second owner is created.
- Detailed release chronology displaced from `projects/lifeup-system.md`: **ARCHIVE_EVIDENCE**. Current checkpoint/OPEN/next state remains in the owner; detailed history remains in the pre-cleanup blob plus existing Git/history/architecture records.
- Production Neon ledger/schema: **LIVE_OWNER / PRESERVE**. Cleanup is read-only toward production player state.
- Five disposable Neon test branches: **OPEN CLEANUP**. Ron approved deletion; the connector blocked the destructive call. No bypass is attempted and production main is unaffected.

## Checks
- `server-v2.mjs` serves `index-v2.html` at root.
- Current `app-v2.js` registers `/sw-v2.js`.
- `sw-v2.js` caches only current shell assets and has no dependency on the removed v1 HTML/app.
- Focused PWA CI targets current PWA assets/tests, so the legacy cleanup remains inside the existing regression lane.
- LifeUp rollback evidence remains available in Git history and the explicitly retired `system/lifeup/northflank/` tree.
