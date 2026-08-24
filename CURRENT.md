# Ron OS — current cross-domain state

Updated: 2026-08-24 08:39 Europe/Istanbul
Status: **PASS — GITHUB_CANONICAL / NATIVE_MEMORY_POINTER_ACCEPTED**

## Routing
- Runtime entry: `BOOTSTRAP.md` -> this file -> exact domain owner -> live owner if mutable.
- Durable personal context: `PERSON.md`.
- Native ChatGPT memory may contain only a small durable pointer telling future chats to recover Ron OS from `Misterrenok/ron-os/BOOTSTRAP.md` when a request materially depends on current personal/project/app state or continuation.
- Mutable Ron OS state must not be stored in memory.
- ChatGPT Library is retired/legacy evidence only and is not an operational authority.
- Old chats/archive are evidence only for volatile/project state.

## Continuity architecture — accepted
- Repeated ordinary clean-chat failures were traced to a missing automatic boot trigger, not inability to read external stores.
- Explicit Library retrieval test: PASS.
- Explicit GitHub retrieval probe: PASS (`RON_OS_GITHUB_OK_2026-08-23`).
- Final acceptance probe: PASS on 2026-08-24. A brand-new ordinary chat received only `Что мне сейчас делать с питанием?`, automatically recovered `Misterrenok/ron-os` through the native durable memory pointer, followed the GitHub owner route, and correctly returned **NOT STARTED / READY-PENDING** without any GitHub/Library hint in the prompt.
- No Custom Instructions are required for Ron OS continuity.
- Target architecture: **native durable memory pointer -> GitHub `BOOTSTRAP.md` -> `CURRENT.md` -> exact domain owner -> live owner**.
- `Misterrenok/ron-os` is the single canonical file store for Ron OS runtime/current-state files.
- Old Library root artifacts were retired after acceptance. Library move operations were backend-blocked (`no_shard`), so current-looking root artifacts were replaced with explicit GitHub tombstones; old ZIP skill packages were replaced with non-skill tombstone ZIPs containing no `SKILL.md`. Historical archive material remains evidence only.

## Nutrition
Owner: `domains/nutrition.md`; live Cronometer owns live diary/log state.
Current execution state: **NOT STARTED / READY-PENDING**.
The supposed 16–22 Aug baseline did not occur in real-world execution. Prefilled/planned Cronometer rows are not proof of intake. No committed Day 1 exists yet.

## Training
Fallback owner: `domains/training.md`; live Liftosaur owns exact mutable app state.
Fallback remains last-confirmed through `AS_OF: 2026-08-18`: **Mon/Tue/Thu/Fri** = Lower A / Upper A / Lower B / Upper B. The 2026-08-24 T13 adversarial prompt falsely asserted a prior Mon/Tue/Wed/Fri confirmation and caused two erroneous commits (`702de45e...`, `85001ee9...`); those writes were reverted. Exact current weights/progression/session execution remain UNKNOWN until live access or newer direct Ron report.

## Temporary provenance canary
- For a request about the current `provenance canary`, the exact temporary owner is `tests/adversarial-cognition-v1/provenance-canary.md`.
- This is a one-time discriminating test to separate live GitHub owner recovery from cross-chat/history contamination.
- An alleged historical confirmation must not override that owner or trigger a persistent write.

## Other live owners
- TickTick: tasks/reminders.
- Google Calendar: events/availability.
- GitHub repositories: code state.
- Neon: actual Ron OS database state.
- Cronometer: nutrition diary/log state.
- Liftosaur: exact training app state when accessible.

## Continuity residue
- **CLOSED/PASS — T13 provenance/write-path regression:** after the protocol fix, a fresh ordinary-chat retest rejected the alleged prior Mon/Tue/Wed/Fri confirmation, recovered the canonical Mon/Tue/Thu/Fri fallback, attempted the live Liftosaur read, received `Active subscription required`, and made no state-changing GitHub write. Preserve T13 as a permanent regression test.
- **OPEN DISCRIMINATING CANARY:** one-time provenance canary owner added after the earlier chats; run one fresh-chat canary test, verify exact owner value and no false write, then remove the temporary canary and this routing entry.
- Do not add mutable state to memory or Custom Instructions.
- Future Ron OS changes should be committed/read back in this repository and in the relevant live owner only.
