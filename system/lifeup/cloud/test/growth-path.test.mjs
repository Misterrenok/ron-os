import test from 'node:test';
import assert from 'node:assert/strict';
import { growthQuestForAttribute, growthQuestForSkill } from '../public/growth-path.js';

function quest({
  id,
  focused = false,
  status = 'ACTIVE',
  primary = null,
  secondary = [],
  attributes = []
}) {
  return {
    id,
    title: `Quest ${id}`,
    focused,
    status,
    growth: {
      primary_skill: primary ? { skill_id: primary } : null,
      secondary_skills: secondary.map((skill_id) => ({ skill_id })),
      attributes: attributes.map((name) => ({ name }))
    }
  };
}

test('focused active mapped Quest wins deterministically for a skill', () => {
  const quests = [
    quest({ id: 'background', primary: 'german-language' }),
    quest({ id: 'focused', focused: true, primary: 'german-language' })
  ];
  assert.deepEqual(growthQuestForSkill(quests, 'german-language'), {
    id: 'focused',
    title: 'Quest focused',
    focused: true
  });
});

test('one unique background active mapped Quest is actionable without changing focus', () => {
  const quests = [quest({ id: 'only', primary: 'german-language' })];
  assert.deepEqual(growthQuestForSkill(quests, 'german-language'), {
    id: 'only',
    title: 'Quest only',
    focused: false
  });
});

test('multiple non-focused active candidates fail closed instead of guessing', () => {
  const quests = [
    quest({ id: 'a', primary: 'german-language' }),
    quest({ id: 'b', secondary: ['german-language'] })
  ];
  assert.equal(growthQuestForSkill(quests, 'german-language'), null);
});

test('terminal mapped quests are ignored', () => {
  const quests = [
    quest({ id: 'done', focused: true, status: 'COMPLETED', primary: 'german-language' }),
    quest({ id: 'cancelled', status: 'CANCELLED', attributes: ['INT'] })
  ];
  assert.equal(growthQuestForSkill(quests, 'german-language'), null);
  assert.equal(growthQuestForAttribute(quests, 'INT'), null);
});

test('attribute path resolves the already-focused active quest', () => {
  const quests = [
    quest({ id: 'lesson3', focused: true, primary: 'german-language', attributes: ['INT'] })
  ];
  assert.deepEqual(growthQuestForAttribute(quests, 'INT'), {
    id: 'lesson3',
    title: 'Quest lesson3',
    focused: true
  });
});

test('different targets never cross-link', () => {
  const quests = [
    quest({ id: 'german', focused: true, primary: 'german-language', attributes: ['INT'] })
  ];
  assert.equal(growthQuestForSkill(quests, 'marketplace-operations'), null);
  assert.equal(growthQuestForAttribute(quests, 'STR'), null);
});
