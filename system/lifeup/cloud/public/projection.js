export function xpLevelProgress(profile = {}) {
  const level = Number(profile.level);
  const totalXp = Number(profile.xp ?? 0);
  const remaining = Number(profile.xp_to_next);
  if (!Number.isFinite(level) || level < 1 || !Number.isFinite(totalXp) || !Number.isFinite(remaining) || remaining < 0) {
    return { percent: 0, into_level: 0, level_span: null, remaining: Number.isFinite(remaining) ? remaining : null };
  }
  const floor = 250 * level * (level - 1);
  const intoLevel = Math.max(0, totalXp - floor);
  const span = intoLevel + remaining;
  const percent = span > 0 ? Math.max(0, Math.min(100, (intoLevel / span) * 100)) : 0;
  return { percent, into_level: intoLevel, level_span: span, remaining };
}

export function questIsPlayerVisible(quest) {
  return quest?.visibility !== 'HIDDEN' || quest?.revealed === true;
}

export function questDisplayStatus(quest, now = Date.now()) {
  if (quest?.status !== 'ACTIVE' || !quest?.deadline_at) return quest?.status ?? 'UNKNOWN';
  const deadline = new Date(quest.deadline_at).getTime();
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  return Number.isFinite(deadline) && Number.isFinite(nowMs) && nowMs >= deadline ? 'OVERDUE' : 'ACTIVE';
}

export function questTiming(quest, now = Date.now()) {
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  const hardAt = quest?.deadline_at ? new Date(quest.deadline_at).getTime() : NaN;
  if (Number.isFinite(hardAt)) {
    const kind = quest?.timing_mode === 'CHALLENGE' ? 'CHALLENGE' : 'HARD';
    return { kind, at: quest.deadline_at, passed: Number.isFinite(nowMs) && nowMs >= hardAt };
  }
  const recommendedValue = quest?.recommended_window_at ?? quest?.soft_target_at;
  const recommendedAt = recommendedValue ? new Date(recommendedValue).getTime() : NaN;
  if (Number.isFinite(recommendedAt) && (!Number.isFinite(nowMs) || nowMs < recommendedAt)) {
    return { kind: 'RECOMMENDED', at: recommendedValue, passed: false };
  }
  return { kind: 'NONE', at: null, passed: false };
}

export function visibleQuests(quests = [], now = Date.now()) {
  return quests.filter((quest) => {
    if (quest?.quest_version !== 2 || !questIsPlayerVisible(quest)) return false;
    return ['ACTIVE', 'OVERDUE'].includes(questDisplayStatus(quest, now));
  });
}

export function playerQuestCounts(quests = [], now = Date.now()) {
  return visibleQuests(quests, now).reduce((counts, quest) => {
    const status = questDisplayStatus(quest, now);
    if (status === 'ACTIVE') counts.active += 1;
    if (status === 'OVERDUE') counts.overdue += 1;
    return counts;
  }, { active: 0, overdue: 0 });
}

export function questObjectiveProgress(quest) {
  const objectives = Array.isArray(quest?.objectives) ? quest.objectives : [];
  const required = objectives.filter((objective) => objective.required !== false);
  const completed = required.filter((objective) => Number(objective.progress ?? 0) >= Number(objective.target ?? 1)).length;
  return { completed, total: required.length };
}
