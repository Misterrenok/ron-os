# Skill Evidence v1

Policy ref: **`system-skill-evidence:v1`**  
Scale ref: **`system-skill-competency5:v1`**

## Purpose

Provide a conservative executable evidence floor for promoting a real skill Tier without conflating frequent Skill Mastery XP with competence.

The numeric thresholds below are System calibration parameters, not scientifically established universal learning laws.

## Evidence kinds

From weaker to stronger:
- `guided_practice`
- `independent_output`
- `objective_benchmark`
- `difficult_outcome`
- `external_validation`
- `exceptional_milestone`

All records must be verified, dated, skill-specific and no more than 180 days old at evaluation.

## Minimum package

| Tier | Minimum evidence floor |
|---:|---|
| 1 | >=1 verified guided-practice-or-stronger record |
| 2 | >=4 records across >=7 days, including >=2 independent-output-or-stronger records |
| 3 | >=6 records across >=28 days and >=1 objective benchmark or stronger |
| 4 | >=8 records across >=56 days, >=1 objective benchmark and >=2 difficult outcomes or stronger |
| 5 | >=10 records across >=84 days, >=1 objective benchmark, >=2 difficult outcomes and >=1 external validation or exceptional milestone |

Use the highest Tier whose **entire** floor is supported.

## Semantics

- Tier 1..5 remains the generic competency meaning in `CALIBRATION_SPEC.md`.
- Skill Mastery Level is a separate game-progress signal and cannot satisfy these gates by itself.
- Repeated trivial Quest farming cannot become a higher Tier unless the required evidence class/time/benchmark conditions are independently present.
- Unknown remains `null`.
- Automatic Growth Engine promotions are upward-only and are permitted only under `system-growth:v1`; ordinary skill configuration remains user-directed.
