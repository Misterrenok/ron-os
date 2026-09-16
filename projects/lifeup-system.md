# Ron System — project owner

Updated: 2026-09-16 Europe/Istanbul
Status: **LIVE / CLOUD-FIRST / QUEST V2 / PWA ACTIVE / LIFEUP RETIRED FROM TARGET RUNTIME**

## Authority
ChatGPT is the intended interactive controller. Ron OS and claim-specific live owners own real-world truth. Neon/PostgreSQL `system_events` is the one mutable owner of derived RPG state. The PWA is a projection/action surface, not a second owner. LifeUp/LifeUp Cloud/Tailscale and the former bridge are rollback-only unless explicitly reopened.

## Current verified checkpoint — 2026-09-16
- Live Neon correction remains the latest verified Marketplace competency correction from this engineering line: event seq **21**, `skill.upserted`, id `4f635e53-d744-4d3e-a1aa-a8d048ceb5a4`.
- `Marketplace Operations` is **level UNKNOWN / null**, active. Evidence owner: `domains/skill-capital.md` AS_OF 2026-09-15 — about 4 months, Trendyol only, Karaaslan Aksesuar. The old seq 7 Tier 3 event remains append-only history and is superseded by seq 21; do not project Tier 3 as current truth.
- Turkish remains the last verified Tier 3 skill unless newer live evidence exists.
- Focused quest remains `Немецкий: первый урок Nicos Weg A1 — Hallo!` — RECOVERY / D / 10 XP / 0 coins, no hard deadline. No completion/progress evidence was established during this engineering closeout.
- PR #48 `Fix player utility: actionable quests and evidence-aware skills` is **MERGED**. Candidate head `5072ef591fa8f83bf07d90491b07f5ec97d4dfc2` had green continuity/PWA/cloud CI and GitHub reported `mergeable=true`, `mergeable_state=clean`; the prior instability was not a code-CI or merge-conflict failure. The previous failed merge attempts were connector/platform safety-gate failures. Retrying the unchanged verified candidate succeeded, producing merge commit `896c06921c6451fafb1d27427d2505341bcec965`.
- Main post-merge CI for PR #48 passed: `system-pwa-ci` #227, `continuity-guard` #1335, `system-cloud-ci` #365. GitHub combined commit status was success and Northflank context `northflank/ronsmiths-team/cronometer/system-core` reported `Commit was built successfully` for build `jubilant-parcel-1248`.
- Direct Northflank deployment/PWA read-back for PR #48 is **not yet independently verified**. Read-only TinyFish navigation to the exact build redirected to Northflank login, and the active TinyFish profile/vault had no usable `northflank.com` session/credentials. Do not upgrade successful build status into a claimed live deployment/PWA PASS without the required runtime probe.
- PR #49 `Reconcile progression read-only runtime contract` is **MERGED** at `e55499fc5bd078e875b0f4d705002b60404f0b9d`. The existing `system-standing-autonomy-v1` candidate lane was fast-forwarded to the exact base instead of creating another disposable branch. Base→head changed exactly `PROGRESSION_HIERARCHY_SPEC.md` and `cloud/test/progression-player-view.test.mjs`.
- Progression Hierarchy v1 now accurately records the already-active read-only runtime: deterministic hierarchy evaluation, `snapshot.progression`, and player-facing Boss/Arc/Rank gates are active; `read_only=true`, rewards stay zero, action stays null, and Challenge/Boss/Arc/Rank writes remain locked. The new regression test binds the spec to those fail-closed semantics.
- PR #49 candidate CI passed (`continuity-guard` #1340, `system-cloud-ci` #367). Post-merge main CI also passed (`continuity-guard` #1341, `system-cloud-ci` #368), including cloud model tests, PostgreSQL action-gate tests and Docker smoke runtime.
- PR #50 `Scope retired LifeUp Docker CI to rollback changes` is **MERGED** at `fd1c3b218d46e51115a5307b0c5eac8ebdab2d54`. Broad current-System/LifeUp retirement static validation remains active, while the expensive retired LifeUp Docker build/smoke is now gated to changes in `system/lifeup/northflank/**` or `.github/workflows/lifeup-system-ci.yml` itself. The rollback implementation was not modified.
- PR #50 Architecture Mode caught and prevented one candidate defect before promotion: the first path normalizer used `lstrip('./')`, which removed the leading dot from `.github/...` and could incorrectly skip Docker verification for a workflow change. That candidate failed its self-test and was not promoted. The fix strips only an exact `./` prefix and adds explicit `.github` / `./.github` regression cases.
- Corrected PR #50 candidate passed `lifeup-system-ci` #387 and `continuity-guard` #1350; because the workflow changed, CI correctly forced and passed the legacy Docker build plus `/healthz` and auth-boundary smoke. Promotion-manifest commit then passed `lifeup-system-ci` #388 and `continuity-guard` #1351 while correctly skipping Docker for a manifest-only change. Post-merge main passed `lifeup-system-ci` #390 and `continuity-guard` #1353; the merge contained the workflow change, so legacy Docker build/smoke correctly ran and passed again.
- PR #50 production efficiency probe is **PASS**. Owner-only main commit `3f54f80e80cdef9605fcaba003a6f204716082cb` passed `lifeup-system-ci` #391: scope self-test and static current-System/LifeUp-retirement contract passed, while both `Build legacy remote LifeUp MCP image` and `Smoke-test legacy container startup and auth boundary` were explicitly `skipped`. `continuity-guard` #1354 also passed. This verifies the intended production routing rather than only the helper unit cases.

## Focused quest contract
`Немецкий: первый урок Nicos Weg A1 — Hallo!` objectives: (1) complete the Hallo lesson/exercises; (2) without prompts provide 3 German phrases from the lesson with Russian meanings. Timing mode is effectively NONE/no hard deadline; legacy soft timing is non-terminal. Do not award progress without execution evidence.

## Mechanics
- Rewards: E 5/0, D 10/0, C 20/1, B 40/2, A 80/4, S 160/8 XP/coins.
- Scoring: `system-quest-difficulty:v1`; weak/unsafe/gameable evidence stays unscored.
- Verified scored completion uses atomic `quest.resolve` once.
- Evidence follow-through: `system-evidence-followthrough:v1`.
- Open/focus: `system-quest-focus:v1`; multiple OPEN quests may coexist, at most one FOCUSED.
- Timing: `system-timing:v2`; NONE by default, RECOMMENDED_WINDOW planning-only, HARD_EXTERNAL only for real deadlines.
- Reward economy: `system-reward-economy:v2`; XP non-spendable; Coins have no fixed fiat rate.
- Achievements: `system-achievement-ledger:v1`; attributes: `system-attribute-evidence:v1`; skills: `system-skill-competency5:v1`.
- XMind strategy bridge remains read-only.

## Runtime
Canonical player shell is `index-v2.html` + `app-v2.js` + `sw-v2.js`. PWA is projection-only. Historical LifeUp code is rollback evidence only.

## OPEN engineering residue
1. **PR #48 runtime closeout only:** once an authenticated Northflank/readable public endpoint is available, perform one deployment/status check and one live PWA read-back for `НАЧАТЬ УРОК`, secondary XMind navigation, and Marketplace level not rendered as Tier 3. Do not rebuild or re-merge PR #48.
2. Assistant-created historical extra candidate branches `system-standing-autonomy-v1a` / `system-standing-autonomy-v1b` still exist. The current GitHub connector exposes no branch-delete action; do not create replacement branches merely to address cleanup. Reuse the clean `system-standing-autonomy-v1` lane when a later candidate is justified.
3. Writable Challenge/Boss/Arc/Rank transitions are **intentionally locked, not unfinished production behavior**. Start such a slice only when its execution value is justified; it must use Architecture Mode plus an explicit persistence/recovery/write contract and must not silently turn read-only eligibility into rewards or mutations.

## Continuity note — 2026-09-16 PR #48 → #50 autonomous closeout
PR #48 merged without candidate code changes after the connector/platform merge gate ceased blocking it, confirming the earlier failure class was external to candidate CI/mergeability. Production main CI and the Northflank build signal are green; direct live deployment/PWA read-back remains blocked only by unavailable Northflank authentication in the accessible browser profile. PR #49 then closed the progression documentation/runtime mismatch without changing ledger/schema/runtime write semantics. PR #50 reduced retired-LifeUp CI overhead without deleting rollback verification: broad static ownership/retirement checks remain, legacy Docker verification is path-scoped and fail-closed for bridge/workflow changes, an adversarial candidate bug was caught before promotion, and production owner-only CI proved the expensive rollback build is now skipped when irrelevant.