# Current-routing overhead A/B v1 — screening — 2026-09-13

Status: **P1 + P6 SCREENING PASS / FULL A-B GATE STILL PENDING**

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

## Current decision
The conditional-CURRENT hypothesis has survived one positive single-domain case (P1) and one high-risk cross-domain contra-case (P6). This still does **not** satisfy the full frozen promotion gate. Next fail-fast probe is P7 (architecture/global checkpoint), where skipping CURRENT is a hard failure. If P7 passes, continue only the smallest remaining set needed to establish the frozen gate rather than turning Ron into a manual QA runner.
