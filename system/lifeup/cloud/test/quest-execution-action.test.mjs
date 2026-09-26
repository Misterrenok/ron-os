import test from 'node:test';
import assert from 'node:assert/strict';
import { questExecutionAction, questExecutionUrls } from '../public/quest-execution-action.js';

test('single safe URL becomes a generic execution action', () => {
  assert.deepEqual(
    questExecutionAction({
      title: 'Проверить документ',
      description: 'Открой https://example.com/work/item и выполни шаги.'
    }),
    { href: 'https://example.com/work/item', label: 'ОТКРЫТЬ ЗАДАНИЕ' }
  );
});

test('lesson-like quest gets a lesson action label without quest-id hardcoding', () => {
  assert.deepEqual(
    questExecutionAction({
      id: 'any-future-lesson-id',
      title: 'Немецкий с нуля: Бебрис A0 — урок 4',
      description: 'Ссылка: https://www.youtube.com/watch?v=future123 . Без дедлайна.'
    }),
    { href: 'https://www.youtube.com/watch?v=future123', label: 'НАЧАТЬ УРОК' }
  );
});

test('current Bebris lesson 3 canonical description still resolves its execution URL', () => {
  const action = questExecutionAction({
    id: 'qv2-german-a0-bebris-lesson3-20260926',
    title: 'Немецкий с нуля: Бебрис A0 — урок 3',
    description: 'Пройди урок 3. Ссылка: https://www.youtube.com/watch?v=d_bW8YApWac . Без дедлайна.'
  });
  assert.deepEqual(action, { href: 'https://www.youtube.com/watch?v=d_bW8YApWac', label: 'НАЧАТЬ УРОК' });
});

test('trailing prose punctuation is removed from the action URL', () => {
  assert.deepEqual(
    questExecutionUrls('Открой https://example.com/a?x=1, затем продолжай.'),
    ['https://example.com/a?x=1']
  );
});

test('multiple distinct URLs fail closed instead of guessing the primary action', () => {
  assert.equal(
    questExecutionAction({
      title: 'Сравнить два источника',
      description: 'Источник 1: https://a.example/x Источник 2: https://b.example/y'
    }),
    null
  );
});

test('strategy metadata alone cannot create an execution action', () => {
  assert.equal(
    questExecutionAction({
      title: 'Стратегическая задача',
      description: 'Выполни следующий реальный шаг.',
      strategy_context: { status: 'VERIFIED', file_id: 'xmind-file' }
    }),
    null
  );
});

test('duplicate textual copies of the same URL are deduplicated', () => {
  assert.deepEqual(
    questExecutionUrls('Открой https://example.com/a и при необходимости вернись к https://example.com/a.'),
    ['https://example.com/a']
  );
});
