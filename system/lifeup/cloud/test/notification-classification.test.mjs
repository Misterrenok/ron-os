import test from 'node:test';
import assert from 'node:assert/strict';
import {
  notificationAttentionCounts,
  notificationClassification
} from '../public/notification-classification.js';

test('explicit INFO push/test messages classify as technical', () => {
  const cases = [
    { id: 'live-manual-test-20260926-1', title: 'Тест уведомления Ron System', body: 'Если ты видишь это push-уведомление — доставка System/PWA работает.', severity: 'INFO', status: 'UNREAD' },
    { id: 'execution-reminder-a', title: 'Тест push Системы #2', body: 'Проверка доставки после исправления VAPID. Это технический тест.', severity: 'INFO', status: 'UNREAD' },
    { id: 'execution-reminder-b', title: 'Обычный заголовок', body: 'Проверка доставки push через Ron System/PWA. Это технический тест.', severity: 'INFO', status: 'UNREAD' }
  ];
  for (const item of cases) {
    assert.deepEqual(notificationClassification(item), { technical: true, player_relevant: false });
  }
});

test('ordinary INFO and QUEST messages fail closed to player-relevant', () => {
  const cases = [
    { id: 'deadline-1', title: 'Срок задания', body: 'До срока осталось меньше часа.', severity: 'INFO', kind: 'QUEST' },
    { id: 'soft-target-1', title: 'Рекомендуемое время', body: 'Можно выполнить сегодня.', severity: 'INFO', kind: 'QUEST' },
    { id: 'system-info', title: 'Система обновлена', body: 'Новая версия готова.', severity: 'INFO', kind: 'SYSTEM' }
  ];
  for (const item of cases) {
    assert.deepEqual(notificationClassification(item), { technical: false, player_relevant: true });
  }
});

test('reward is never demoted merely because its body contains a test-like word', () => {
  const item = {
    id: 'reward',
    title: 'Получено 10 опыта',
    body: 'Тест прогресса пройден',
    severity: 'SUCCESS',
    kind: 'REWARD',
    status: 'UNREAD'
  };
  assert.deepEqual(notificationClassification(item), { technical: false, player_relevant: true });
});

test('attention counts separate unread player messages from technical residue', () => {
  const notifications = [
    { id: 'reward', title: 'Получено 10 опыта', body: '+10 XP', severity: 'SUCCESS', kind: 'REWARD', status: 'UNREAD' },
    { id: 'live-manual-test-1', title: 'Тест уведомления', body: 'Проверка доставки push', severity: 'INFO', kind: 'SYSTEM', status: 'UNREAD' },
    { id: 'execution-reminder-test', title: 'Тест push Системы', body: 'Это технический тест.', severity: 'INFO', kind: 'QUEST', status: 'UNREAD' },
    { id: 'read-test', title: 'Тест push Системы', body: 'Это технический тест.', severity: 'INFO', kind: 'QUEST', status: 'READ' }
  ];
  assert.deepEqual(notificationAttentionCounts(notifications), {
    unread_player: 1,
    unread_technical: 2
  });
});
