const PWA_CLIENT = 'ron-system-pwa-v1';
const list = document.getElementById('notificationList');

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
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function renderAckControls(notifications) {
  if (!list) return;
  const cards = [...list.querySelectorAll('.notification-card')];
  cards.forEach((card, index) => {
    card.querySelector('.notification-ack-button')?.remove();
    const item = notifications[index];
    if (!item || item.status !== 'UNREAD') return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'install-button notification-ack-button';
    button.dataset.notificationId = String(item.id);
    button.textContent = 'ПРОЧИТАНО';
    card.append(button);
  });
}

async function syncAckControls() {
  if (!list) return;
  try {
    const snapshot = await request('/api/v1/snapshot');
    renderAckControls(snapshot.state?.notifications || []);
  } catch {
    // The main app owns connection/error UI; this module only adds the optional acknowledgement action.
  }
}

if (list) {
  const observer = new MutationObserver(() => void syncAckControls());
  observer.observe(list, { childList: true });

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('.notification-ack-button');
    if (!button || !list.contains(button)) return;
    const notificationId = button.dataset.notificationId;
    if (!notificationId) return;

    button.disabled = true;
    button.textContent = 'СОХРАНЯЮ…';
    try {
      await request('/api/v1/actions', {
        method: 'POST',
        headers: {
          'Idempotency-Key': `pwa-notification-ack-${notificationId}`,
          'x-system-actor': 'ron',
          'x-system-source': 'ron-system-pwa'
        },
        body: JSON.stringify({
          type: 'notification.ack',
          payload: { notification_id: notificationId }
        })
      });
      window.location.reload();
    } catch {
      button.disabled = false;
      button.textContent = 'ОШИБКА · ПОВТОРИТЬ';
    }
  });

  void syncAckControls();
}
