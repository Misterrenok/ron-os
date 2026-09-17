const HALLO_QUEST_ID = 'qv2-german-nicos-weg-a1-hallo-recovery-20260912';
const HALLO_URL = 'https://learngerman.dw.com/en/hallo/l-37250531';

const SEVERITY_LABELS = { INFO: 'ИНФОРМАЦИЯ', SUCCESS: 'УСПЕХ', WARNING: 'ПРЕДУПРЕЖДЕНИЕ', CRITICAL: 'КРИТИЧЕСКОЕ' };
const STATUS_LABELS = { UNREAD: 'НЕ ПРОЧИТАНО', READ: 'ПРОЧИТАНО' };
const SOURCE_LABELS = {
  'system-deadline-engine': 'Система · контроль сроков',
  'system-controller': 'Система · контроллер',
  'system-api': 'Система · API'
};

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function marketplaceEvidenceCurrent(skill) {
  if (skill?.id !== 'marketplace-operations') return true;
  const ref = String(skill.evidence_ref || '').toLowerCase();
  return ref.includes('4 months') || ref.includes('4 месяца') || ref.includes('four months');
}

function marketplaceEvidencePlayerText(skill) {
  if (skill?.id !== 'marketplace-operations') return skill?.evidence_ref || 'Ссылка на доказательство отсутствует — уровень требует проверки.';
  if (!marketplaceEvidenceCurrent(skill)) {
    return 'Старая оценка опиралась на неверное предположение о многолетнем опыте. Актуально: около 4 месяцев работы с маркетплейсами, только Trendyol, текущее место работы — Karaaslan Aksesuar. До критериальной переоценки числовой уровень не показывается как подтверждённый.';
  }
  return 'Около 4 месяцев практического опыта работы с маркетплейсами: только Trendyol, текущее место работы — Karaaslan Aksesuar. Предыдущая оценка Tier 3, основанная на предположении о многолетнем опыте, отменена; текущий числовой уровень остаётся неопределённым до критериальной переоценки.';
}

function skillScalePlayerText(scaleRef) {
  const value = String(scaleRef || '');
  if (!value) return 'Шкала пока не указана.';
  if (value.includes('system-skill-competency5:v1')) return 'Пятиуровневая шкала компетентности System; уровень подтверждается только наблюдаемыми критериями и практическими доказательствами.';
  return value;
}

function actionForQuest(quest) {
  if (quest?.id === HALLO_QUEST_ID) return { href: HALLO_URL, label: 'НАЧАТЬ УРОК' };
  return null;
}

function enhanceQuest(quest) {
  const key = `quest:${quest.id}`;
  const card = [...document.querySelectorAll('[data-detail-key]')].find((item) => item.dataset.detailKey === key);
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
    const detail = card.querySelector('.card-detail');
    const strategy = card.querySelector('.quest-strategy');
    (strategy || detail || card).insertAdjacentElement(strategy ? 'beforebegin' : 'beforeend', link);
  }
  const xmind = card.querySelector('.quest-strategy a');
  if (xmind) {
    xmind.textContent = 'КАРТА СТРАТЕГИИ ↗';
    xmind.classList.add('secondary-action');
    xmind.setAttribute('aria-label', 'Открыть карту стратегии XMind в новой вкладке');
  }
}

function evidenceSection(label, body) {
  return `<section class="skill-evidence-section"><span class="skill-evidence-label">${esc(label)}</span><p>${esc(body)}</p></section>`;
}

function enhanceSkill(skill) {
  const key = skill.id || skill.name;
  const card = document.querySelector(`[data-skill-key="${CSS.escape(key)}"]`);
  if (!card || card.dataset.utilityEnhanced === 'true') return;
  card.dataset.utilityEnhanced = 'true';
  const current = marketplaceEvidenceCurrent(skill);
  const badge = card.querySelector('.badge');
  if (badge) {
    if (!current) badge.textContent = 'УРОВЕНЬ НЕ ПОДТВЕРЖДЁН';
    else if (skill.level == null) badge.textContent = 'УРОВЕНЬ НЕ ОПРЕДЕЛЁН';
  }
  const detail = document.createElement('div');
  detail.className = 'card-detail skill-evidence';
  detail.innerHTML = [
    evidenceSection('ОСНОВАНИЕ', marketplaceEvidencePlayerText(skill)),
    evidenceSection('ШКАЛА', skillScalePlayerText(skill.scale_ref)),
    evidenceSection('СЛЕДУЮЩИЙ УРОВЕНЬ', 'Только после подтверждённых критериев и практических доказательств; стаж сам по себе уровень не повышает.')
  ].join('');
  card.appendChild(detail);
}

function enhanceXp() {
  const track = document.querySelector('.xp-track');
  const bar = document.getElementById('xpBar');
  const next = document.getElementById('xpNext');
  if (!track || !bar || !next) return;
  const percent = Math.max(0, Math.min(100, Number.parseFloat(bar.style.width || '0') || 0));
  track.setAttribute('aria-valuenow', String(Math.round(percent)));
  if (!next.textContent.includes('НЕ ОТКАЛИБРОВАНО') && !next.textContent.includes('%')) {
    next.textContent = `${next.textContent} · ${Math.round(percent)}%`;
  }
}

function notificationCard(notification) {
  return [...document.querySelectorAll('[data-notification-id]')]
    .find((item) => item.dataset.notificationId === notification.id);
}

function enhanceNotification(notification) {
  const card = notificationCard(notification);
  if (!card) return;
  const summary = card.querySelector('.card-summary');
  const badge = summary?.querySelector('.badge');
  if (!summary || !badge) return;
  badge.textContent = SEVERITY_LABELS[notification.severity] || notification.severity || 'СООБЩЕНИЕ';
  let status = summary.querySelector('.status-chip');
  if (!status) {
    status = document.createElement('span');
    status.className = 'status-chip';
    summary.appendChild(status);
  }
  const statusText = STATUS_LABELS[notification.status] || notification.status || 'НЕИЗВЕСТНО';
  if (status.textContent !== statusText) status.textContent = statusText;
  status.dataset.status = String(notification.status || '').toLowerCase();
}

function detailValue(card, label) {
  const rows = [...card.querySelectorAll('.detail-grid > div')];
  const row = rows.find((item) => item.querySelector('dt')?.textContent === label);
  return row?.querySelector('dd') || null;
}

function enhanceLogEvent(item) {
  const key = `event:${item.event_id || item.id}`;
  const card = [...document.querySelectorAll('[data-detail-key]')].find((node) => node.dataset.detailKey === key);
  if (!card) return;
  const badge = card.querySelector('.card-summary .badge');
  if (badge && String(item.claim_status || '').toUpperCase() === 'DERIVED' && badge.textContent !== 'АВТОМАТИЧЕСКИ') {
    badge.textContent = 'АВТОМАТИЧЕСКИ';
  }
  const source = detailValue(card, 'Источник');
  const playerSource = SOURCE_LABELS[item.source];
  if (source && playerSource && source.textContent !== playerSource) source.textContent = playerSource;
}

function enhancePushControl() {
  const button = document.getElementById('pushButton');
  if (!button) return;
  const enabled = button.textContent.trim() === 'ОТКЛЮЧИТЬ';
  button.setAttribute('role', 'switch');
  button.setAttribute('aria-checked', String(enabled));
  button.dataset.state = enabled ? 'on' : 'off';
}

async function enhance() {
  try {
    const response = await fetch('/api/v1/snapshot', { credentials: 'omit', cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const state = data?.state || {};
    (state.quests || []).forEach(enhanceQuest);
    (state.skills || []).forEach(enhanceSkill);
    (state.notifications || []).forEach(enhanceNotification);
    (state.log || []).forEach(enhanceLogEvent);
    enhanceXp();
    enhancePushControl();
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