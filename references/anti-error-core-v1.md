# Anti-error core v1

Status: durable reference / starter library  
Created: 2026-10-01  
Purpose: prevent high-cost recurring life errors with compact action patterns. This is not a list of authoritative quotes. Each pattern is a practical trigger with an explicit boundary so one heuristic does not become a new error.

Canonical pattern:
**trigger question -> heuristic -> if-then action -> boundary/counterexample -> memorable hook**.

## 1. Reality and evidence

### 1. Confirmation / motivated reasoning
- **Trigger:** “What evidence would make me admit I’m wrong?”
- **Heuristic:** Wanting a claim to be true is evidence about motivation, not truth.
- **If-then:** If a conclusion matters and I strongly prefer one answer, actively look for the strongest disconfirming evidence before committing.
- **Boundary:** Do not turn every trivial choice into adversarial research.
- **Hook:** “First try to prove yourself wrong.”

### 2. Correlation mistaken for causation
- **Trigger:** “What else could cause both things?”
- **Heuristic:** Things moving together do not establish that one caused the other.
- **If-then:** If an action depends on a causal claim, check confounders, reverse causality and plausible mechanism.
- **Boundary:** Strong experiments or well-established mechanisms can justify causal confidence.
- **Hook:** “After this does not mean because of this.”

### 3. Anecdote / base-rate neglect
- **Trigger:** “Is this one story or the normal rate?”
- **Heuristic:** Vivid examples are not population frequencies.
- **If-then:** If deciding about a class of events, seek the relevant base rate before overweighting a memorable case.
- **Boundary:** A direct case can still matter when it matches the exact mechanism or exposes a severe failure mode.
- **Hook:** “One swallow does not make a summer.”

### 4. Overconfidence and unknown unknowns
- **Trigger:** “What important thing might I not even know to ask?”
- **Heuristic:** Confidence should track evidence quality, not familiarity.
- **If-then:** If the cost of being wrong is high, seek an independent view or falsifiable check before an irreversible move.
- **Boundary:** Do not use uncertainty as an excuse for paralysis when action is cheap and reversible.
- **Hook:** “The map is not the territory.”

## 2. Choice and commitment

### 5. Sunk-cost error
- **Trigger:** “If I had invested nothing so far, would I choose to continue today?”
- **Heuristic:** Irrecoverable past costs do not make future spending worthwhile.
- **If-then:** If the main reason to continue is what was already spent, reassess using only future value, future costs and switching costs.
- **Boundary:** Existing skill, reputation, contracts or near-completion value are future assets, not sunk costs.
- **Hook:** “Do not throw good money after bad.”

### 6. Ignoring opportunity cost
- **Trigger:** “What am I giving up by choosing this?”
- **Heuristic:** The cost of an option includes the best credible alternative forgone.
- **If-then:** If a choice consumes meaningful time/money/attention, compare it with at least one strong alternative.
- **Boundary:** Do not compare against imaginary perfect alternatives that are not feasible.
- **Hook:** “Every yes is a no to something else.”

### 7. Single-metric optimization
- **Trigger:** “What important thing gets worse if I maximize this metric?”
- **Heuristic:** A proxy can be optimized while the real outcome deteriorates.
- **If-then:** If one metric dominates a decision, check downstream effects, failure modes and whether the metric still tracks the real goal.
- **Boundary:** Single metrics are fine when they truly capture the outcome and side effects are negligible.
- **Hook:** “What gets measured can get gamed.”

### 8. Premature commitment
- **Trigger:** “Can I buy information before I buy commitment?”
- **Heuristic:** Cheap reversible tests beat expensive guesses when uncertainty is decision-relevant.
- **If-then:** If two paths are uncertain and switching later is costly, run the smallest test that could change the choice.
- **Boundary:** Skip testing when the decision is obvious, cheap, or delay itself is costly.
- **Hook:** “Test before you bet.”

## 3. Action and execution

### 9. Procrastinating the important unpleasant task
- **Trigger:** “What am I avoiding because it feels unpleasant, not because it is low-value?”
- **Heuristic:** Avoidance often selects for short-term comfort over long-term value.
- **If-then:** If one high-value task is repeatedly deferred, define the smallest concrete first action and do it before optional low-value work.
- **Boundary:** “Eat the frog” is wrong when the unpleasant task is not actually important.
- **Hook:** “Eat the frog first.”

### 10. Waiting for motivation
- **Trigger:** “Can the environment make the action easier than resisting it?”
- **Heuristic:** Stable systems beat repeated acts of willpower.
- **If-then:** If the same good action is repeatedly missed, change cues, friction, defaults or timing before demanding more discipline.
- **Boundary:** Some actions remain inherently effortful; environment design is not magic.
- **Hook:** “Make the right action the easy action.”

### 11. Activity mistaken for progress
- **Trigger:** “What real-world result changed?”
- **Heuristic:** Motion, planning and busyness are not outcomes.
- **If-then:** If a task consumes repeated effort without measurable progress, redefine success in terms of an external result or stop.
- **Boundary:** Learning and exploration can create delayed value; not every useful activity pays immediately.
- **Hook:** “Busy is not productive.”

### 12. Perfectionism / polishing beyond value
- **Trigger:** “Would another hour plausibly change the decision or result?”
- **Heuristic:** Marginal quality eventually costs more than it returns.
- **If-then:** If additional refinement has little chance of changing outcome, ship/act and learn from feedback.
- **Boundary:** High-stakes safety, legal, medical and irreversible work may justify much higher verification.
- **Hook:** “Perfect is the enemy of good.”

## 4. Persistence and stopping

### 13. Escalating commitment after failure
- **Trigger:** “Has new evidence improved the case, or am I defending the old decision?”
- **Heuristic:** A failing strategy deserves new evidence, not more loyalty.
- **If-then:** If repeated results contradict the original thesis, update the thesis before adding more resources.
- **Boundary:** Noise and temporary setbacks do not automatically invalidate a sound long-term strategy.
- **Hook:** “Do not double down just to avoid admitting the first bet was wrong.”

### 14. Quitting because of discomfort
- **Trigger:** “Is this evidence the path is bad, or merely that it is hard?”
- **Heuristic:** Difficulty is not the same as negative expected value.
- **If-then:** If a valuable path is hard but assumptions still hold, reduce friction or adjust method before abandoning the objective.
- **Boundary:** Pain, danger, illegality, repeated failure of assumptions or dominated alternatives can justify stopping.
- **Hook:** “Hard is not the same as wrong.”

### 15. Helping where help has no leverage
- **Trigger:** “What will my next unit of help actually change?”
- **Heuristic:** Good intentions do not guarantee useful intervention.
- **If-then:** If progress requires the other person to act and they repeatedly refuse, stop automatically increasing your input; identify the real bottleneck first.
- **Boundary:** Children, acute crises, incapacity, illness or temporary overload can justify strong external support.
- **Hook:** “Do not row for someone who threw away their oars.”

### 16. Preserving an obsolete rule
- **Trigger:** “What changed since this rule was created?”
- **Heuristic:** A once-good rule can become harmful after the environment changes.
- **If-then:** If the assumptions behind a routine/strategy no longer hold, re-evaluate the rule instead of preserving it by habit.
- **Boundary:** Do not churn stable rules because of ordinary noise.
- **Hook:** “Update the map when the terrain changes.”

## 5. People and incentives

### 17. Ignoring incentives
- **Trigger:** “What does the other person gain or lose from each option?”
- **Heuristic:** Incentives often predict behavior better than stated intentions.
- **If-then:** If cooperation matters, inspect whether incentives align with the desired behavior before relying on promises.
- **Boundary:** People also act from values, identity, affection and norms; incentives are not the whole person.
- **Hook:** “Show me the incentives and I’ll show you the behavior.”

### 18. Taking responsibility that belongs to someone else
- **Trigger:** “Which part is actually mine to control?”
- **Heuristic:** Responsibility without control creates endless obligation and weakens boundaries.
- **If-then:** If an outcome depends on another adult’s choices, separate your controllable contribution from their responsibility.
- **Boundary:** Shared commitments and dependent-care situations legitimately create joint responsibility.
- **Hook:** “Own your part, not the whole world.”

### 19. Trusting words over repeated behavior
- **Trigger:** “What has this person consistently done, not merely said?”
- **Heuristic:** Repeated behavior is usually stronger evidence than promises.
- **If-then:** If words and actions conflict repeatedly, plan around observed behavior until new evidence appears.
- **Boundary:** One mistake or one unusual circumstance should not define a person forever.
- **Hook:** “Watch the feet, not the mouth.”

### 20. Conflict without shared objective
- **Trigger:** “Are we actually trying to achieve the same thing?”
- **Heuristic:** Technique cannot solve a disagreement about the goal itself.
- **If-then:** If discussion loops endlessly, check whether the parties disagree on facts, incentives, values or the objective before arguing tactics.
- **Boundary:** Some disputes really are about implementation after goals are aligned.
- **Hook:** “Agree on the game before arguing about the move.”

## 6. Time, money and attention

### 21. Penny-wise, pound-foolish
- **Trigger:** “Am I saving money by spending something more valuable?”
- **Heuristic:** Cheap in cash can be expensive in time, risk or attention.
- **If-then:** If a saving requires repeated friction or significant time, compare total cost rather than sticker price.
- **Boundary:** Time is not infinitely valuable; low-cost manual effort can be rational when cash is scarce.
- **Hook:** “Do not save pennies by burning hours.”

### 22. Ignoring the bottleneck
- **Trigger:** “What single constraint currently limits the whole system?”
- **Heuristic:** Improving non-bottlenecks may produce almost no real gain.
- **If-then:** If several parts are already adequate, identify the constraint that actually caps throughput/results and work there first.
- **Boundary:** Some systems have multiple interacting constraints or need resilience, not one bottleneck.
- **Hook:** “Strengthen the weakest link first.”

### 23. Doing manually what should be automated/delegated
- **Trigger:** “Will I repeat this enough for setup cost to pay back?”
- **Heuristic:** Repetition turns small inefficiencies into large cumulative losses.
- **If-then:** If a stable task repeats often and can be safely standardized, compare automation/delegation setup cost with cumulative future savings.
- **Boundary:** Do not automate unstable, rare or poorly understood work prematurely.
- **Hook:** “Automate repetition, not uncertainty.”

### 24. Too many priorities
- **Trigger:** “If everything is important, what actually gets my best attention?”
- **Heuristic:** Attention fragmentation can destroy throughput even when every task is individually useful.
- **If-then:** If several development projects compete, maintain background obligations but choose one main execution focus.
- **Boundary:** Some responsibilities cannot be serialized and must coexist.
- **Hook:** “Ten priorities means no priority.”

## 7. Risk and protection

### 25. Underprotecting against large downside
- **Trigger:** “Is there a cheap protection against a severe failure?”
- **Heuristic:** Small recurring cost can be rational against large irreversible loss.
- **If-then:** If downside is severe and protection is cheap/reliable, protect even when probability is modest.
- **Boundary:** Do not insure every imaginable remote possibility at high cost.
- **Hook:** “Better safe than sorry — when safety is cheap.”

### 26. Overprotecting / excessive caution
- **Trigger:** “What opportunity am I paying to avoid this risk?”
- **Heuristic:** Risk avoidance also has a cost.
- **If-then:** If downside is bounded/reversible and upside is meaningful, prefer a controlled experiment over blanket avoidance.
- **Boundary:** Catastrophic, irreversible or poorly understood risks deserve stricter caution.
- **Hook:** “A ship is safe in harbor, but that is not what ships are for.”

### 27. Irreversible action before reversible test
- **Trigger:** “Can I make this smaller, temporary or reversible first?”
- **Heuristic:** Preserve option value when uncertainty is high.
- **If-then:** If commitment is costly to undo, pilot at smaller scale before full commitment when feasible.
- **Boundary:** Delay can destroy opportunities; not every decision has a useful pilot.
- **Hook:** “Try the door before breaking the wall.”

### 28. Ignoring tail risk
- **Trigger:** “What could wipe out years of progress?”
- **Heuristic:** Rare events with catastrophic consequences deserve disproportionate attention.
- **If-then:** If one plausible failure can cause ruin, add a robust floor: buffer, backup, legal compliance, diversification or emergency plan.
- **Boundary:** Do not let tiny speculative catastrophes dominate everyday life.
- **Hook:** “Do not risk what you cannot afford to lose.”

## 8. Meta-errors

### 29. Solving the symptom instead of the cause
- **Trigger:** “What keeps producing this problem?”
- **Heuristic:** Repeated symptoms usually justify looking upstream.
- **If-then:** If the same failure recurs after local fixes, map the causal chain and intervene at the earliest practical cause.
- **Boundary:** Sometimes symptom relief is urgent and must come first.
- **Hook:** “Do not keep mopping while the tap is running.”

### 30. Wrong question / wrong problem
- **Trigger:** “What outcome am I actually trying to get?”
- **Heuristic:** A perfectly solved wrong problem is still failure.
- **If-then:** If a task becomes complex or expensive, restate the desired real-world outcome and ask whether the task can be removed, reframed or replaced.
- **Boundary:** Do not endlessly reframe a straightforward necessary task.
- **Hook:** “Before climbing faster, check the ladder is on the right wall.”

## Operating rule
- Do not memorize all 30.
- Use them as a diagnostic library.
- Promote a pattern into active use only when it matches a real recurring error or a high-cost decision class.
- When two heuristics conflict, choose using conditions and expected consequences, not by which slogan sounds wiser.
- A pattern is successful only if it changes a real decision or behavior and reduces error; recall alone is not success.
