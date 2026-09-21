#!/usr/bin/env python3
"""Regression guard for the nutrition master-plan architecture."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

skill = (ROOT / "skills" / "nutrition.md").read_text(encoding="utf-8")
method = (ROOT / "references" / "nutrition" / "method.md").read_text(encoding="utf-8")
factor_map = (ROOT / "references" / "nutrition" / "ideal-nutrition-factor-map.md").read_text(encoding="utf-8")
owner = (ROOT / "domains" / "nutrition.md").read_text(encoding="utf-8")

required_skill = [
    "Master Status Board first",
    "Do not create a second mutable nutrition status owner",
    "### Board maintenance rule",
]
required_method = [
    "## Canonical four-layer nutrition architecture",
    "### Layer 1 — Factor universe",
    "### Layer 2 — Master Status Board",
    "### Layer 3 — Dependency propagation graph",
    "### Layer 4 — Execution surface",
    "## Dependency propagation graph",
    "### Stale-artifact rule",
]
required_map = [
    "## Factor-map growth rule",
    "what about teeth/polyphenols/cooking?",
]
required_owner = [
    "# Nutrition Master Status Board",
    "single mutable GitHub owner",
    "| 1 | Goal, activity horizon, energy hypothesis",
    "| 10 | Microbiota / prebiotics / fermented foods / SCFA",
    "| 11 | Polyphenols / antioxidants / bioactives",
    "| 12 | Dental/oral health / free sugar / erosion",
    "| 16 | Cooking chemistry / AGE / acrylamide / oil oxidation",
    "| 18 | Actual dishes / taste / moisture / texture",
    "| 20 | Batch cooking / raw-to-cooked yield / cleanup",
    "| 22 | Containers / transport / work fridge / cold chain",
    "| 23 | Work / commute / training / sleep schedule fit",
    "| 25 | Procurement / Türkiye services / price / availability",
    "| 28 | Cognitive load / automation",
    "| 30 | Actual launch / adherence evidence",
    "## Master-board operating rule",
]

for label, text, needles in [
    ("skill", skill, required_skill),
    ("method", method, required_method),
    ("factor map", factor_map, required_map),
    ("owner", owner, required_owner),
]:
    missing = [needle for needle in needles if needle not in text]
    if missing:
        raise SystemExit(f"FAIL: {label} missing required architecture markers: {missing}")

if "domains/nutrition-status" in skill or "domains/nutrition-status" in method:
    raise SystemExit("FAIL: second mutable nutrition status owner introduced")

if owner.count("# Nutrition Master Status Board") != 1:
    raise SystemExit("FAIL: nutrition master status board must be singular")

print("PASS: nutrition factor-map -> status-board -> dependency-graph -> execution architecture is present")
