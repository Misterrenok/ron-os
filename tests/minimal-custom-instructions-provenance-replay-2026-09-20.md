# Minimal Custom Instructions provenance guard — replay — 2026-09-20

Status: **FAIL / active-guard state user-side not independently inspectable**

After the user was instructed to add a minimal global provenance paragraph to Custom Instructions, the frozen hypothetical job-choice prompt was rerun in a fresh ordinary chat.

Observed answer:
- It explicitly said the current job was ambiguous and presented a range instead of a single point.
- It nevertheless gave **54.7–66.5 h/week** and **237–288 h/month** for the current job.
- Both endpoints still require importing the stale Calendar-only **07:30** start time. The lower endpoint corresponds to four long weekdays plus Saturday starting 07:30; the upper endpoint corresponds to five long weekdays plus Saturday starting 07:30.
- It then used the derived current-time comparison downstream (e.g. B's time advantage vs current), so the stale operand still affected the recommendation.
- A↔B arithmetic remained valid because all A/B schedule inputs were explicit.

Interpretation:
If the new Custom Instructions paragraph was actually saved and active, the minimal provenance sentence is insufficient by itself. This does not yet distinguish instruction non-activation from instruction non-compliance. The next controlled intervention should target activation of the existing repo reasoning layer for consequential self-contained decisions, not add another provenance rule.

Do not call this behavioral closure.
