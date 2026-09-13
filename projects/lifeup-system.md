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

Live automation `Развитие Ron System` is enabled every **5 hours** in `Europe/Istanbul`; its live definition owns cadence. The old notification acknowledgement/drill-down item is CLOSED, not a current P0.

## OPEN / next
1. Resolve the active Hallo quest only after both objectives have qualifying evidence; reward 10 XP / 0 coins once.
2. Evaluate achievements after the first verified rewarded Quest v2 completion.
3. Keep shop/attributes/skills evidence-gated rather than filling them for appearance.
4. Cleanup CLOSED 2026-09-13: all five disposable zero-write Neon test branches and temporary GitHub branch `system-cleanup-20260913-v1` were deleted; live read-back shows only Neon `main`, GitHub cleanup branch absent, and production ledger unchanged at 18 events / max seq 20.
5. Otherwise continue the highest-value bounded engineering slice under `system/lifeup/EXECUTION_FAST_PATH.md`; do not create a second active player quest.

## Provenance
This owner was compacted during the 2026-09-13 stale-surface cleanup. Pre-cleanup content remains recoverable at commit `b7de9b73c708fef57f5d96ed7517f1e2d6bac65c`, blob `55a4c2bd24dbaa865a04f3d9d88d0db5b24f8912`; detailed release history remains in Git/history/architecture records.
