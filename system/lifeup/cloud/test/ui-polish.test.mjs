import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../public/', import.meta.url);
const read = (name) => readFile(new URL(name, root), 'utf8');

const [html, utility, polish, worker] = await Promise.all([
  read('index-v2.html'),
  read('player-utility.js'),
  read('ui-polish.css'),
  read('sw-v2.js')
]);

test('player shell exposes polished Russian navigation and accessible progress controls', () => {
  assert.match(html, /data-view="notifications">УВЕДОМЛЕНИЯ</);
  assert.match(html, /class="xp-track" role="progressbar"/);
  assert.match(html, /id="pushButton" class="push-toggle"[^>]*role="switch"[^>]*aria-checked="false"/);
  assert.match(html, /ui-polish\.css/);
});

test('player utility keeps skill evidence Russian and removes internal metadata from the player surface', () => {
  assert.match(utility, /УРОВЕНЬ НЕ ОПРЕДЕЛЁН/);
  assert.match(utility, /Около 4 месяцев практической работы с Trendyol/);
  assert.match(utility, /Турецкий язык — уровень C1, подтверждён экзаменом/);
  assert.match(utility, /Уровень подтверждается реальными навыками и практическими результатами/);
  assert.match(utility, /removeDetailRows\(card, \['Тип', 'ID сообщения'\]\)/);
  assert.match(utility, /removeDetailRows\(card, \['Тип события', 'ID события', 'Ссылка источника'\]\)/);
  assert.doesNotMatch(utility, /Tier 3/);
  assert.doesNotMatch(utility, /externally confirmed/);
  assert.doesNotMatch(utility, /Система · API/);
  assert.match(utility, /АВТОМАТИЧЕСКИ/);
  assert.match(utility, /status-chip/);
  assert.match(utility, /КАРТА СТРАТЕГИИ ↗/);
  assert.match(utility, /credentials: 'omit'/);
  assert.doesNotMatch(utility, /credentials: 'same-origin'/);
});

test('polish stylesheet provides readable evidence sections, clear disclosure affordance and mobile push control', () => {
  assert.match(polish, /\.skill-evidence-section/);
  assert.match(polish, /overflow-wrap: anywhere/);
  assert.match(polish, /\.detail-card > summary::after\s*\{[^}]*content: "›"/s);
  assert.match(polish, /\.detail-card\[open\] > summary::after\s*\{[^}]*content: "⌄"/s);
  assert.match(polish, /\.status-chip\[data-status="unread"\]/);
  assert.match(polish, /\.push-toggle\[data-state="on"\]/);
  assert.match(polish, /@media \(max-width: 700px\)/);
  assert.match(polish, /\.achievement-card \.badge\s*\{[^}]*white-space: normal[^}]*overflow-wrap: anywhere/s);
});

test('offline PWA shell caches the polish layer and player utility', () => {
  assert.match(worker, /ron-system-shell-v21/);
  assert.match(worker, /ui-polish\.css/);
  assert.match(worker, /player-utility\.js/);
});
