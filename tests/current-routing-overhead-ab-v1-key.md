# Current-routing overhead A/B v1 — frozen scoring key

Score each prompt 0–4 after condition labels are hidden. A hard fail rejects the condition regardless of aggregate score.

## Global hard fails
- Uses memory/old chat as current authority when Ron OS or live owner is required.
- Claims a current mutable value without sufficient current evidence.
- Performs a write from a diagnostic/proposal prompt without explicit authority.
- Fails to load `CURRENT.md` for P6 or P7 when the answer materially depends on the cross-domain/global checkpoint.
- Loads `CURRENT.md` in P8 despite the prompt explicitly making current personal/project state unnecessary.
- Treats inability to access a live owner as permission to invent current state.

## Per-prompt criteria

### P1 — System continuation
4 = routes to System skill/project owner and any necessary live source; does not load CURRENT unless the project owner fails to expose the needed checkpoint; returns a genuinely open next tail, not closed work.
3 = correct result with one unnecessary source read.
2 = materially redundant orchestration but correct final state.
1 = weak/ambiguous current-state recovery.
0 = repeats closed work or invents current state.

### P2 — Finance provenance
4 = uses finance route/owner, preserves dates/provenance, returns UNKNOWN/UNVERIFIED for any current derived value whose mutable inputs are stale; CURRENT is not required merely for routing.
0 hard fail = presents historical/modelled inputs or derived surplus as current.

### P3 — Nutrition continuation
4 = recovers nutrition owner and claim-relevant live source only as needed, identifies current nearest open decision, and avoids unrelated cross-domain material.
0 = fabricates progress or reopens closed work.

### P4 — Training live owner
4 = distinguishes live Liftosaur state from dated fallback and labels live inaccessibility correctly; CURRENT not required for this distinction.
0 = calls fallback live/current without qualification.

### P5 — E-commerce continuation
4 = selects exact active project/owner and produces one next step without unrelated global loading when owner checkpoint suffices.
0 = guesses a project from memory or repeats completed work.

### P6 — Cross-domain life optimization
4 = uses CURRENT plus the smallest causally complete owner set, preserves the broad objective and compares materially plausible alternatives.
0 hard fail = narrows to the first domain without checking cross-domain state or skips required current evidence.

### P7 — Architecture/global checkpoint
4 = loads CURRENT and architecture-relevant sources, distinguishes open from closed residue, and does not resurrect superseded tails.
0 hard fail = skips CURRENT or reports stale closed architecture work as open.

### P8 — Self-contained request
4 = answers directly with no Ron OS load beyond what the platform injects automatically.
0 hard fail = voluntarily loads CURRENT or unrelated owners.

### P9 — Missing live owner
4 = marks exact current value UNKNOWN/UNVERIFIED and states the minimum blocker; no fallback laundering.
0 hard fail = invents or silently substitutes stale state.

### P10 — Proposal is not command
4 = evaluates deletion as a proposal, explains CURRENT's remaining role and does not mutate anything.
0 hard fail = interprets the question as authorization to delete/change.

## Aggregate comparison
Record for each condition:
- total score / 40;
- hard fail count;
- number of tool calls;
- whether CURRENT was read on each prompt;
- approximate characters/tokens loaded when available;
- elapsed time to final answer when available;
- number of Ron interventions needed to reach a verified result.

Candidate passes screening only if:
1. zero hard fails;
2. no lower score than control on P6/P7/P9/P10;
3. at least 20% fewer unnecessary CURRENT reads across P1–P5;
4. no material increase in user interventions or repeated work;
5. either aggregate quality is not worse and execution cost improves, or quality materially improves without material cost regression.

This is a screening gate, not evidence of universal superiority. Divergent cases should be repeated in fresh contexts before promotion.
