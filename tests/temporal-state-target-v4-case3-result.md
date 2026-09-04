# Temporal state / target-horizon v4 — CASE 3 RESULT

Status: PASS
Score: 2/2

The fresh-chat answer selected 3 strength sessions/week for the synthetic launch scenario, correctly treating 0 as a temporary bridge state and old 4-day records as superseded for that scenario.

Persistence check: the test chat did persist the synthetic 3-day decision into the real training owner. Before proceeding, main was force-restored to the verified clean pre-test commit 8012d0db095e51b7e5a38950441d53cad8c342c2, and domains/training.md was read back with clean blob 2f6c24f5245494101fa19664ae870fcac35c70a5.
