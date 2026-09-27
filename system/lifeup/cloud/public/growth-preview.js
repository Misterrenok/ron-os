const ATTRIBUTE_LABELS = Object.freeze({
  STR: 'СИЛА',
  VIT: 'ВЫНОСЛИВОСТЬ',
  INT: 'ИНТЕЛЛЕКТ',
  DISC: 'ДИСЦИПЛИНА',
  CHA: 'ХАРИЗМА'
});

const SKILL_LABELS = Object.freeze({
  'German Language': 'Немецкий язык',
  Turkish: 'Турецкий язык',
  'Marketplace Operations': 'Работа с маркетплейсами'
});

function secondaryMasteryXp(questXp) {
  const xp = Number(questXp);
  if (!Number.isSafeInteger(xp) || xp <= 0) return 0;
  return Math.floor((xp / 2) / 5) * 5;
}

function skillLabel(skill) {
  const name = String(skill?.name || skill?.skill_id || '').trim();
  return SKILL_LABELS[name] || name;
}

export function growthPreviewForQuest(quest) {
  const growth = quest?.growth;
  if (!growth || quest?.status !== 'ACTIVE') return null;

  const questXp = Number(quest?.reward_xp);
  const hasXp = Number.isSafeInteger(questXp) && questXp > 0;
  const parts = [];

  if (growth.primary_skill) {
    const label = skillLabel(growth.primary_skill);
    if (label) parts.push(hasXp ? `${label} +${questXp} мастерства` : `${label}: практика`);
  }

  for (const skill of Array.isArray(growth.secondary_skills) ? growth.secondary_skills : []) {
    const label = skillLabel(skill);
    const masteryXp = hasXp ? secondaryMasteryXp(questXp) : 0;
    if (label && masteryXp > 0) parts.push(`${label} +${masteryXp} мастерства`);
    else if (label && !hasXp) parts.push(`${label}: практика`);
  }

  for (const attribute of Array.isArray(growth.attributes) ? growth.attributes : []) {
    const label = ATTRIBUTE_LABELS[attribute?.name] || String(attribute?.name || '').trim();
    if (label) parts.push(`${label}: доказательство роста`);
  }

  if (!parts.length) return null;
  return {
    label: 'РОСТ ПРИ ВЫПОЛНЕНИИ',
    text: parts.join(' · ')
  };
}
