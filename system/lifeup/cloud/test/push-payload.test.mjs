import test from 'node:test';
import assert from 'node:assert/strict';
import { pushPayload } from '../src/store-v2.mjs';

test('reward push deep-links to its exact notification and requests celebration mode', () => {
  const payload = pushPayload({
    payload: {
      notification_id: 'reward-42',
      title: 'Уровень повышен',
      body: 'Получено 10 опыта',
      severity: 'SUCCESS',
      kind: 'REWARD'
    }
  });
  assert.equal(payload.notification_id, 'reward-42');
  assert.equal(payload.url, '/?view=notifications&notification=reward-42&celebrate=1');
});

test('achievement push also requests celebration while ordinary info stays non-celebratory', () => {
  const achievement = pushPayload({
    payload: {
      notification_id: 'achievement-1',
      title: 'Достижение открыто',
      severity: 'INFO',
      kind: 'ACHIEVEMENT'
    }
  });
  assert.equal(achievement.url, '/?view=notifications&notification=achievement-1&celebrate=1');

  const info = pushPayload({
    payload: {
      notification_id: 'info-1',
      title: 'Обычное сообщение',
      severity: 'INFO',
      kind: 'SYSTEM'
    }
  });
  assert.equal(info.url, '/?view=notifications&notification=info-1');
});
