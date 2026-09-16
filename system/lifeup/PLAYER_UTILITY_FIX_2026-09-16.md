# Player utility correction — 2026-09-16

Status: candidate pending promotion.

Observed defects:
- `Marketplace Operations` Tier 3 was derived from stale false evidence claiming about three years of marketplace experience. Current owner says about four months, Trendyol only, at the current workplace.
- Skill cards exposed only name/status/level, hiding evidence and making stale precision look authoritative.
- The focused `Hallo!` quest had no direct execution link while the XMind strategy link was prominent.

Candidate correction:
- add a direct `НАЧАТЬ УРОК` action for the current Hallo quest to the canonical DW lesson;
- demote the XMind link to secondary strategy navigation;
- expose skill evidence/scale/next-level evidence requirement;
- fail closed on the known stale marketplace calibration: hide the numeric level as confirmed until upstream skill evidence is recalibrated to the current owner truth.

This UI guard does not rewrite the append-only player ledger. The stale live `skill.upserted` event still requires a new canonical `skill.upsert` through the production action gate; do not edit/delete historical events.
