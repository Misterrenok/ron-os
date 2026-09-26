import { applyCalibrationProjection } from './calibration.mjs';
import { progressionPlayerView } from './progression-player-view.mjs';
import { buildSnapshot } from './quest-v2.mjs';
import { deriveExecutionStreak } from './streak-policy.mjs';
import { pressureProfileStatus } from './pressure-profile.mjs';
import { buildGrowthProjection } from './growth-engine.mjs';

export function buildPlayerSnapshot(events = [], { now = Date.now() } = {}) {
  const ledger = Array.isArray(events) ? events : [];
  const snapshot = applyCalibrationProjection(buildSnapshot(ledger));
  snapshot.progression = progressionPlayerView({ events: ledger });
  snapshot.streak = deriveExecutionStreak(ledger, { now });
  snapshot.pressure_profile = pressureProfileStatus(ledger, { now });
  snapshot.growth = buildGrowthProjection(ledger, { now });
  const baseSkills = new Map((snapshot.skills || []).map((skill) => [skill.id, skill]));
  snapshot.skills = snapshot.growth.skills.map((skill) => ({ ...(baseSkills.get(skill.id) || {}), ...skill }));
  return snapshot;
}
