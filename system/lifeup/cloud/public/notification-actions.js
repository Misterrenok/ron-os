const NOTIFICATION_ID_MAX = 100;

function normalizedId(notificationId) {
  const id = String(notificationId || '').trim();
  if (!id || id.length > NOTIFICATION_ID_MAX) throw new Error('invalid notification id');
  return id;
}

export function notificationAckAction(notificationId) {
  return {
    type: 'notification.ack',
    payload: { notification_id: normalizedId(notificationId) }
  };
}

export function notificationAckIdempotencyKey(notificationId) {
  return `pwa-notification-ack-${normalizedId(notificationId)}`;
}

export function notificationAckView(notification, pendingIds = new Set()) {
  if (!notification?.id) return { actionable: false, pending: false, label: 'НЕДОСТУПНО' };
  if (notification.status === 'READ') return { actionable: false, pending: false, label: 'ПОДТВЕРЖДЕНО' };
  const pending = pendingIds.has(notification.id);
  return {
    actionable: !pending,
    pending,
    label: pending ? 'СОХРАНЯЮ…' : 'ПОДТВЕРДИТЬ'
  };
}
