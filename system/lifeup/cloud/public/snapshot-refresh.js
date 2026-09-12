export const SNAPSHOT_REFRESH_INTERVAL_MS = 30_000;

export function shouldRefreshSnapshot({ enabled, visibilityState, online }) {
  return Boolean(enabled) && visibilityState === 'visible' && online !== false;
}

export function createSnapshotRefreshCoordinator(loadSnapshot) {
  if (typeof loadSnapshot !== 'function') throw new TypeError('loadSnapshot must be a function');

  let inFlight = null;

  function run() {
    if (inFlight) return inFlight;

    const task = Promise.resolve().then(loadSnapshot);
    const tracked = task.finally(() => {
      if (inFlight === tracked) inFlight = null;
    });
    inFlight = tracked;
    return tracked;
  }

  async function runAfterCurrent() {
    if (inFlight) {
      try {
        await inFlight;
      } catch {
        // A write-triggered read-back still gets a fresh attempt after a failed poll.
      }
    }
    return run();
  }

  return { run, runAfterCurrent };
}
