import { applyCalibrationProjection } from './calibration.mjs';
import { progressionPlayerView } from './progression-player-view.mjs';
import { buildSnapshot } from './quest-v2.mjs';

export function buildPlayerSnapshot(events = []) {
  const ledger = Array.isArray(events) ? events : [];
  const snapshot = applyCalibrationProjection(buildSnapshot(ledger));
  snapshot.progression = progressionPlayerView({ events: ledger });
  return snapshot;
}
