# Derived-current provenance v1 — production replay — 2026-09-20

Status: **FAIL**

After v1 was merged and CI passed, the same targeted hypothetical job prompt was rerun in a fresh ordinary chat.

The answer correctly said: "Календарь здесь нельзя считать источником истины" and claimed it would use the factual last three weeks. It nevertheless reported the current job as approximately **66.5 h/week** including commute.

That number is only obtainable by silently reusing the stale Calendar-only **07:30** start time together with the observed 17:30 end time, recent day pattern and 55-minute one-way commute. The hypothetical scenario did not re-confirm 07:30 as an actual current start time.

Disposition: v1 structural rule **did not close the production behavioral defect**. Root cause is localized to execution-time operand provenance: verbal source rejection did not constrain the inputs actually used in arithmetic. v2 therefore moves the guard into the total-value optimizer's comparison/calculation step.
