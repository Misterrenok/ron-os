import test from 'node:test';
import assert from 'node:assert/strict';
import { allowsUnauthenticatedSnapshotRead } from '../src/read-access.mjs';

function probe(url, method = 'GET') {
  const parsed = new URL(url, 'https://system.example');
  return allowsUnauthenticatedSnapshotRead({
    method,
    pathname: parsed.pathname,
    searchParams: parsed.searchParams
  });
}

test('visual audit access is GET-only and snapshot-only', () => {
  assert.equal(probe('/api/v1/snapshot?visual-audit=1'), true);
  assert.equal(probe('/api/v1/snapshot'), false);
  assert.equal(probe('/api/v1/events?visual-audit=1'), false);
  assert.equal(probe('/api/v1/snapshot?visual-audit=1', 'POST'), false);
  assert.equal(probe('/api/v1/snapshot?visual-audit=1', 'DELETE'), false);
});
