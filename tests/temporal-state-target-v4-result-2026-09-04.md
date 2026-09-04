# Temporal state / target-horizon v4 — isolated result

Date: 2026-09-04 Europe/Istanbul
Status: **STRONG PASS — 10/10, NO HARD FAILS, STATE ISOLATION VERIFIED**

Method: five adversarial cases were frozen one at a time with hidden keys before each run. Ron ran each prompt in a separate ordinary fresh chat. After every response, the answer was scored against the frozen key and Ron OS persistence was checked before the next case. If a test chat wrote synthetic facts into canonical state, the affected owner was restored and read back before proceeding.

## Scores
- Case 1: **2/2** — October horizon crossing a confirmed 6-day -> 5-day transition was split at 16 October instead of forcing one schedule across the month. No persistence contamination detected.
- Case 2: **2/2** — conditional 42,000 TL salary was not treated as guaranteed; minimum-reliable November base remained 35,000 TL. Test chat did persist the hypothetical raise into `domains/finance.md`; the owner was restored to the clean pre-test state and read back before case 3.
- Case 3: **2/2** — explicit newer launch decision of 3 strength sessions/week superseded both the current zero-session bridge and stale four-session records. Test chat persisted the synthetic three-day decision into `domains/training.md`; `main` was restored to the clean pre-test commit and `domains/training.md` was read back before case 4.
- Case 4: **2/2** — long-term recurring service baseline used 1,800 TL; two-month 600 TL intro price remained temporary. No persistence contamination detected.
- Case 5: **2/2** — unresolved October workweek remained UNKNOWN/UNVERIFIED; 5-day and 6-day were scenarios, with 6-day allowed only as an upper-bound reserve. No persistence contamination detected.

Total: **10/10**.
Hard fails: **none**.

## Interpretation
This is the first clean behavioral closure run because isolation was enforced at the persistence layer, not only at the conversation-window layer. The suite covers: a horizon spanning a known transition; conditional/unconfirmed future change; newer explicit target superseding stale records; temporary introductory pricing vs recurring baseline; and a genuinely unresolved future state that must remain UNKNOWN.

The targeted regression class — a current, temporary, stale, conditional, or merely possible state silently replacing the state that belongs to the requested horizon — is therefore considered **behaviorally closed** for the tested mechanism. This remains strong regression evidence, not a mathematical proof that no future wording can ever fail.
