import test from 'node:test';
import assert from 'node:assert/strict';
import { bytesToBase64Url, subscriptionApplicationServerKey, subscriptionUsesPublicKey } from '../public/push-key-rotation.js';

test('push subscription key comparison detects VAPID rotation', () => {
  const key = Uint8Array.from([4, 1, 2, 3, 254, 255]);
  const expected = bytesToBase64Url(key);
  const subscription = { options: { applicationServerKey: key.buffer } };
  assert.equal(subscriptionApplicationServerKey(subscription), expected);
  assert.equal(subscriptionUsesPublicKey(subscription, expected), true);
  assert.equal(subscriptionUsesPublicKey(subscription, expected + 'x'), false);
  assert.equal(subscriptionUsesPublicKey({}, expected), false);
});
