const GERMAN_A0_QUEST_ID = 'qv2-german-a0-bebris-lesson3-20260926';
const GERMAN_A0_URL = 'https://www.youtube.com/watch?v=d_bW8YApWac';

const SEVERITY_LABELS = { INFO: 'ИНФОРМАЦИЯ', SUCCESS: 'УСПЕХ', WARNING: 'ПРЕДУПРЕЖДЕНИЕ', CRITICAL: 'КРИТИЧЕСКОЕ' };
const STATUS_LABELS = { UNREAD: 'НЕ ПРОЧИТАНО', READ: 'ПРОЧИТАНО' };
let deepLinkRetryTimer = null;
let deepLinkRetryCount = 0;
const DEEP_LINK_MAX_RETRIES = 20;

const SOURCE_LABELS = {
  'system-deadline-engine': 'Система',
  'system-controller': 'Система',
  'system-api': 'Система',
  'system-growth-engine': 'Система роста'
};

function esc(value) {
  return String(value ?? '').replace(/[&<>'\"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' }[char]));
}

function marketplaceEvidenceCurrent(skill) {
  if (skill?.id !== 'marketplace-operations') return true;
  const ref = String(skill.evidence_ref || '').toLowerCase();
  return ref.includes('4 months') || ref.includes('4 месяца') || ref.includes('four months');
}

function isTurkishSkill(skill) {
  return String(skill?.id || '').toLowerCase() === 'turkish' || String(skill?.name || '').toLowerCase() === 'turkish';
}

function skillEvidencePlayerText(skill) {
  if (skill?.id === 'marketplace-operations') {
    if (!marketplaceEvidenceCurrent(skill)) {
      return 'Старая оценка была завышена из-за неверного предположения о большом опыте. Актуально: около 4 месяцев работы с Trendyol в Karaaslan Aksesuar. Уровень пока не определён.';
    }
    return 'Около 4 месяцев практической работы с Trendyol в Karaaslan Aksesuar. Предыдущая завышенная оценка отменена; текущий уровень пока не определён.';
  }
  if (isTurkishSkill(skill)) {
    return 'Турецкий язык — уровень C1, подтверждён экзаменом Türkçe Yeterlilik Sınavı в июне 2026 года.';
  }
  if (skill?.mastery_policy_ref === 'system-skill-mastery:v1') {
    if (skill.level == null) return 'Система уже отслеживает подтверждённую практику этого навыка, но реальный компетентностный тир пока не доказан.';
    return 'Компетентностный тир повышается только по подтверждённым результатам; мастерство показывает объём верифицированной практики и не заменяет реальную компетентность.';
  }
  return 'Уровень основан на подтверждённых практических данных.';
}

function skillScalePlayerText(skill) {
  const value = String(skill?.scale_ref || '');
  if (skill?.mastery_policy_ref === 'system-skill-mastery:v1') {
    return value
      ? 'Тир 1–5 — доказанная компетентность. Мастерство — отдельная игровая шкала практики; оно не является CEFR, профессией или сертификатом.'
      : 'Мастерство уже считается как игровая шкала практики. Компетентностный тир остаётся неизвестным до достаточных доказательств.';
  }
  if (!value) return 'Шкала пока не указана.';
  return 'Уровень подтверждается реальными навыками и практическими результатами.';
}

function skillNextLevelPlayerText(skill) {
  if (skill?.status === 'EVOLUTION_READY' && skill?.highest_eligible_level != null) {
    return `Доказательств уже достаточно для тира ${skill.highest_eligible_level}; Система применяет повышение автоматически.`;
  }
  if (skill?.mastery_policy_ref === 'system-skill-mastery:v1') {
    return `Мастерство: ур. ${skill.mastery_level || 1}, до следующего уровня ${skill.mastery_xp_to_next ?? '--'} XP. Компетентность повысится только после выполнения evidence-порогов.`;
  }
  if (skill?.id === 'marketplace-operations') return 'Следующий уровень появится после подтверждения нужных навыков на практике.';
  if (isTurkishSkill(skill)) return 'Следующий уровень — после новых подтверждённых результатов и практики.';
  return 'Следующий уровень — после новых подтверждённых результатов.';
}

function actionForQuest(quest) {
  if (quest?.id === GERMAN_A0_QUEST_ID) return { href: GERMAN_A0_URL, label: 'НАЧАТЬ УРОК БЕБРИСА' };
  return null;
}

function enhanceQuest(quest) {
  const key = `quest:${quest.id}`;
  const card = [...document.querySelectorAll('[data-detail-key]')].find((item) => item.dataset.detailKey === key);
  if (!card) return;
  const action = actionForQuest(quest);
  if (action && !card.querySelector('[data-execution-action]')) {
    const link = executionLink(action);
    const detail = card.querySelector('.card-detail');
    const strategy = card.querySelector('.quest-strategy');
    (strategy || detail || card).insertAdjacentElement(strategy ? 'beforebegin' : 'beforeend', link);
  }
  const xmind = card.querySelector('.quest-strategy a');
  if (xmind) {
    if (xmind.textContent !== 'КАРТА СТРАТЕГИИ ↗') xmind.textContent = 'КАРТА СТРАТЕГИИ ↗';
    xmind.classList.add('secondary-action');
    if (xmind.getAttribute('aria-label') !== 'Открыть карту стратегии XMind в новой вкладке') {
      xmind.setAttribute('aria-label', 'Открыть карту стратегии XMind в новой вкладке');
    }
  }
}


function executionLink(action) {
  const link = document.createElement('a');
  link.dataset.executionAction = 'true';
  link.className = 'primary-action quest-execution-action';
  link.href = action.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = action.label;
  return link;
}

function enhanceFocusAction(state) {
  const host = document.getElementById('focusActions');
  if (!host) return;
  const quests = Array.isArray(state?.quests) ? state.quests : [];
  const focused = quests.find((quest) => quest?.focused && quest?.status === 'ACTIVE');
  const action = actionForQuest(focused);
  const current = host.querySelector('[data-execution-action]');
  if (!action) {
    if (current) current.remove();
    host.hidden = true;
    return;
  }
  if (!current || current.getAttribute('href') !== action.href || current.textContent !== action.label) {
    host.replaceChildren(executionLink(action));
  }
  host.hidden = false;
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
    else if (skill.level == null) badge.textContent = 'КОМПЕТЕНТНОСТЬ НЕ ПОДТВЕРЖДЕНА';
  }
  const detail = document.createElement('div');
  detail.className = 'card-detail skill-evidence';
  detail.innerHTML = [
    evidenceSection('ОСНОВАНИЕ', skillEvidencePlayerText(skill)),
    evidenceSection('ШКАЛА', skillScalePlayerText(skill)),
    evidenceSection('МАСТЕРСТВО', `Ур. ${skill.mastery_level || 1} · всего ${skill.mastery_xp || 0} XP мастерства · до следующего ${skill.mastery_xp_to_next ?? '--'} XP.`),
    evidenceSection('СЛЕДУЮЩИЙ УРОВЕНЬ', skillNextLevelPlayerText(skill))
  ].join('');
  card.appendChild(detail);
}

function enhanceXp() {
  const track = document.querySelector('.xp-track');
  const bar = document.getElementById('xpBar');
  const next = document.getElementById('xpNext');
  if (!track || !bar || !next) return;
  const percent = Math.max(0, Math.min(100, Number.parseFloat(bar.style.width || '0') || 0));
  const rounded = String(Math.round(percent));
  if (track.getAttribute('aria-valuenow') !== rounded) track.setAttribute('aria-valuenow', rounded);
  if (!next.textContent.includes('НЕ ОТКАЛИБРОВАНО') && !next.textContent.includes('%')) {
    next.textContent = `${next.textContent} · ${rounded}%`;
  }
}

function notificationCard(notification) {
  return [...document.querySelectorAll('[data-notification-id]')]
    .find((item) => item.dataset.notificationId === notification.id);
}


function isCelebrationNotification(notification) {
  return ['REWARD', 'ACHIEVEMENT'].includes(String(notification?.kind || '').toUpperCase())
    || String(notification?.severity || '').toUpperCase() === 'SUCCESS';
}

function levelUpTransition(notification) {
  const copy = `${notification?.title || ''} ${notification?.body || ''}`;
  const transition = copy.match(/Уровень\s+(\d+)\s*→\s*(\d+)/iu);
  const titled = copy.match(/Уровень\s+повышен\s*:\s*(\d+)/iu);
  if (transition) return { before: Number(transition[1]), after: Number(transition[2]) };
  if (titled) return { before: null, after: Number(titled[1]) };
  return null;
}

function celebrationLabel(notification) {
  const kind = String(notification?.kind || '').toUpperCase();
  const title = String(notification?.title || '');
  if (levelUpTransition(notification)) return 'ПОВЫШЕНИЕ УРОВНЯ';
  if (/^Навык повышен:/iu.test(title)) return 'ЭВОЛЮЦИЯ НАВЫКА';
  if (/^Характеристика повышена:/iu.test(title)) return 'ХАРАКТЕРИСТИКА ПОВЫШЕНА';
  if (/^Эволюция персонажа/iu.test(title)) return 'ЭВОЛЮЦИЯ ПЕРСОНАЖА';
  if (kind === 'ACHIEVEMENT') return 'ДОСТИЖЕНИЕ ОТКРЫТО';
  if (kind === 'REWARD') return 'НАГРАДА ПОЛУЧЕНА';
  return 'СИСТЕМА · УСПЕХ';
}

function celebrationStats(notification) {
  const copy = `${notification?.title || ''} ${notification?.body || ''}`;
  const stats = [];
  const transition = levelUpTransition(notification);
  const level = copy.match(/(?:УРОВЕНЬ|LEVEL|УР\.?)[^0-9]{0,18}(\d+)/iu);
  const xp = copy.match(/([+-]?\d+)\s*(?:XP|ОПЫТА|ОПЫТ)/iu);
  const coins = copy.match(/([+-]?\d+)\s*(?:МОНЕТА|МОНЕТЫ|МОНЕТ|COIN|COINS)/iu);
  const next = copy.match(/До уровня\s+(\d+)\s*:\s*(\d+)\s*XP/iu);
  if (transition?.before != null) stats.push({ label: 'БЫЛО', value: `УР. ${transition.before}` });
  if (transition?.after != null) stats.push({ label: 'СТАЛО', value: `УР. ${transition.after}` });
  if (!transition && level) stats.push({ label: 'УРОВЕНЬ', value: level[1] });
  if (xp) stats.push({ label: 'ОПЫТ', value: `${Number(xp[1]) > 0 ? '+' : ''}${xp[1]} XP` });
  if (coins) stats.push({ label: 'МОНЕТЫ', value: `${Number(coins[1]) > 0 ? '+' : ''}${coins[1]}` });
  if (next) stats.push({ label: `ДО УР. ${next[1]}`, value: `${next[2]} XP` });
  return stats;
}

function closeCelebration() {
  const dialog = document.getElementById('celebrationDialog');
  if (dialog?.open) dialog.close();
}

function showCelebration(notification) {
  if (!isCelebrationNotification(notification)) return false;
  const dialog = document.getElementById('celebrationDialog');
  const eyebrow = document.getElementById('celebrationEyebrow');
  const mark = dialog?.querySelector('.celebration-mark');
  const title = document.getElementById('celebrationTitle');
  const body = document.getElementById('celebrationBody');
  const stats = document.getElementById('celebrationStats');
  if (!dialog || !eyebrow || !title || !body || !stats) return false;
  const transition = levelUpTransition(notification);
  dialog.classList.toggle('level-up', Boolean(transition));
  if (mark) mark.textContent = transition?.after != null ? String(transition.after) : '✦';
  eyebrow.textContent = celebrationLabel(notification);
  title.textContent = notification.title || 'Результат подтверждён';
  const rawBody = notification.body || 'Прогресс подтверждён Системой.';
  const scanMarker = ' · Скан роста: ';
  const scanIndex = rawBody.indexOf(scanMarker);
  body.textContent = scanIndex >= 0 ? rawBody.slice(0, scanIndex) : rawBody;
  let growth = dialog.querySelector('.celebration-growth');
  if (!growth) {
    growth = document.createElement('div');
    growth.className = 'celebration-growth';
    body.insertAdjacentElement('afterend', growth);
  }
  if (scanIndex >= 0) {
    growth.textContent = `СКАН РОСТА · ${rawBody.slice(scanIndex + scanMarker.length)}`;
    growth.hidden = false;
  } else {
    growth.textContent = '';
    growth.hidden = true;
  }
  const items = celebrationStats(notification);
  stats.replaceChildren(...items.map((item) => {
    const node = document.createElement('div');
    node.className = 'celebration-stat';
    const label = document.createElement('span');
    label.textContent = item.label;
    const value = document.createElement('strong');
    value.textContent = item.value;
    node.append(label, value);
    return node;
  }));
  stats.hidden = items.length === 0;
  if (!dialog.open) dialog.showModal();
  return true;
}

function setupCelebrationControls() {
  const dialog = document.getElementById('celebrationDialog');
  const close = document.getElementById('closeCelebrationButton');
  const continueButton = document.getElementById('continueCelebrationButton');
  if (!dialog || dialog.dataset.bound === 'true') return;
  dialog.dataset.bound = 'true';
  close?.addEventListener('click', closeCelebration);
  continueButton?.addEventListener('click', closeCelebration);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeCelebration();
  });
}

function maybeOpenDeepLinkedNotification(notifications) {
  const params = new URLSearchParams(window.location.search);
  const notificationId = params.get('notification');
  if (!notificationId) return;
  const notification = (notifications || []).find((item) => item.id === notificationId);
  if (!notification) return;
  const card = notificationCard(notification);
  if (!card) {
    if (deepLinkRetryCount < DEEP_LINK_MAX_RETRIES && deepLinkRetryTimer == null) {
      deepLinkRetryCount += 1;
      deepLinkRetryTimer = setTimeout(() => {
        deepLinkRetryTimer = null;
        void enhance();
      }, 75);
    }
    return;
  }
  deepLinkRetryCount = 0;
  if (deepLinkRetryTimer != null) {
    clearTimeout(deepLinkRetryTimer);
    deepLinkRetryTimer = null;
  }
  card.open = true;
  if (params.get('celebrate') !== '1' || !showCelebration(notification)) return;
  params.delete('celebrate');
  const query = params.toString();
  history.replaceState(history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
}

function removeDetailRows(card, labels) {
  const rows = [...card.querySelectorAll('.detail-grid > div')];
  rows.forEach((row) => {
    const label = row.querySelector('dt')?.textContent || '';
    if (labels.includes(label)) row.remove();
  });
  card.querySelectorAll('.detail-grid').forEach((grid) => {
    if (!grid.querySelector('div')) grid.remove();
  });
}

function enhanceNotification(notification) {
  const card = notificationCard(notification);
  if (!card) return;
  const summary = card.querySelector('.card-summary');
  const badge = summary?.querySelector('.badge');
  if (!summary || !badge) return;

  let group = summary.querySelector('.badge-group');
  if (!group) {
    group = document.createElement('span');
    group.className = 'badge-group';
    badge.replaceWith(group);
    group.appendChild(badge);
  }

  const severityText = SEVERITY_LABELS[notification.severity] || notification.severity || 'СООБЩЕНИЕ';
  if (badge.textContent !== severityText) badge.textContent = severityText;

  let status = group.querySelector('.status-chip');
  if (!status) {
    status = document.createElement('span');
    status.className = 'status-chip';
    group.appendChild(status);
  }
  const statusText = STATUS_LABELS[notification.status] || notification.status || 'НЕИЗВЕСТНО';
  if (status.textContent !== statusText) status.textContent = statusText;
  const statusKey = String(notification.status || '').toLowerCase();
  if (status.dataset.status !== statusKey) status.dataset.status = statusKey;
  removeDetailRows(card, ['Тип', 'ID сообщения']);
  if (isCelebrationNotification(notification) && summary.dataset.celebrationBound !== 'true') {
    summary.dataset.celebrationBound = 'true';
    summary.addEventListener('click', () => { showCelebration(notification); });
  }
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
  if (source) {
    const playerSource = SOURCE_LABELS[item.source] || (String(item.claim_status || '').toUpperCase() === 'DERIVED' ? 'Система' : 'Подтверждённые данные');
    if (source.textContent !== playerSource) source.textContent = playerSource;
  }
  removeDetailRows(card, ['Тип события', 'ID события', 'Ссылка источника']);
}

function enhancePushControl() {
  const button = document.getElementById('pushButton');
  if (!button) return;
  const enabled = button.textContent.trim() === 'ОТКЛЮЧИТЬ';
  const checked = String(enabled);
  if (button.getAttribute('role') !== 'switch') button.setAttribute('role', 'switch');
  if (button.getAttribute('aria-checked') !== checked) button.setAttribute('aria-checked', checked);
  const state = enabled ? 'on' : 'off';
  if (button.dataset.state !== state) button.dataset.state = state;
}

async function enhance() {
  try {
    const response = await fetch('/api/v1/snapshot', { credentials: 'omit', cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const state = data?.state || {};
    (state.quests || []).forEach(enhanceQuest);
    enhanceFocusAction(state);
    (state.skills || []).forEach(enhanceSkill);
    (state.notifications || []).forEach(enhanceNotification);
    (state.log || []).forEach(enhanceLogEvent);
    enhanceXp();
    enhancePushControl();
    setupCelebrationControls();
    maybeOpenDeepLinkedNotification(state.notifications || []);
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