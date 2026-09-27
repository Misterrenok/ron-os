import test from 'node:test';
import assert from 'node:assert/strict';
import { truthfulRewardNotification } from '../public/notification-truth.js';

const staleReward = {
  id: 'player-feedback-reward-old',
  title: 'Получено 10 опыта',
  body: '+10 XP · До уровня 2: 480 XP',
  severity: 'SUCCESS',
  kind: 'REWARD',
  status: 'UNREAD'
};

test('stale reward progression is preserved as history but corrected to current profile truth', () => {
  const view = truthfulRewardNotification(staleReward, { level: 1, xp_to_next: 80 });
  assert.equal(view.id, staleReward.id);
  assert.equal(view.kind, 'REWARD');
  assert.equal(view.severity, 'SUCCESS');
  assert.equal(view.historical_progression, true);
  assert.match(view.body, /\+10 XP/);
  assert.match(view.body, /Исторически в уведомлении было: до уровня 2 — 480 XP/);
  assert.match(view.body, /По текущей шкале: До уровня 2: 80 XP/);
});

test('matching reward progression is rendered unchanged', () => {
  const current = { ...staleReward, body: '+10 XP · До уровня 2: 80 XP' };
  const view = truthfulRewardNotification(current, { level: 1, xp_to_next: 80 });
  assert.equal(view.body, current.body);
  assert.equal(view.historical_progression, false);
});

test('already passed historical target is marked historical and current threshold is shown', () => {
  const view = truthfulRewardNotification(staleReward, { level: 2, xp_to_next: 110 });
  assert.equal(view.historical_progression, true);
  assert.match(view.body, /Этот порог уже пройден/);
  assert.match(view.body, /Сейчас уровень 2/);
  assert.match(view.body, /До уровня 3: 110 XP/);
});

test('non-reward notifications are unchanged', () => {
  const item = {
    id: 'system-test',
    title: 'Тест',
    body: 'До уровня 2: 480 XP',
    severity: 'INFO',
    kind: 'SYSTEM',
    status: 'UNREAD'
  };
  assert.deepEqual(
    truthfulRewardNotification(item, { level: 1, xp_to_next: 80 }),
    { ...item, historical_progression: false }
  );
});

test('reward without current profile evidence fails closed to historical body', () => {
  const view = truthfulRewardNotification(staleReward, { level: null, xp_to_next: null });
  assert.equal(view.body, staleReward.body);
  assert.equal(view.historical_progression, false);
});

test('unrelated future target is not reinterpreted', () => {
  const future = { ...staleReward, body: '+10 XP · До уровня 4: 900 XP' };
  const view = truthfulRewardNotification(future, { level: 1, xp_to_next: 80 });
  assert.equal(view.body, future.body);
  assert.equal(view.historical_progression, false);
});
