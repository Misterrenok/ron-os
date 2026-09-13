import { playerQuestCounts, questDisplayStatus, questObjectiveProgress, questTiming, visibleQuests, xpLevelProgress } from './projection.js';
import { strategyContextView } from './strategy-context.js';
import { applyCosmeticEffects } from './cosmetic-effects.js';
import { notificationAckAction, notificationAckIdempotencyKey, notificationAckView } from './notification-actions.js';
import { createSnapshotRefreshCoordinator, shouldRefreshSnapshot, SNAPSHOT_REFRESH_INTERVAL_MS } from './snapshot-refresh.js';
import { activateViewState, urlForView, viewFromSearch } from './view-navigation.js';

const ATTRIBUTES = ['STR', 'VIT', 'INT', 'DISC', 'CHA'];
const ATTRIBUTE_LABELS = { STR: 'СИЛА', VIT: 'ВЫНОСЛИВОСТЬ', INT: 'ИНТЕЛЛЕКТ', DISC: 'ДИСЦИПЛИНА', CHA: 'ХАРИЗМА' };
const STATUS_LABELS = { ACTIVE: 'АКТИВНО', OVERDUE: 'ПРОСРОЧЕНО', COMPLETED: 'ВЫПОЛНЕНО', CANCELLED: 'ОТМЕНЕНО', FAILED: 'ПРОВАЛЕНО', EXPIRED: 'ИСТЕКЛО', UNREAD: 'НЕ ПРОЧИТАНО', READ: 'ПРОЧИТАНО', UNKNOWN: 'НЕИЗВЕСТНО' };
const CLASS_LABELS = { DAILY: 'ЕЖЕДНЕВНОЕ', MAIN: 'ОСНОВНОЕ', SIDE: 'ПОБОЧНОЕ', HIDDEN: 'СКРЫТОЕ', RECOVERY: 'ВОССТАНОВЛЕНИЕ' };
const SEVERITY_LABELS = { INFO: 'ИНФОРМАЦИЯ', SUCCESS: 'УСПЕХ', WARNING: 'ПРЕДУПРЕЖДЕНИЕ', CRITICAL: 'КРИТИЧЕСКОЕ' };
const CLAIM_LABELS = { VERIFIED: 'ПОДТВЕРЖДЕНО', REPORTED: 'СООБЩЕНО', DERIVED: 'ВЫЧИСЛЕНО', UNKNOWN: 'НЕИЗВЕСТНО' };
const EVENT_LABELS = {
  'quest.created': 'Задание создано', 'quest.progressed': 'Прогресс задания', 'quest.completed': 'Задание выполнено',
  'quest.cancelled': 'Задание отменено', 'quest.failed': 'Задание провалено', 'quest.expired': 'Срок задания истёк',
  'progression.awarded': 'Начислена награда', 'profile.calibrated': 'Профиль откалиброван', 'attribute.set': 'Характеристика обновлена',
  'skill.upserted': 'Навык обновлён', 'achievement.unlocked': 'Достижение открыто', 'shop.item.upserted': 'Награда магазина обновлена',
  'shop.redeemed': 'Награда получена', 'notification.pushed': 'Системное сообщение', 'notification.acknowledged': 'Сообщение прочитано'
};
const SOURCE_LABELS = { 'system-deadline-engine': 'движок дедлайнов', 'system-controller': 'контроллер Системы', 'system-api': 'API Системы' };
const SKILL_LABELS = { Turkish: 'Турецкий язык', 'Marketplace Operations': 'Работа с маркетплейсами' };
const UNIT_LABELS = { lesson: 'урок', lessons: 'уроков', phrase: 'фразы', phrases: 'фраз', session: 'сессия', sessions: 'сессий', check: 'проверка', count: 'раз' };
const PWA_CLIENT = 'ron-system-pwa-v1';
const $ = (id) => document.getElementById(id);

let connected = false;
let sessionGeneration = 0;
let disconnecting = false;
let currentPushSubscription = null;
let lastData = null;
let deferredInstallPrompt = null;
let feedbackTimer = null;
let automaticRefreshEnabled = true;
const pendingNotificationAcks = new Set();

const els = {
  connectButton: $('connectButton'), connectionText: $('connectionText'), tokenDialog: $('tokenDialog'), tokenInput: $('tokenInput'), tokenForm: $('tokenForm'),
  tokenError: $('tokenError'), unlockButton: $('unlockButton'), cancelTokenButton: $('cancelTokenButton'), sessionDialog: $('sessionDialog'),
  closeSessionButton: $('closeSessionButton'), disconnectButton: $('disconnectButton'), installButton: $('installButton'), criticalBanner: $('criticalBanner'),
  feedbackBar: $('feedbackBar'),
  rank: $('rankValue'), level: $('levelValue'), xp: $('xpValue'), xpNext: $('xpNext'), xpBar: $('xpBar'), coins: $('coinValue'), attributes: $('attributes'),
  profileState: $('profileState'), coreState: $('coreState'), authority: $('authorityText'), questCount: $('questCount'), quests: $('questList'), skills: $('skillList'),
  achievements: $('achievementList'), shop: $('shopList'), notifications: $('notificationList'), notificationCount: $('notificationCount'), log: $('logList'),
  pushButton: $('pushButton'), pushStatus: $('pushStatus'), focusPanel: $('focusPanel'), focusBadge: $('focusBadge'), focusTitle: $('focusTitle'),
  focusObjective: $('focusObjective'), focusTimeLabel: $('focusTimeLabel'), focusTime: $('focusTime'), focusProgress: $('focusProgress'), focusReward: $('focusReward'), focusDeadline: $('focusDeadline')
};

function empty(target, text) { target.innerHTML = `<div class="empty">${esc(text)}</div>`; }
function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
function valueOrUnknown(value) { return value == null ? '--' : esc(value); }
function label(map, value) { return map[value] || value || 'НЕИЗВЕСТНО'; }
function detailRows(rows) {
  const items = rows
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([name, value]) => `<div><dt>${esc(name)}</dt><dd>${esc(value)}</dd></div>`)
    .join('');
  return items ? `<dl class="detail-grid">${items}</dl>` : '';
}
function showFeedback(message, tone = 'success') {
  clearTimeout(feedbackTimer);
  els.feedbackBar.textContent = message;
  els.feedbackBar.className = `feedback-bar ${tone}`;
  els.feedbackBar.hidden = false;
  feedbackTimer = setTimeout(() => { els.feedbackBar.hidden = true; }, 5_000);
}
function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'неизвестно' : date.toLocaleString('ru-RU', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
function plural(number, forms) {
  const n = Math.abs(Number(number)) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

function profileStatusText(profile) {
  if (!profile.initialized) return 'Проверенной калибровки профиля пока нет; уровень, ранг и характеристики не выдумываются.';
  const economy = profile.economy_status === 'CALIBRATED' ? 'активна' : 'ожидает калибровки';
  return `Профиль готов · экономика ${economy}. Характеристики без подтверждений остаются неизвестными.`;
}

function coreStatusText(eventCount) {
  const count = Number(eventCount);
  const history = Number.isFinite(count)
    ? `${count} ${plural(count, ['событие', 'события', 'событий'])}`
    : 'данные доступны';
  return `Система работает · в истории ${history} · состояние восстановлено из неизменяемого журнала.`;
}

function rankText(rank) { return rank ?? 'БЕЗ РАНГА'; }

function attributeCard(name, value, meta) {
  const status = meta ? label(CLAIM_LABELS, meta.claim) : 'НЕИЗВЕСТНО';
  return `<details class="attribute detail-card" data-detail-key="attribute:${esc(name)}"><summary><span>${ATTRIBUTE_LABELS[name]}</span><b>${valueOrUnknown(value)}</b><small>${esc(status)}</small></summary>${detailRows([['Статус', status]])}</details>`;
}

function setConnected(value) {
  connected = value;
  els.connectButton.classList.toggle('connected', value);
  els.connectButton.classList.toggle('disconnected', !value);
  els.connectionText.textContent = value ? 'ПОДКЛЮЧЕНО' : 'ЗАБЛОКИРОВАНО';
}

function russianError(error) {
  const message = String(error?.message || error || 'Неизвестная ошибка');
  if (message === 'UNAUTHORIZED') return 'Неверный токен или срок сессии истёк.';
  if (message === 'LOCKED') return 'Система заблокирована.';
  if (message.includes('Notification permission')) return 'Разрешение на уведомления не предоставлено.';
  if (message.includes('Server push')) return 'Push-уведомления ещё не настроены на сервере.';
  if (message.includes('already acknowledged')) return 'Сообщение уже подтверждено на другом устройстве.';
  if (message.includes('notification does not exist')) return 'Сообщение больше не существует. Состояние будет обновлено.';
  if (message.startsWith('HTTP ')) return `Сервер временно недоступен (${message.slice(5)}).`;
  return message;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    headers: {
      'x-system-client': PWA_CLIENT,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {})
    },
    cache: 'no-store'
  });
  if (response.status === 401) {
    setConnected(false);
    throw new Error('UNAUTHORIZED');
  }
  if (!response.ok) {
    let detail = '';
    try { detail = (await response.json())?.error || ''; } catch {}
    throw new Error(detail || `HTTP ${response.status}`);
  }
  return response.json();
}

async function createDeviceSession(token) {
  return request('/api/v1/session', { method: 'POST', body: JSON.stringify({ token }) });
}

async function migrateLegacySession() {
  const legacyToken = sessionStorage.getItem('system-token');
  if (!legacyToken) return;
  try {
    await createDeviceSession(legacyToken);
    sessionStorage.removeItem('system-token');
  } catch {
    // Keep the legacy value for one final manual retry if deployment was mid-upgrade.
  }
}

function renderList(target, items, mapper, emptyText) {
  if (!items?.length) return empty(target, emptyText);
  target.innerHTML = items.map(mapper).join('');
}

function playerDescription(value) {
  return String(value || '').replace(/(?:^|\s)outcome_key=[^\s]+/g, '').trim();
}

function questDeadline(quest) {
  return quest.deadline_at ? ` · СРОК ${esc(formatDate(quest.deadline_at))}` : '';
}

function questReward(quest) {
  if (quest.reward_xp == null && quest.reward_coins == null) return 'БЕЗ НАГРАДЫ';
  const parts = [];
  if (quest.reward_xp != null) parts.push(`${esc(quest.reward_xp)} ОПЫТА`);
  if (quest.reward_coins != null) parts.push(`${esc(quest.reward_coins)} ${plural(quest.reward_coins, ['МОНЕТА', 'МОНЕТЫ', 'МОНЕТ'])}`);
  const reward = parts.join(' · ');
  return ['FAILED', 'EXPIRED'].includes(quest.status) ? `НАГРАДА УТРАЧЕНА · ${reward}` : reward;
}

function questStrategyHtml(quest) {
  const strategy = strategyContextView(quest.strategy_context);
  if (!strategy) return '';
  const statusClass = strategy.verified ? 'verified' : 'unverified';
  return `<div class="quest-strategy ${statusClass}"><div><small>СТРАТЕГИЧЕСКАЯ СВЯЗЬ</small><b>${esc(strategy.label)}</b><span>${esc(strategy.status_label)}</span></div><a href="${esc(strategy.href)}" target="_blank" rel="noopener noreferrer">ОТКРЫТЬ XMIND</a></div>`;
}

function renderQuest(quest) {
  const displayStatus = questDisplayStatus(quest);
  const objectives = Array.isArray(quest.objectives) ? quest.objectives : [];
  const summary = questObjectiveProgress(quest);
  const objectiveHtml = objectives.length ? `<div class="quest-objectives">${objectives.map((objective) => {
    const progress = Number(objective.progress ?? 0);
    const target = Number(objective.target ?? 1);
    const percent = target > 0 ? Math.max(0, Math.min(100, (progress / target) * 100)) : 0;
    return `<div class="objective-row"><div class="objective-copy"><span>${esc(objective.title)}</span><b>${esc(progress)} / ${esc(target)} ${esc(UNIT_LABELS[objective.unit] || objective.unit || '')}</b></div><div class="objective-track"><i style="width:${percent}%"></i></div></div>`;
  }).join('')}</div>` : '';
  const objectiveSummary = summary.total ? `ЦЕЛИ ${summary.completed}/${summary.total}` : '';
  const hiddenBadge = quest.visibility === 'HIDDEN' ? ' · РАСКРЫТО' : '';
  const strategyHtml = questStrategyHtml(quest);
  const timing = questTiming(quest);
  const timingRows = timing.kind === 'HARD'
    ? [['Срок', formatDate(timing.at)]]
    : timing.kind === 'SOFT'
      ? [['Мягкая цель', formatDate(timing.at)], ['Если пропустить', 'Задание останется активным']]
      : [['Срок', 'БЕЗ СРОКА']];
  return `<details class="card detail-card quest-card status-${esc(displayStatus.toLowerCase())}" data-detail-key="quest:${esc(quest.id)}"><summary class="card-summary"><span><b>${esc(quest.title)}</b><small>${esc(label(STATUS_LABELS, displayStatus))}${hiddenBadge}</small></span><span class="badge">${esc(quest.rank || '--')} · ${esc(label(CLASS_LABELS, quest.class))}</span></summary><div class="card-detail"><p>${esc(playerDescription(quest.description) || label(STATUS_LABELS, displayStatus))}</p>${strategyHtml}${objectiveHtml}<div class="quest-footer"><span>${esc(questReward(quest))}</span><span>${esc(objectiveSummary)}</span></div>${detailRows(timingRows)}</div></details>`;
}

function countdownText(deadline) {
  const remaining = new Date(deadline).getTime() - Date.now();
  if (!Number.isFinite(remaining)) return '--:--';
  if (remaining <= 0) return '00:00';
  const minutes = Math.ceil(remaining / 60_000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return days ? `${days}д ${hours}ч` : `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function renderFocus(state) {
  const quests = visibleQuests(state.quests).filter((quest) => quest.quest_version === 2);
  const current = quests.find((quest) => ['ACTIVE', 'OVERDUE'].includes(questDisplayStatus(quest)));
  const latest = quests.at(-1);
  const quest = current || latest;
  els.focusPanel.classList.toggle('terminal', Boolean(!current && latest));
  els.focusPanel.classList.toggle('overdue', current && questDisplayStatus(current) === 'OVERDUE');
  if (!quest) {
    els.focusBadge.textContent = 'НЕТ АКТИВНЫХ';
    els.focusTitle.textContent = 'Ожидание нового задания';
    els.focusObjective.textContent = 'Контроллер Системы подберёт следующее задание по реальным приоритетам.';
    els.focusTimeLabel.textContent = 'СТАТУС';
    els.focusTime.textContent = 'ГОТОВ';
    els.focusProgress.style.width = '0%';
    els.focusReward.textContent = 'НАГРАДА: --';
    els.focusDeadline.textContent = 'СРОК: --';
    return;
  }
  const status = questDisplayStatus(quest);
  const timing = questTiming(quest);
  const progress = questObjectiveProgress(quest);
  const percent = progress.total ? Math.round((progress.completed / progress.total) * 100) : (status === 'COMPLETED' ? 100 : 0);
  const nextObjective = (quest.objectives || []).find((item) => Number(item.progress || 0) < Number(item.target || 1));
  els.focusBadge.textContent = `${quest.rank || '--'} · ${label(STATUS_LABELS, status)}`;
  els.focusTitle.textContent = quest.title;
  els.focusObjective.textContent = nextObjective?.title || (status === 'COMPLETED' ? 'Все обязательные цели выполнены.' : 'Активных обязательных целей нет.');
  els.focusProgress.style.width = `${percent}%`;
  els.focusReward.textContent = `НАГРАДА: ${questReward(quest)}`;
  els.focusDeadline.textContent = timing.kind === 'HARD'
    ? `СРОК: ${formatDate(timing.at)}`
    : timing.kind === 'SOFT'
      ? `МЯГКАЯ ЦЕЛЬ: ${formatDate(timing.at)}`
      : 'СРОК: БЕЗ СРОКА';
  els.focusTimeLabel.textContent = timing.kind === 'HARD'
    ? (status === 'OVERDUE' ? 'СРОК ИСТЁК' : 'ОСТАЛОСЬ')
    : timing.kind === 'SOFT'
      ? (timing.passed ? 'ЦЕЛЬ ПРОШЛА' : 'ДО ЦЕЛИ')
      : 'СТАТУС';
  els.focusTime.textContent = timing.kind === 'SOFT' && timing.passed
    ? 'АКТИВНО'
    : timing.kind !== 'NONE'
      ? countdownText(timing.at)
      : label(STATUS_LABELS, status);
}

function localizeNotification(item) {
  if (String(item.id).startsWith('expired-')) {
    const title = String(item.title || '').replace(/^Quest expired:\s*/i, '').replace(/^Задание просрочено:\s*/i, '');
    return { title: `Задание просрочено: ${title}`, body: 'Срок пропущен. Награда утрачена, задание завершено со статусом «ИСТЕКЛО». Неподтверждённый прогресс не начислен.' };
  }
  if (String(item.id).startsWith('deadline-')) {
    const title = String(item.title || '').replace(/^Quest deadline:\s*/i, '').replace(/^Срок задания:\s*/i, '');
    return { title: `Срок задания: ${title}`, body: item.body };
  }
  return { title: item.title, body: item.body || item.kind };
}

function renderCriticalBanner(notifications) {
  const critical = (notifications || []).find((item) => item.status === 'UNREAD' && item.severity === 'CRITICAL');
  if (!critical) { els.criticalBanner.hidden = true; return; }
  const localized = localizeNotification(critical);
  const ack = notificationAckView(critical, pendingNotificationAcks);
  els.criticalBanner.innerHTML = `<div><span>СИСТЕМНОЕ ПРЕДУПРЕЖДЕНИЕ</span><b>${esc(localized.title)}</b><p>${esc(localized.body)}</p></div><div class="alert-actions"><button type="button" data-open-notification="${esc(critical.id)}">ПОДРОБНОСТИ</button><button type="button" class="primary-action" data-notification-ack="${esc(critical.id)}" ${ack.actionable ? '' : 'disabled'}>${esc(ack.label)}</button></div>`;
  els.criticalBanner.hidden = false;
}

function render(data) {
  const expanded = new Set(
    [...document.querySelectorAll('details[open][data-detail-key]')].map((item) => item.dataset.detailKey)
  );
  lastData = data;
  const state = data.state;
  applyCosmeticEffects(state.shop);
  els.rank.textContent = rankText(state.profile.rank);
  els.level.textContent = state.profile.level ?? '--';
  els.xp.textContent = state.profile.xp ?? 0;
  els.coins.textContent = state.profile.coins ?? 0;

  const xpProgress = xpLevelProgress(state.profile);
  els.xpNext.textContent = xpProgress.remaining == null ? '· НЕ ОТКАЛИБРОВАНО' : `· ${xpProgress.remaining} ДО СЛЕДУЮЩЕГО`;
  els.xpBar.style.width = `${xpProgress.percent}%`;
  els.authority.textContent = 'RON OS + ПРОВЕРЕННЫЕ ИСТОЧНИКИ';
  els.profileState.textContent = profileStatusText(state.profile);
  els.coreState.textContent = coreStatusText(data.event_count);

  els.attributes.innerHTML = ATTRIBUTES.map((name) => attributeCard(name, state.attributes[name], state.attribute_meta?.[name])).join('');

  const playerQuests = visibleQuests(state.quests);
  const counts = playerQuestCounts(playerQuests);
  els.questCount.textContent = `${counts.active} ${plural(counts.active, ['АКТИВНОЕ', 'АКТИВНЫХ', 'АКТИВНЫХ'])}${counts.overdue ? ` · ${counts.overdue} ПРОСРОЧЕНО` : ''}`;
  renderList(els.quests, playerQuests, renderQuest, 'Видимых заданий пока нет.');

  renderList(els.skills, state.skills, (skill) => {
    const level = skill.level == null ? '--' : skill.level;
    const key = skill.id || skill.name;
    return `<div class="card skill-card" data-skill-key="${esc(key)}"><div class="card-summary"><span><b>${esc(SKILL_LABELS[skill.name] || skill.name)}</b><small>${skill.active ? 'АКТИВЕН' : 'НЕАКТИВЕН'}</small></span><span class="badge">УР. ${esc(level)}</span></div></div>`;
  }, 'Подтверждённых навыков пока нет.');

  renderList(els.achievements, state.achievements, (item) => `<details class="card detail-card" data-detail-key="achievement:${esc(item.id)}"><summary class="card-summary"><span><b>${esc(item.title)}</b><small>${esc(formatDate(item.unlocked_at))}</small></span><span class="badge">${esc(item.rank)} · ПОДТВЕРЖДЕНО</span></summary><div class="card-detail"><p>${esc(item.description || 'Подтверждённый этап')}</p>${detailRows([['ID достижения', item.id], ['Получено', formatDate(item.unlocked_at)], ['Доказательство', item.evidence_ref]])}</div></details>`, 'Подтверждённых достижений пока нет.');

  renderList(els.shop, state.shop, (item) => {
    const price = item.cost_coins == null ? 'НЕ ОТКАЛИБРОВАНО' : `${item.cost_coins} ${plural(item.cost_coins, ['МОНЕТА', 'МОНЕТЫ', 'МОНЕТ'])}`;
    return `<details class="card detail-card" data-detail-key="shop:${esc(item.id)}"><summary class="card-summary"><span><b>${esc(item.title)}</b><small>${item.active ? 'АКТИВНО' : 'НЕАКТИВНО'} · ${item.repeatable ? 'МНОГОРАЗОВО' : 'ОДНОРАЗОВО'}</small></span><span class="badge">${esc(price)}</span></summary><div class="card-detail"><p>${esc(item.description || 'Описание награды отсутствует.')}</p>${detailRows([['ID награды', item.id], ['Получено', item.redemptions || 0], ['Последнее получение', item.last_redeemed_at ? formatDate(item.last_redeemed_at) : 'НИКОГДА']])}</div></details>`;
  }, 'Магазин наград пока не настроен.');

  const unread = state.notifications.filter((item) => item.status === 'UNREAD').length;
  els.notificationCount.textContent = `${unread} ${plural(unread, ['НЕПРОЧИТАННОЕ', 'НЕПРОЧИТАННЫХ', 'НЕПРОЧИТАННЫХ'])}`;
  renderList(els.notifications, state.notifications, (item) => {
    const localized = localizeNotification(item);
    const ack = notificationAckView(item, pendingNotificationAcks);
    const action = item.status === 'UNREAD'
      ? `<button type="button" class="primary-action" data-notification-ack="${esc(item.id)}" ${ack.actionable ? '' : 'disabled'}>${esc(ack.label)}</button>`
      : `<span class="action-complete">✓ ПОДТВЕРЖДЕНО ${item.acknowledged_at ? esc(formatDate(item.acknowledged_at)) : ''}</span>`;
    return `<details class="card detail-card notification-card severity-${esc(String(item.severity).toLowerCase())}" data-detail-key="notification:${esc(item.id)}" data-notification-id="${esc(item.id)}"><summary class="card-summary"><span><b>${esc(localized.title)}</b><small>${esc(formatDate(item.pushed_at))}</small></span><span class="badge">${esc(label(SEVERITY_LABELS, item.severity))} · ${esc(label(STATUS_LABELS, item.status))}</span></summary><div class="card-detail"><p>${esc(localized.body)}</p>${detailRows([['Тип', item.kind], ['ID сообщения', item.id], ['Статус', label(STATUS_LABELS, item.status)]])}<div class="card-actions">${action}</div></div></details>`;
  }, 'Системных сообщений пока нет.');

  renderList(els.log, state.log, (item) => `<details class="card detail-card" data-detail-key="event:${esc(item.event_id || item.id)}"><summary class="card-summary"><span><b>${esc(EVENT_LABELS[item.type] || item.type)}</b><small>${esc(formatDate(item.occurred_at))}</small></span><span class="badge">${esc(label(CLAIM_LABELS, String(item.claim_status || '').toUpperCase()))}</span></summary>${detailRows([['Тип события', item.type], ['Источник', SOURCE_LABELS[item.source] || item.source], ['ID события', item.event_id || item.id], ['Ссылка источника', item.source_ref]])}</details>`, 'Журнал событий пуст.');
  renderFocus(state);
  renderCriticalBanner(state.notifications);
  document.querySelectorAll('details[data-detail-key]').forEach((item) => {
    if (expanded.has(item.dataset.detailKey)) item.open = true;
  });
}

function renderUnavailable(kind = 'LOCKED') {
  lastData = null;
  setConnected(false);
  const locked = kind === 'LOCKED';
  const loading = kind === 'LOADING';
  const message = locked ? 'Нажми «ВОЙТИ» вверху, чтобы открыть свой профиль.'
    : loading ? 'Загружаем актуальные данные…' : 'Данные временно скрыты. Подключение восстановится автоматически.';
  els.connectionText.textContent = locked ? 'ВОЙТИ' : loading ? 'ПОДКЛЮЧЕНИЕ…' : 'НЕТ СВЯЗИ';
  for (const target of [els.rank, els.level, els.xp, els.coins, els.questCount, els.notificationCount]) target.textContent = '—';
  els.xpNext.textContent = '';
  els.xpBar.style.width = '0%';
  els.focusPanel.classList.remove('terminal', 'overdue');
  els.focusBadge.textContent = locked ? 'ТРЕБУЕТСЯ ВХОД' : loading ? 'ЗАГРУЗКА' : 'НЕТ СВЯЗИ';
  els.focusTitle.textContent = locked ? 'Войди в Систему' : loading ? 'Подключение к Системе…' : 'Нет подключения';
  els.focusObjective.textContent = message;
  els.focusTimeLabel.textContent = 'СТАТУС';
  els.focusTime.textContent = '—';
  els.focusProgress.style.width = '0%';
  els.focusReward.textContent = 'НАГРАДА: —';
  els.focusDeadline.textContent = 'СРОК: —';
  els.profileState.textContent = message;
  els.coreState.textContent = locked ? 'Личные данные скрыты до входа.' : message;
  els.authority.textContent = 'ДАННЫЕ НЕ ЗАГРУЖЕНЫ';
  for (const target of [els.attributes, els.quests, els.skills, els.achievements, els.shop, els.notifications, els.log]) empty(target, message);
  els.criticalBanner.innerHTML = '';
  els.criticalBanner.hidden = true;
  els.feedbackBar.hidden = true;
  els.pushButton.disabled = true;
  els.pushStatus.textContent = locked ? 'Сначала войди в Систему.' : 'Ожидание подключения.';
  currentPushSubscription = null;
  applyCosmeticEffects([]);
}

async function loadSnapshot() {
  if (disconnecting) return null;
  const generation = sessionGeneration;
  try {
    const data = await request('/api/v1/snapshot');
    if (generation !== sessionGeneration || disconnecting) return null;
    automaticRefreshEnabled = true;
    setConnected(true);
    render(data);
    void updatePushStatus();
    return data;
  } catch (error) {
    if (generation !== sessionGeneration || disconnecting) return null;
    const locked = error.message === 'UNAUTHORIZED';
    if (locked) automaticRefreshEnabled = false;
    renderUnavailable(locked ? 'LOCKED' : 'OFFLINE');
    return null;
  }
}

const snapshotRefresh = createSnapshotRefreshCoordinator(loadSnapshot);

function refresh({ afterCurrent = false } = {}) {
  return afterCurrent ? snapshotRefresh.runAfterCurrent() : snapshotRefresh.run();
}

function refreshWhenUsable() {
  if (!shouldRefreshSnapshot({
    enabled: automaticRefreshEnabled,
    visibilityState: document.visibilityState,
    online: navigator.onLine
  })) return;
  void refresh();
}

function findNotification(notificationId) {
  return lastData?.state?.notifications?.find((item) => item.id === notificationId);
}

function openNotification(notificationId) {
  document.querySelector('.tab[data-view="notifications"]')?.click();
  requestAnimationFrame(() => {
    const card = [...els.notifications.querySelectorAll('[data-notification-id]')]
      .find((item) => item.dataset.notificationId === notificationId);
    if (!card) return;
    card.open = true;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

async function acknowledgeNotification(notificationId) {
  const notification = findNotification(notificationId);
  if (!notification || notification.status === 'READ') {
    showFeedback('Сообщение уже подтверждено.', 'neutral');
    await refresh({ afterCurrent: true });
    return;
  }
  if (pendingNotificationAcks.has(notificationId)) return;

  pendingNotificationAcks.add(notificationId);
  render(lastData);
  try {
    await request('/api/v1/actions', {
      method: 'POST',
      headers: {
        'Idempotency-Key': notificationAckIdempotencyKey(notificationId),
        'x-system-actor': 'ron',
        'x-system-source': 'ron-system-pwa'
      },
      body: JSON.stringify(notificationAckAction(notificationId))
    });
    await refresh({ afterCurrent: true });
    showFeedback(notification.severity === 'CRITICAL'
      ? 'Предупреждение подтверждено и закрыто.'
      : 'Сообщение подтверждено.');
  } catch (error) {
    await refresh({ afterCurrent: true });
    if (findNotification(notificationId)?.status === 'READ') {
      showFeedback('Сообщение уже было подтверждено. Состояние обновлено.', 'neutral');
    } else {
      showFeedback(`Не удалось подтвердить: ${russianError(error)}`, 'error');
    }
  } finally {
    pendingNotificationAcks.delete(notificationId);
    if (lastData) render(lastData);
  }
}

function handleNotificationControl(event) {
  if (!(event.target instanceof Element)) return;
  const ack = event.target.closest('[data-notification-ack]');
  if (ack) {
    event.preventDefault();
    void acknowledgeNotification(ack.dataset.notificationAck);
    return;
  }
  const open = event.target.closest('[data-open-notification]');
  if (open) {
    event.preventDefault();
    openNotification(open.dataset.openNotification);
  }
}

function base64UrlToUint8Array(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function updatePushStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    els.pushStatus.textContent = 'Этот браузер не поддерживает системные push-уведомления.';
    els.pushButton.disabled = true;
    return;
  }
  if (!connected) {
    els.pushStatus.textContent = 'Сначала разблокируй Систему.';
    return;
  }
  try {
    const config = await request('/api/v1/push/public-key');
    if (!config.enabled) {
      els.pushStatus.textContent = 'Push-ключи сервера ещё не настроены.';
      els.pushButton.disabled = true;
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    currentPushSubscription = await registration.pushManager.getSubscription();
    if (currentPushSubscription) {
      els.pushStatus.textContent = 'Уведомления включены на этом устройстве.';
      els.pushButton.textContent = 'ОТКЛЮЧИТЬ';
      els.pushButton.disabled = false;
    } else {
      els.pushStatus.textContent = Notification.permission === 'denied' ? 'Уведомления заблокированы в настройках браузера.' : 'Одно нажатие включит напоминания о дедлайнах.';
      els.pushButton.textContent = 'ВКЛЮЧИТЬ';
      els.pushButton.disabled = Notification.permission === 'denied';
    }
  } catch {
    els.pushStatus.textContent = 'Подключись к Системе, чтобы настроить уведомления.';
  }
}

async function enablePush() {
  els.pushButton.disabled = true;
  try {
    const config = await request('/api/v1/push/public-key');
    if (!config.enabled || !config.public_key) throw new Error('Server push is not configured');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission was not granted');
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64UrlToUint8Array(config.public_key) });
    await request('/api/v1/push/subscriptions', { method: 'POST', body: JSON.stringify(subscription.toJSON()) });
    currentPushSubscription = subscription;
    els.pushStatus.textContent = 'Уведомления включены на этом устройстве.';
    els.pushButton.textContent = 'ОТКЛЮЧИТЬ';
  } catch (error) {
    els.pushStatus.textContent = russianError(error);
  } finally {
    els.pushButton.disabled = false;
  }
}

async function togglePush() {
  if (!currentPushSubscription) return enablePush();
  els.pushButton.disabled = true;
  try {
    await request('/api/v1/push/subscriptions', { method: 'DELETE', body: JSON.stringify({ endpoint: currentPushSubscription.endpoint }) });
    await currentPushSubscription.unsubscribe();
    currentPushSubscription = null;
    els.pushStatus.textContent = 'Уведомления на этом устройстве отключены.';
    els.pushButton.textContent = 'ВКЛЮЧИТЬ';
  } catch (error) {
    els.pushStatus.textContent = russianError(error);
  } finally {
    els.pushButton.disabled = false;
  }
}

els.connectButton.addEventListener('click', () => {
  if (connected) return els.sessionDialog.showModal();
  els.tokenError.hidden = true;
  els.tokenInput.value = sessionStorage.getItem('system-token') || '';
  els.tokenDialog.showModal();
  setTimeout(() => els.tokenInput.focus(), 30);
});

els.tokenForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const token = els.tokenInput.value.trim();
  if (!token) return;
  els.unlockButton.disabled = true;
  els.tokenError.hidden = true;
  try {
    await createDeviceSession(token);
    automaticRefreshEnabled = true;
    sessionStorage.removeItem('system-token');
    els.tokenInput.value = '';
    els.tokenDialog.close();
    await refresh({ afterCurrent: true });
    await updatePushStatus();
  } catch (error) {
    els.tokenError.textContent = russianError(error);
    els.tokenError.hidden = false;
  } finally {
    els.unlockButton.disabled = false;
  }
});

els.cancelTokenButton.addEventListener('click', () => els.tokenDialog.close());
els.closeSessionButton.addEventListener('click', () => els.sessionDialog.close());
els.disconnectButton.addEventListener('click', async () => {
  els.disconnectButton.disabled = true;
  disconnecting = true;
  sessionGeneration += 1;
  automaticRefreshEnabled = false;
  renderUnavailable('LOCKED');
  try {
    await request('/api/v1/session', { method: 'DELETE' });
    els.sessionDialog.close();
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') els.sessionDialog.close();
    else showFeedback('Данные скрыты, но выйти на сервере не удалось. Проверь связь и повтори отключение.', 'error');
  } finally {
    disconnecting = false;
    els.disconnectButton.disabled = false;
  }
});

const tabs = [...document.querySelectorAll('.tab')];
const allowedViews = tabs.map((button) => button.dataset.view);

function activateView(view, { syncUrl = true } = {}) {
  if (!activateViewState(tabs, [...document.querySelectorAll('.view')], view)) return false;
  if (syncUrl) history.replaceState({ view }, '', urlForView(location.href, view));
  return true;
}

tabs.forEach((button) => button.addEventListener('click', () => activateView(button.dataset.view)));
window.addEventListener('popstate', () => activateView(viewFromSearch(location.search, allowedViews), { syncUrl: false }));

els.criticalBanner.addEventListener('click', handleNotificationControl);
els.notifications.addEventListener('click', handleNotificationControl);
els.pushButton.addEventListener('click', togglePush);

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  els.installButton.hidden = false;
});
els.installButton.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  await deferredInstallPrompt.prompt();
  deferredInstallPrompt = null;
  els.installButton.hidden = true;
});

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw-v2.js').catch(() => {});
activateView(viewFromSearch(location.search, allowedViews), { syncUrl: false });

renderUnavailable('LOADING');
await migrateLegacySession();
await refresh();
await updatePushStatus();
setInterval(refreshWhenUsable, SNAPSHOT_REFRESH_INTERVAL_MS);
document.addEventListener('visibilitychange', refreshWhenUsable);
window.addEventListener('online', refreshWhenUsable);
setInterval(() => { if (lastData) renderFocus(lastData.state); }, 1_000);
