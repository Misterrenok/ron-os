const ATTRIBUTES = ['STR', 'VIT', 'INT', 'DISC', 'CHA'];
const $ = (id) => document.getElementById(id);
let token = sessionStorage.getItem('system-token') || '';

const els = {
  connectButton: $('connectButton'), connectionText: $('connectionText'), tokenDialog: $('tokenDialog'), tokenInput: $('tokenInput'), tokenForm: $('tokenForm'),
  rank: $('rankValue'), level: $('levelValue'), xp: $('xpValue'), xpNext: $('xpNext'), xpBar: $('xpBar'), coins: $('coinValue'), attributes: $('attributes'),
  coreState: $('coreState'), authority: $('authorityText'), questCount: $('questCount'), quests: $('questList'), skills: $('skillList'), achievements: $('achievementList'), shop: $('shopList'), log: $('logList')
};

function empty(target, text) { target.innerHTML = `<div class="empty">${text}</div>`; }
function esc(value) { return String(value ?? '').replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }

function setConnected(connected) {
  els.connectButton.classList.toggle('connected', connected);
  els.connectButton.classList.toggle('disconnected', !connected);
  els.connectionText.textContent = connected ? 'ONLINE' : 'LOCKED';
}

async function api(path) {
  if (!token) throw new Error('LOCKED');
  const response = await fetch(path, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
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

function render(data) {
  const state = data.state;
  els.rank.textContent = state.profile.rank ?? '--';
  els.level.textContent = state.profile.level ?? '--';
  els.xp.textContent = state.profile.xp ?? 0;
  els.coins.textContent = state.profile.coins ?? 0;
  els.xpNext.textContent = state.profile.xp_to_next == null ? '· UNCALIBRATED' : `/ ${state.profile.xp_to_next}`;
  const pct = state.profile.xp_to_next ? Math.min(100, (state.profile.xp / state.profile.xp_to_next) * 100) : 0;
  els.xpBar.style.width = `${pct}%`;
  els.authority.textContent = data.real_world_authority;
  els.coreState.textContent = state.profile.initialized
    ? `${data.event_count} ledger events · projection rebuilt from source ledger.`
    : `Cloud core online · ${data.event_count} ledger events · progression intentionally uninitialized until calibration.`;

  els.attributes.innerHTML = ATTRIBUTES.map((name) => `<div class="attribute"><span>${name}</span><b>${state.attributes[name] ?? '--'}</b></div>`).join('');
  const active = state.quests.filter((q) => q.status === 'ACTIVE').length;
  els.questCount.textContent = `${active} ACTIVE`;
  renderList(els.quests, state.quests, (q) => `<article class="card"><div class="card-head"><b>${esc(q.title)}</b><span class="badge">${esc(q.rank)} · ${esc(q.class)}</span></div><p>${esc(q.description || q.status)}${q.completion_claim ? ` · ${esc(q.completion_claim)}` : ''}</p></article>`, 'No System quests yet.');
  renderList(els.skills, state.skills, (x) => `<article class="card"><b>${esc(x.name)}</b></article>`, 'No skills initialized. Current skill portfolio must come from authoritative domains.');
  renderList(els.achievements, state.achievements, (x) => `<article class="card"><b>${esc(x.title)}</b></article>`, 'No verified achievements yet.');
  renderList(els.shop, state.shop, (x) => `<article class="card"><b>${esc(x.title)}</b></article>`, 'Reward shop is not calibrated yet.');
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

els.connectButton.addEventListener('click', () => { els.tokenInput.value = token; els.tokenDialog.showModal(); setTimeout(() => els.tokenInput.focus(), 30); });
els.tokenForm.addEventListener('submit', (event) => {
  if (event.submitter?.value === 'cancel') return;
  event.preventDefault();
  token = els.tokenInput.value.trim();
  if (!token) return;
  sessionStorage.setItem('system-token', token);
  els.tokenDialog.close();
  refresh();
});

document.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === button));
  document.querySelectorAll('.view').forEach((x) => x.classList.toggle('active', x.id === button.dataset.view));
}));

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
refresh();
setInterval(refresh, 30_000);
