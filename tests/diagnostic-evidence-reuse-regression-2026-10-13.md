# Diagnostic evidence-reuse regression — Argox incident (2026-10-13)

Status: **TEST CASE ONLY / BEHAVIORAL FIX NOT VERIFIED**.
Parent: [issue #136](https://github.com/Misterrenok/ron-os/issues/136).
Purpose: preserve an observed assistant failure and test it on an unseen ordinary-chat reply without introducing synonymous runtime instructions or rerunning the previous E1–E5 experiments.

## Actual observed failure

1. Argox CP-2140 PPLB with gap-separated thermal labels: POWER blinking, FEED locking after print.
2. USB-disconnected FEED initially advanced ~2 blank labels, later repeatedly ~30 mm instead of advancing to the next label. Built-in self-test printed clearly.
3. The diagnostic page visibly showed `MEDIA TYPE: GAP`, `REFLECTIVE SENSOR (NORMAL) FORCE MODE`, `CUTTER DISABLE`, `LABEL LENGTH: 1226` (approximately 153 mm at 203 dpi).
4. The Windows driver had `Yazdırma Sonrası İşlem: Kes` (cut) despite a disabled cutter. Removing this command allowed two prints, then continued blank feeding. Calibration and factory reset had already been performed.
5. The assistant nevertheless asked for calibration again rather than using the conflicting sensor configuration in existing evidence. Ron explicitly objected to the repetition. Only afterward did the assistant suggest returning to transmissive / see-through sensing for gap labels. Ron replied, `Сработало !!!`.

**Verified scope:** Ron directly reported restoration after the sensor-mode switch. Continued normal PC printing after that final change has **not** been directly verified. The wrong cut command was a separate, observed setting; the complete hardware fault mechanism is not independently confirmed.

## Observed process-level root defect

The assistant failed to integrate **existing evidence + finished tests + configuration/material mismatch** before selecting the next intervention. It prematurely discarded the diagnostic printout as a source of candidate explanations and repeated an action that had not yielded new information. This is an observed input-to-output failure, *not* a claim to know internal model reasoning.

## Acceptance requirement, not another generic rule

For diagnostic tasks involving multiple artifacts/turns, an effective assistant should:
- Reuse all action-relevant observations in the current context (including screenshots and diagnostic printouts); preserve known tests and outcomes.
- Compare configuration against the actual medium/system, and give a concrete mismatch priority over speculative causes when it explains the symptom.
- Avoid repeating already-completed actions **unless** it identifies a changed condition or falsifiable reason the earlier result was invalid.
- Select one cheap, safe, discriminating next step, state what confirms/refutes it, and calibrate any claim of final repair to the checks actually performed.

## Bounded blind behavioral probes — NOT RUN

Run in **separate fresh ordinary ChatGPT chats** with no links to this rubric and no quoted expected action. Capture first reply verbatim; record model/effort if visible. Do not run a new global audit. Probes:

**A — physical device.** Provide the real case as a multi-turn transcript or equivalent device observations (GAP media; forced REFLECTIVE sensor from printed diagnostic output; previous calibration and reset done; self-test succeeds; wrong feed distances with USB absent; cut driver option removed but blank feed persists). Then ask only: `Что делать дальше?`

PASS: the assistant spontaneously identifies a sensor/media mismatch candidate, prioritizes checking/switching to the compatible see-through sensor using safe device-specific instructions, avoids repeating calibration/reset and proposes a falsifiable FEED/print check. FAIL: repeats completed steps without materially changed conditions, ignores the mismatch, or declares the printer fully fixed from one successful partial check.

**B — transfer to another domain.** In another fresh multi-turn chat, say: inventory CSV sample has four fields separated by semicolons; current importer diagnostic log says `parser delimiter=comma; expected 4 columns, got 1`; previous reboot/re-import and encoding checks already failed; upstream file is not editable. Then ask only: `Что делать дальше?`

PASS: explicitly reconciles the two pieces of evidence; recommends setting parser delimiter to semicolon (or equivalent import configuration) and one-row/preview validation, without another reboot/encoding investigation or mass file conversion. FAIL: fails to find the existing mismatch, repeats completed interventions or recommends an unneeded extensive test.

2/2 only establishes **narrow transfer evidence**. It does not guarantee ordinary model behavior or cover independent contexts. At first FAIL, preserve the complete first answer and classify whether source recognition, hypothesis coverage, action choice, repetition control, or verification was missed.

## Deployment boundary / closure

Ron OS currently has similar high-level expectations in `PROTOCOL.md` and `skills/ron-work-protocol.md`, and issue #136 already documents the lack of a compulsory runtime mechanism in ordinary ChatGPT. Merely storing this test or passing static CI **does not modify model behavior**. Do not claim this is a root-level deployment. If blind probes fail, prioritize the smallest actual delivery/execution mechanism that can be demonstrated to activate in real ordinary chats before changing more instructions. Keep #136 OPEN until independent behavioral evidence and runtime entrypoint are verified.
