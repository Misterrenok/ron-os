# Trendyol print automation — current project fallback

Status: **ACTIVE / NEXT STEP OPEN**  
AS_OF: **2026-08-24 12:56 Europe/Istanbul**

Purpose: recover the last-confirmed working browser-automation state across chats. The live Tampermonkey script installed in Ron's Edge profile is the exact mutable owner when it can be inspected directly; this file is the last-confirmed fallback and must not overwrite newer explicit Ron results.

## Confirmed working baseline
- Script: `Trendyol - Sticker -> Auto Close -> Done`
- Version: **`2.1-rollback`**
- Edge launch uses `--kiosk-printing`.
- Preserve the working flow intact: **Sticker -> print preview appears -> preview auto-closes -> Ctrl+Alt+I Done**.
- Order-processing direction is **top-to-bottom**. Any "next" operation must target the order visually below the current one, not the first/top order.
- Do not reintroduce earlier failure modes: printing the whole webpage, printing the wrong/top order, or leaving the preview open after printing.
- Keep only one active script version during testing so behavior is attributable.

## Current unfinished step
Add **only** `Print -> next order below` without modifying the confirmed Sticker/auto-close/Done baseline.

Last proposed experiment:
- separate full-table-row identification for the next-order logic;
- use a dedicated `NEXT_ROW_KEY` rather than reusing fragile top-row logic;
- candidate version was **2.2 (`working base + safe NEXT`)**, but it is **NOT CONFIRMED WORKING** and therefore must not replace `2.1-rollback` as the fallback owner state;
- test sequence: first confirm normal mouse Sticker still works, then test `Ctrl+Alt+P` for Next **before** invoking Done.

## Safety / attribution guard
If exact next-row identity cannot be established, fail closed rather than print a guessed row/page. Change one behavior at a time and preserve the rollback baseline. A newer explicit Ron report such as “this version works” supersedes this fallback only for the behavior/version actually confirmed.
