# Ron OS — current cross-domain state

Updated: 2026-08-23 23:31 Europe/Istanbul
Status: MIGRATING_TO_GITHUB

## Routing
- Runtime entry: `BOOTSTRAP.md` -> this file -> exact domain owner -> live owner if mutable.
- Durable personal context: `PERSON.md`.
- ChatGPT Library is legacy/backup during migration and is not an operational authority.
- Memory/old chats/archive are evidence only for volatile/project state.

## Continuity architecture
- Repeated ordinary clean-chat failures were traced to a missing automatic boot trigger, not inability to read external stores.
- Explicit Library retrieval test: PASS.
- Explicit GitHub retrieval probe against connected repository: PASS (`RON_OS_GITHUB_OK_2026-08-23`).
- `Misterrenok/ron-os` is being established as the canonical file store.
- Migration is not accepted until a fresh ordinary chat automatically reads this GitHub repo without a GitHub/Library hint and returns correct current state.

## Nutrition
Owner: `domains/nutrition.md`; live Cronometer owns live diary/log state.
Current execution state: **NOT STARTED / READY-PENDING**.
The supposed 16–22 Aug baseline did not occur in real-world execution. Prefilled/planned Cronometer rows are not proof of intake. No committed Day 1 exists yet.

## Training
Fallback owner: `domains/training.md`; live Liftosaur owns exact mutable app state.
Live Liftosaur was subscription-gated; fallback is only last-confirmed through `AS_OF: 2026-08-18`. Exact current weights/progression/session execution remain UNKNOWN until live access or newer explicit Ron report.

## Other live owners
- TickTick: tasks/reminders.
- Google Calendar: events/availability.
- GitHub repositories: code state.
- Neon: actual Ron OS database state.
- Cronometer: nutrition diary/log state.
- Liftosaur: exact training app state when accessible.

## Current continuity unblock
After GitHub migration/read-back passes, install one minimal native ChatGPT bootstrap instruction that only triggers for requests requiring Ron's mutable personal/project/app state or continuation and tells ChatGPT to read `Misterrenok/ron-os/BOOTSTRAP.md` first. Then run one brand-new ordinary-chat nutrition probe with no repository hint.
