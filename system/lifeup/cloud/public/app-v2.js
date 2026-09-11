import { playerQuestCounts, questDisplayStatus, questObjectiveProgress, visibleQuests, xpLevelProgress } from './projection.js';

const ATTRIBUTES = ['STR', 'VIT', 'INT', 'DISC', 'CHA'];
const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem('system-token') || '';

const els = {
  connectButton: $('connectButton'), connectionText: $('connectionText'), tokenDialog: $('tokenDialog'), tokenInput: $('tokenInput'), tokenForm: $('tokenForm'),
  rank: $('rankValue'), level: $('levelValue'), xp: $('xpValue'), xpNext: $('xpNext'), xpBar: $('xpBar'), coins: $('coinValue'), attributes: $('attributes'),
  profileState: $('profileState'), coreState: $('coreState'), authority: $('authorityText'), questCount: $('questCount'), quests: $('questList'), skills: $('skillList'),
  achievements: $('achievementList'), shop: $('shopList'), notifications: $('notificationList'), notificationCount: $('notificationCount'), log: $('logList'),
  pushButton: $('pushButton'), pushStatus: $('pushStatus')
};

function empty(target, text) { target.innerHTML = `<div class="empty">${text}</div>`; }
function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
function valueOrUnknown(value) { return value == null ? '--' : esc(value); }

function setConnected(connected) {
  els.connectButton.classList.toggle('connected', connected);
  els.connectButton.classList.toggle('disconnected', !connected);
  els.connectionText.textContent = connected ? 'ONLINE' : 'LOCKED';
}

async function api(path, options = {}) {
  if (!token) throw new Error('LOCKED');
  const response = await fetch(path, {
    ...options,
    headers: {
      authorization: `Bearer ${token}`,
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.headers || {})
    },
    cache: 'no-store'
  });
  if (response.status === 401) {
    token = ''; sessionStorage.removeItem('system-token'); setConnected(false); throw new Error('UNAUTHORIZED');
  }
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function renderList(target, items, mapper, emptyText) {
  if (!items?.length) return empty(target, emptyText);
  target.innerHTML = items.map(mapper).join('');
}

function questDeadline(q) {
  if (!q.deadline_at) return '';
  const parsed = new Date(q.deadline_at);
  return Number.isNaN(parsed.getTime()) ? '' : ` · DEADLINE ${esc(parsed.toLocaleString())}`;
}

function questReward(q) {
  if (q.reward_xp == null && q.reward_coins == null) return 'UNSCORED';
  const parts = [];
  if (q.reward_xp != null) parts.push(`${esc(q.reward_xp)} XP`);
  if (q.reward_coins != null) parts.push(`${esc(q.reward_coins)} COIN${Number(q.reward_coins) === 1 ? '' : 'S'}`);
  return parts.join(' · ');
}

function renderQuest(q) {
  const displayStatus = questDisplayStatus(q);
  const objectives = Array.isArray(q.objectives) ? q.objectives : [];
  const summary = questObjectiveProgress(q);
  const objectiveHtml = objectives.length ? `
    <div class="quest-objectives">
      ${objectives.map((objective) => {
        const progress = Number(objective.progress ?? 0);
        const target = Number(objective.target ?? 1);
        const pct = target > 0 ? Math.max(0, Math.min(100, (progress / target) * 100)) : 0;
        return `<div class="objective-row">
          <div class="objective-copy"><span>${esc(objective.title)}</span><b>${esc(progress)} / ${esc(target)} ${esc(objective.unit || '')}</b></div>
          <div class="objective-track"><i style="width:${pct}%"></i></div>
        </div>`;
      }).join('')}
    </div>` : '';
  const objectiveSummary = summary.total ? ` · ${summary.completed}/${summary.total} REQUIRED` : '';
  const hiddenBadge = q.visibility === 'HIDDEN' ? ' · REVEALED' : '';
  return `<article class="card quest-card ${displayStatus === 'OVERDUE' ? 'overdue' : ''}">
    <div class="card-head"><b>${esc(q.title)}</b><span class="badge">${esc(q.rank)} · ${esc(q.class)}</span></div>
    <p>${esc(q.description || displayStatus)} · ${esc(displayStatus)}${q.completion_claim ? ` · ${esc(q.completion_claim)}` : ''}${hiddenBadge}${questDeadline(q)}</p>
    ${objectiveHtml}
    <div class="quest-footer"><span>${esc(questReward(q))}</span><span>${esc(q.quest_version === 2 ? 'QUEST v2' : 'QUEST v1')}${objectiveSummary}</span></div>
  </article>`;
}

function render(data) {
  const state = data.state;
  els.rank.textContent = state.profile.rank ?? '--';
  els.level.textContent = state.profile.level ?? '--';
  els.xp.textContent = state.profile.xp ?? 0;
  els.coins.textContent = state.profile.coins ?? 0;

  const xpProgress = xpLevelProgress(state.profile);
  els.xpNext.textContent = xpProgress.remaining == null ? '· UNCALIBRATED' : `· ${xpProgress.remaining} TO NEXT`;
  els.xpBar.style.width = `${xpProgress.percent}%`;

  els.authority.textContent = data.real_world_authority;
  els.profileState.textContent = state.profile.initialized
    ? `Verified calibration present · economy ${state.profile.economy_status} · unknown fields remain uninitialized.`
    : 'No verified profile calibration yet · level, rank and attributes remain intentionally unknown.';
  els.coreState.textContent = `Cloud core online · ${data.event_count} ledger events · ${esc(data.model_version)} projection rebuilt from the append-only ledger.`;

  els.attributes.innerHTML = ATTRIBUTES.map((name) => {
    const meta = state.attribute_meta?.[name];
    const detail = meta ? ` · ${esc(meta.claim)} · ${esc(meta.scale_ref)}` : '';
    return `<div class="attribute" title="${meta ? esc(meta.evidence_ref || '') : ''}"><span>${name}</span><b>${valueOrUnknown(state.attributes[name])}</b><small>${meta ? `CALIBRATED${detail}` : 'UNKNOWN'}</small></div>`;
  }).join('');

  const playerQuests = visibleQuests(state.quests);
  const counts = playerQuestCounts(playerQuests);
  els.questCount.textContent = `${counts.active} ACTIVE${counts.overdue ? ` · ${counts.overdue} OVERDUE` : ''}`;
  renderList(els.quests, playerQuests, renderQuest, 'No visible System quests yet.');

  renderList(els.skills, state.skills, (skill) => {
    const level = skill.level == null ? '--' : skill.level;
    const scale = skill.scale_ref ? ` · ${esc(skill.scale_ref)}` : '';
    return `<article class="card"><div class="card-head"><b>${esc(skill.name)}</b><span class="badge">LV ${esc(level)}</span></div><p>${esc(skill.domain)} · ${skill.active ? 'ACTIVE' : 'INACTIVE'} · ${esc(skill.claim)}${scale}</p></article>`;
  }, 'No skills initialized. Current skill portfolio must come from authoritative domains.');

  renderList(els.achievements, state.achievements, (item) => `<article class="card"><div class="card-head"><b>${esc(item.title)}</b><span class="badge">${esc(item.rank)} · VERIFIED</span></div><p>${esc(item.description || 'Verified milestone')} · ${esc(new Date(item.unlocked_at).toLocaleString())}</p></article>`, 'No verified achievements yet.');

  renderList(els.shop, state.shop, (item) => {
    const price = item.cost_coins == null ? 'UNCALIBRATED' : `${item.cost_coins} COINS`;
    return `<article class="card"><div class="card-head"><b>${esc(item.title)}</b><span class="badge">${esc(price)}</span></div><p>${esc(item.description || '')}${item.description ? ' · ' : ''}${item.active ? 'ACTIVE' : 'INACTIVE'} · ${item.repeatable ? 'REPEATABLE' : 'ONE-TIME'} · ${esc(item.redemptions || 0)} redeemed</p></article>`;
  }, 'Reward shop has no configured items yet.');

  const unread = state.notifications.filter((item) => item.status === 'UNREAD').length;
  els.notificationCount.textContent = `${unread} UNREAD`;
  renderList(els.notifications, state.notifications, (item) => `<article class="card"><div class="card-head"><b>${esc(item.title)}</b><span class="badge">${esc(item.severity)} · ${esc(item.status)}</span></div><p>${esc(item.body || item.kind)} · ${esc(item.kind)} · ${esc(new Date(item.pushed_at).toLocaleString())}</p></article>`, 'No System notifications.');

  renderList(els.log, state.log, (x) => `<article class="card"><div class="card-head"><b>${esc(x.type)}</b><span class="badge">${esc(x.claim_status)}</span></div><p>${esc(new Date(x.occurred_at).toLocaleString())} · ${esc(x.source)}</p></article>`, 'Event ledger is empty.');
}

async function refresh() {
  try {
    const data = await api('/api/v1/snapshot');
    setConnected(true); render(data);
  } catch (error) {
    setConnected(false);
    els.coreState.textContent = error.message === 'LOCKED' ? 'Connect to System Core.' : `Core unavailable: ${error.message}`;
  }
}

function base64UrlToUint8Array(value) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function updatePushStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    els.pushStatus.textContent = 'This browser does not support Web Push.';
    els.pushButton.disabled = true;
    return;
  }
  if (!token) {
    els.pushStatus.textContent = 'Unlock System first.';
    return;
  }
  try {
    const config = await api('/api/v1/push/public-key');
    if (!config.enabled) {
      els.pushStatus.textContent = 'Server push keys are not configured yet.';
      els.pushButton.disabled = true;
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      els.pushStatus.textContent = 'Alerts enabled on this device.';
      els.pushButton.textContent = 'ENABLED';
      els.pushButton.disabled = true;
    } else {
      els.pushStatus.textContent = Notification.permission === 'denied' ? 'Notifications are blocked in browser settings.' : 'One tap enables deadline alerts on this device.';
      els.pushButton.disabled = Notification.permission === 'denied';
    }
  } catch {
    els.pushStatus.textContent = 'Connect to System to configure alerts.';
  }
}

async function enablePush() {
  els.pushButton.disabled = true;
  try {
    const config = await api('/api/v1/push/public-key');
    if (!config.enabled || !config.public_key) throw new Error('Server push is not configured');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') throw new Error('Notification permission was not granted');
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(config.public_key)
    });
    await api('/api/v1/push/subscriptions', { method: 'POST', body: JSON.stringify(subscription.toJSON()) });
    els.pushStatus.textContent = 'Alerts enabled on this device.';
    els.pushButton.textContent = 'ENABLED';
  } catch (error) {
    els.pushStatus.textContent = error.message;
    els.pushButton.disabled = false;
  }
}

els.connectButton.addEventListener('click', () => { els.tokenInput.value = token; els.tokenDialog.showModal(); setTimeout(() => els.tokenInput.focus(), 30); });
els.tokenForm.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  token = els.tokenInput.value.trim();
  if (!token) return;
  sessionStorage.setItem('system-token', token);
  els.tokenDialog.close();
  refresh();
  updatePushStatus();
});

document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === button));
  document.querySelectorAll('.view').forEach((x) => x.classList.toggle('active', x.id === button.dataset.view));
}));

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw-v2.js').catch(() => {});
els.pushButton.addEventListener('click', enablePush);
const requestedView = new URLSearchParams(location.search).get('view');
if (requestedView) document.querySelector(`.tab[data-view="${CSS.escape(requestedView)}"]`)?.click();
refresh();
updatePushStatus();
setInterval(refresh, 30_000);
