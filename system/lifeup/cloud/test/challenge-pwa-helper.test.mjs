import test from 'node:test';
import assert from 'node:assert/strict';
import { challengeFocusCopy, challengeTimingRows } from '../public/challenge-timing-view.js';

const formatDate = (value) => `DATE:${value}`;

test('Challenge helper renders explicit deadline and preaccepted recovery copy', () => {
  const timing = { kind: 'CHALLENGE', at: '2026-09-20T12:00:00Z', recovery_title: 'Короткое восстановление' };
  assert.deepEqual(challengeTimingRows(timing, formatDate), [
    ['Испытание до', 'DATE:2026-09-20T12:00:00Z'],
    ['Если пропустить', 'Активируется восстановление «Короткое восстановление»']
  ]);
  assert.deepEqual(challengeFocusCopy(timing, 'ACTIVE', formatDate), {
    deadline: 'ИСПЫТАНИЕ ДО: DATE:2026-09-20T12:00:00Z · ВОССТАНОВЛЕНИЕ: Короткое восстановление',
    time_label: 'ДО ИСПЫТАНИЯ'
  });
  assert.equal(challengeFocusCopy(timing, 'OVERDUE', formatDate).time_label, 'ИСПЫТАНИЕ ИСТЕКЛО');
  assert.equal(challengeTimingRows({ kind: 'HARD' }, formatDate), null);
});
