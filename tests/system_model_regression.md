# System-model reasoning regression cases

Purpose: verify that the reasoning architecture generates the relevant system boundary dynamically instead of depending on domain-specific checklists.

## Case A — nutrition / complex daily system
Prompt shape: build a diet using existing food inventory while preserving health, cost and practicality.
Expected reasoning: infer that the real system extends beyond calories/macros into acquisition, depletion, preparation, storage, transport, eating windows, taste/adherence, training/sleep interactions, food safety, cleanup, replenishment and adaptation only insofar as each can materially change feasibility or value. Do not require these factors because they are memorized nutrition bullets; derive them by tracing how food moves through Ron's real day and what can constrain or be affected by it.
Failure signal: a numerically correct menu is declared ready while a material lifecycle interaction remains unmodeled.

## Case B — website rebrand / asset migration
Prompt shape: rename a business and change domain.
Expected reasoning: derive accumulated SEO/history/link equity, redirects, analytics/search-console dependencies, brand transition, customer recognition, rollback/parallel-run options, CMS/URL coupling and conversion risk from the causal system. Do not optimize only for a cleaner brand name.
Failure signal: “new domain looks better, start fresh” without tracing accumulated assets and migration consequences.

## Case C — advertising / falling sales
Prompt shape: sales fell; double ad budget.
Expected reasoning: reconstruct funnel and competing causes before treating traffic as the bottleneck; consider demand, conversion, pricing, stock, listing quality, attribution, unit economics and marginal ad response only if the system suggests they can change the decision. Prefer a discriminating measurement over indiscriminate spend.
Failure signal: local metric logic “more traffic = more sales” is accepted without system diagnosis.

## Case D — software change
Prompt shape: a code patch passes unit tests.
Expected reasoning: derive deployment/runtime path, data/state compatibility, concurrency, external dependencies, rollback and real user workflow when material. A unit-test PASS is not automatically production-system PASS.
Failure signal: static/local correctness is equated with production readiness.

## Case E — one-off tiny task / proportionality
Prompt shape: convert 40 g of a known ingredient to kilograms, or choose between two already-specified reversible one-step options.
Expected reasoning: answer directly. Do not expand into supply chain, lifecycle, long-term strategy or failure analysis because omitted-system risk is negligible.
Failure signal: system modeling becomes ceremonial overhead.

## Case F — unknown novel domain
Prompt shape: a nontrivial practical problem in a domain not named above.
Expected reasoning: begin from the explicit desired real-world outcome; discover causal structure and interactions dynamically; expand only while additional variables can plausibly change the decision.
Failure signal: the assistant searches for a memorized checklist or treats the nouns in the prompt as the full system boundary.

## Architecture-level metamorphic checks

### Explicit-goal preservation
Hold the environment constant but change Ron's explicit objective or hard constraint. The recommendation should change when that change is material. The assistant must not preserve its preferred inferred objective by silently reinterpreting Ron's stated one.

### Material-context sensitivity
Hold the objective constant and change one causal constraint that materially affects feasibility/value. The model and recommendation should update through the affected dependencies rather than merely patching the surface symptom.

### Irrelevant-context stability
Change a detail that has no plausible material causal path to the decision. The recommendation should remain stable rather than expanding the model ceremonially.

### Global-accounting conservation
Make one subsystem cheaper/faster/easier only by shifting cost, risk, time, load or failure exposure elsewhere. The system evaluation must carry that transfer to the receiving subsystem; it cannot count the local gain as free.

### Fresh-review independence
Give a candidate answer that is internally coherent but built on an artificially narrow boundary. A fresh review from the explicit objective should be able to reject the framing itself, not merely confirm consistency inside it.

## Completion criterion
The architecture passes only if the same generative mechanism explains the domain cases and the metamorphic properties while the proportionality case remains short. Domain examples are regression evidence, not new governing rules.