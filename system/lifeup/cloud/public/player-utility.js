const HALLO_QUEST_ID = 'qv2-german-nicos-weg-a1-hallo-recovery-20260912';
const HALLO_URL = 'https://learngerman.dw.com/en/hallo/l-37250531';

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function marketplaceEvidenceCurrent(skill) {
  if (skill?.id !== 'marketplace-operations') return true;
  const ref = String(skill.evidence_ref || '').toLowerCase();
  return ref.includes('4 months') || ref.includes('4 месяца') || ref.includes('four months');
}

function actionForQuest(quest) {
  if (quest?.id === HALLO_QUEST_ID) return { href: HALLO_URL, label: 'НАЧАТЬ УРОК' };
  return null;
}

function enhanceQuest(quest) {
  const card = document.querySelector(`[data-quest-key="${CSS.escape(quest.id)}"]`);
  if (!card) return;
  const action = actionForQuest(quest);
  if (action && !card.querySelector('[data-execution-action]')) {
    const link = document.createElement('a');
    link.dataset.executionAction = 'true';
    link.className = 'primary-action quest-execution-action';
    link.href = action.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = action.label;
    const strategy = card.querySelector('.quest-strategy');
    (strategy || card).insertAdjacentElement(strategy ? 'beforebegin' : 'beforeend', link);
  }
  const xmind = card.querySelector('.quest-strategy a');
  if (xmind) {
    xmind.textContent = 'КАРТА СТРАТЕГИИ';
    xmind.classList.add('secondary-action');
  }
}

function enhanceSkill(skill) {
  const key = skill.id || skill.name;
  const card = document.querySelector(`[data-skill-key="${CSS.escape(key)}"]`);
  if (!card || card.dataset.utilityEnhanced === 'true') return;
  card.dataset.utilityEnhanced = 'true';
  const current = marketplaceEvidenceCurrent(skill);
  const badge = card.querySelector('.badge');
  if (!current && badge) badge.textContent = 'УРОВЕНЬ НЕ ПОДТВЕРЖДЁН';
  const detail = document.createElement('div');
  detail.className = 'card-detail skill-evidence';
  const evidence = current
    ? (skill.evidence_ref || 'Ссылка на доказательство отсутствует — уровень требует проверки.')
    : 'Старая запись уровня опирается на неверное утверждение о многолетнем опыте. Актуальный owner: около 4 месяцев, только Trendyol, текущее место работы. До перекалибровки числовой уровень не показывается как подтверждённый.';
  detail.innerHTML = `<p><b>ОСНОВАНИЕ</b><br>${esc(evidence)}</p><p><b>ШКАЛА</b><br>${esc(skill.scale_ref || 'Не указана')}</p><p><b>СЛЕДУЮЩИЙ УРОВЕНЬ</b><br>Только после подтверждённых критериев и evidence; стаж сам по себе уровень не повышает.</p>`;
  card.appendChild(detail);
}

async function enhance() {
  try {
    const response = await fetch('/api/v1/snapshot', { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const state = data?.state || {};
    (state.quests || []).forEach(enhanceQuest);
    (state.skills || []).forEach(enhanceSkill);
  } catch {}
}

let queued = false;
const observer = new MutationObserver(() => {
  if (queued) return;
  queued = true;
  queueMicrotask(() => { queued = false; void enhance(); });
});
observer.observe(document.documentElement, { childList: true, subtree: true });
void enhance();
