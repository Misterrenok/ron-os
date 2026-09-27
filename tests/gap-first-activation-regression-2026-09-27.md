# Gap-first activation regression — 2026-09-27

Status: FIXED STRUCTURALLY / ACCOUNT-SIDE ACTIVATION DELTA REQUIRED

## Reproduction
1. User provides a new principle/idea.
2. User asks whether it should be added to account memory.
3. Assistant recommends adding it before checking whether Ron OS already covers the behavior.
4. Only after challenge does the assistant read BOOTSTRAP/PROTOCOL and discover the proposed rule is substantially duplicate.

## Root cause
- The breadth-before-depth rule existed in Ron OS.
- A related reminder also existed in account memory, but account memory is contextual evidence rather than a hard execution gate.
- The persistent-change request was not classified strongly enough as optimization of an existing system before the recommendation was made.

## Required behavior
Any proposal to add/modify/remove/duplicate a persistent rule, Custom Instruction, account-memory entry, prompt/skill, automation, owner, guard, or system mechanism must:
1. Treat the request as existing-system optimization.
2. Inspect the smallest end-to-end existing control path first.
3. Prove a concrete uncovered gap before recommending or writing a new mechanism.
4. Stop with "no change needed" when existing coverage already satisfies the objective.
5. Distinguish stored/remembered rules from proven runtime enforcement.

## Structural fix
PROTOCOL.md now contains a Persistent-change activation gate and direct_reasoning_overlay_guard.py asserts that the scope and control-path check remain present.

## Remaining activation requirement
Because ordinary-chat activation is account-side, Custom Instructions should contain an explicit trigger that routes persistent rule/memory/system-change proposals through this gate before recommendation. Repo-local text alone cannot guarantee a fresh chat will load it.
