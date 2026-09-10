import test from 'node:test';
import assert from 'node:assert/strict';
import { resolvePgPool } from '../src/store.mjs';

test('pg exposes a constructible Pool through the runtime import shape', async () => {
  const pgModule = await import('pg');
  const Pool = resolvePgPool(pgModule);
  assert.equal(typeof Pool, 'function');
  const pool = new Pool({ connectionString: 'postgresql://user:pass@localhost:5432/db', max: 1 });
  assert.equal(typeof pool.query, 'function');
  await pool.end();
});
