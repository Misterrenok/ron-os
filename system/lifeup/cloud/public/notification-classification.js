const TEST_TITLE_RE = /^(?:тест|test)(?:\s|$)/iu;
const TEST_BODY_RE = /(?:техническ(?:ий|ая|ое)\s+тест|проверка\s+доставки(?:\s+push)?|тест\s+push|push-уведомление[^.\n]*работает)/iu;
const TEST_ID_RE = /^(?:live-(?:manual-)?test-|technical-test-|push-test-)/iu;

export function notificationClassification(notification) {
  const severity = String(notification?.severity || '').toUpperCase();
  const id = String(notification?.id || '');
  const title = String(notification?.title || '');
  const body = String(notification?.body || '');
  const explicitTestSignal = TEST_ID_RE.test(id) || TEST_TITLE_RE.test(title) || TEST_BODY_RE.test(body);
  const technical = severity === 'INFO' && explicitTestSignal;
  return {
    technical,
    player_relevant: !technical
  };
}

export function notificationAttentionCounts(notifications) {
  let unread_player = 0;
  let unread_technical = 0;
  for (const item of Array.isArray(notifications) ? notifications : []) {
    if (String(item?.status || '').toUpperCase() !== 'UNREAD') continue;
    if (notificationClassification(item).technical) unread_technical += 1;
    else unread_player += 1;
  }
  return { unread_player, unread_technical };
}
