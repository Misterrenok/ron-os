# Ron OS — current cross-domain state

Updated: 2026-08-23 23:31 Europe/Istanbul
Status: AWAITING_BOOTSTRAP_ACCEPTANCE

## Routing
- Runtime entry: `BOOTSTRAP.md` -> this file -> exact domain owner -> live owner if mutable.
- Durable personal context: `PERSON.md`.
- ChatGPT Library is legacy/backup during migration and is not an operational authority.
- Memory/old chats/archive are evidence only for volatile/project state.

## Continuity architecture
- Repeated ordinary clean-chat failures were traced to a missing automatic boot trigger, not inability to read external stores.
- Explicit Library retrieval test: PASS.
- Explicit GitHub retrieval probe against connected repository: PASS (`RON_OS_GITHUB_OK_2026-08-23`).
- `Misterrenok/ron-os` is now the canonical file store for Ron OS runtime/current-state files.
- Core GitHub owners and supporting references were written, simplified to remove old skill/byte-mirror dependencies, and read back from GitHub successfully.
- Migration is not fully accepted until a fresh ordinary chat automatically reads this GitHub repo without a GitHub/Library hint and returns correct current state.

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
1. Put the exact contents of `CHATGPT_BOOTLOADER.txt` into ChatGPT Custom Instructions.
2. Open one brand-new ordinary chat and ask only: `Что мне сейчас делать с питанием?`
3. PASS requires automatic GitHub bootstrap recovery and the current NOT STARTED / READY-PENDING answer with no GitHub/Library hint from Ron.
4. After PASS, archive/retire the old active Library Ron OS layer so GitHub remains the only file authority.
