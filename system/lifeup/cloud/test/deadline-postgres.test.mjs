import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store-v2.mjs';
import { runDeadlineSweep } from '../src/deadline-engine.mjs';

const databaseUrl = process.env.TEST_DATABASE_URL?.trim();

test('PostgreSQL scheduler and push outbox converge idempotently', { skip: !databaseUrl }, async () => {
  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    PGSSL: process.env.PGSSL
  };
  process.env.DATABASE_URL = databaseUrl;
  process.env.PGSSL = 'disable';
  const store = await createStore();
  try {
    await store.init();
    const questId = 'pg-deadline-automation-v1';
    await store.applyAction({
      type: 'quest.create',
      payload: {
        quest_id: questId,
        quest_version: 2,
        title: 'Automatic expiry integration',
        deadline_at: '2000-01-01T00:00:00Z',
        objectives: []
      }
    }, { actor: 'ci', source: 'deadline-postgres-test', sourceRef: 'ci' }, 'pg-deadline-create-v1');

    await store.upsertPushSubscription({
      endpoint: 'https://push.example/deadline-postgres-v1',
      keys: { p256dh: 'test-p256dh', auth: 'test-auth' }
    });

    const first = await runDeadlineSweep({ store, now: Date.parse('2026-09-11T16:31:00Z') });
    assert.deepEqual(first.map((item) => item.kind), ['expiry', 'expired-notification']);
    const second = await runDeadlineSweep({ store, now: Date.parse('2026-09-11T16:32:00Z') });
    assert.deepEqual(second, []);

    const events = await store.listAllEvents();
    assert.equal(events.filter((event) => event.event_type === 'quest.expired' && event.payload.quest_id === questId).length, 1);
    assert.equal(events.filter((event) => event.event_type === 'notification.pushed' && event.payload.title.includes('Automatic expiry integration')).length, 1);

    await store.enqueuePushDeliveries();
    const claims = await store.claimPushDeliveries(20);
    const claim = claims.find((item) => item.endpoint === 'https://push.example/deadline-postgres-v1');
    assert.ok(claim);
    assert.equal(claim.payload.severity, 'CRITICAL');
    await store.finishPushDelivery(claim, { sent: false, gone: true, error: 'gone' });
  } finally {
    await store.close();
    if (previous.DATABASE_URL == null) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous.DATABASE_URL;
    if (previous.PGSSL == null) delete process.env.PGSSL;
    else process.env.PGSSL = previous.PGSSL;
  }
});
