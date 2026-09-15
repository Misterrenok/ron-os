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
- A known blocker that is unchanged and still non-tool-executable is deferred, not re-selected as the primary slice; choose another materially useful executable slice or `NO-OP/PASS`. Retry it only when capability, authority, target state or evidence materially changes; unchanged `OPEN` status alone is not a change, and surface it to Ron only when it blocks the current outcome.
- **In-flight optimization is mandatory:** during execution, watch for repeated tool calls, unnecessary serial waits, duplicate verification, over-broad CI, micro-commits, avoidable rereads or any other workflow that is materially slower than necessary. When found, change the workflow in the same run without waiting for Ron to point it out.
- **Browser executor loop guard:** treat authentication as its own phase and verify signed-in state before a persistent mutation. After one timeout or materially repeated unresolved UI step, do not rerun the same broad goal: preserve the session, reduce to one atomic action/state check with a short bound; after a second materially identical failure, switch interface/executor or surface the exact blocker instead of a third equivalent run.
- Prefer batching related writes, running independent work while external jobs execute, reusing already verified evidence, and selecting the narrowest valid test/read-back path.
- Never trade away required safety, permission, integrity, architecture or production verification gates just to save time; optimize the path to those gates instead.

Target: routine bounded slices should usually finish in 5–10 minutes; architecture-significant slices in roughly 10–15 minutes when external CI allows.
