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
- Main post-merge CI at `896c06921c6451fafb1d27427d2505341bcec965` passed: `system-pwa-ci` #227, `continuity-guard` #1335, `system-cloud-ci` #365.
- GitHub combined commit status for the merge commit is success and Northflank context `northflank/ronsmiths-team/cronometer/system-core` reports `Commit was built successfully` for build `jubilant-parcel-1248`.
- Direct Northflank deployment/PWA read-back is **not yet independently verified** in this run. Read-only TinyFish navigation to the exact build redirected to Northflank login, and the active TinyFish profile/vault had no usable `northflank.com` session/credentials. Do not upgrade successful build status into a claimed live deployment/PWA PASS without the required runtime probe.

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
2. **Progression contract consistency:** current `main` already composes deterministic read-only `progressionPlayerView` into the player snapshot while `PROGRESSION_HIERARCHY_SPEC.md` still says `NOT RUNTIME-ACTIVE`. Reconcile that documentation/runtime boundary before treating a later writable Challenge/Rank slice as ready.
3. Assistant-created historical extra candidate branches from the earlier incident may still exist; cleanup only through an available branch-delete capability. Reuse an existing candidate lane rather than creating disposable residue when Architecture Mode is required.

## Continuity note — 2026-09-16 PR #48 closeout
The PR #48 engineering candidate was not changed to make the merge pass. The same verified head merged successfully once the connector/platform gate allowed the action, confirming that the prior failure class was external to candidate CI/mergeability. Production main CI and Northflank build status are green. Live deployment/PWA read-back remains explicitly blocked by Northflank authentication in the available browser profile, so production UI behavior is not falsely marked verified.