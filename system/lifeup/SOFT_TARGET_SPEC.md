# System Soft Target v1

Policy ref: `system-soft-target:v1`.

## Purpose
Use a recommended completion time to create useful pressure without turning every self-improvement task into an artificial failure condition.

## Three timing modes
1. **No target** — valid when timing adds no useful pressure.
2. **Soft target** — default when earlier execution is useful but missing the time should not invalidate the real-world outcome.
3. **Hard deadline** — only when the underlying commitment has a real deadline or Ron explicitly accepts a time-bounded challenge whose miss should end the quest.

## Ledger representation
Soft targets do not create a new mutable store or quest terminal state. The controller records the target through the existing `notification.push` action gate. The declaration event carries a versioned `source_ref`:

`system-soft-target:v1?quest=<quest-id>&target=<iso-timestamp>[&reason=...]`

The newest valid declaration for an active Quest v2 is the current soft target. This uses the existing immutable `system_events` ledger and existing notification/write validation.

## Automation
The existing server-side deadline sweep also reads soft-target declarations:
- within 1 hour: one idempotent informational reminder;
- at/after the target while the quest is still ACTIVE: one idempotent WARNING that the target was missed;
- the quest remains ACTIVE;
- no `quest.failed`, `quest.expired`, completion, XP or coin event is produced by soft-target automation;
- a hard `deadline_at` remains completely separate and keeps the existing `deadline-v1` automatic expiry behavior.

If a soft target conflicts with a hard deadline by being later than it, automation fails closed and ignores the conflicting soft target.

## Controller policy
- Prefer soft targets for learning, training, skill building and other valuable tasks whose outcome remains useful after a timing miss.
- Use hard deadlines for real external deadlines or explicitly accepted time-bounded challenges.
- A missed soft target is a priority/adherence signal, not proof of laziness, failure or inability. Diagnose repeated misses before changing difficulty or applying stronger pressure.
- Rescheduling creates a newer declaration; history remains auditable.
- Setting/rescheduling a target is still a System mutation and follows the existing exact-authorization rule.

## Current compatibility
Quest v2 payloads, completion/reward rules, one-active-quest invariant, XMind provenance, hard deadlines, existing notifications and old quests remain unchanged. The PWA already shows System notifications; no new state owner is introduced.
