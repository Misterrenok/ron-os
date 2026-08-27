'use strict';

// Non-runtime regression harness for the Trendyol print automation project.
// Contract: `rows` must already be normalized as full order rows in actual
// top-to-bottom DOM order. This selector never guesses a row: ambiguous or
// missing identity fails closed with null.

function normalizeKey(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function selectNextRowBelow(rows, currentKey) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const key = normalizeKey(currentKey);
  if (!key) return null;

  const currentMatches = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i] || {};
    if (row.visible === false) continue;
    if (normalizeKey(row.key) === key) currentMatches.push(i);
  }

  if (currentMatches.length !== 1) return null;

  const currentIndex = currentMatches[0];
  for (let i = currentIndex + 1; i < rows.length; i += 1) {
    const row = rows[i] || {};
    if (row.visible === false || row.eligible !== true) continue;

    const candidateKey = normalizeKey(row.key);
    if (!candidateKey) return null;

    let candidateMatches = 0;
    for (let j = 0; j < rows.length; j += 1) {
      const other = rows[j] || {};
      if (other.visible === false) continue;
      if (normalizeKey(other.key) === candidateKey) candidateMatches += 1;
    }
    if (candidateMatches !== 1) return null;

    return { index: i, key: candidateKey };
  }

  return null;
}

function assertEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${label}: expected ${e}, got ${a}`);
}

const base = [
  { key: 'A', visible: true, eligible: true },
  { key: 'B', visible: true, eligible: true },
  { key: 'C', visible: true, eligible: true },
];

assertEqual(selectNextRowBelow(base, 'A'), { index: 1, key: 'B' }, 'normal next row');
assertEqual(selectNextRowBelow(base, 'B'), { index: 2, key: 'C' }, 'top-to-bottom direction');
assertEqual(selectNextRowBelow(base, 'C'), null, 'no row below');
assertEqual(selectNextRowBelow(base, 'X'), null, 'missing current row');
assertEqual(selectNextRowBelow(base, ''), null, 'empty current key');
assertEqual(selectNextRowBelow([
  { key: 'A', visible: true, eligible: true },
  { key: 'A', visible: true, eligible: true },
  { key: 'B', visible: true, eligible: true },
], 'A'), null, 'duplicate current key fails closed');
assertEqual(selectNextRowBelow([
  { key: 'A', visible: true, eligible: true },
  { key: 'X', visible: true, eligible: false },
  { key: 'B', visible: true, eligible: true },
], 'A'), { index: 2, key: 'B' }, 'skip non-eligible row');
assertEqual(selectNextRowBelow([
  { key: 'A', visible: true, eligible: true },
  { key: 'HIDDEN', visible: false, eligible: true },
  { key: 'B', visible: true, eligible: true },
], 'A'), { index: 2, key: 'B' }, 'skip hidden row');
assertEqual(selectNextRowBelow([
  { key: 'A', visible: true, eligible: true },
  { key: '', visible: true, eligible: true },
  { key: 'B', visible: true, eligible: true },
], 'A'), null, 'eligible row without key fails closed');
assertEqual(selectNextRowBelow([
  { key: 'A', visible: true, eligible: true },
  { key: 'B', visible: true, eligible: true },
  { key: 'B', visible: true, eligible: true },
], 'A'), null, 'duplicate candidate key fails closed');

console.log('PASS trendyol next-row selector: 10/10');
