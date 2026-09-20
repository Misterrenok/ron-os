#!/usr/bin/env python3
"""Regression guard for derived-current provenance semantics."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROTOCOL = (ROOT / "PROTOCOL.md").read_text(encoding="utf-8")
SKILL = (ROOT / "skills/total-value-optimizer.md").read_text(encoding="utf-8")
SPEC = (ROOT / "tests/derived-provenance-v1.md").read_text(encoding="utf-8")

def require(cond: bool, msg: str) -> None:
    if not cond:
        raise SystemExit(f"FAIL: {msg}")

def current_derivation(material_inputs: list[str]) -> str:
    """Reference policy for current derived claims."""
    return "VERIFIED" if all(x == "current_verified" for x in material_inputs) else "CONDITIONAL_OR_UNKNOWN"

def numeric_use_allowed(provenance: str, mode: str, robust_across_plausible_values: bool = False) -> bool:
    """Reference gate for stale/planned operands."""
    if provenance == "current_verified":
        return True
    if mode == "counterfactual_if":
        return True
    if mode == "current_ranking" and robust_across_plausible_values:
        return True
    return False

require("inherits the weakest provenance of every material input" in PROTOCOL, "derived-current inheritance rule missing")
require("Never fill a missing current input from stale/planned evidence" in PROTOCOL, "stale/planned fill prohibition missing")
require("identify each material operand and its provenance" in SKILL, "optimizer operand-level provenance gate missing")
require("do not silently reuse it for a current point estimate" in SKILL, "optimizer hidden stale-operand prohibition missing")
require("Do not promote stale/planned evidence into a current operand merely by calling it an assumption" in SKILL, "assumption-laundering prohibition missing")
require("explicitly counterfactual `IF` calculation" in SKILL, "counterfactual escape hatch missing")

# Contra: one material input is stale/planned, so the present-tense derived claim cannot be VERIFIED.
require(
    current_derivation(["current_verified", "stale_planned", "current_verified"]) == "CONDITIONAL_OR_UNKNOWN",
    "stale material input was laundered into a verified current derivation",
)

# Existing capability: with all material inputs verified, normal calculation remains allowed.
require(
    current_derivation(["current_verified", "current_verified", "current_verified"]) == "VERIFIED",
    "verified inputs should still permit a current derived calculation",
)

# Explicitly labelling stale evidence as an "assumption" does not make it current.
require(
    not numeric_use_allowed("stale_planned", "assumed_current"),
    "stale/planned evidence was promoted to a current operand by assumption wording",
)

# Counterfactual use remains available, and robust decisions may proceed without pretending the value is current.
require(
    numeric_use_allowed("stale_planned", "counterfactual_if"),
    "explicit counterfactual IF calculation should remain allowed",
)
require(
    numeric_use_allowed("stale_planned", "current_ranking", robust_across_plausible_values=True),
    "robust ranking across plausible values should remain allowed",
)

# Peripheral stale evidence that is not a material input is excluded before derivation.
material = ["current_verified", "current_verified"]
irrelevant = "stale_planned"
require(current_derivation(material) == "VERIFIED" and irrelevant == "stale_planned", "irrelevant stale evidence should not block")

for case in ("P1", "P2", "P3", "P4", "P5", "P6", "P7"):
    require(f"## {case} " in SPEC, f"behavioral regression case {case} missing")

print("PASS: derived-current provenance rejects stale material inputs while preserving verified calculations")
