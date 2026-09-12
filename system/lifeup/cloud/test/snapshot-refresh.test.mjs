import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSnapshotRefreshCoordinator,
  shouldRefreshSnapshot,
  SNAPSHOT_REFRESH_INTERVAL_MS
} from '../public/snapshot-refresh.js';

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

test('coalesces concurrent snapshot reads and releases the lock after completion', async () => {
  const reads = [];
  const coordinator = createSnapshotRefreshCoordinator(() => {
    const pending = deferred();
    reads.push(pending);
    return pending.promise;
  });

  const first = coordinator.run();
  const duplicate = coordinator.run();
  assert.strictEqual(duplicate, first);
  await Promise.resolve();
  assert.equal(reads.length, 1);

  reads[0].resolve('snapshot-1');
  assert.equal(await first, 'snapshot-1');

  const second = coordinator.run();
  await Promise.resolve();
  assert.equal(reads.length, 2);
  reads[1].resolve('snapshot-2');
  assert.equal(await second, 'snapshot-2');
});

test('write read-back waits for a stale poll and then coalesces one fresh read', async () => {
  const reads = [];
  const coordinator = createSnapshotRefreshCoordinator(() => {
    const pending = deferred();
    reads.push(pending);
    return pending.promise;
  });

  const stale = coordinator.run();
  await Promise.resolve();
  const freshA = coordinator.runAfterCurrent();
  const freshB = coordinator.runAfterCurrent();
  reads[0].resolve('stale');
  assert.equal(await stale, 'stale');
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(reads.length, 2);

  reads[1].resolve('fresh');
  assert.equal(await freshA, 'fresh');
  assert.equal(await freshB, 'fresh');
});

test('a failed poll does not poison later refreshes', async () => {
  let calls = 0;
  const coordinator = createSnapshotRefreshCoordinator(async () => {
    calls += 1;
    if (calls === 1) throw new Error('offline');
    return 'recovered';
  });

  await assert.rejects(coordinator.run(), /offline/);
  assert.equal(await coordinator.run(), 'recovered');
  assert.equal(calls, 2);
});

test('automatic refresh runs only for an enabled visible online client', () => {
  assert.equal(SNAPSHOT_REFRESH_INTERVAL_MS, 30_000);
  assert.equal(shouldRefreshSnapshot({ enabled: true, visibilityState: 'visible', online: true }), true);
  assert.equal(shouldRefreshSnapshot({ enabled: true, visibilityState: 'hidden', online: true }), false);
  assert.equal(shouldRefreshSnapshot({ enabled: true, visibilityState: 'visible', online: false }), false);
  assert.equal(shouldRefreshSnapshot({ enabled: false, visibilityState: 'visible', online: true }), false);
});
