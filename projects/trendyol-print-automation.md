# Trendyol print automation — current project fallback

Status: **ACTIVE / SAFE NEXT CANDIDATE READY / LIVE MERGE UNVERIFIED**  
AS_OF: **2026-08-26 20:24 Europe/Istanbul**

Purpose: recover the last-confirmed working browser-automation state across chats. The live Tampermonkey script installed in Ron's Edge profile is the exact mutable owner when it can be inspected directly; this file is the last-confirmed fallback and must not overwrite newer explicit Ron results.

## Confirmed working baseline
- Script: `Trendyol - Sticker -> Auto Close -> Done`
- Version: **`2.1-rollback`**.
- Edge launch uses `--kiosk-printing`.
- Preserve the working flow intact: **Sticker -> print preview appears -> preview auto-closes -> Ctrl+Alt+I Done**.
- Order-processing direction is **top-to-bottom**. Any "next" operation must target the order visually below the current one, not the first/top order.
- Do not reintroduce earlier failure modes: printing the whole webpage, printing the wrong/top order, or leaving the preview open after printing.
- Keep only one active integrated script version during live testing so behavior is attributable.

## Nearest safe technical tail — repository implementation closed 2026-08-26
The previously open behavior was: add **only** `Print -> next order below` without modifying the confirmed Sticker/auto-close/Done baseline.

A fail-closed candidate implementation is now stored as a non-runtime test artifact:
- `tests/trendyol-print-next-v22/safe-next.js`
- deterministic model test: `tests/trendyol-print-next-v22/safe-next.test.js`

Candidate behavior:
- learns the exact current row only from a real Sticker action click;
- `Ctrl+Alt+P` acts only when that exact row is still connected;
- scopes the search to the same table/row group;
- selects the nearest row **visually below** the current row rather than relying on DOM order or the first/top row;
- requires exactly one visible enabled Sticker action in that next row;
- otherwise fails closed and prints nothing;
- does not invoke Done and does not modify the confirmed print/preview-close path.

Verification completed before commit:
- JavaScript syntax check: PASS (`node --check`).
- Deterministic model test: PASS for nearest-visually-below selection, rejection when no row exists below, rejection when current-row identity is absent, and fail-closed behavior before an exact current row is learned.
- Both committed files were read back from GitHub after write.

This closes the safe repository-level implementation/test tail. It **does not** promote version `2.2` to the working baseline because the exact installed `2.1-rollback` source and Trendyol live DOM are not inspectable through the current connector surface.

## Remaining live integration gate
Exact current installed script: **UNKNOWN/UNVERIFIED** until the live Tampermonkey source is inspected.

When that source is available, the next action is narrowly defined:
1. read the installed `2.1-rollback` source;
2. merge only the SAFE NEXT augmentation, resolving any selector/hotkey collision without changing Sticker, preview auto-close, or `Ctrl+Alt+I Done`;
3. keep one integrated script active;
4. confirm normal mouse Sticker still works;
5. before invoking Done, test `Ctrl+Alt+P` once and verify it prints the order visually below the current order;
6. verify no whole-page print, no top-row jump, no preview regression;
7. only after Ron/live evidence confirms this behavior, promote the working fallback from `2.1-rollback` to the actually confirmed integrated version.

## Safety / attribution guard
If exact current-row or next-row identity cannot be established, fail closed rather than print a guessed row/page. Change one behavior at a time and preserve the rollback baseline. A newer explicit Ron report such as “this version works” supersedes this fallback only for the behavior/version actually confirmed.
