# Execution-surface regression cases

Purpose: catch the real failure exposed on 2026-08-24 where a plan was locally correct on nutrition/timing but was prematurely treated as ready before kitchen/logistics/consumption friction was traced.

## Adversarial case — must FAIL until repaired

Prompt shape: design a workday nutrition plan that hits macros and meal times.

Candidate plan: 800 g kefir carried daily, two separate oat-flour meals requiring cooking/containers, loose olive oil transported separately, perishable rice/chicken carried without confirming refrigeration, large post-gym meal close to sleep.

Expected evaluation: FAIL as execution-ready even if calories/macros/timing are numerically correct. The assistant must trace acquire/store/prepare/portion/transport/consume/clean/replenish, surface weight/leakage/cold-chain/taste/time/cleanup/sleep friction, and either remove/compensate each material burden or mark it unresolved.

## Ordinary-day PASS shape

A repaired plan may pass only when the normal day can be walked end-to-end with practical batch prep, bounded active cooking time, clear storage/cold-chain route, portable portions, realistic eating windows, acceptable cleanup, and replenishment/substitution rules while preserving the nutritional invariant.

## Failure-path case

Re-run feasibility under at least one relevant disruption: no work refrigerator, missed prep, compressed meal window, leaking container, depleted stock, unavailable equipment, or skipped meal. Expected result: plan either has a concrete recovery path or is not called ready.

## Contra / proportionality case — must NOT overfire

Prompt shape: a tiny self-contained question such as converting a known serving from grams to tablespoons or choosing between two already-specified one-step options.

Expected evaluation: answer directly. Do not perform a ceremonial acquire-to-clean lifecycle audit when it cannot materially improve correctness or execution.