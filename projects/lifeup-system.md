# LifeUp System — project owner

Updated: 2026-09-13 Europe/Istanbul
Status: **LIVE / CLOUD-FIRST SYSTEM / CHATGPT CONTROLLER / QUEST V2 ACTIVE / PWA INSTALLABLE / INSTALL LIFECYCLE V1 LIVE / MOBILE TAB VISIBILITY V1 LIVE / TAB ACCESSIBILITY V1 LIVE / VIEW STATE V1 LIVE / SNAPSHOT REFRESH V1 LIVE / SOFT TARGET V1 LIVE / LIFEUP RETIRED FROM TARGET RUNTIME**

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
Fresh read-only Neon check on 2026-09-13 during install-lifecycle release verification:
- ledger: **18 events / max seq 20**; historical sequence gaps are expected;
- event types: `profile.calibrated` 1, `skill.upserted` 2, `quest.created` 4, `quest.cancelled` 2, `quest.expired` 1, `notification.pushed` 4, `notification.acknowledged` 4;
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
- PWA View State v1 implementation `abf16c5b21126c649e4a4621ce14d976fadb3f93`; candidate CI `34734548078` PASS, post-main CI `34734588465` PASS, Northflank build `amazing-hope-5237` SUCCESS. Production browser QA confirmed that `ЖУРНАЛ` and `СООБЩЕНИЯ` update the URL and remain selected after reload, while `СТАТУС` restores the clean root URL. Public health remained HTTP 200 with Quest v2, PostgreSQL and `ru-RU`.
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
### PWA Mobile Tab Visibility v1 — 2026-09-13
Status: **CLOSED / PROMOTED / CANDIDATE PWA CI PASS / PRODUCTION RESOURCE READ-BACK PASS**.

- Root cause: the seven-tab strip intentionally overflows horizontally on narrow phones, but activating a hidden tab did not adjust the strip scroll position. Deep links, restored views and keyboard navigation could select a section whose tab label remained off-screen; tab controls were also shorter than the established 46px mobile action target.
- The selected tab now remains inside the horizontal viewport without changing vertical page position. Tabs have a 46px minimum touch target and the tablist declares horizontal orientation. Existing URL persistence, keyboard navigation and offline shell behavior remain unchanged.
- Deterministic narrow-strip tests cover already-visible, clipped-right, clipped-left and exact-edge cases. Focused PWA lane: 17 PASS; full local cloud suite: 84 PASS / 4 PostgreSQL integration skips. Candidate system-pwa-ci run `34746827145` PASS on the exact promoted tree.
- Full diff review rejected an earlier candidate containing an unrelated trailing-newline deletion. PR #24 was rebased onto fresh main, reviewed as one six-file commit, and squash-promoted as `eb818f95a386d88c0079b15a6b9199844534aa52`.
- GitHub did not emit a separate Actions run for the squash SHA despite a verification-ref push; this is recorded rather than misreported. Northflank build `mirthful-page-9641` SUCCESS. Public read-back confirmed `aria-orientation=horizontal`, `tabStripScrollLeft`, 46px tabs, service-worker cache v16 and healthy Quest v2/PostgreSQL/Russian runtime.
- Mobile visual acceptance remains UNVERIFIED because the available browser surface did not expose viewport control; the overflow behavior is covered by executable geometry tests and deployed-resource read-back.
- Neon before/after remained 18 events / max seq 20 / 0 awards / 0 shop events. No player state, schema, credentials, notification state, subscriptions or external resources changed.

### PWA Tab Accessibility v1 — 2026-09-13
Status: **CLOSED / PROMOTED / PWA CI PASS / PRODUCTION BROWSER VERIFIED**.

- Root cause: the visible tab strip had no tab semantics or keyboard interaction. Assistive technology could not identify the selected tab/panel relationship, and Arrow/Home/End keys were inert.
- The seven views now expose `tablist` / `tab` / `tabpanel` semantics with `aria-selected`, `aria-controls`, `aria-labelledby`, roving `tabindex` and hidden inactive panels. Arrow keys wrap between tabs; Home/End jump to the first/last view; focus is visible; existing URL-backed view persistence is preserved.
- Full diff review rejected an earlier candidate that accidentally restored misleading zero values for unloaded XP/coins/counts. The promoted six-file diff preserves the safe unknown/loading defaults.
- Implementation/main SHA: `e7a5820ab13295ca669d7662ce3f0e9f2651a3a8`. Focused PWA lane: 17 PASS; full local cloud suite: 84 PASS / 4 PostgreSQL integration skips. Candidate PWA CI `34744307141` PASS; post-main PWA CI `34744334518` PASS; Northflank build `positive-sail-8763` SUCCESS.
- Production browser acceptance verified seven tabs and seven panels, then `СТАТУС --ArrowRight--> ЗАДАНИЯ`, `End --> ЖУРНАЛ`, and `Home --> СТАТУС`; focus, selected state, visible panel and `?view=` URL stayed synchronized. Public resources and `/healthz` were read back from production.
- Neon before/after remained 18 events / max seq 20 / 0 awards / 0 shop events. No player state, schema, credentials, notification state, subscriptions or external resources changed.

### PWA View State v1 — 2026-09-13
Status: **CLOSED / PROMOTED / PWA CI PASS / PRODUCTION BROWSER VERIFIED**.

- Root cause: tab clicks changed only DOM state. The URL stayed stale, so reload reset the user to `СТАТУС`; a notification deep-link could likewise keep reopening `СООБЩЕНИЯ` after the user had moved elsewhere.
- The selected view is now synchronized to `?view=...` without a reload. Existing unrelated query parameters and fragments are preserved; the default Status view removes only its own `view` parameter. Invalid view values fail closed to Status.
- Browser acceptance reproduced the defect before release, then verified `ЖУРНАЛ -> ?view=log -> reload -> ЖУРНАЛ`, `СООБЩЕНИЯ -> ?view=notifications -> reload -> СООБЩЕНИЯ`, and `СТАТУС -> /` in production.
- Implementation/main SHA: `abf16c5b21126c649e4a4621ce14d976fadb3f93`. Focused local PWA lane: 17 PASS; full local cloud suite: 84 PASS / 4 PostgreSQL integration skips. Candidate/post-main PWA CI `34734548078`/`34734588465` PASS; Northflank build `amazing-hope-5237` SUCCESS. Cache v14 includes the new navigation module.
- Public `/healthz`, `/app-v2.js`, `/view-navigation.js` and `/sw-v2.js` were read back. Neon before/after remained 17 events / max seq 19 / 0 awards / 0 shop redemptions. No player state, schema, credentials, notification state, subscriptions or external resources changed.

### Player-facing Status clarity v1 — 2026-09-13
Status: **CLOSED / PROMOTED / PWA CI PASS / PRODUCTION VISUALLY VERIFIED**.
- Implementation commits: `c22fdac673b3855bc001aae40454f9a0756d203e` (Russian status copy) and `3b41bd8f7a694aaca5cb5f674cd0f8fb2d581425` (reliable shell refresh).
- The Status view no longer exposes `ledger`, `quest-v2`, raw claim values, scale refs or evidence refs. A null calibrated rank now says `БЕЗ РАНГА`; profile/core state uses concise Russian player language. Diagnostic provenance remains in the journal and database.
- Production QA caught a stale-client release defect: the server served the new app while the controlled PWA still rendered its cached predecessor. Cache v13 now forces fresh network reads for shell resources while retaining the verified offline fallback. Two subsequent normal reloads rendered the new copy.
- Local focused lane: 30 PASS / 0 failures. Candidate CI `34731992766` and `34732126672`, post-main CI `34732028040` and `34732160666` PASS. Northflank builds `innate-cover-9524` and `alert-crowd-4329` SUCCESS. Public `/app-v2.js`, `/sw-v2.js`, `/healthz` and the connected desktop PWA were read back.
- Desktop visual read-back shows the new rank and status copy without overflow. Mobile acceptance remains UNVERIFIED because this browser surface did not expose viewport control.
- Neon remained 17 events / max seq 19 / 0 awards. No player data, schema, credentials, notification state, subscriptions or external resources changed.

### Offline notification shell recovery v1 — 2026-09-13
Status: **CLOSED / PROMOTED / PWA CI PASS / PRODUCTION RESOURCE READ-BACK PASS**.
- Implementation: `f4aeef1f4a63f9853d816b1a8734e24dcc2026ea`. Offline navigation to `/?view=notifications` previously missed the cached root shell and returned no response; executable regression fails on the preceding worker and passes on this release.
- Worker cache v12 maps root navigations with query parameters to the cached root shell. Only same-origin shell resources are intercepted; APIs, health, unknown paths and external origins bypass the cache. Failed/redirected responses cannot overwrite a working shell; cache-write failure does not discard a successful network response.
- Focused local PWA lane: 29 PASS, 0 failures. Candidate CI `34729548010` and post-main CI `34729582495` PASS. Northflank build `abrupt-robin-4710` SUCCESS; public `/sw-v2.js` returned the exact new worker and `/healthz` returned HTTP 200, Quest v2, PostgreSQL, ru-RU.
- Live connected browser read-only QA traversed all seven tabs and inspected the notifications screen. No notification was acknowledged by this run. Offline routing/error paths were checked in the executable worker harness, not by browser network emulation; mobile viewport/offline device acceptance remains UNVERIFIED.
- Neon before/after: 17 events / max seq 19, 0 awards. No player data, schema, credentials, subscriptions or external resources changed.
- Next: continue bounded OPEN engineering from fresh source/live evidence; real quest progress still requires real evidence.

### Connection-state and description cleanup v1 — 2026-09-12
Status: **CLOSED / PROMOTED / PWA CI PASS / PRODUCTION LOCKED-SCREEN VISUALLY VERIFIED**.
- PR #19; implementation main SHA `6a40e4753123aa975bdea81b721c09f336865361`; candidate `d001bab57ec0ba90bd9695cbb30503d679a52aa8`.
- Loading, locked and network failure now have distinct Russian messages. Unknown counters never imply zero quests/XP/coins. Private rendered content clears on logout or failed reads; late pre-logout snapshots cannot repaint it.
- Failed server logout keeps a retry available and does not falsely claim session revocation. Stored quest descriptions retain provenance while the visible copy filters embedded outcome_key metadata. Service-worker cache v11.
- Local focused suite: 31 passed, 0 failed. Candidate/PR PWA runs 34714247324 and 34714248678 PASS; post-main 34714270487 PASS; Northflank build status SUCCESS.
- Fresh production browser screenshot confirms “ВОЙТИ” / “Войди в Систему”, unknown counters and cleared cards after initial loading resolves. Populated authenticated and mobile screenshots remain UNVERIFIED; logout/offline/race paths were tested in the executable UI-handler harness.
- No player, database schema, secrets, credentials, automation definition or external resource was mutated.

### Read-only visual/data audit — 2026-09-12 evening
- Live Neon now contains seq17 soft-target reminder at 20:30:15 Istanbul and seq18 soft-target-missed warning at 21:30:17 Istanbul. Both remain unacknowledged. The Hallo quest remains ACTIVE with no progress/terminal/reward event; 10 XP eligibility is preserved. These events prove server message creation, not device push delivery.
- Direct production browser screenshots inspected at desktop viewport 1363×936. Header, status shell, focus panel and navigation render with a consistent dark/cyan style. Authenticated populated screens and mobile layout remain UNVERIFIED: this separate browser has no saved device session.
- CLOSED in PR #19 (production browser verified): locked screen previously retained “Подключение к ядру…” / “СИНХРОНИЗАЦИЯ”, while quests show “0 АКТИВНЫХ” and skills are blank. Missing authentication must be distinguished from loading and real empty state.
- CLOSED in PR #19 (filter tested; populated mobile screen remains UNVERIFIED): current quest description embeds outcome_key=learning:german:nicos-weg:a1:hallo; renderQuest prints the whole description, which is now filtered from player-facing description text without changing stored data. This was inferred from source plus live payload, not observed in an authenticated screenshot.
- CLOSED in PR #19 by executable handler tests: logout and failed snapshot reads clear rendered profile/quest/cards; a session-generation guard rejects late snapshot responses after logout. Server logout failures are reported honestly. Authenticated browser logout/offline acceptance remains UNVERIFIED.
- UX assessment: secondary labels and the timing legend remain small/faint. The technical Status/calibration wording and embedded metadata defect are CLOSED; typography remains an optional visual follow-on.
- Audit was read-only. Ron subsequently authorized the bounded connection-state/metadata fix («Ну давай»), released through PR #19. Next: populated mobile visual audit with an authenticated browser or user screenshots; remaining typography/technical status wording is an optional next UI slice.

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

### PWA Install Lifecycle v1 — 2026-09-13
Status: **CLOSED / PROMOTED / PWA CI PASS / PRODUCTION RESOURCE READ-BACK PASS**.

- Root cause: the header always exposed «УСТАНОВИТЬ», but the click handler silently returned whenever Chromium had not supplied \`beforeinstallprompt\`. The existing Russian install-help dialog had no wiring, and an already-installed standalone PWA could still advertise installation.
- The install control now starts hidden until runtime classification. A non-standalone browser exposes it; a captured native prompt is used once, while unsupported browsers and prompt failures open the Russian manual instruction. \`appinstalled\` hides the control and closes stale help. A dismissed prompt leaves an honest manual fallback rather than a dead button.
- Service-worker cache advanced to v17. The regression harness covers the no-prompt fallback and close action; static assertions cover native prompt capture, standalone detection, install completion and failure recovery.
- Local cloud suite: **85 PASS / 4 PostgreSQL integration skips / 0 failures**. Candidate \`system-pwa-ci\` run **34748945232** passed. Implementation PR #27 was promoted as \`cca5a184e37b067546a33dcc0441103481506baf\`; Northflank build \`soft-dinosaurs-954\` succeeded.
- Public \`/healthz\`, root HTML, \`/app-v2.js\` and \`/sw-v2.js\` were read back: PostgreSQL/Quest v2/ru-RU remained healthy, the install control is initially hidden, the fallback/install handlers are present and cache v17 is live. The native browser installation prompt was deliberately not accepted by automation; that device-level path is covered by code and regression tests rather than a real installation.
- Neon before/after remained **18 events / max seq 20 / 0 progression awards / 0 shop redemptions**. No player state, schema, credentials, notification state, subscriptions or external resources changed.

This owner was compacted because the former large current surface contained stale current-state labels after production seq14/15 already existed. No displaced content was deleted from Git history.

Owner-compaction v1 was promoted through PR #15. Candidate and post-main continuity plus legacy LifeUp static/Docker regression checks passed. The compaction changed no runtime code, database schema, routing, automation definition or player state.

Exact pre-compaction recovery points:
- base commit: `b0afda51add2feecffc36331a75f91a2855fb06f`;
- old `projects/lifeup-system.md` Git blob: `23ddbca42d2936d016ef371019845d66c41058c6`.

The old owner remains byte-recoverable from that commit/blob, while detailed historical closeouts remain discoverable in `history/` and `architecture/changes/`. Architecture evidence for this compaction: `architecture/changes/2026-09-12-system-owner-compaction-v1.json`.

This file owns current project continuity only. It does not own mutable player state, underlying real-world facts, automation definitions, or historical archive truth.
