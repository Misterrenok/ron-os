import test from 'node:test';
import assert from 'node:assert/strict';
import { createPushDelivery, pushConfiguration } from '../src/push-delivery.mjs';

test('push remains safely disabled when VAPID configuration is incomplete', async () => {
  assert.equal(pushConfiguration({ VAPID_PUBLIC_KEY: 'public' }).enabled, false);
  const delivery = await createPushDelivery({ store: {}, env: { VAPID_PUBLIC_KEY: 'public' } });
  assert.equal(delivery.enabled, false);
  await delivery.drain();
});

test('configured push drains claimed deliveries and marks success', async () => {
  const finished = [];
  let claims = [{
    notification_event_id: 'event', subscription_hash: 'sub', endpoint: 'https://push.example/1', p256dh: 'p', auth: 'a',
    topic: 'deadline-notice', payload: { title: 'Quest', body: '15 minutes left', severity: 'WARNING' }
  }];
  const store = {
    async enqueuePushDeliveries() {},
    async claimPushDeliveries() { const value = claims; claims = []; return value; },
    async finishPushDelivery(claim, result) { finished.push({ claim, result }); }
  };
  const sent = [];
  const fakeWebPush = {
    setVapidDetails(...args) { assert.deepEqual(args, ['mailto:test@example.com', 'public', 'private']); },
    async sendNotification(subscription, payload, options) { sent.push({ subscription, payload: JSON.parse(payload), options }); }
  };
  const delivery = await createPushDelivery({
    store,
    env: { VAPID_PUBLIC_KEY: 'public', VAPID_PRIVATE_KEY: 'private', VAPID_SUBJECT: 'mailto:test@example.com' },
    importWebPush: async () => fakeWebPush
  });
  await delivery.drain();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].options.urgency, 'normal');
  assert.deepEqual(finished[0].result, { sent: true });
});

test('gone push subscription is pruned without crashing the dispatcher', async () => {
  let claims = [{ notification_event_id: 'e', subscription_hash: 's', endpoint: 'https://push.example/gone', p256dh: 'p', auth: 'a', topic: 'x', payload: {} }];
  let outcome;
  const delivery = await createPushDelivery({
    store: {
      async enqueuePushDeliveries() {},
      async claimPushDeliveries() { const value = claims; claims = []; return value; },
      async finishPushDelivery(_claim, result) { outcome = result; }
    },
    env: { VAPID_PUBLIC_KEY: 'public', VAPID_PRIVATE_KEY: 'private', VAPID_SUBJECT: 'https://example.com' },
    importWebPush: async () => ({ setVapidDetails() {}, async sendNotification() { throw Object.assign(new Error('gone'), { statusCode: 410 }); } })
  });
  await delivery.drain();
  assert.deepEqual(outcome, { sent: false, gone: true, error: 'gone' });
});
