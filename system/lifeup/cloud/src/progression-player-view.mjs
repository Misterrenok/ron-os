import { progressionHierarchySnapshot } from './progression-hierarchy.mjs';

export const PROGRESSION_PLAYER_VIEW_REF = 'system-progression-player-view:v1';

function eligible(items) {
  return (Array.isArray(items) ? items : []).filter((item) => item?.status === 'ELIGIBLE');
}

function gateState(items, emptyLabel) {
  const candidates = Array.isArray(items) ? items : [];
  const ready = eligible(candidates);
  if (ready.length) return { status: 'READY', count: ready.length, label: `${ready.length} подтверждено` };
  if (candidates.length) return { status: 'NOT_READY', count: 0, label: 'Доказательств пока недостаточно' };
  return { status: 'NO_CANDIDATE', count: 0, label: emptyLabel };
}

export function progressionPlayerView(input = {}) {
  const hierarchy = progressionHierarchySnapshot(input);
  const outcomes = hierarchy.verified_rewarded_quest_v2_outcomes;
  const boss = gateState(hierarchy.boss_candidates, 'Босс пока не подтверждён');
  const arc = gateState(hierarchy.arc_candidates, 'Этап арки пока не подтверждён');

  return {
    policy_ref: PROGRESSION_PLAYER_VIEW_REF,
    hierarchy_policy_ref: hierarchy.policy_ref,
    read_only: true,
    verified_quest_count: outcomes.length,
    visible_growth: outcomes.length
      ? `Подтверждённых результатов Quest v2: ${outcomes.length}`
      : 'Первый подтверждённый результат Quest v2 ещё не получен',
    boss,
    arc,
    rank: {
      status: 'LOCKED',
      label: 'Эволюция ранга откроется только после отдельной подтверждённой политики'
    },
    next_progression_gate: boss.status === 'READY'
      ? 'Подтверждён кандидат Boss Quest'
      : arc.status === 'READY'
        ? 'Подтверждён этап арки'
        : outcomes.length
          ? 'Продолжай накапливать подтверждённые значимые результаты'
          : 'Заверши первый Quest v2 с проверяемым доказательством',
    reward_delta: { xp: 0, coins: 0 },
    action: null
  };
}
