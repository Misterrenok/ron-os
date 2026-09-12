# LifeUp System — project owner

Updated: 2026-09-12 Europe/Istanbul
Status: **LIVE / CLOUD-FIRST SYSTEM / CHATGPT CONTROLLER / QUEST V2 ACTIVE / PWA INSTALLABLE / SNAPSHOT REFRESH V1 LIVE / SOFT TARGET V1 LIVE / LIFEUP RETIRED FROM TARGET RUNTIME**

## Purpose
Own the current project decisions, runtime boundaries, current verified fallback checkpoint, OPEN/CLOSED state and continuation path for Ron's real-life RPG System. Historical implementation detail belongs in architecture manifests, closeouts and Git history rather than this current owner.

## Authority and routing
- ChatGPT is the sole intended interactive System controller.
- Neon/PostgreSQL `system_events` is the one mutable owner of **derived RPG state**.
- Ron OS and claim-specific live owners remain authoritative for underlying real-world facts; the System may represent/reward them but never replaces them.
- Northflank PWA is a projection/read surface over the same ledger, not a second mutable owner.
- LifeUp is retired from the target runtime. Its MCP/Tailscale/Android bridge remains legacy/rollback evidence only unless Ron explicitly reopens that architecture.
- Before asserting mutable player state, read live Neon. This file is a verified fallback/checkpoint, not permission to treat old counts as live forever.
- Persistent player mutations go only through `system_apply_action(...)`, remain exact-authorization gated, and require write read-back.

## Runtime architecture
```text
Ron
 |
 v
ChatGPT / System Controller
 |
 +----> Ron OS + claim-specific live owners  (real-world truth)
 |
 +----> Neon/PostgreSQL system_apply_action(...)
              |
              v
       append-only system_events
              |
              v
       rebuildable projections
              |
              +----> Northflank PWA / read surfaces
```

## Current production checkpoint
Fresh live Neon read on 2026-09-12 around 22:24 Europe/Istanbul during the requested visual audit:
- ledger: **16 events / max seq 18**; historical sequence gaps are expected;
- event types: `profile.calibrated` 1, `skill.upserted` 2, `quest.created` 4, `quest.cancelled` 2, `quest.expired` 1, `notification.pushed` 4, `notification.acknowledged` 2;
- `progression.awarded`: **0**;
- therefore calibrated System XP remains **0**, coins remain **0**, and no verified rewarded Quest v2 completion exists yet;
- latest calibrated profile event: Level **1**, Rank `null`, XP-to-next **500**, economy `CALIBRATED`, refs `system-level-xp:v1` + `system-quest-reward:v1`;
- active initialized skills remain `Turkish` Tier **3** and `Marketplace Operations` Tier **3** under `system-skill-competency5:v1`;
- STR/VIT/INT/DISC/CHA remain `null` because no `attribute.set` event exists;
- production shop remains unconfigured because no shop event exists;
- no achievement unlock exists.

### Active player Quest v2
Quest seq **14**:
- id: `qv2-german-nicos-weg-a1-hallo-recovery-20260912`;
- title: `Немецкий: первый урок Nicos Weg A1 — Hallo!`;
- class/rank/reward: `RECOVERY / D / 10 XP / 0 coins`;
- hard deadline: **none**;
- objective 1: complete `Hallo!` lesson and exercises, target `1 lesson`;
- objective 2: without prompts, provide `3` German phrases from the lesson with Russian meanings;
- stable outcome key: `learning:german:nicos-weg:a1:hallo`;
- the fresh quest-specific Neon read returned only its `quest.created` event; no completion/cancel/fail/expire event was present at this checkpoint.

Soft-target declaration seq **15**:
- policy: `system-soft-target:v1`;
- target: **2026-09-12 21:30 Europe/Istanbul** = `2026-09-12T18:30:00Z`;
- this is intentionally **not** a hard deadline;
- missing it must not complete/fail/expire the quest and must not remove the 10 XP reward;
- exact receipt: `history/2026-09-12-xmind-linked-quest-proposal.json`;
- release closeout: `history/2026-09-12-system-soft-target-v1-closeout.md`.

Connected production PWA acceptance evidence seq **16**:
- event: `notification.acknowledged` for notification `soft-target-set-384ea502e1d7a761f9dde43f9bd7519a`;
- source: `ron-system-pwa`; actor: `ron`; occurred at `2026-09-12T13:03:58.767Z`;
- this is a natural user acknowledgement, not a test write; it changed no quest lifecycle, XP, coins, attributes, skills, achievements or shop state.

The previous real player quest `qv2-german-nicos-weg-a1-day1-20260911` is historically **EXPIRED / unrewarded**. Legacy infrastructure `persist-probe` is **CANCELLED / neutralized** and was never a genuine player quest.

## Canonical mechanics and policies
- Calibration/XP: `system-level-xp:v1`; no retroactive XP for pre-System history.
- Quest reward ladder: `system-quest-reward:v1` — E 5/0, D 10/0, C 20/1, B 40/2, A 80/4, S 160/8 XP/coins.
- Quest difficulty: `system-quest-difficulty:v1`; use the executable rubric, fail closed to UNSCORED when evidence is insufficient or scope is gameable.
- Quest v2 lifecycle is live with the one-active-player-quest invariant.
- Routine verified scored completion uses atomic `quest.resolve`: verified final objective progress + `quest.completed` + exact canonical reward in one idempotent PostgreSQL transaction. Reported-only evidence cannot be laundered into progression.
- Timing: `system/lifeup/SOFT_TARGET_SPEC.md`; choose NO TARGET when timing adds no value, SOFT by default when earlier execution helps but a miss does not invalidate the outcome, HARD only for a real external deadline or explicitly accepted time-bounded challenge. The snapshot projects the latest valid soft target onto its active Quest v2, and the PWA keeps it visible as a non-terminal `МЯГКАЯ ЦЕЛЬ` before and after the target time.
- Deadline automation remains authoritative for hard deadlines and can server-expire them without ChatGPT.
- Shop: `system-shop-economy:v1`; only safe System-controlled cosmetics, and configuration/redemption remain separate exact-permission mutations. Verified starter fulfillments exist but production catalog is empty.
- Achievements: `system-achievement-ledger:v1`; eligibility derives only from verified rewarded Quest v2 completions and unlocking is permission-gated.
- Attributes: `system-attribute-evidence:v1` + `system-attribute-ordinal5:v1`; unresolved evidence stays `null` and evaluator never writes by itself.
- Skills: `system-skill-competency5:v1`; numeric skill tiers require verified provenance.
- XMind bridge: `system-xmind-strategy-bridge:v1`; strictly READ_ONLY, optional strategy provenance only, never a second truth store or automatic sync.
- Russian-first installable PWA + signed persistent device session are live. Snapshot polling is single-flight, pauses while the page is hidden/offline or unauthenticated, resumes on visibility/network recovery, and forces a fresh read after PWA writes. Player-facing quest cards hide internal ID/ledger/version/provenance/visibility noise and render `RECOVERY` as `ВОССТАНОВЛЕНИЕ`; skill cards show only name, active state and level. Internal provenance remains in the System ledger/log rather than the player card. Web Push subsystem is implemented. Exact subscription/delivery state is mutable and must be read live before asserting it.

## Autonomous maintenance executor
- Live automation owner confirms task **`Развитие Ron System`** is **ENABLED**, exact hourly, timezone `Europe/Istanbul`.
- Its automation prompt is an executable projection, not a current-state owner; every run must recover this GitHub owner and live owners first.
- The prompt still contains a historical P0 about the CRITICAL-notification acknowledgement/drill-down dead-end. That P0 is **CLOSED / SUPERSEDED**: PWA notification acknowledgement + drill-down v1 was promoted on `61b77b389608c1e1d4f06d63e5b9ea086431be4d` and must not be selected again merely because the automation prompt still mentions it.
- Do not rewrite the automation definition implicitly. If its prompt itself should be cleaned up, that is a separate live automation mutation.

## Deployment and verification boundary
- Soft Target v1 runtime/controller merge: `62e5738f29acfd4e214c787ea16cbe9d75a96927`.
- Post-main CI for that release: system-cloud `34687628015` PASS, continuity `34687627979` PASS, legacy LifeUp rollback `34687627973` PASS.
- Northflank commit status for that release: `system-core` build `playful-winter-3317` SUCCESS.
- PWA player-facing cleanup v1 was promoted through PR #16 as squash commit `bbe099790e106efda12cc81b2dfdea395557e165`.
- Cleanup verification: candidate `system-pwa-ci` `34698231313` PASS, PR `system-pwa-ci` `34698301691` PASS, post-main `system-pwa-ci` `34698314592` PASS; Northflank `system-core` build `complex-cave-1500` SUCCESS.
- Direct public HTTP read-back is **VERIFIED**: the canonical route returned HTTP 200 with `ok: true`, `persistence: postgres`, `model_version: quest-v2`, `interface_locale: ru-RU`; deployed `/app-v2.js` contained the Russian `ВОССТАНОВЛЕНИЕ` label and `ЦЕЛИ` copy and no longer contained the removed quest/skill diagnostic labels.
- Soft Target HUD v1 implementation: `146627800af9c79ca12ce90a1819712fa5adeffe`; candidate CI `34701324127`/`34701324161`/`34701324344` PASS; post-main CI `34701362623`/`34701362593`/`34701362598` PASS; Northflank build `necessary-rail-2733` SUCCESS.
- Production read-back confirmed the three-mode timing legend, soft-target HUD code, Russian `phrase` unit, and healthy Quest v2/PostgreSQL/Russian runtime.
- PWA installability v1: implementation `020c29ac523f41fb955b122777e3944230bd687e`, final 192px icon fix `f674253f1753ccfe0dfe2e370d5ae66b266040cd`, recorded closeout `a154972c16d2a8f34bd0e5576ed8baeba2a817ae`; production root and manifest read-back are now VERIFIED and expose the Russian install action plus 192px/512px manifest icons.
- PWA Snapshot Refresh v1 implementation: `432522da470a35c6306a7e454b5dec203ed6c151`; candidate CI `34704368222`/`34704368205`/`34704368206` PASS; post-main CI `34704412752`/`34704412722`/`34704412749` PASS; Northflank build `fair-twist-2304` SUCCESS.
- Public read-back confirmed `snapshot-refresh.js`, visible/online gating, single-flight coordination, post-write fresh reads, service-worker cache v10 and removal of the overlapping raw interval. `/healthz` remained HTTP 200 with Quest v2, PostgreSQL and `ru-RU`.
- Canonical historical public route: `https://p01--system-core--yh2fvbyd9vfg.code.run`; the old short alias was previously 502 and is not canonical.

## OPEN
1. **Current active quest:** wait for real completion evidence for both Hallo objectives. Do not infer completion from elapsed time or a soft-target miss. When evidence is sufficient, resolve through canonical `quest.resolve`; reward exactly **10 XP / 0 coins once**.
2. **Achievement follow-on:** after the first verified rewarded Quest v2 completion, evaluate `system-achievement-ledger:v1`; any unlock remains a separate exact-permission mutation.
3. **Shop:** verified starter cosmetics remain unconfigured/inactive in production. Do not activate/redeem implicitly; live coins are 0 at this checkpoint.
4. **Attributes:** STR/VIT/INT/DISC/CHA remain null until current upstream evidence makes an individual attribute ELIGIBLE and Ron authorizes the exact `attribute.set` payload.
5. **Skills:** add/change only with evidence-supported current competence; do not initialize weakly evidenced skills for visual completeness.
6. **Disposable Neon test branches:** cleanup is destructive and remains permission-gated.
7. **Automation prompt hygiene:** the hourly executor is live, but its embedded notification-UX P0 is stale. Current GitHub owner supersedes it, so this does not block execution; editing the automation definition remains a separate live mutation.

## Next execution
- If Ron reports the active Hallo quest complete, verify both objectives against the completion/evidence contract and use the atomic resolution path only if the required evidence qualifies.
- Otherwise continue highest-value bounded System engineering under `system/lifeup/EXECUTION_FAST_PATH.md`; safe code-only work may proceed through candidate/CI/promotion, while player/schema/credential/external side effects remain separately authorization-gated.
- Do not create another player Quest v2 while the current one is ACTIVE.
- The hourly maintenance loop must ignore its stale notification-UX P0 because this owner records that slice as CLOSED.

## Continuity / history
### Read-only visual/data audit — 2026-09-12 evening
- Live Neon now contains seq17 soft-target reminder at 20:30:15 Istanbul and seq18 soft-target-missed warning at 21:30:17 Istanbul. Both remain unacknowledged. The Hallo quest remains ACTIVE with no progress/terminal/reward event; 10 XP eligibility is preserved. These events prove server message creation, not device push delivery.
- Direct production browser screenshots inspected at desktop viewport 1363×936. Header, status shell, focus panel and navigation render with a consistent dark/cyan style. Authenticated populated screens and mobile layout remain UNVERIFIED: this separate browser has no saved device session.
- OPEN confirmed visual defect: locked screen indefinitely retains “Подключение к ядру…” / “СИНХРОНИЗАЦИЯ”, while quests show “0 АКТИВНЫХ” and skills are blank. Missing authentication must be distinguished from loading and real empty state.
- OPEN source+live-payload defect: current quest description still embeds outcome_key=learning:german:nicos-weg:a1:hallo; renderQuest prints the whole description, so prior player-card cleanup does not cover this embedded metadata. This was inferred from source plus live payload, not observed in an authenticated screenshot.
- OPEN source-review defect: disconnect handler sets lastData=null but does not clear rendered profile/quest/cards; loadSnapshot failure likewise leaves prior rendered content without a freshness marker. Reproduce authenticated logout/offline paths before claiming full runtime verification.
- UX assessment: secondary labels and timing legend are very small/faint; technical status/calibration wording remains in the main Status view. Prioritize truthful locked/loading/offline states and remaining metadata removal before extra decoration.
- Scope: audit and continuity capture only; no runtime, player, schema, credential or automation mutation. Next: fix the bounded connection-state/metadata slice under EXECUTION_FAST_PATH; complete populated mobile visual audit with an authenticated browser or user screenshots.

### PWA Snapshot Refresh v1 — 2026-09-12
Status: **CLOSED / PROMOTED / CI PASS / PRODUCTION READ-BACK PASS**.

- Root cause: the PWA called `refresh` on a raw 30-second interval without an in-flight guard. Slow responses could overlap and let an older snapshot repaint newer state; hidden, offline and unauthenticated clients also continued unnecessary polling.
- A testable coordinator now coalesces concurrent reads and releases its lock after success or failure. Any PWA write queues one fresh read after a pre-existing poll, so acknowledgement/session feedback cannot settle on the stale pre-write snapshot.
- Automatic polling runs only for an enabled, visible, online client and resumes on visibility/network recovery. An unauthorized response and explicit disconnect stop polling until a new device session succeeds.
- Focused and full local cloud tests passed: **76 PASS / 4 PostgreSQL integration skips / 0 failures**. Candidate and post-main PWA, cloud and continuity lanes passed; Northflank and public static/health read-back passed.
- Fresh Neon read remained **14 events / max seq 16**, with 0 progression awards, 0 shop events and 0 terminal events for the active quest. No player, schema, secret, external resource or automation definition was changed.

### Soft Target HUD v1 — 2026-09-12
Status: **CLOSED / PROMOTED / CI PASS / PRODUCTION READ-BACK PASS**.

- Root cause: `system-soft-target:v1` persisted and automated a target, but the Quest v2 snapshot did not attach that declaration to its quest, so the player HUD misleadingly showed only `БЕЗ СРОКА` and lost the target after its notification was acknowledged.
- The projection now attaches the latest valid soft target only to an ACTIVE Quest v2 and rejects a target later than a hard deadline.
- The HUD distinguishes `БЕЗ СРОКА`, `МЯГКАЯ ЦЕЛЬ` and `ДЕДЛАЙН`; before the soft target it counts down, after it shows `ЦЕЛЬ ПРОШЛА / АКТИВНО` and never implies failure, expiry or reward loss.
- The current objective unit `phrase` renders as `фразы` instead of English implementation text; service-worker cache advanced to v9.
- Focused local checks: **30/30 PASS**. Candidate and post-main System Cloud/PWA/continuity lanes passed. Northflank and public static/health read-back passed.
- Fresh Neon read remained **14 events / max seq 16**, with 0 progression awards, 0 shop events and 0 terminal events for the active quest. No player, schema, secret, external resource or automation definition was changed.

### PWA player-language cleanup — 2026-09-12
Status: **CLOSED / PROMOTED / CI PASS / PRODUCTION READ-BACK PASS**.

- Implementation commit: `bbe099790e106efda12cc81b2dfdea395557e165`; scope was limited to `system/lifeup/cloud/public/app-v2.js` and its PWA contract test.
- `RECOVERY` now renders as `ВОССТАНОВЛЕНИЕ`; player-facing quest and skill cards no longer expose ledger IDs, model versions, claim refs or evidence refs. Diagnostic provenance remains available in the journal/ledger.
- Focused local regression: **20/20 PASS**; candidate, PR and post-main `system-pwa-ci` runs passed; Northflank build `complex-cave-1500` succeeded.
- Public production read-back confirmed the new static bundle and healthy Quest v2/PostgreSQL/Russian runtime.
- This slice changed no database schema, secrets, automation definition, external resource or player state.

This owner was compacted because the former large current surface contained stale current-state labels after production seq14/15 already existed. No displaced content was deleted from Git history.

Owner-compaction v1 was promoted through PR #15. Candidate and post-main continuity plus legacy LifeUp static/Docker regression checks passed. The compaction changed no runtime code, database schema, routing, automation definition or player state.

Exact pre-compaction recovery points:
- base commit: `b0afda51add2feecffc36331a75f91a2855fb06f`;
- old `projects/lifeup-system.md` Git blob: `23ddbca42d2936d016ef371019845d66c41058c6`.

The old owner remains byte-recoverable from that commit/blob, while detailed historical closeouts remain discoverable in `history/` and `architecture/changes/`. Architecture evidence for this compaction: `architecture/changes/2026-09-12-system-owner-compaction-v1.json`.

This file owns current project continuity only. It does not own mutable player state, underlying real-world facts, automation definitions, or historical archive truth.
