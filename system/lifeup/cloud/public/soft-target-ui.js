const PREFIX = 'system-soft-target:v1?';

export function parseSoftTargetRef(value) {
  if (typeof value !== 'string' || !value.startsWith(PREFIX)) return null;
  const params = new URLSearchParams(value.slice(PREFIX.length));
  const questId = params.get('quest');
  const targetValue = params.get('target');
  if (!questId || !targetValue) return null;
  const target = new Date(targetValue);
  if (Number.isNaN(target.getTime())) return null;
  return { quest_id: questId, target_at: target.toISOString() };
}

export function latestSoftTarget(events, questId) {
  let latest = null;
  for (const event of events ?? []) {
    if (event?.event_type !== 'notification.pushed') continue;
    const parsed = parseSoftTargetRef(event.source_ref);
    if (!parsed || parsed.quest_id !== questId) continue;
    const seq = Number(event.seq ?? 0);
    if (!latest || seq >= latest.seq) latest = { ...parsed, seq };
  }
  return latest;
}

export function softTargetView(target, now = Date.now()) {
  if (!target) return { text: 'МЯГКАЯ ЦЕЛЬ: НЕТ', missed: false };
  const targetMs = new Date(target.target_at).getTime();
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (!Number.isFinite(targetMs) || !Number.isFinite(nowMs)) return { text: 'МЯГКАЯ ЦЕЛЬ: --', missed: false };
  if (nowMs >= targetMs) return { text: 'МЯГКАЯ ЦЕЛЬ ПРОПУЩЕНА · КВЕСТ ОСТАЁТСЯ АКТИВНЫМ', missed: true };
  const label = new Date(targetMs).toLocaleString('ru-RU', {
    timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
  return { text: `МЯГКАЯ ЦЕЛЬ: ${label} · БЕЗ AUTO-FAIL`, missed: false };
}

async function refreshSoftTarget() {
  const el = document.getElementById('focusSoftTarget');
  if (!el) return;
  try {
    const [snapshotResponse, eventsResponse] = await Promise.all([
      fetch('/api/v1/snapshot', { credentials: 'same-origin', cache: 'no-store' }),
      fetch('/api/v1/events?limit=1000', { credentials: 'same-origin', cache: 'no-store' })
    ]);
    if (!snapshotResponse.ok || !eventsResponse.ok) return;
    const [{ state }, { events }] = await Promise.all([snapshotResponse.json(), eventsResponse.json()]);
    const quest = (state?.quests ?? []).find((item) => item.quest_version === 2 && item.status === 'ACTIVE');
    if (!quest) {
      el.textContent = 'МЯГКАЯ ЦЕЛЬ: --';
      el.dataset.missed = 'false';
      return;
    }
    const view = softTargetView(latestSoftTarget(events, quest.id));
    el.textContent = view.text;
    el.dataset.missed = String(view.missed);
  } catch {
    // Main PWA owns connectivity feedback; this read-only enhancement fails silently.
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    void refreshSoftTarget();
    const timer = setInterval(() => void refreshSoftTarget(), 60_000);
    window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
  });
}
