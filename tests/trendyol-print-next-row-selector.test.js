'use strict';

const assert = require('node:assert/strict');

/**
 * Select the unique next eligible visible row strictly below the current row.
 *
 * Contract:
 * - current row is identified by NEXT_ROW_KEY (`key`) among visible rows;
 * - current identity must be unique, otherwise fail closed;
 * - candidates must be visible, eligible, and have a finite top strictly greater
 *   than the current row's top;
 * - the candidate with the smallest top wins only if that top is unique;
 * - any ambiguity or missing row returns null.
 *
 * This function intentionally knows nothing about Trendyol DOM selectors. A live
 * DOM adapter must normalize table rows into this shape before integration.
 */
function selectNextRowIndex(rows, currentKey) {
  if (!Array.isArray(rows) || currentKey == null) return null;

  const visibleCurrentMatches = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row || row.hidden === true || !Number.isFinite(row.top)) continue;
    if (row.key === currentKey) visibleCurrentMatches.push(i);
  }

  if (visibleCurrentMatches.length !== 1) return null;

  const currentIndex = visibleCurrentMatches[0];
  const currentTop = rows[currentIndex].top;
  let bestTop = Infinity;
  let bestIndex = null;
  let bestTopCount = 0;

  for (let i = 0; i < rows.length; i += 1) {
    if (i === currentIndex) continue;
    const row = rows[i];
    if (!row || row.hidden === true || row.eligible !== true || !Number.isFinite(row.top)) continue;
    if (row.top <= currentTop) continue;

    if (row.top < bestTop) {
      bestTop = row.top;
      bestIndex = i;
      bestTopCount = 1;
    } else if (row.top === bestTop) {
      bestTopCount += 1;
    }
  }

  return bestIndex !== null && bestTopCount === 1 ? bestIndex : null;
}

const cases = [
  {
    name: 'selects nearest eligible visible row strictly below current',
    rows: [
      { key: 'A', top: 100, eligible: true },
      { key: 'B', top: 200, eligible: true },
      { key: 'C', top: 300, eligible: true },
    ],
    currentKey: 'A',
    expected: 1,
  },
  {
    name: 'does not jump upward when current row is in the middle',
    rows: [
      { key: 'A', top: 100, eligible: true },
      { key: 'B', top: 200, eligible: true },
      { key: 'C', top: 300, eligible: true },
    ],
    currentKey: 'B',
    expected: 2,
  },
  {
    name: 'skips hidden rows',
    rows: [
      { key: 'A', top: 100, eligible: true },
      { key: 'B', top: 150, eligible: true, hidden: true },
      { key: 'C', top: 200, eligible: true },
    ],
    currentKey: 'A',
    expected: 2,
  },
  {
    name: 'skips ineligible rows',
    rows: [
      { key: 'A', top: 100, eligible: true },
      { key: 'B', top: 150, eligible: false },
      { key: 'C', top: 200, eligible: true },
    ],
    currentKey: 'A',
    expected: 2,
  },
  {
    name: 'fails closed when current row is missing',
    rows: [{ key: 'B', top: 200, eligible: true }],
    currentKey: 'A',
    expected: null,
  },
  {
    name: 'fails closed when current row key is ambiguous among visible rows',
    rows: [
      { key: 'A', top: 100, eligible: true },
      { key: 'A', top: 200, eligible: true },
      { key: 'B', top: 300, eligible: true },
    ],
    currentKey: 'A',
    expected: null,
  },
  {
    name: 'hidden duplicate current key does not create ambiguity',
    rows: [
      { key: 'A', top: 50, eligible: true, hidden: true },
      { key: 'A', top: 100, eligible: true },
      { key: 'B', top: 200, eligible: true },
    ],
    currentKey: 'A',
    expected: 2,
  },
  {
    name: 'fails closed when no eligible row exists below current',
    rows: [
      { key: 'A', top: 100, eligible: true },
      { key: 'B', top: 200, eligible: false },
    ],
    currentKey: 'A',
    expected: null,
  },
  {
    name: 'fails closed when nearest next vertical position is ambiguous',
    rows: [
      { key: 'A', top: 100, eligible: true },
      { key: 'B', top: 200, eligible: true },
      { key: 'C', top: 200, eligible: true },
    ],
    currentKey: 'A',
    expected: null,
  },
  {
    name: 'ignores malformed row positions instead of guessing',
    rows: [
      { key: 'A', top: 100, eligible: true },
      { key: 'B', top: Number.NaN, eligible: true },
      { key: 'C', top: 250, eligible: true },
    ],
    currentKey: 'A',
    expected: 2,
  },
];

for (const testCase of cases) {
  assert.equal(
    selectNextRowIndex(testCase.rows, testCase.currentKey),
    testCase.expected,
    testCase.name,
  );
}

console.log(`PASS ${cases.length}/${cases.length} trendyol next-row selector cases`);
