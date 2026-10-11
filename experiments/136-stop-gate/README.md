# Issue 136: external completion gate experiment — 2026-10-11

**UNINSTALLED, NOT PROMOTED; issue 136 stays OPEN.** This is a persistent research artifact on a draft candidate branch, not temporary infrastructure, another current-state owner, a skill, or a universal assistant repair. Main, personalization, credentials and live apps remain unchanged. PR 137 stays a separate unverified delivery hypothesis; issue 26 remains rollback-only.

## Evidence and diagnosis

Read current BOOTSTRAP, domain router, meta skill, PROTOCOL, total-value optimizer, CURRENT, issue 136 and comments, PR 137 diff, E1–E5, adversarial key/T21–T22 incident history, Protocol A/B result, and mechanism-space 2026-10-01 results.

The observed production defect is real but its internal root cause is not known. Available evidence supports these distinct observable failures:

| Stage | Evidence | What it establishes / does not establish |
|---|---|---|
| Intent | E1 ordinary-chat FAIL, Temporary E1 PASS | Example interpreted as assignment in some contexts; model/context effect not isolated. |
| Candidate coverage / choice | Three-candidate intervention still chose five-day tracking; cheap question absent. Explicit ten-second cost contrast passed once. | Comparing candidates is insufficient when the useful family is omitted. Neither written output nor self-analysis reveals internal reasoning. |
| Active goal | Issue 136 work diverted into university PR 138, later corrected by PR 139 | Outcome/scope drift despite written rules; not permission to pursue university work. |
| Execution / stopping | Apology-only continuation; older T22 recurrences after two runtime reinforcements | Rule noncompliance and no demonstrated compulsory completion controller. |
| Success assessment | Structural CI and isolated PASS coexist with recurring failures | Existing CI validates repository/evidence integrity, not live response reliability. |

The 2026-10-01 mechanism-space suite reported 12/12 fresh-context screening passes on unchanged runtime, explicitly not independent-model ordinary consumer production evidence. It does not contradict the later real incident. The 2026-08-27 protocol A/B (31/32 vs 30/32) tested a different sampled distribution and cannot close 136.

Sources: [issue 136](https://github.com/Misterrenok/ron-os/issues/136), [E1–E5](../../tests/expert-answer-exemplar-v1.md), [T22 history](../../tests/adversarial-cognition-v1/results-2026-09-01-user-auditor-action-handoff.md), [mechanism-space](../../tests/mechanism-space-v1/results-2026-10-01.md), [PR 137](https://github.com/Misterrenok/ron-os/pull/137).

## Mechanism selection and economics

| Alternative | Potential benefit | Cost / current blocker | Disposition |
|---|---|---|---|
| More runtime wording | Possibly increased salience | Already present; repeated failure; no enforcement | Reject as primary repair. |
| PR 137 skills-only plugin | Better procedure delivery | Invocation and ordinary-chat installation not demonstrated; cannot compel execution | Keep draft, no claimed falsification of activation hypothesis. |
| Always-on second model / agent team | Different candidate search and semantic review | More inference, correlated errors, no native global interception established | Do not deploy by default. |
| Paid API agent controller | Explicit state, tools, retries and verifier | API billing and hosting/auth maintenance; no need to incur this cost for current experiment | Defer. |
| Deterministic task-bound Stop hook | Evidence-based completion check, bounded automatic continuation | No added model/API calls for checks; at most one requested continuation, which still consumes agent usage | Implement narrow opt-in prototype for supported local Codex. |
| Another model / mode alone | Can improve some measured cases | Existing mixed evidence, confounded settings, no persistent guarantee | Not a repair claim. |

Working choice: smallest externally executed, task-bound evidence check. This does **not** solve candidate generation, priorities or general expert judgment. No subscription bypass or exact quota savings are claimed. This choice is assistant-proposed, not Ron's approved platform migration.

## Implemented

`stop_gate.py` consumes the documented Stop JSON event and a pinned controller contract. It inspects actual local artifacts, never the assistant's assertion of success. Supported checks: exact SHA256 for an expected output or protected baseline; absence of a forbidden artifact. Paths stay under the declared root; size limits and schema checks bound input. No shell commands, network, inference, live writes or permission grants occur in the checker.

Missing/wrong artifact -> `decision: block` with a focused continuation. Already-continued event -> UNVERIFIED warning, no further continuation. Correct artifacts -> narrowly scoped file-check result, never semantic PASS. Different session/turn -> inactive warning. Broken config -> UNVERIFIED warning, no costly retry loop.

The contract must be fixed by a trusted controller **before the agent run** and stored outside the agent-writable workspace, along with the verifier. Fields: `version: 1`, absolute `root`, exact `session_id`, `turn_id`, `objective`, and nonempty `checks` with `path`, `kind: sha256`, `expected` digest or `kind: absent`. Do not let the tested agent define its own success oracle. Agent-generated contract/evidence is not independent verification. This checkout is a development copy, not a protected installation. `hooks.example.json` is a configuration illustration with conspicuous placeholders, NOT an installed or directly runnable configuration.

Scope check covers only explicitly pinned files. It detects changes after they occurred and does not roll them back. It cannot detect semantic drift in prose, arbitrary unlisted writes, external account mutations, or correctness of a novel artifact whose expected content cannot be fixed in advance. An SHA256 proves equality, not usefulness. It is not a security boundary; concurrent file races and hostile processes require proper isolation. General tasks need a separately trusted task-specific executable oracle or independent semantic evaluator; never substitute a self-reported checklist.

## Independent mechanism tests

Command: `python3 -m unittest discover -s experiments/136-stop-gate -p 'test_*.py' -v`.

2026-10-11 local result: **20/20 synthetic subprocess tests passed**. Test process writes fixture files then invokes the verifier in a separate Python interpreter. Tests include false completion, apology without execution, empty placeholder, correct artifact, tampering after success, protected-file scope drift, forbidden artifact, bounded continuation, completion after continuation, unrelated session/turn, path escape, symlink escape, malformed config/hash/event, duplicate/missing checks and oversized output.

These are independently executed deterministic tests, **not blind model runs, not ordinary-chat E1–E5 PASS, not native-hook activation tests**. Dedicated GitHub workflow runs only these mechanism tests. Existing continuity CI remains separate and unchanged. No original private chat audit is published.

## Exact deployment barrier

Official documentation inspected 2026-10-11:
- [Hooks](https://learn.chatgpt.com/docs/hooks): Stop `decision: block` requests an automatic continuation; `stop_hook_active` indicates prior continuation. Local hooks are not supported with cloud orchestration; personal accounts do not use enterprise managed cloud hooks. Hook errors can fail without blocking processing.
- [Non-interactive Codex](https://learn.chatgpt.com/docs/non-interactive-mode): `codex exec` can expose JSONL events and resume an exact session; reuses saved CLI authentication. This does not mean CLI is present or authenticated here.
- [Plugin packaging](https://developers.openai.com/plugins/build/plugins): installing a web plugin does not deploy hook scripts; plugin hooks require trust.

Observed here: `command -v codex` and `command -v gh` returned no executable; GitHub connected reads/writes and public Git clone work. Available connector registry exposes no operation to register a compulsory hook in this running cloud chat. There is no verified current local Codex executor/authentication/supported hook host available to this experiment. No attempt was made to extract/copy subscription tokens, deploy billable infrastructure, install into Ron's device, or change ordinary-chat settings.

Therefore activation and live model recovery remain **NOT RUN**. A more substantial current-session improvement claim would be fabricated. This is a supported technical avenue for local Codex, not an assertion that it is installable on Ron's Android or attaches to all ordinary chats.

## Precommitted next evidence gate — no manual test burden for Ron

When an authorized supported executor is actually available, the engineer must run the following, not ask Ron to repeat known facts or act as QA:
1. Confirm event delivery, script trust, contract protection and session/turn binding. Specifically observe whether automatic continuation retains `turn_id`; if it changes, this strict binding must be redesigned/tested before use. Verify `stop_hook_active` really caps retries. Hook errors must be visible; do not call this fail-closed enforcement.
2. On an isolated local task with no live accounts, compare a recorded early-stop failure with gate off/on; preserve native event trace and independent filesystem read-back. One recovery establishes integration only, not durability.
3. Freeze novel task families and counterexamples before model runs: execution after criticism, genuine access blocker, irrelevant cheap question, unknown decisive input, scope drift, repeated-use negative case. E1–E5 and T22 remain unchanged. Start with a small pilot; stop if integration fails or benefit does not justify additional usage. At most one recovery per task.
4. Measure first-answer failure, recovered completion, false continuation, scope violation, latency and inference usage across multiple independent sessions. Separate model/version/effort and activation. Resume gate cannot claim better first-answer reasoning or E2 improvement.
5. Reject promotion if task binding, oracle trust, native activation, proportionality or actual recovery fails; leave this branch archival. Durable artifact rollback is simply no hook registration/removal of this opt-in candidate, not issue 26 activation.

Full issue closure additionally needs independently scored ordinary production E1–E5 and recurring real-work outcomes across domains. No amount of passing these file fixtures establishes autonomous expert judgment. The deployable end-to-end solution remains blocked on a supported executable host, while the deterministic mechanism is implemented and tested.
