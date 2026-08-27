# Trendyol print automation — current project fallback

Status: **ACTIVE / SAFE NEXT CANDIDATE HARDENED / LIVE MERGE UNVERIFIED**  
AS_OF: **2026-08-27 Europe/Istanbul**

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

A fail-closed candidate implementation is stored as a non-runtime test artifact:
- `tests/trendyol-print-next-v22/safe-next.js`
- deterministic model test: `tests/trendyol-print-next-v22/safe-next.test.js`

Candidate behavior:
- initial current-row attribution is accepted only from a **trusted real user Sticker click** (`event.isTrusted`); arbitrary synthetic DOM clicks cannot establish the starting row;
- `Ctrl+Alt+P` acts only when that exact row is still connected;
- scopes the search to the same table/row group;
- selects the nearest row **visually below** the current row rather than relying on DOM order or the first/top row;
- requires exactly one visible enabled Sticker action in that next row;
- otherwise fails closed and prints nothing;
- after the candidate itself dispatches the exact chosen next-row Sticker click successfully, it advances its tracked row to that known next row;
- does not invoke Done and does not modify the confirmed print/preview-close path.

Verification completed before the latest commit:
- JavaScript syntax check: PASS (`node --check`).
- Deterministic model test: PASS for nearest-visually-below selection, rejection when no row exists below, rejection when current-row identity is absent, fail-closed behavior before an exact current row is learned, rejection of synthetic initial Sticker attribution, acceptance of trusted Sticker attribution, exactly-one next Sticker click, and current-row advancement after the owned next click.
- Both candidate files were read back from GitHub after write.

### Safety hardening closed 2026-08-26 21:19
A self-audit found a mismatch between the candidate's stated invariant and its implementation: the previous click listener accepted synthetic `element.click()` events even though the owner said the starting row was learned only from a real Sticker action click. This could allow unrelated page/userscript code to establish row context.

Fix now committed:
- starting-row learning requires `event.isTrusted === true`;
- synthetic initial Sticker events are ignored;
- candidate-owned next-row clicks no longer rely on the generic click listener for attribution; row state advances only after dispatch of the exact already-selected next Sticker action returns;
- regression coverage for trusted-vs-synthetic attribution is now part of the deterministic test.

This closes the nearest safe repository-level hardening tail. It **does not** promote version `2.2` to the working baseline because the exact installed `2.1-rollback` source and Trendyol live DOM are not inspectable through the current connector surface.

## Repeated-order grouping candidate — 2026-08-27
Ron wants `Yeni Siparişler` to expose repeated products together so physical picking can be batched.

A separate **read-only / non-runtime** Tampermonkey candidate now exists at:
- `tests/trendyol-repeat-groups-v01/repeat-groups.js`

Candidate behavior:
- scans only visible rows that contain a recognizable Sticker action;
- identifies product identity by visible `Barkod` first, then SKU / `Stok Kodu` / product code, then a conservative product-title fallback;
- groups only identities appearing at least twice and sorts groups by descending repeat count;
- renders a floating `Tekrarlanan Siparişler` panel;
- clicking a group only highlights its matching rows and scrolls to the first one;
- does **not** reorder Trendyol DOM rows, print, invoke Done, invoke `İşleme Al`, or synthesize any order action.

Repository verification:
- syntax checked with `node --check`: PASS before commit;
- GitHub write read back successfully after commit `bb2cdafd4e2e97823a132a6834e2bb619f1fd69a`.

Live behavior remains **UNVERIFIED** because the current Trendyol DOM cannot be inspected through the available connector surface. First live test should install this as a separate temporary userscript and verify that barcode/SKU extraction groups the intended visible orders. It must not be merged with `2.1-rollback` until that read-only test passes.

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

For repeated-order grouping specifically, the first gate is separate: install `tests/trendyol-repeat-groups-v01/repeat-groups.js` as its own temporary userscript, verify extraction/group counts on `Yeni Siparişler`, then decide whether to connect a selected group to SAFE NEXT or another queue executor.

## Safety / attribution guard
If exact current-row or next-row identity cannot be established, fail closed rather than print a guessed row/page. Change one behavior at a time and preserve the rollback baseline. A newer explicit Ron report such as “this version works” supersedes this fallback only for the behavior/version actually confirmed.
