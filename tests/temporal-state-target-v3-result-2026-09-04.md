# Temporal state / target-horizon adversarial blind probe v3 — result

Date: 2026-09-04 Europe/Istanbul
Status: **OBSERVED 20/20, BUT STATE-CONTAMINATED — NOT VALID INDEPENDENT CLOSURE EVIDENCE**

Ron ran all ten frozen adversarial prompts in separate fresh ordinary chats and returned the responses before the hidden key was opened. The returned answers were pasted in a different order; mapping was reconstructed unambiguously by content.

## Observed scoring against the frozen key
- A1 procurement horizon / four-session launch: **2/2**
- A2 factual outgoing-week report / zero completed sessions: **2/2**
- A3 December recurring rent / 12,000 TL hypothetical scenario: **2/2**
- A4 newer committed three-session semester target: **2/2**
- A5 temporary taxi bridge vs recurring metro baseline: **2/2**
- A6 destination operating budget / German costs with uncertainty preserved: **2/2**
- A7 one-off 8,000 TL bonus excluded from recurring baseline: **2/2**
- A8 equipment-gated nutrition launch / four-session activity: **2/2**
- A9 tentative later three-session idea does not override current four-session plan: **2/2**
- A10 unresolved 5-day/6-day October schedule remains UNKNOWN; scenario-bound instead of guessed: **2/2**

Observed total: **20/20** with no hard fails.

## Why the result is not accepted as independent evidence
The test chats shared writable Ron OS state. Prior v2 probes and some v3 probes persisted synthetic scenario facts into canonical owners, so later chats could read data created by earlier tests. This violates test independence even though the answer content matched the frozen key.

Concrete contamination confirmed in Git history/current-owner diffs included synthetic finance updates (40,000 TL future salary, September-only 4,000 TL expense, 8,000 TL one-off bonus) and a synthetic three-session training target. The training owner was later overwritten by another test prompt back to four sessions, which demonstrates cross-case state interaction directly.

The contaminated finance and training owners were restored to their clean pre-test states on 2026-09-04. This v3 result is therefore retained only as an observed same-shared-state run, not as closure evidence.

## Correct next-test design
A convincing fresh-chat test must isolate persistence as well as conversation context. Separate chats alone are insufficient. Use one of:
1. explicit no-persistence/no-Ron-OS-write instruction on every probe;
2. frozen isolated Ron OS branch reset between probes;
3. one prompt at a time, then audit/rollback any owner write before running the next prompt.

The prompt wording can remain natural; isolation must happen at the state layer rather than by revealing the expected temporal answer.
