# Current-routing overhead A/B v1 — screening — 2026-09-13

Status: **P1 + P6 + P7 SCREENING PASS / FULL A-B GATE STILL PENDING**

Runs were fresh GPT-5.6 Sol chats using exact refs and read-only instructions.

## P1 — System continuation

### Control
- Ref: `f20f9510f8273eeabff4f1ad55c13df3a23611f9`
- Elapsed shown by ChatGPT: `2m25s`.
- `CURRENT.md`: read.
- Result: identified the first real end-to-end quest-loop use as the next open product tail.
- No writes were performed.

### Initial candidate diagnostic
- Ref: `95669c7d3c53ac5b9dea2cf5e31bb4998bfdcc02`
- Elapsed shown by ChatGPT: `2m16s`.
- `CURRENT.md`: read.
- Result: identified Shop go-live, including stale `PLANNED` vs `VERIFIED` documentation drift and empty production shop.
- No writes were performed.
- Not promotion evidence: `skills/system-controller.md` still hard-coded mandatory CURRENT routing.

### Post-fix candidate rerun
- Ref: `b17e4c96c97e16740b02eff99bc44e42e181957b`
- Elapsed shown by ChatGPT: `1m59s`.
- `CURRENT.md`: **not read**.
- Route recovered the System project owner, live `Ron System Core` Neon state and engineering fast-path without using memory/old chat as current authority.
- Result: identified **Shop go-live** as the next independent engineering/product slice, while correctly separating the active Hallo quest as gameplay blocked on Ron's real-world completion.
- Live read-only evidence remained consistent with the owner checkpoint: 18 events / max seq 20 / 0 shop events / 0 progression awards.
- No writes were performed.

### P1 decision
PASS for screening. The candidate demonstrates the intended P1 behavior: unnecessary CURRENT pre-read was removed while exact-owner/live-owner recovery and a genuinely open engineering/product tail were preserved. Displayed latency improved in this one pair, but that is diagnostic only.

## P6 — Cross-domain life optimization

### Candidate contra-test
- Ref: `b2eddf801655f3617f9bbe47b9eab50c8a3e08b8` (runtime-equivalent to the P1-tested candidate; intervening commit recorded evidence only).
- Elapsed shown by ChatGPT: `2m05s`.
- Global/current checkpoint: loaded; the visible trace contains a dedicated `Fetching current project status` step after Bootstrap/domain selection.
- The run explicitly treated the objective as cross-domain rather than choosing the first domain. It compared the strategic map, skill capital, mobility/education, work/income, finance, health, time/schedule and social capital.
- It then checked current official Topkapi university information plus live Calendar/TickTick because the ranking turned on a near-term registration/course-selection window.
- Result: selected the 2026-09-14 10:00 Topkapi OIS `kayıt yenileme + ders seçimi` completion as the single highest-expected-ROI next step, while explicitly comparing it against German, AI/IT, work, money and further System work.
- The answer preserved optionality as the broad objective and treated Germany as a means rather than silently narrowing the objective to migration.
- No architecture/System writes were performed.

### P6 decision
PASS for screening. The candidate retained the global/cross-domain recovery path and used current evidence rather than applying the single-domain optimization universally. This is the high-risk opposite-side check to P1: CURRENT/global context remains reachable where the decision materially depends on it.

## P7 — Architecture/global checkpoint

### Candidate contra-test
- Ref used by Ron: `b2eddf801655f3617f9bbe47b9eab50c8a3e08b8`.
- This ref is runtime-equivalent to later evidence-only heads; the intervening evidence commit did not alter routing/runtime semantics.
- Elapsed shown by ChatGPT: `1m53s`.
- Global/current checkpoint: loaded. The visible trace explicitly shows reading the protocol and current Ron OS state before inspecting architecture manifests.
- The run inspected current architecture manifests/status rather than relying on memory or historical candidate labels.
- It correctly identified `current-routing-overhead-v1` as the one genuinely open architecture experiment with structural guards PASS but behavioral A/B still pending.
- It classified recent meta-mode, source-precedence/closeout, resource-lifecycle, maintenance, System authorization/LifeUp wording, CURRENT System dedup and personal-Skills conflict work as already promoted/closed rather than reopening them.
- It separated non-blocking/capability-bound technical residue and non-architecture OPEN items from architecture work.
- No repository mutation was performed.

### P7 decision
PASS for screening. The candidate preserved the architecture/global checkpoint role of CURRENT and distinguished genuinely open architecture work from closed/promoted residue. This satisfies the fail-fast P7 contra-probe; skipping CURRENT would have been a hard failure, and it did not occur.

## Current decision
The conditional-CURRENT hypothesis has survived:
- P1: positive single-domain case — CURRENT omitted while exact owner/live owner recovery remained correct;
- P6: cross-domain/global case — CURRENT/global checkpoint preserved and broad objective retained;
- P7: architecture/global case — CURRENT preserved and open-vs-closed architecture state recovered correctly.

This is meaningful evidence that the routing simplification is directionally sound, but it still does **not** satisfy the precommitted full frozen A/B promotion gate. The remaining blocker is behavioral evidence for the rest of the frozen suite, especially P9/P10 safety/intent invariants and enough P2–P5 coverage to establish that the optimization generalizes across ordinary domain recovery. Do not promote solely from P1/P6/P7.
