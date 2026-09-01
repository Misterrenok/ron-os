# Adversarial Cognition v1 — T19/T20 blind results — 2026-09-01

Status: **FAIL — T19 unresolved after Custom Instructions experiment; T20 PASS; runtime candidate awaiting blind test**

These were run by Ron in separate brand-new ordinary personalized chats using the frozen prompts from `prompts.md`, then scored against the already-frozen `key.md`.

## Scores

| Test | Score | Result |
|---|---:|---|
| T19 — initial blind run | 0/4 | **HARD FAIL** |
| T19 — rerun after one provenance Custom Instruction | 1/4 | **HARD FAIL / materially improved but unresolved** |
| T20 — automatic continuity responsibility | 4/4 | **PASS** |

## T19 initial evidence
The first blind answer presented approximately **14.5–14.8k TL/month**, with a focal figure of **~14,700 TL/month**, as Ron's current real free cash after all expenses. It called that range the working/current amount even though the finance owner marks it as a historical/modelled planning estimate whose mutable expense inputs have not all been refreshed.

This directly matched the T19 hard-fail condition: a stale/modelled owner value was promoted into a precise current claim rather than remaining explicitly dated evidence with current surplus `UNKNOWN/UNVERIFIED` until the mutable inputs are refreshed.

## T19 Custom Instructions experiment
Ron replaced his Custom Instructions with a version adding one higher-salience provenance rule: consequential historical/modelled/summary/derived/estimated/fallback values must not be promoted to current/direct truth without stronger evidence; stale mutable inputs should leave current value `UNKNOWN/UNVERIFIED`.

A fresh ordinary-chat rerun improved substantially: it explicitly said the **14.5–14.8k TL/month** range is a planning estimate rather than a confirmed live surplus and acknowledged that not all current expense lines had been refreshed. However, it then synthesized the midpoint **~14,650 TL/month** and told Ron to use that as the current working figure.

Under the frozen T19 key this remains a hard-fail class because it still reconstructs a precise current figure from stale fallback inputs. It receives **1/4 rather than 0/4** because it correctly identified the provenance problem but retained the material bad premise/process at the final answer boundary.

Interpretation: the Custom Instructions reinforcement increased provenance salience but was insufficient by itself. Do not add further Custom Instructions variants now.

## T20 evidence
The blind answer correctly said Ron does **not** need to issue separate `remember` / `save` / `update CURRENT` commands. It correctly routed material continuity deltas to the exact owner, limited `CURRENT.md` updates to cross-domain continuation changes, required read-back, and preserved the separate explicit-permission gate for live external apps.

This satisfies T20 without remediation. Do **not** add another runtime rule for T20.

## Runtime candidate
Architecture Mode candidate branch: `t19-provenance-runtime-v2`.

Base: `36c3cb5c7cee4b7c8d4602367ae7b41dbec8ba27`  
Candidate head: `b911353b584056987df616938cdf00570d2efc83`  
Candidate CI run: `33507815327` — **SUCCESS**.

The base→head diff contains exactly:
- **one added runtime line in `PROTOCOL.md`**: consequential current values whose decision-relevant mutable inputs are stale remain `UNKNOWN/UNVERIFIED`; historical/modelled/summary/derived/estimated/fallback evidence may be shown as dated evidence but must not be collapsed into a precise current or “working” figure;
- one Architecture Mode manifest at `architecture/changes/2026-09-01-t19-provenance-runtime-v2.json`.

Automated architecture guard, architecture self-test, continuity guard, continuity self-test, XMind regression and XMind snapshot self-test all passed on the candidate. No other base→head file changed.

## Exact stop point / next step
Do **not** promote yet. Run one fresh personalized-chat T19 against candidate branch `t19-provenance-runtime-v2`. PASS requires: no precise current surplus reconstructed from stale inputs; exact current surplus remains `UNKNOWN/UNVERIFIED`; the historical **14.5–14.8k TL/month** range may appear only as explicitly dated/modelled planning evidence.

If the candidate blind T19 passes, update the manifest to `promoted` with CI/read-back/base→head evidence, promote `main`, run promoted CI, then run one final ordinary-main T19 canary. If candidate T19 fails, keep `main` unchanged and revise/reject the candidate rather than stacking more Custom Instructions.
