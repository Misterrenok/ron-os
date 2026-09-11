import { playerQuestCounts, questDisplayStatus, questObjectiveProgress, visibleQuests, xpLevelProgress } from './projection.js';

const ATTRIBUTES = ['STR', 'VIT', 'INT', 'DISC', 'CHA'];
const ATTRIBUTE_LABELS = { STR: 'СИЛА', VIT: 'ВЫНОСЛИВОСТЬ', INT: 'ИНТЕЛЛЕКТ', DISC: 'ДИСЦИПЛИНА', CHA: 'ХАРИЗМА' };
const STATUS_LABELS = { ACTIVE: 'АКТИВНО', OVERDUE: 'ПРОСРОЧЕНО', COMPLETED: 'ВЫПОЛНЕНО', CANCELLED: 'ОТМЕНЕНО', FAILED: 'ПРОВАЛЕНО', EXPIRED: 'ИСТЕКЛО', UNREAD: 'НЕ ПРОЧИТАНО', READ: 'ПРОЧИТАНО', UNKNOWN: 'НЕИЗВЕСТНО' };
const CLASS_LABELS = { DAILY: 'ЕЖЕДНЕВНОЕ', MAIN: 'ОСНОВНОЕ', SIDE: 'ПОБОЧНОЕ', HIDDEN: 'СКРЫТОЕ' };
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
const DOMAIN_LABELS = { language: 'языки', work: 'работа', learning: 'обучение', health: 'здоровье', training: 'тренировки', nutrition: 'питание' };
const UNIT_LABELS = { lesson: 'урок', lessons: 'уроков', session: 'сессия', sessions: 'сессий', check: 'проверка' };
const PWA_CLIENT = 'ron-system-pwa-v1';
const $ = (id) => document.getElementById(id);

let connected = false;
let currentPushSubscription = null;
let lastData = null;
let deferredInstallPrompt = null;

const els = {
  connectButton: $('connectButton'), connectionText: $('connectionText'), tokenDialog: $('tokenDialog'), tokenInput: $('tokenInput'), tokenForm: $('tokenForm'),
  tokenError: $('tokenError'), unlockButton: $('unlockButton'), cancelTokenButton: $('cancelTokenButton'), sessionDialog: $('sessionDialog'),
  closeSessionButton: $('closeSessionButton'), disconnectButton: $('disconnectButton'), installButton: $('installButton'), criticalBanner: $('criticalBanner'),
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
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
  const objectiveSummary = summary.total ? ` · ОБЯЗАТЕЛЬНО ${summary.completed}/${summary.total}` : '';
  const hiddenBadge = quest.visibility === 'HIDDEN' ? ' · РАСКРЫТО' : '';
  return `<article class="card quest-card status-${esc(displayStatus.toLowerCase())}"><div class="card-head"><b>${esc(quest.title)}</b><span class="badge">${esc(quest.rank || '--')} · ${esc(label(CLASS_LABELS, quest.class))}</span></div><p>${esc(quest.description || label(STATUS_LABELS, displayStatus))} · ${esc(label(STATUS_LABELS, displayStatus))}${quest.completion_claim ? ` · ${esc(label(CLAIM_LABELS, quest.completion_claim))}` : ''}${hiddenBadge}${questDeadline(quest)}</p>${objectiveHtml}<div class="quest-footer"><span>${esc(questReward(quest))}</span><span>${quest.quest_version === 2 ? 'ЗАДАНИЕ v2' : 'ЗАДАНИЕ v1'}${objectiveSummary}</span></div></article>`;
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
  const progress = questObjectiveProgress(quest);
  const percent = progress.total ? Math.round((progress.completed / progress.total) * 100) : (status === 'COMPLETED' ? 100 : 0);
  const nextObjective = (quest.objectives || []).find((item) => Number(item.progress || 0) < Number(item.target || 1));
  els.focusBadge.textContent = `${quest.rank || '--'} · ${label(STATUS_LABELS, status)}`;
  els.focusTitle.textContent = quest.title;
  els.focusObjective.textContent = nextObjective?.title || (status === 'COMPLETED' ? 'Все обязательные цели выполнены.' : 'Активных обязательных целей нет.');
  els.focusProgress.style.width = `${percent}%`;
  els.focusReward.textContent = `НАГРАДА: ${questReward(quest)}`;
  els.focusDeadline.textContent = `СРОК: ${quest.deadline_at ? formatDate(quest.deadline_at) : 'БЕЗ СРОКА'}`;
  els.focusTimeLabel.textContent = current?.deadline_at ? (status === 'OVERDUE' ? 'СРОК ИСТЁК' : 'ОСТАЛОСЬ') : 'СТАТУС';
  els.focusTime.textContent = current?.deadline_at ? countdownText(current.deadline_at) : label(STATUS_LABELS, status);
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
  const critical = [...(notifications || [])].reverse().find((item) => item.status === 'UNREAD' && item.severity === 'CRITICAL');
  if (!critical) { els.criticalBanner.hidden = true; return; }
  const localized = localizeNotification(critical);
  els.criticalBanner.innerHTML = `<span>СИСТЕМНОЕ ПРЕДУПРЕЖДЕНИЕ</span><b>${esc(localized.title)}</b><p>${esc(localized.body)}</p>`;
  els.criticalBanner.hidden = false;
}

function render(data) {
  lastData = data;
  const state = data.state;
  els.rank.textContent = state.profile.rank ?? '--';
  els.level.textContent = state.profile.level ?? '--';
  els.xp.textContent = state.profile.xp ?? 0;
  els.coins.textContent = state.profile.coins ?? 0;

  const xpProgress = xpLevelProgress(state.profile);
  els.xpNext.textContent = xpProgress.remaining == null ? '· НЕ ОТКАЛИБРОВАНО' : `· ${xpProgress.remaining} ДО СЛЕДУЮЩЕГО`;
  els.xpBar.style.width = `${xpProgress.percent}%`;
  els.authority.textContent = 'RON OS + ПРОВЕРЕННЫЕ ИСТОЧНИКИ';
  els.profileState.textContent = state.profile.initialized
    ? `Профиль откалиброван · экономика: ${state.profile.economy_status === 'CALIBRATED' ? 'АКТИВНА' : 'НЕ ОТКАЛИБРОВАНА'} · неподтверждённые поля остаются неизвестными.`
    : 'Проверенной калибровки профиля пока нет; уровень, ранг и характеристики не выдумываются.';
  els.coreState.textContent = `Ядро в сети · событий в ledger: ${data.event_count} · модель ${data.model_version} · состояние восстановлено из неизменяемого журнала.`;

  els.attributes.innerHTML = ATTRIBUTES.map((name) => {
    const meta = state.attribute_meta?.[name];
    const detail = meta ? ` · ${label(CLAIM_LABELS, meta.claim)} · ${meta.scale_ref}` : '';
    return `<div class="attribute" title="${meta ? esc(meta.evidence_ref || '') : ''}"><span>${ATTRIBUTE_LABELS[name]}</span><b>${valueOrUnknown(state.attributes[name])}</b><small>${meta ? `ОТКАЛИБРОВАНО${esc(detail)}` : 'НЕИЗВЕСТНО'}</small></div>`;
  }).join('');

  const playerQuests = visibleQuests(state.quests);
  const counts = playerQuestCounts(playerQuests);
  els.questCount.textContent = `${counts.active} ${plural(counts.active, ['АКТИВНОЕ', 'АКТИВНЫХ', 'АКТИВНЫХ'])}${counts.overdue ? ` · ${counts.overdue} ПРОСРОЧЕНО` : ''}`;
  renderList(els.quests, playerQuests, renderQuest, 'Видимых заданий пока нет.');

  renderList(els.skills, state.skills, (skill) => {
    const level = skill.level == null ? '--' : skill.level;
    const domain = String(skill.domain || '').toLowerCase();
    return `<article class="card"><div class="card-head"><b>${esc(SKILL_LABELS[skill.name] || skill.name)}</b><span class="badge">УР. ${esc(level)}</span></div><p>${esc(DOMAIN_LABELS[domain] || skill.domain)} · ${skill.active ? 'АКТИВЕН' : 'НЕАКТИВЕН'} · ${esc(label(CLAIM_LABELS, skill.claim))}</p></article>`;
  }, 'Подтверждённых навыков пока нет.');

  renderList(els.achievements, state.achievements, (item) => `<article class="card"><div class="card-head"><b>${esc(item.title)}</b><span class="badge">${esc(item.rank)} · ПОДТВЕРЖДЕНО</span></div><p>${esc(item.description || 'Подтверждённый этап')} · ${esc(formatDate(item.unlocked_at))}</p></article>`, 'Подтверждённых достижений пока нет.');

  renderList(els.shop, state.shop, (item) => {
    const price = item.cost_coins == null ? 'НЕ ОТКАЛИБРОВАНО' : `${item.cost_coins} ${plural(item.cost_coins, ['МОНЕТА', 'МОНЕТЫ', 'МОНЕТ'])}`;
    return `<article class="card"><div class="card-head"><b>${esc(item.title)}</b><span class="badge">${esc(price)}</span></div><p>${esc(item.description || '')}${item.description ? ' · ' : ''}${item.active ? 'АКТИВНО' : 'НЕАКТИВНО'} · ${item.repeatable ? 'МНОГОРАЗОВО' : 'ОДНОРАЗОВО'} · получено: ${esc(item.redemptions || 0)}</p></article>`;
  }, 'Магазин наград пока не настроен.');

  const unread = state.notifications.filter((item) => item.status === 'UNREAD').length;
  els.notificationCount.textContent = `${unread} ${plural(unread, ['НЕПРОЧИТАННОЕ', 'НЕПРОЧИТАННЫХ', 'НЕПРОЧИТАННЫХ'])}`;
  renderList(els.notifications, state.notifications, (item) => {
    const localized = localizeNotification(item);
    return `<article class="card notification-card severity-${esc(String(item.severity).toLowerCase())}"><div class="card-head"><b>${esc(localized.title)}</b><span class="badge">${esc(label(SEVERITY_LABELS, item.severity))} · ${esc(label(STATUS_LABELS, item.status))}</span></div><p>${esc(localized.body)} · ${esc(formatDate(item.pushed_at))}</p></article>`;
  }, 'Системных сообщений пока нет.');

  renderList(els.log, state.log, (item) => `<article class="card"><div class="card-head"><b>${esc(EVENT_LABELS[item.type] || item.type)}</b><span class="badge">${esc(label(CLAIM_LABELS, String(item.claim_status || '').toUpperCase()))}</span></div><p>${esc(formatDate(item.occurred_at))} · ${esc(SOURCE_LABELS[item.source] || item.source)}</p></article>`, 'Журнал событий пуст.');
  renderFocus(state);
  renderCriticalBanner(state.notifications);
}

async function refresh() {
  try {
    const data = await request('/api/v1/snapshot');
    setConnected(true);
    render(data);
  } catch (error) {
    setConnected(false);
    els.coreState.textContent = error.message === 'UNAUTHORIZED' ? 'Система заблокирована. Нажми на индикатор подключения.' : `Ядро недоступно: ${russianError(error)}`;
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
    sessionStorage.removeItem('system-token');
    els.tokenInput.value = '';
    els.tokenDialog.close();
    await refresh();
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
  try { await request('/api/v1/session', { method: 'DELETE' }); } catch {}
  setConnected(false);
  lastData = null;
  els.sessionDialog.close();
  els.coreState.textContent = 'Система отключена на этом устройстве.';
  els.disconnectButton.disabled = false;
});

document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((item) => item.classList.toggle('active', item === button));
  document.querySelectorAll('.view').forEach((item) => item.classList.toggle('active', item.id === button.dataset.view));
}));

els.criticalBanner.addEventListener('click', () => document.querySelector('.tab[data-view="notifications"]')?.click());
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
const requestedView = new URLSearchParams(location.search).get('view');
if (requestedView) document.querySelector(`.tab[data-view="${CSS.escape(requestedView)}"]`)?.click();

await migrateLegacySession();
await refresh();
await updatePushStatus();
setInterval(refresh, 30_000);
setInterval(() => { if (lastData) renderFocus(lastData.state); }, 1_000);
