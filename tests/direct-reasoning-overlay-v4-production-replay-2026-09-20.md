# Direct-reasoning overlay v4 — production replay — 2026-09-20

Status: **FAIL**

A fresh ordinary-chat replay of the frozen hypothetical job-choice prompt was run after v4 structural deployment.

Observed behavior:
- The answer correctly rejected the old Calendar as the preferred source in prose.
- It still produced a current workload range for the existing job: approximately **55–67 h/week** and then used derived current-hour comparisons such as ~93 h/month saved versus B.
- The prompt did not establish the current start time of the existing job. Therefore even a range for current weekly workload was not grounded by current evidence.
- The upper end again corresponds to the stale Calendar-only 07:30 start if applied to five full weekdays plus Saturday.
- The answer did not explicitly mark current start time as UNKNOWN, nor keep the stale value confined to a clearly counterfactual IF calculation.

Decision: v4 **does not behaviorally close** the production failure.

Root-cause update:
The repeated ordinary-chat failures across v1-v4, despite repo-local rule changes and successful structural CI, now make the activation layer the leading suspect. An ordinary fresh chat is not guaranteed to load BOOTSTRAP/PROTOCOL/total-value procedure merely because those files exist in GitHub. Issue #26 already contains the rollback plan for the 2026-09-13 simplification of the personal instruction/skill layer: restore the prior Custom Instructions first, then restore/reinstall personal Ron Work Protocol if needed, and retest the actual observed failure.

Do not keep adding repo-local optimizer rules until the global activation path is restored or otherwise proven to execute in the fresh-chat condition.
