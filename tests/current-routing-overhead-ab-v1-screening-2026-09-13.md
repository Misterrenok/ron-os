# Current-routing overhead A/B v1 — P1 diagnostic screening — 2026-09-13

Status: **DIAGNOSTIC ONLY / RERUN REQUIRED**

Prompt class: P1 System continuation. Both runs were fresh GPT-5.6 Sol chats using exact refs and read-only instructions.

## Control
- Ref: `f20f9510f8273eeabff4f1ad55c13df3a23611f9`
- Elapsed shown by ChatGPT: `2m25s`.
- `CURRENT.md`: read.
- Result: identified the first real end-to-end quest-loop use as the next open product tail.
- No writes were performed.

## Candidate as tested
- Ref: `95669c7d3c53ac5b9dea2cf5e31bb4998bfdcc02`
- Elapsed shown by ChatGPT: `2m16s`.
- `CURRENT.md`: read.
- Result: identified Shop go-live, including the stale `PLANNED` vs `VERIFIED` documentation drift and empty production shop, as the next engineering/product tail.
- No writes were performed.

## Why this is not a candidate PASS
The candidate was intended to make `CURRENT.md` conditional for ordinary single-domain continuation, but `skills/system-controller.md` still hard-coded `BOOTSTRAP.md -> CURRENT.md -> references/domain-routing.md`. The tested System path therefore did not actually contain the intended routing change.

This is an implementation gap, not evidence against the conditional-CURRENT hypothesis. Do not use this pair as promotion evidence.

## Fix after screening
`skills/system-controller.md` was aligned with the conditional-CURRENT route. `tests/system_controller_routing_guard.py` now rejects reintroduction of the old mandatory-CURRENT System path.

Next gate: rerun P1 in a fresh GPT-5.6 Sol chat against the post-fix candidate head. The control run remains useful as a diagnostic baseline, but promotion still requires the frozen screening gate rather than this single pair.
