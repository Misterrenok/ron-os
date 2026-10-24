# Controller audit and finite decision pilot

Status: candidate-only follow-up to live evidence at 1bbcbbc. No main change,
no local-PC access from this cloud session, no new inference/API calls.

## Reproduced and repaired

Five negative cases failed against the prior controller: late unapproved action,
late wrong content hash, late prior-state conflict, duplicate destination, and
recovery scope violation losing its classification. Validation now completes for
the entire proposal before any write. Exclusive creation refuses a target that
appears after preflight. Recovery preserves scope_violation.

This is not full transactionality: an I/O failure or concurrent modification can
still leave a partial batch. No claim is made against hostile filesystem races,
directory replacement, or a model process with arbitrary host access.

## Narrow semantic verifier, not general expert oracle

decision_oracle.py computes exact expected net payoff with Fraction arithmetic.
Three synthetic fixtures cover useful cheap information, an already dominant
action, and an uninformative paid query. The selected ID is evaluated against all
feasible enumerated alternatives, rather than comparing model answer bytes to a
hash. Missing alternatives, mistaken payoffs, or incomplete objectives remain
outside this oracle. These fixtures are development cases, not an untouched
held-out E1-E5 set.

run_semantic_pilot.py gives baseline/candidate identical initial facts and uses
the same appserver_actor configuration (currently gpt-5.6-sol). Candidate differs
only by bounded external rejection feedback. Six primary requests plus at most
two recoveries; actor failure aborts further calls. Tests verify this budget and
failure stop. Returned choices are graded, but proposals are NOT written or
executed; this is choice-only measurement, not E4 execution evidence.

No answer key is added to model prompts. A live run must prevent the actor from
reading this source and answer-key tests. Current actor is proposal-only and
read-only; actual tool absence must still be checked in live traces. Same model
and identical instructions do not make repeated outputs deterministic.

## How the existing authorized local executor can run it

After pulling the candidate branch and confirming no overlapping dirty changes:

```text
python run_semantic_pilot.py --actor python appserver_actor.py <absolute-codex-executable>
```

Run from experiments/136-stop-gate. The runner resolves paths before moving each
call into an isolated temporary directory. Use the already working subscription
auth on the Windows host, not copied auth tokens or a paid API fallback. Save
stdout as the pilot report. The actor currently does not expose usage counters;
usage_tokens remains null and must be recovered from host/provider traces before
cost conclusions. Request count is not billed token count. If both lanes are
already correct, report no measurable improvement, not a fix. If performance
degrades, retain the negative result.

## Verification in this cloud session

- Before repair: all five new negative cases FAIL.
- After repair/additions: 47 deterministic tests PASS (30 prior + 17 new).
- Architecture guard and self-test PASS.
- Continuity guard and self-test PASS on Linux.
- git diff --check PASS.
- Live paired semantic/model tests: NOT RUN; cloud auth access is blocked and no
  native-PC control capability is available. Existing Windows live evidence is
  preserved, not attributed to this patch.
- Windows sandbox, user skill YAML, Neon auth, UI model catalog: unchanged.
- No ordinary-chat reliability, universal autonomy, or E1-E5 improvement claim.

Issue #136 remains the status owner. PR #140 remains draft; #137 remains a
separate skills delivery hypothesis and #26 rollback-only. Next evidence is the
bounded paired local run, followed only if useful by genuinely held-out cases.
