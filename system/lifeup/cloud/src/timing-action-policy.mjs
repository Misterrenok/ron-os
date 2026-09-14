export const ACTIVE_TIMING_WRITE_MODES = ['NONE', 'HARD_EXTERNAL'];

function questCreatePayload(action) {
  const payload = action?.payload;
  return action?.type === 'quest.create'
    && payload
    && typeof payload === 'object'
    && !Array.isArray(payload)
    ? payload
    : null;
}

function isQuestV2Create(action) {
  const payload = questCreatePayload(action);
  return Boolean(payload)
    && (payload.quest_version === 2 || 'deadline_at' in payload || 'objectives' in payload || 'visibility' in payload);
}

export function validateTimingAction(action) {
  const createPayload = questCreatePayload(action);
  if (createPayload && ('timing_mode' in createPayload || 'challenge_contract' in createPayload) && !isQuestV2Create(action)) {
    throw new Error('timing fields require a Quest v2 create');
  }
  if (!isQuestV2Create(action)) return null;

  const payload = action.payload;
  const deadline = payload.deadline_at == null ? null : new Date(payload.deadline_at);
  if (deadline && Number.isNaN(deadline.getTime())) throw new Error('payload.deadline_at must be a valid timestamp or null');

  const mode = payload.timing_mode ?? (deadline ? null : 'NONE');
  if (deadline && mode == null) throw new Error('payload.timing_mode is required when payload.deadline_at is set');
  if (!deadline && mode !== 'NONE') throw new Error(`payload.timing_mode ${mode} requires payload.deadline_at`);
  if (deadline && !['HARD_EXTERNAL', 'CHALLENGE'].includes(mode)) {
    throw new Error('deadline-bearing Quest v2 requires timing_mode HARD_EXTERNAL or CHALLENGE');
  }
  if (mode === 'CHALLENGE') {
    throw new Error('CHALLENGE timing is not activated in the current runtime; use HARD_EXTERNAL only for a real external deadline or create the quest without a deadline');
  }
  if (payload.challenge_contract != null) throw new Error('payload.challenge_contract is allowed only after CHALLENGE runtime activation');
  return { timing_mode: mode };
}
