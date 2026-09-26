import test from 'node:test';
import assert from 'node:assert/strict';
import { createPushDelivery, describePushError, pushConfiguration, pushSubscriptionIsGone } from '../src/push-delivery.mjs';

const TEST_VAPID_PRIVATE = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE';
const TEST_VAPID_PUBLIC = 'BGsX0fLhLEJH-Lzm5WOkQPJ3A32BLeszoPShOUXYmMKWT-NC4v4af5uO5-tKfA-eFivOM1drMV7Oy7ZAaDe_UfU';
const TEST_VAPID_ENV = { VAPID_PUBLIC_KEY: 'corrupted-public-key', VAPID_PRIVATE_KEY: TEST_VAPID_PRIVATE, VAPID_SUBJECT: 'mailto:test@example.com' };

test('push remains safely disabled when VAPID configuration is incomplete', async () => {
  assert.equal(pushConfiguration({ VAPID_PUBLIC_KEY: 'public' }).enabled, false);
  const delivery = await createPushDelivery({ store: {}, env: { VAPID_PUBLIC_KEY: 'public' } });
  assert.equal(delivery.enabled, false);
  await delivery.drain();
});

test('VAPID public key is derived from the private scalar and repairs a corrupted configured public key', () => {
  const config = pushConfiguration(TEST_VAPID_ENV);
  assert.equal(config.enabled, true);
  assert.equal(config.publicKeyRepaired, true);
  assert.equal(config.publicKey, TEST_VAPID_PUBLIC);
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
    setVapidDetails(...args) { assert.deepEqual(args, ['mailto:test@example.com', TEST_VAPID_PUBLIC, TEST_VAPID_PRIVATE]); },
    async sendNotification(subscription, payload, options) { sent.push({ subscription, payload: JSON.parse(payload), options }); }
  };
  const delivery = await createPushDelivery({
    store,
    env: TEST_VAPID_ENV,
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
    env: { ...TEST_VAPID_ENV, VAPID_SUBJECT: 'https://example.com' },
    importWebPush: async () => ({ setVapidDetails() {}, async sendNotification() { throw Object.assign(new Error('gone'), { statusCode: 410 }); } })
  });
  await delivery.drain();
  assert.deepEqual(outcome, { sent: false, gone: true, error: 'gone | status=410' });
});

test('VAPID subscription-key mismatch is permanent rather than retried forever', () => {
  assert.equal(pushSubscriptionIsGone(Object.assign(new Error('mismatch'), {
    statusCode: 403,
    body: 'the VAPID credentials in the authorization header do not correspond to the credentials used to create the subscriptions.'
  })), true);
  assert.equal(pushSubscriptionIsGone(Object.assign(new Error('temporary'), { statusCode: 503, body: 'try again' })), false);
});

test('push provider diagnostics preserve status and bounded body', () => {
  assert.equal(
    describePushError(Object.assign(new Error('Received unexpected response code'), { statusCode: 403, body: 'Forbidden by push provider' })),
    'Received unexpected response code | status=403 | body=Forbidden by push provider'
  );
});
