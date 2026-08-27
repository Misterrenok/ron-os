# Trendyol print automation — current project fallback

Status: **ACTIVE / NEXT DEPLOYMENT STEP OPEN**  
AS_OF: **2026-08-27 07:22 Europe/Istanbul**

Purpose: recover the last-confirmed working browser-automation state across chats. The live Tampermonkey script installed in Ron's Edge profile is the exact mutable owner when it can be inspected directly; this file is the last-confirmed fallback and must not overwrite newer explicit Ron results.

## Confirmed working baseline
- Script: `Trendyol - Sticker -> Auto Close -> Done`
- Version: **`2.1-rollback`**.
- Edge launch uses `--kiosk-printing`.
- Preserve the working flow intact: **Sticker -> print preview appears -> preview auto-closes -> Ctrl+Alt+I Done**.
- Order-processing direction is **top-to-bottom**. Any "next" operation must target the order visually below the current one, not the first/top order.
- Do not reintroduce earlier failure modes: printing the whole webpage, printing the wrong/top order, or leaving the preview open after printing.
- Keep only one active script version during testing so behavior is attributable.

## Safe technical tail closed — 2026-08-27
The row-selection kernel for `Print -> next order below` is now specified and regression-tested without touching the installed working script.

Artifact: `tests/trendyol-print-next-row-selector.test.js`.

Closed contract:
- input rows are full order rows normalized in actual top-to-bottom DOM order;
- the current row must be identified by exactly one non-empty dedicated row key;
- only a visible + explicitly eligible row below the current row may be selected;
- the candidate row must also have a unique non-empty key;
- missing, duplicated or ambiguous current/candidate identity returns `null` and performs no action;
- hidden and non-eligible rows are skipped;
- no row above/current can be selected as "next".

Verification: local Node execution passed **10/10** regression cases; the committed test artifact was then read back from this branch. This is a non-runtime kernel/test only and does **not** claim that candidate version `2.2` is deployed or working in Edge.

## Current unfinished step
Integrate the tested selector into the exact live `2.1-rollback` script after the installed script and Trendyol's current row DOM can be inspected. The integration must add only the adapter that produces `{key, visible, eligible}` full-row records plus the `Ctrl+Alt+P` Next trigger; it must not modify Sticker printing, preview auto-close or `Ctrl+Alt+I Done`.

Candidate version remains **2.2 (`working base + safe NEXT`)**, **NOT CONFIRMED WORKING** until live browser testing passes.

Required live test sequence:
1. confirm normal mouse Sticker still prints exactly the intended label and preview auto-closes;
2. on that same printed/current row, invoke `Ctrl+Alt+P` before Done;
3. require selection of exactly the next eligible row visually below;
4. if row identity is missing/ambiguous, require no print/navigation action;
5. only after the above passes, test `Ctrl+Alt+I Done` and confirm no unprinted order is processed.

## Safety / attribution guard
If exact next-row identity cannot be established, fail closed rather than print a guessed row/page. Change one behavior at a time and preserve the rollback baseline. A newer explicit Ron report such as “this version works” supersedes this fallback only for the behavior/version actually confirmed.
