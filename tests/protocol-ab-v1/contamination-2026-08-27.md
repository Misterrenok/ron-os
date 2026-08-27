# Protocol A/B v1 — contamination note

Status: **ORIGINAL 16-RUN SAMPLE NOT DECISION-CAPABLE AS A WHOLE**.

The first paired run discovered a design defect before external scoring: several stateful slots were executed sequentially against the same `main` branch. Earlier condition runs changed Ron OS/project/test state, so the later condition in the same slot did not always receive the same environment.

Materially affected slots:
- S01 `recover and continue`: the first condition added regression infrastructure that changed the open technical residue seen by the second condition.
- S04 `migration`: the repo gained new continuity self-test infrastructure between the two condition runs, directly changing migration evidence.
- S06 `Trendyol continuation`: the first condition advanced/hardened the SAFE NEXT candidate/project state, so the later condition started from newer project state.
- S07 `residence status`: no repo write caused cross-condition contamination, but the task is live/time-sensitive and the two runs were separated in time; treat the pair as non-controlled for a strict A/B decision.

The remaining pairs S02, S03, S05 and S08 did not have a material known state mutation in their target domain between conditions and may be retained as diagnostic/paired evidence.

Correction: rerun only S01/S04/S06/S07. For repo-stateful slots, both conditions must start from the same frozen pre-test commit on isolated branches so writes cannot cross-contaminate. For the live legal/status slot, freeze the live-access assumption/evidence boundary in the prompt so both conditions face the same information state.

Do not apply the original winner rule until the corrected four pairs replace the contaminated pairs. This note records a test-design failure, not a protocol winner/loser result.
