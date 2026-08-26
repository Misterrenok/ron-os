# Protocol A/B v1

Purpose: determine whether the current `PROTOCOL.md` materially improves behavior over a much leaner candidate, instead of judging architecture by prose quality.

Status: **READY TO RUN / NO RUNTIME CHANGE**.

Files:
- `candidate-lean.md` — test-only lean condition; never runtime authority until acceptance.
- `prompts.md` — 8 paired held-out tasks.
- `key.md` — hidden rubric + hard fails + precommitted decision rule.

## Why these slots
The suite is drawn from failure classes already documented in Ron OS history/regressions: continuity recovery, stale training propagation, plan-vs-reality confusion, coverage-blind migration, false tool capability/read-back, orphaned Trendyol project state, stale legal/status assertion, and overengineering/meta-overhead. This is not a claim that these 8 cases exhaust future failures.

## Runner protocol
1. Freeze `candidate-lean.md`, `prompts.md`, and `key.md` before the first scored output. No post-hoc edits.
2. Use the same ChatGPT model/product configuration for both conditions.
3. For each S01–S08, open **two separate fresh chats**. Run A and B in randomized order. Do not continue one condition in the other's chat.
4. Paste the relevant condition preamble followed by the exact slot prompt. Do not show `key.md` or the other condition's output to the tested chat.
5. For S05, run conditions sequentially and confirm the probe file is absent before the second run; cleanup failure is itself evidence and must be recorded, not silently repaired before scoring unless necessary to keep the second condition executable.
6. Save raw outputs verbatim. Replace condition labels with random IDs such as X/Y before evaluation. Do not edit wording, tool-result claims, or omissions.
7. The evaluator receives only: slot prompt, anonymized X/Y outputs, and `key.md`. It must score both before condition labels are revealed.
8. Prefer an evaluator that did not author either protocol. A fresh isolated evaluator is better than the current ChatGPT or the Claude instance that proposed the lean critique. If no independent evaluator is available, record that limitation explicitly rather than calling the result independent.
9. Reveal labels only after all 16 scores are frozen. Apply the decision rule in `key.md` mechanically.
10. If lean wins, do **not** immediately delete current protocol/history. First patch runtime, preserve the displaced protocol in Git history/archive, run structural continuity guard, then perform one fresh post-change regression. If current wins, keep current. If inconclusive, run a second fresh 8-slot sample before changing runtime.

## What this test can and cannot prove
A win shows better sampled behavior under these known failure classes at lower/equal policy complexity. It does not establish a universal architecture score or prove unknown failure classes are absent.

Until this paired test is complete, numeric ratings such as `5/10`, `7/10`, or `7.5/10` should be treated as subjective impressions, not measured Ron OS quality.
