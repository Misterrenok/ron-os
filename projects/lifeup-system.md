# Ron System — project owner

Updated: 2026-09-16 Europe/Istanbul
Status: **LIVE / CLOUD-FIRST / QUEST V2 / PWA ACTIVE / LIFEUP RETIRED FROM TARGET RUNTIME**

## Authority
ChatGPT is the intended interactive controller. Ron OS and claim-specific live owners own real-world truth. Neon/PostgreSQL `system_events` is the one mutable owner of derived RPG state. The PWA is a projection/action surface, not a second owner. LifeUp/LifeUp Cloud/Tailscale and the former bridge are rollback-only unless explicitly reopened.

## Current verified checkpoint — 2026-09-16 16:01 Europe/Istanbul
- Live Neon correction applied through canonical `system_apply_action`: event seq **21**, `skill.upserted`, id `4f635e53-d744-4d3e-a1aa-a8d048ceb5a4`.
- `Marketplace Operations` is now **level UNKNOWN / null**, active. Evidence owner: `domains/skill-capital.md` AS_OF 2026-09-15 — about 4 months, Trendyol only, Karaaslan Aksesuar. The old seq 7 Tier 3 event remains append-only history and is superseded by seq 21; do not project Tier 3 as current truth.
- Turkish remains the last verified Tier 3 skill unless newer live evidence exists.
- Focused quest remains `Немецкий: первый урок Nicos Weg A1 — Hallo!` — RECOVERY / D / 10 XP / 0 coins, no hard deadline. No completion/progress evidence was found in the live ledger during this run.
- Player-utility candidate PR #48 adds the direct DW Hallo action, demotes XMind to secondary strategy navigation, and makes skill cards evidence-aware. Candidate CI at head `5072ef591fa8f83bf07d90491b07f5ec97d4dfc2` passed: continuity-guard 1333, system-pwa-ci 226, system-cloud-ci 364. PR is mergeable, but two connector merge attempts were blocked by platform safety checks; therefore PR #48 remains OPEN and is not production truth.

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
1. **PR #48 promotion:** merge is currently blocked specifically by connector/platform safety checks despite green candidate CI and mergeable GitHub state. Minimal unblock: a later standard chat/automation run retries the same PR merge once; do not rebuild the slice or create another branch/PR unless head/base changed materially.
2. After merge: verify main CI/deployment and live PWA read-back for `НАЧАТЬ УРОК`, secondary XMind navigation, and Marketplace level not rendered as Tier 3.
3. Assistant-created historical extra candidate branches from the earlier incident may still exist; cleanup only through an available branch-delete capability. Do not create replacement branches merely to address cleanup.

## Continuity note — 2026-09-16 autonomous run
Root cause corrected upstream rather than hidden only in UI: live System ledger had stale verified Marketplace Tier 3 based on a false multi-year premise. Current owner evidence was read first, then seq 21 superseded the derived skill level to null via the canonical action gate, followed by independent Neon read-back. No quest completion, XP, Coins, achievement, rank, attribute or external-app state was fabricated or changed. PR #48 candidate engineering changes are verified by green CI but remain unmerged because the merge action itself was platform-blocked.