# Trendyol print automation — current project fallback

Status: **CLOSED / USER-CONFIRMED SATISFACTORY**  
AS_OF: **2026-08-31 Europe/Istanbul**

Purpose: preserve the last-confirmed browser-automation continuity without reopening already-solved work.

## Closure — 2026-08-31
Ron explicitly reports that the Trendyol auto-print workflow has long since been configured to his liking and asks to forget it as an open project. Treat the project as **CLOSED**. Do not surface SAFE NEXT, repeated-order grouping, live DOM inspection, Edge/Work inspection or any other historical technical tail as pending work or as a daily-brief opportunity unless Ron later reports a new concrete problem or explicitly reopens the project.

The live installed Tampermonkey/Edge setup remains the exact owner of deployed behavior if a future issue is reported. The material below is historical continuity only and must not override the 2026-08-31 closure.

## Historical confirmed working baseline
- Script: `Trendyol - Sticker -> Auto Close -> Done`
- Historical version: **`2.1-rollback`**.
- Edge launch used `--kiosk-printing`.
- Historical preserved flow: **Sticker -> print preview appears -> preview auto-closes -> Ctrl+Alt+I Done**.
- Order-processing direction was **top-to-bottom**.

## Printer change — 2026-10-13 (Ron report; targeted maintenance guidance)
- **New printer explicitly reported by Ron:** Argox CP-2140 PPLB, replacing the previous printer. The live Edge shortcut/driver/printer selection and actual print outcome are **not independently inspected**.
- **Ron-supplied shortest procedure for this already-established Edge setup:** in the **same Edge shortcut's Properties -> Target (Объект)** temporarily remove only `--kiosk-printing`; launch Edge without that flag, open normal `Ctrl+P` and choose **Argox CP-2140 PPLB** (print one label if needed to retain/check the destination); fully close Edge; restore `--kiosk-printing` to the shortcut; reopen using that shortcut. The previous Tampermonkey script need not be edited just to switch the selected printer.
- **Guidance failure observed in chat, 2026-10-13:** the assistant had already retrieved this project's known `--kiosk-printing` flag but prioritized generic Edge/Windows printer defaults and delayed the shortcut-specific solution. This is a **failure to apply available architecture/context when generating/ranking candidate actions**, not merely a missing stored fact. The precise internal model cause is unverified.
- **Future trigger:** for a printer replacement in this known kiosk-printing workflow, give the reversible shortcut-flag procedure first. Troubleshoot Windows defaults, print preferences, driver, paper size or Tampermonkey only if this fails or there is a separately observed print defect. Preserve existing script/shortcut settings beyond the temporary flag change.
- **State:** one-off device-switch guidance documented; no confirmed browser-runtime write or independent print test; no new software-development backlog. Prior 2026-08-31 project closure still applies to unrelated historical candidates.

## Historical repository candidates — CLOSED, NOT PENDING
The former SAFE NEXT candidate remains as a non-runtime test artifact:
- `tests/trendyol-print-next-v22/safe-next.js`
- `tests/trendyol-print-next-v22/safe-next.test.js`

The former repeated-order grouping candidate remains at:
- `tests/trendyol-repeat-groups-v01/repeat-groups.js`

These artifacts are provenance only. They are not instructions to continue implementation, merge, inspect live DOM, or run live tests after the user's 2026-08-31 closure.

## Reopen rule
Reopen this project only on a newer explicit Ron report of a concrete print/order-automation problem or an explicit request to change the current workflow. On reopen, inspect the then-current live installed script/runtime before relying on historical repository candidates.