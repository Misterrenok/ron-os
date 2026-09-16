# System Achievement Policy v1

Policy ref: `system-achievement-ledger:v1`

## Purpose
Achievements mark independently meaningful System-era milestones without inventing real-world facts, duplicating quest rewards, or turning historical life evidence into retroactive game progress.

## Authority and mutation boundary
- Eligibility is derived only from the append-only System ledger.
- V1 counts only **verified rewarded Quest v2 completions**: a verified `quest.completed` event for a Quest v2 creation that is the basis of exactly one `progression.awarded` event.
- Reported-only completion, unscored/unrewarded completion, expired/failed/cancelled quests, legacy Quest v1/infrastructure probes and pre-System life history do not count.
- Detection produces deterministic eligibility only. When eligibility is established immediately from a verified completion, the controller may apply the exact `achievement.unlock` as non-choice internal follow-through only under Internal System authorization v1. Engineering-only maintenance/evaluation does not unlock achievements.
- Achievements grant no XP or coins by themselves. Progression remains owned by the quest reward flow.

## Starter milestones
| Achievement id | Title | Rank | Eligibility |
|---|---|---|---|
| `system-achievement-first-verified-win-v1` | Первый подтверждённый шаг | E | at least 1 verified rewarded Quest v2 completion |
| `system-achievement-five-verified-wins-v1` | Пять подтверждённых побед | D | at least 5 distinct verified rewarded Quest v2 completions |
| `system-achievement-consistency-20x28-v1` | Доказанная устойчивость | C | at least 20 distinct verified rewarded Quest v2 completions spanning at least 28 days between the earliest and latest counted completion |

Thresholds are cumulative. Historical/backfill eligibility discovered outside the immediate verified-completion follow-through remains user-directed; the controller must not fabricate retroactive unlock events merely because an old threshold is now visible.

## Evidence bundle
The evaluator sorts distinct qualifying progression basis events deterministically and hashes their stable event ids. The candidate evidence reference contains:
- policy ref;
- achievement id;
- qualifying count;
- SHA-256 digest of the counted basis event ids.

This keeps the reference under the database length bound while making it recomputable from the immutable ledger. The evidence source is `system-ledger` and status is `verified`.

## Fail-closed rules
Return no candidate when required ledger linkage is missing or ambiguous. A progression event counts only when its `basis_event_id` resolves to one verified completion, that completion resolves to a Quest v2 creation, and the quest ids match. Duplicate progression for one completion is deduplicated by completion event id and remains invalid upstream under the action gate.

Already unlocked achievement ids are suppressed. Input ordering must not change eligibility, evidence digest, or action payload.
