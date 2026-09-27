import test from 'node:test';
import assert from 'node:assert/strict';
import {
  growthReadinessPlayerView,
  growthRequirementPlayerText
} from '../public/growth-readiness.js';

test('known Skill evidence requirements become compact Russian player text', () => {
  assert.equal(growthRequirementPlayerText('verified_evidence_count>=4'), 'подтверждённых результатов ≥4');
  assert.equal(growthRequirementPlayerText('evidence_span_days>=7'), 'период доказательств ≥7 дн.');
  assert.equal(growthRequirementPlayerText('independent_output_or_stronger>=2'), 'самостоятельных результатов ≥2');
  assert.equal(growthRequirementPlayerText('objective_benchmark_or_stronger>=1'), 'объективных проверок ≥1');
});

test('known Attribute evidence requirements become compact Russian player text', () => {
  assert.equal(growthRequirementPlayerText('repeated_execution_or_stronger>=1'), 'повторных выполнений ≥1');
  assert.equal(growthRequirementPlayerText('difficult_outcome_or_stronger>=2'), 'сложных результатов ≥2');
  assert.equal(growthRequirementPlayerText('external_validation_or_stronger>=1'), 'внешних подтверждений ≥1');
  assert.equal(growthRequirementPlayerText('no_conflicting_duplicate_refs'), 'устранить конфликт доказательств');
});

test('unknown internal requirement fails safe without leaking its identifier', () => {
  assert.equal(growthRequirementPlayerText('future_internal_code>=99'), 'нужно дополнительное подтверждение');
});

test('readiness view summarizes the next Tier gate', () => {
  assert.deepEqual(growthReadinessPlayerView({
    next_candidate: 2,
    next_failed_requirements: [
      'verified_evidence_count>=4',
      'evidence_span_days>=7',
      'independent_output_or_stronger>=2'
    ],
    status: 'CALIBRATED'
  }), {
    ready: false,
    label: 'ДО ТИРА 2: подтверждённых результатов ≥4 · период доказательств ≥7 дн. · самостоятельных результатов ≥2',
    requirements: [
      'подтверждённых результатов ≥4',
      'период доказательств ≥7 дн.',
      'самостоятельных результатов ≥2'
    ]
  });
});

test('evolution-ready and max-tier states do not invent unmet gates', () => {
  assert.deepEqual(growthReadinessPlayerView({
    next_candidate: 2,
    highest_eligible_level: 2,
    next_failed_requirements: [],
    status: 'EVOLUTION_READY'
  }), {
    ready: true,
    label: 'ТИР 2 ГОТОВ К ПОВЫШЕНИЮ',
    requirements: []
  });
  assert.deepEqual(growthReadinessPlayerView({
    next_candidate: null,
    next_failed_requirements: [],
    status: 'CALIBRATED'
  }), {
    ready: false,
    label: 'МАКСИМАЛЬНЫЙ ТИР',
    requirements: []
  });
});
