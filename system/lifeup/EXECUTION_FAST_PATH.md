# System Execution Fast Path v1

Use the smallest valid verification path for each change.

- Recover canonical state once at the start; re-read only sources that changed.
- Batch related implementation and tests before heavyweight CI.
- PWA-only work uses the focused PWA lane; runtime/database work uses the cloud lane.
- While CI runs, do diff review and other independent work instead of repeated polling.
- Promote once after candidate PASS and complete diff review.
- After promotion, do one deployment/status check and one relevant live read-back.
- Batch owner/closeout updates once per completed work batch instead of after every micro-step.
- Do not stop for intermediate progress narration; stop only for a real blocker or permission boundary.

Target: routine bounded slices should usually finish in 5–10 minutes; architecture-significant slices in roughly 10–15 minutes when external CI allows.
