const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync(path.join(__dirname, 'safe-next.js'), 'utf8');
const warnings = [];
const listeners = {};
const sandbox = {
  window: {},
  document: {
    addEventListener(type, handler) {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    },
  },
  console: { warn: (...args) => warnings.push(args.join(' ')) },
};

vm.runInNewContext(code, sandbox);
const api = sandbox.window.__ronTrendyolNextV22;
assert(api, 'debug API should be exposed');

const simpleRow = (top, name) => ({
  name,
  getBoundingClientRect: () => ({ top, width: 100, height: 20 }),
});

const above = simpleRow(20, 'above');
const currentSimple = simpleRow(100, 'current');
const belowFar = simpleRow(220, 'belowFar');
const belowNear = simpleRow(140, 'belowNear');

assert.strictEqual(
  api.chooseNextRow([belowFar, above, currentSimple, belowNear], currentSimple),
  belowNear,
  'must choose nearest visually lower row, not DOM order/top row'
);

assert.strictEqual(
  api.chooseNextRow([above, currentSimple], currentSimple),
  null,
  'must fail closed when nothing is below'
);

assert.strictEqual(
  api.chooseNextRow([above, belowNear], currentSimple),
  null,
  'must fail closed if current row identity is absent'
);

assert.strictEqual(
  api.printNextBelow(),
  false,
  'must fail closed before exact current row is learned'
);

assert(
  warnings.some((x) => x.includes('no exact current printed row')),
  'must explain fail-closed reason'
);

// Attribution regression: arbitrary synthetic Sticker clicks must not establish current-row identity.
const scope = { querySelectorAll: () => [] };
function makeRow(top, key) {
  return {
    key,
    isConnected: true,
    parentElement: scope,
    getBoundingClientRect: () => ({ top, width: 100, height: 20 }),
    getAttribute: (name) => name === 'data-row-key' ? key : null,
    closest: (selector) => selector === 'tbody,[role="rowgroup"],table' ? scope : null,
    querySelectorAll: () => [],
  };
}
function makeAction(row, text = 'Kargo Etiketi Sticker Yazdır') {
  const action = {
    textContent: text,
    disabled: false,
    clickCount: 0,
    getBoundingClientRect: () => ({ top: row.getBoundingClientRect().top, width: 80, height: 20 }),
    getAttribute: () => null,
    closest: (selector) => selector === 'button,a,[role="button"]' ? action
      : selector === 'tr,[role="row"],[data-row-key]' ? row
      : null,
    click() { this.clickCount += 1; },
  };
  return action;
}

const current = makeRow(100, 'current');
const next = makeRow(140, 'next');
const currentAction = makeAction(current);
const nextAction = makeAction(next);
current.querySelectorAll = () => [currentAction];
next.querySelectorAll = () => [nextAction];
scope.querySelectorAll = () => [current, next];

assert.strictEqual(
  api.rememberRowFromTrustedStickerClick({ isTrusted: false, target: currentAction }),
  false,
  'synthetic Sticker click must not establish initial current row'
);
assert.strictEqual(api.getCurrentRow(), null, 'synthetic click must leave current row unset');

assert.strictEqual(
  api.rememberRowFromTrustedStickerClick({ isTrusted: true, target: currentAction }),
  true,
  'trusted Sticker click should establish current row'
);
assert.strictEqual(api.getCurrentRow(), current, 'trusted click must identify the exact row');

assert.strictEqual(api.printNextBelow(), true, 'next print should execute with trusted attribution');
assert.strictEqual(nextAction.clickCount, 1, 'must click exactly one Sticker in the nearest lower row');
assert.strictEqual(api.getCurrentRow(), next, 'successful owned next click should advance current row');

console.log('PASS trendyol-next-safe: visual selection + trusted attribution + fail-closed guards');
