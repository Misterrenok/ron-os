const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync(path.join(__dirname, 'safe-next.js'), 'utf8');
const warnings = [];
const sandbox = {
  window: {},
  document: { addEventListener() {} },
  console: { warn: (...args) => warnings.push(args.join(' ')) },
};

vm.runInNewContext(code, sandbox);
const api = sandbox.window.__ronTrendyolNextV22;
assert(api, 'debug API should be exposed');

const row = (top, name) => ({
  name,
  getBoundingClientRect: () => ({ top, width: 100, height: 20 }),
});

const above = row(20, 'above');
const current = row(100, 'current');
const belowFar = row(220, 'belowFar');
const belowNear = row(140, 'belowNear');

assert.strictEqual(
  api.chooseNextRow([belowFar, above, current, belowNear], current),
  belowNear,
  'must choose nearest visually lower row, not DOM order/top row'
);

assert.strictEqual(
  api.chooseNextRow([above, current], current),
  null,
  'must fail closed when nothing is below'
);

assert.strictEqual(
  api.chooseNextRow([above, belowNear], current),
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

console.log('PASS trendyol-next-safe: visual below selection + fail-closed guards');
