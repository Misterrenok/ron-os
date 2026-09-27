import test from 'node:test';
import assert from 'node:assert/strict';
import { growthPreviewForQuest } from '../public/growth-preview.js';

const mappedQuest = {
  status: 'ACTIVE',
  reward_xp: 10,
  growth: {
    policy_ref: 'system-growth:v1',
    primary_skill: { skill_id: 'german-language', name: 'German Language', domain: 'language', evidence_kind: 'independent_output' },
    secondary_skills: [],
    attributes: [{ name: 'INT', kind: 'baseline' }]
  }
};

test('current-style mapped quest previews primary Mastery and attribute evidence', () => {
  assert.deepEqual(growthPreviewForQuest(mappedQuest), {
    label: 'РОСТ ПРИ ВЫПОЛНЕНИИ',
    text: 'Немецкий язык +10 мастерства · ИНТЕЛЛЕКТ: доказательство роста'
  });
});

test('secondary Mastery uses the same bounded half-XP quantum as Growth v1', () => {
  const view = growthPreviewForQuest({
    status: 'ACTIVE',
    reward_xp: 20,
    growth: {
      primary_skill: { skill_id: 'primary', name: 'Primary Skill' },
      secondary_skills: [{ skill_id: 'secondary', name: 'Secondary Skill' }],
      attributes: []
    }
  });
  assert.equal(view.text, 'Primary Skill +20 мастерства · Secondary Skill +10 мастерства');
});

test('E-rank 5 XP does not promise zero-value secondary Mastery', () => {
  const view = growthPreviewForQuest({
    status: 'ACTIVE',
    reward_xp: 5,
    growth: {
      primary_skill: { skill_id: 'primary', name: 'Primary Skill' },
      secondary_skills: [{ skill_id: 'secondary', name: 'Secondary Skill' }],
      attributes: []
    }
  });
  assert.equal(view.text, 'Primary Skill +5 мастерства');
});

test('unmapped or terminal quests do not advertise prospective growth', () => {
  assert.equal(growthPreviewForQuest({ status: 'ACTIVE', reward_xp: 10, growth: null }), null);
  assert.equal(growthPreviewForQuest({ ...mappedQuest, status: 'COMPLETED' }), null);
  assert.equal(growthPreviewForQuest({ ...mappedQuest, status: 'FAILED' }), null);
});

test('unscored mapped practice describes practice without fabricating Mastery XP', () => {
  const view = growthPreviewForQuest({
    status: 'ACTIVE',
    reward_xp: null,
    growth: {
      primary_skill: { skill_id: 'skill', name: 'Skill' },
      secondary_skills: [{ skill_id: 'secondary', name: 'Secondary' }],
      attributes: [{ name: 'DISC', kind: 'baseline' }]
    }
  });
  assert.equal(view.text, 'Skill: практика · Secondary: практика · ДИСЦИПЛИНА: доказательство роста');
});
