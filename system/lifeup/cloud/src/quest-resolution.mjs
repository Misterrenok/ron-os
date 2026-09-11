import { createHash } from 'node:crypto';
import { CALIBRATION_REFS, rewardForQuestRank, validateCalibrationEventAgainstHistory } from './calibration.mjs';
import { actionToEvent, buildSnapshot, validateEventAgainstHistory } from './quest-v2.mjs';

function requireString(value, field, max) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > max) throw new Error(`${field} is too long`);
  return normalized;
}

function verifiedEvidence(value, field = 'evidence') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} must be an object`);
  if (value.status !== 'verified') throw new Error(`${field}.status must be verified`);
  const source = requireString(value.source ?? 'ron', `${field}.source`, 80);
  const ref = value.ref == null ? null : requireString(value.ref, `${field}.ref`, 500);
  return { status: 'verified', source, ref };
}

function derivedKey(rootKey, role) {
  const digest = createHash('sha256').update(`${rootKey}\u0000${role}`).digest('hex').slice(0, 48);
  return `resolve-${digest}`;
}

export function normalizeQuestResolution(action) {
  if (!action || typeof action !== 'object' || Array.isArray(action)) throw new Error('action body must be an object');
  if (action.type !== 'quest.resolve') throw new Error('action type must be quest.resolve');
  const payload = action.payload && typeof action.payload === 'object' && !Array.isArray(action.payload) ? action.payload : {};
  const questId = requireString(payload.quest_id, 'payload.quest_id', 100);
  const evidence = verifiedEvidence(payload.evidence, 'payload.evidence');
  const progressInput = payload.progress ?? [];
  if (!Array.isArray(progressInput)) throw new Error('payload.progress must be an array');
  if (progressInput.length > 32) throw new Error('payload.progress supports at most 32 objective updates');
  const seen = new Set();
  const progress = progressInput.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error(`payload.progress[${index}] must be an object`);
    const objectiveId = requireString(item.objective_id, `payload.progress[${index}].objective_id`, 100);
    if (seen.has(objectiveId)) throw new Error('quest.resolve accepts at most one update per objective');
    seen.add(objectiveId);
    const value = Number(item.value);
    if (!Number.isInteger(value) || value < 0 || value > 1_000_000_000) {
      throw new Error(`payload.progress[${index}].value must be an integer between 0 and 1000000000`);
    }
    return {
      objective_id: objectiveId,
      value,
      evidence: item.evidence == null ? evidence : verifiedEvidence(item.evidence, `payload.progress[${index}].evidence`)
    };
  });
  return { quest_id: questId, evidence, progress };
}

export function resolutionChildKeys(rootKey, progressCount) {
  if (typeof rootKey !== 'string' || rootKey.length < 8 || rootKey.length > 200) {
    throw new Error('Idempotency-Key header (8..200 chars) is required');
  }
  const progressKeys = Array.from({ length: progressCount }, (_, index) => (
    index === 0 ? rootKey : derivedKey(rootKey, `progress:${index}`)
  ));
  return {
    progress: progressKeys,
    completion: progressCount === 0 ? rootKey : derivedKey(rootKey, 'completion'),
    reward: derivedKey(rootKey, 'reward')
  };
}

export function prepareQuestResolution(events, action, context = {}) {
  const normalized = normalizeQuestResolution(action);
  const staged = events.map((event) => structuredClone(event));
  const progressActions = [];
  const progressEvents = [];

  for (const progress of normalized.progress) {
    const progressAction = {
      type: 'quest.progress',
      payload: {
        quest_id: normalized.quest_id,
        objective_id: progress.objective_id,
        value: progress.value,
        evidence: progress.evidence
      }
    };
    const event = actionToEvent(progressAction, context);
    validateEventAgainstHistory(event, staged);
    validateCalibrationEventAgainstHistory(event, staged);
    staged.push(event);
    progressActions.push(progressAction);
    progressEvents.push(event);
  }

  const snapshot = buildSnapshot(staged);
  const quest = snapshot.quests.find((item) => item.id === normalized.quest_id);
  if (!quest) throw new Error('quest does not exist');
  if (quest.quest_version !== 2) throw new Error('quest.resolve requires a Quest v2 quest');
  if (quest.status !== 'ACTIVE') throw new Error(`quest is not active: ${quest.status}`);
  for (const objective of quest.objectives.filter((item) => item.required)) {
    if (Number(objective.progress ?? 0) < Number(objective.target)) throw new Error('required objectives are incomplete');
    if (objective.progress_claim !== 'VERIFIED') throw new Error('required objective progress must be verified');
  }

  const completionAction = {
    type: 'quest.complete',
    payload: { quest_id: normalized.quest_id, evidence: normalized.evidence }
  };
  const completionEvent = actionToEvent(completionAction, context);
  validateEventAgainstHistory(completionEvent, staged);
  validateCalibrationEventAgainstHistory(completionEvent, staged);
  staged.push(completionEvent);

  const created = events.find((event) => event.event_type === 'quest.created' && event.payload?.quest_id === normalized.quest_id);
  if (!created) throw new Error('quest creation event is missing');
  const xp = created.payload?.reward_xp;
  const coins = created.payload?.reward_coins;
  const unscored = xp == null && coins == null;
  if (unscored) {
    return {
      normalized,
      progressActions,
      progressEvents,
      completionAction,
      completionEvent,
      reward: null,
      awardAction: null,
      awardEvent: null
    };
  }
  if (xp == null || coins == null) throw new Error('scored quest requires both reward_xp and reward_coins');
  if (created.payload?.reward_policy_ref !== CALIBRATION_REFS.reward) {
    throw new Error('quest is not scored under system-quest-reward:v1');
  }
  const reward = rewardForQuestRank(created.payload.rank);
  if (Number(xp) !== reward.xp || Number(coins) !== reward.coins) {
    throw new Error('quest reward does not match system-quest-reward:v1');
  }

  const awardAction = {
    type: 'progression.award',
    payload: {
      xp: reward.xp,
      coins: reward.coins,
      basis_event_id: completionEvent.event_id,
      evidence: normalized.evidence
    }
  };
  const awardEvent = actionToEvent(awardAction, context);
  validateEventAgainstHistory(awardEvent, staged);
  validateCalibrationEventAgainstHistory(awardEvent, staged);

  return {
    normalized,
    progressActions,
    progressEvents,
    completionAction,
    completionEvent,
    reward,
    awardAction,
    awardEvent
  };
}

export function awardActionForCompletion(plan, completionEventId) {
  if (!plan.reward) return null;
  return {
    type: 'progression.award',
    payload: {
      xp: plan.reward.xp,
      coins: plan.reward.coins,
      basis_event_id: completionEventId,
      evidence: plan.normalized.evidence
    }
  };
}
