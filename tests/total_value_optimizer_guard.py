#!/usr/bin/env python3
"""Structural regression guard for the cross-cutting total-value optimizer."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def require(cond: bool, msg: str) -> None:
    if not cond:
        raise SystemExit(f"FAIL: {msg}")

bootstrap = (ROOT / "BOOTSTRAP.md").read_text(encoding="utf-8")
protocol = (ROOT / "PROTOCOL.md").read_text(encoding="utf-8")
routing = (ROOT / "references/domain-routing.md").read_text(encoding="utf-8")
work = (ROOT / "skills/ron-work-protocol.md").read_text(encoding="utf-8")
skill_path = ROOT / "skills/total-value-optimizer.md"
regression_path = ROOT / "tests/total-value-optimizer-v1.md"

require(skill_path.exists(), "optimizer skill missing")
require(regression_path.exists(), "behavioral regression surface missing")
skill = skill_path.read_text(encoding="utf-8")
regression = regression_path.read_text(encoding="utf-8")

require("## Total-value optimization invariant" in protocol, "global compact invariant missing")
require("skills/total-value-optimizer.md" in protocol, "PROTOCOL does not route full optimizer procedure")
require("## Cross-cutting total-value optimization overlay" in routing, "cross-cutting routing section missing")
require("skills/total-value-optimizer.md" in routing, "router does not name optimizer skill")
require("cheap, obvious" in routing and "reversible" in routing, "router lost proportional low-stakes escape")
require("skills/total-value-optimizer.md" in work, "work orchestrator does not load optimizer")
require("skills/total-value-optimizer.md" in bootstrap, "direct mode does not expose optimizer for consequential self-contained choices")
require("self-contained direct mode" in protocol, "PROTOCOL does not permit direct-mode optimizer loading")
require("This skill owns procedure only." in skill, "optimizer must remain procedure-only")
require("probability, consequence" in skill, "probability/consequence weighting missing")
require("information value" in skill and "option value" in skill, "option/information value missing")
require("Analysis itself consumes resources" in skill, "analysis-cost stop rule missing")
require("Never fabricate a single numerical utility score" in skill, "fake-precision guard missing")

for case in ("T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8"):
    require(f"## {case} " in regression, f"regression case {case} missing")

print("PASS: total-value optimizer invariant, routing, ownership, proportionality and regression surface are wired")
