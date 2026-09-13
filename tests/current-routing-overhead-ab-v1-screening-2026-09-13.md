# Current-routing overhead A/B v1 — P1 screening — 2026-09-13

Status: **P1 POST-FIX SCREENING PASS / FULL A-B GATE STILL PENDING**

Prompt class: P1 System continuation. Runs were fresh GPT-5.6 Sol chats using exact refs and read-only instructions.

## Control
- Ref: `f20f9510f8273eeabff4f1ad55c13df3a23611f9`
- Elapsed shown by ChatGPT: `2m25s`.
- `CURRENT.md`: read.
- Result: identified the first real end-to-end quest-loop use as the next open product tail.
- No writes were performed.

## Initial candidate diagnostic
- Ref: `95669c7d3c53ac5b9dea2cf5e31bb4998bfdcc02`
- Elapsed shown by ChatGPT: `2m16s`.
- `CURRENT.md`: read.
- Result: identified Shop go-live, including stale `PLANNED` vs `VERIFIED` documentation drift and empty production shop.
- No writes were performed.
- Not promotion evidence: `skills/system-controller.md` still hard-coded mandatory CURRENT routing.

## Post-fix candidate rerun
- Ref: `b17e4c96c97e16740b02eff99bc44e42e181957b`
- Elapsed shown by ChatGPT: `1m59s`.
- `CURRENT.md`: **not read**.
- Route recovered the System project owner, live `Ron System Core` Neon state and engineering fast-path without using memory/old chat as current authority.
- Result: identified **Shop go-live** as the next independent engineering/product slice, while correctly separating the active Hallo quest as gameplay blocked on Ron's real-world completion.
- Live read-only evidence remained consistent with the owner checkpoint: 18 events / max seq 20 / 0 shop events / 0 progression awards.
- No writes were performed.

## P1 screening decision
The post-fix candidate demonstrates the intended P1 behavior: it removes an unnecessary CURRENT pre-read while preserving exact-owner/live-owner recovery and a genuinely open engineering/product tail. The displayed elapsed time also decreased from 2m25s control to 1m59s candidate, but a single timing pair is diagnostic only and is not treated as a stable latency estimate.

This P1 result supports the conditional-CURRENT hypothesis but does **not** satisfy the full frozen promotion gate. The highest-risk next probes are P6/P7, where skipping CURRENT would be a hard failure, followed by the remaining frozen cases if the candidate survives those contra-tests.
