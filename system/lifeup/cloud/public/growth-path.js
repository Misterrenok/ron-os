function activeMappedQuests(quests) {
  return (Array.isArray(quests) ? quests : []).filter((quest) =>
    quest?.status === 'ACTIVE' && quest?.growth && typeof quest.growth === 'object'
  );
}

function selectDeterministicQuest(candidates) {
  const focused = candidates.filter((quest) => quest?.focused === true);
  if (focused.length === 1) return focused[0];
  if (focused.length > 1) return null;
  return candidates.length === 1 ? candidates[0] : null;
}

export function growthQuestForSkill(quests, skillId) {
  const target = String(skillId || '').trim();
  if (!target) return null;
  const candidates = activeMappedQuests(quests).filter((quest) => {
    const growth = quest.growth || {};
    if (growth.primary_skill?.skill_id === target) return true;
    return (Array.isArray(growth.secondary_skills) ? growth.secondary_skills : [])
      .some((skill) => skill?.skill_id === target);
  });
  const quest = selectDeterministicQuest(candidates);
  return quest ? { id: quest.id, title: quest.title, focused: quest.focused === true } : null;
}

export function growthQuestForAttribute(quests, attributeName) {
  const target = String(attributeName || '').trim();
  if (!target) return null;
  const candidates = activeMappedQuests(quests).filter((quest) =>
    (Array.isArray(quest.growth?.attributes) ? quest.growth.attributes : [])
      .some((attribute) => attribute?.name === target)
  );
  const quest = selectDeterministicQuest(candidates);
  return quest ? { id: quest.id, title: quest.title, focused: quest.focused === true } : null;
}
