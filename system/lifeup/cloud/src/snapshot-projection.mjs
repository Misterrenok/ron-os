import { applyCalibrationProjection } from './calibration.mjs';
import { progressionPlayerView } from './progression-player-view.mjs';
import { buildSnapshot } from './quest-v2.mjs';
import { deriveExecutionStreak } from './streak-policy.mjs';

export function buildPlayerSnapshot(events = [], { now = Date.now() } = {}) {
  const ledger = Array.isArray(events) ? events : [];
  const snapshot = applyCalibrationProjection(buildSnapshot(ledger));
  snapshot.progression = progressionPlayerView({ events: ledger });
  snapshot.streak = deriveExecutionStreak(ledger, { now });
  return snapshot;
}
