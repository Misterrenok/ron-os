# Derived-current provenance v2 — production replay — 2026-09-20

Status: **FAIL**

After v2 was merged and CI passed, the same targeted hypothetical job prompt was rerun in a fresh ordinary chat.

The answer no longer hid the source. It explicitly wrote: "для текущей работы я предполагаю 07:30–17:30 ... потому что именно так читаются твои фактические последние 3 недели" and then reported the current job as approximately **66.5 h/week** and ~288 h/month.

The prompt did not establish 07:30 as an observed current start time; 07:30 existed only in the old Calendar plan. Therefore v2 improved transparency but still laundered stale/planned evidence into a current operand by relabelling it as an assumption.

Disposition: v2 **did not behaviorally close** the failure class. v3 distinguishes legitimate counterfactual IF arithmetic from assumed-current arithmetic and forbids the latter from feeding a current point estimate/ranking unless robustness is established across plausible current values.
