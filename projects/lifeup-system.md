# Ron System — project owner

Updated: 2026-09-13 Europe/Istanbul
Status: **LIVE / CLOUD-FIRST / QUEST V2 / PWA ACTIVE / LIFEUP RETIRED FROM TARGET RUNTIME**

## Authority
ChatGPT is the intended interactive controller. Ron OS and claim-specific live owners own real-world truth. Neon/PostgreSQL `system_events` is the one mutable owner of derived RPG state. The PWA is a projection/action surface, not a second owner. LifeUp/LifeUp Cloud/Tailscale and the former bridge are rollback-only unless explicitly reopened.

## Verified fallback — 2026-09-13
- 18 ledger events / max seq 20; 0 progression awards; 0 shop events.
- Profile: Level 1, Rank null, XP-to-next 500, economy CALIBRATED.
- Skills: Turkish Tier 3; Marketplace Operations Tier 3.
- STR/VIT/INT/DISC/CHA null; no achievement unlock.

Refresh live Neon whenever mutable current state matters.

## Active quest at checkpoint
`Немецкий: первый урок Nicos Weg A1 — Hallo!` — RECOVERY / D / 10 XP / 0 coins, no hard deadline. Objectives: complete the lesson/exercises and provide 3 German phrases with Russian meanings without prompts. The missed 2026-09-12 21:30 soft target is non-terminal and does not remove the reward.

## Mechanics
- Rewards: E 5/0, D 10/0, C 20/1, B 40/2, A 80/4, S 160/8 XP/coins.
- Scoring: `system-quest-difficulty:v1`; weak/unsafe/gameable evidence stays unscored.
- Verified scored completion uses atomic `quest.resolve` once.
- Timing follows `system-soft-target:v1`.
- Shop: `system-shop-economy:v1`; empty at this checkpoint.
- Achievements: `system-achievement-ledger:v1`.
- Attributes: `system-attribute-evidence:v1`; skills: `system-skill-competency5:v1`.
- XMind strategy bridge remains read-only.

## Runtime
Canonical player shell is `index-v2.html` + `app-v2.js` + `sw-v2.js`. The old English `index.html` and `app.js` are retired from the active tree; legacy `sw.js` is only a compatibility shim loading `sw-v2.js`. Historical LifeUp code is rollback evidence only.

Live automation `Развитие Ron System` is configured for every **5 hours** in `Europe/Istanbul` but is currently **disabled**; its live definition owns both enabled state and cadence. The old notification acknowledgement/drill-down item is CLOSED, not a current P0.

**2026-09-13 focus UX slice:** the main quest panel now labels the live projected objective as `СЛЕДУЮЩИЙ ШАГ` and keeps the timing contract explicit: no-deadline quests do not expire, a missed soft target does not close the quest, and a hard deadline expires it. The focused `system-pwa-ci` lane passed on runtime commit `5ed71a19a0d9e7ad57f39ec639d126e10206900d`; Northflank status for that commit was success. Two earlier same-slice commits failed the pre-existing timing-copy contract and were corrected before closeout; the final base-to-runtime diff changes only `index-v2.html`.

## OPEN / next
1. Resolve the active Hallo quest only after both objectives have qualifying evidence; reward 10 XP / 0 coins once.
2. Evaluate achievements after the first verified rewarded Quest v2 completion.
3. Keep shop/attributes/skills evidence-gated rather than filling them for appearance.
4. Cleanup CLOSED 2026-09-13: all five disposable zero-write Neon test branches and temporary GitHub branch `system-cleanup-20260913-v1` were deleted; live read-back shows only Neon `main`, GitHub cleanup branch absent, and production ledger unchanged at 18 events / max seq 20.
5. Otherwise continue the highest-value bounded engineering slice under `system/lifeup/EXECUTION_FAST_PATH.md`; do not create a second active player quest.
6. Internal authorization architecture CLOSED 2026-09-13: `Internal System authorization v1` now treats Ron's unambiguous intent as authorization for that exact bounded internal System ledger/projection mutation without a redundant second payload confirmation. The external live-source write gate in `PROTOCOL.md`, ambiguity fail-closed behavior, evidence/lifecycle/provenance/idempotency requirements, user-directed configuration/redeem/cancel/ack choices, and maintenance != gameplay boundary remain preserved. Deterministic verified `quest.resolve` and deterministic ledger-derived achievement follow-through may execute without another confirmation when their existing policy checks pass. Architecture evidence: `architecture/changes/2026-09-13-system-internal-intent-authorization-v1.json`; promoted architecture SHA `c75a404d1d89bb7628dd41692c15d45918df42a6`; candidate continuity run 983, main continuity run 984, system-cloud-ci run 167 and lifeup-system-ci run 235 passed.
7. Canonical LifeUp wording drift CLOSED 2026-09-13 in the same Architecture Mode slice: `BOOTSTRAP.md` now identifies `projects/lifeup-system.md` as the cloud-first Ron System owner, with ChatGPT as intended controller, Neon as derived RPG-state owner and LifeUp retired/rollback-only.
8. CURRENT mutable-state dedup CLOSED 2026-09-13: stale System ledger/release/build snapshots were removed from `CURRENT.md`; System state now routes to this owner + live Neon, and regression guards protect owner/retirement semantics instead of freezing historical prose. Architecture evidence: `architecture/changes/2026-09-13-current-system-mutable-state-dedup-v1.json`. The reused branch `system-fast-execution-v1` is intentionally retained as verification/provenance for that architecture change and **must not be treated as a clean reusable candidate lane**.

## Provenance
This owner was compacted during the 2026-09-13 stale-surface cleanup. Pre-cleanup content remains recoverable at commit `b7de9b73c708fef57f5d96ed7517f1e2d6bac65c`, blob `55a4c2bd24dbaa865a04f3d9d88d0db5b24f8912`; detailed release history remains in Git/history/architecture records.
