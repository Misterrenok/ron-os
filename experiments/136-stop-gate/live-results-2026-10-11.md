# Live controller evidence — 2026-10-11

Status: narrow controller mechanism verified on Codex CLI 0.162.1 with ChatGPT
subscription auth. This is not closure of issue #136 and is not a production E1–E5
behavioral result.

## Environment preflight

- An explicit local npm install of `@openai/codex@0.162.1` was used; the global
  `codex` command still resolves first to 0.63.0.
- `codex login status`: ChatGPT login active. `doctor --json`: provider HTTP and
  WebSocket checks pass; Windows elevated sandbox provisioning fails with
  `helper_unknown_error`.
- A direct `exec --sandbox workspace-write` turn attempted the requested write,
  received `blocked by policy`, reported the barrier, and left the target absent.
  This re-confirms that exit 0 / `turn.completed` is not outcome success.
- The repo-local `skills/ron-work-protocol.md` and frozen E1–E5 were read. The
  separate user skill still logs missing YAML frontmatter. Neon still reports
  `invalid_token`; neither is needed by this isolated experiment.

## Implemented controller

`controller.py` owns the immutable task contract: original objective, scope,
absolute root and pinned outcome hashes. It checks current state before acting,
accepts only allowlisted exact-byte writes, refuses to overwrite conflicting
prior state, verifies the artifact after execution, and permits at most one
same-thread recovery.

`appserver_actor.py` uses the supported Codex app-server with existing ChatGPT
subscription auth. The actor runs read-only with proposal-only base instructions
and structured output. The controller, not the model, performs the allowlisted
write. No paid API key, Defender/TLS weakening, sandbox bypass, user config edit,
or secret copy was used.

## Live cases

1. **Successful execution.** Thread
   `01a12984-983e-7cf3-9ef5-451f6755c545`: one actor turn; controller wrote
   `result.txt`; independent PowerShell SHA-256 read-back was
   `c6b7c74a835f703fb6a6c1933d6b723e8149663b9027136530e8df39bec71c3a`.
2. **Intentional incomplete result and bounded recovery.** Thread
   `01a12984-be94-7571-83a2-3d97881e3985`: the first structured proposal contained
   no writes by frozen task design; verification failed; exactly one `turn/start`
   continued the same thread; the second proposal was applied and the same hash
   verified. Attempts: 2, not an unbounded loop.
3. **Real barriers do not become success.** Direct workspace-write was blocked and
   left no artifact. A live app-server pre-inference call with an invalid output
   schema returned `status: tool_barrier`, failed check `result.txt`, and no write.
   Synthetic subprocess coverage also exercises actor exit 17, prior-state
   conflict, out-of-scope write, and exhausted recovery.

## Usage in this engineering session

Seven model turns were consumed: one direct contour, three CLI-controller turns
(one single attempt plus one two-turn recovery), one app-server success, and one
two-turn app-server recovery. One additional app-server request failed schema
validation before inference. Rollout counters total 141,006 tokens across the
seven turns: 140,394 input, 108,160 cached input, 612 output/reasoning. The two
accepted app-server cases used 30,187 tokens total (9,728 cached). No reviewer
calls and no paid API calls were used.

## E1–E5 boundary

- E4 mechanics improve when success is expressible as a trusted outcome check:
  the controller keeps scope, executes approved work, verifies the real result,
  retries once, and reports a barrier instead of success.
- E1 intent, E2 candidate discovery/prioritization, and E3 choosing the dominant
  cheap action are not solved by byte-level checks. They require an external
  semantic oracle or independent reviewer with held-out evidence.
- E5 bounded stopping improves mechanically: verified outcome stops immediately;
  missing outcome gets one recovery; remaining failure becomes UNVERIFIED/BLOCKED.
- Hash checks do not prove usefulness, correctness of an unpinned semantic answer,
  or external side effects. Broader deployment needs task-specific verifiers and
  repeated independent E1–E5 / real-work evidence.

## Continuation point

Keep PR #140 candidate-only. Next high-information step is a held-out semantic
task with a trusted non-model oracle, followed by a small same-model paired run.
Do not merge to `main` or claim #136 fixed from these narrow cases.
