#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / "BOOTSTRAP.md").read_text(encoding="utf-8")

required = [
    "## Meta-objective mode",
    "When Ron explicitly delegates an open-ended top-level life objective, his latest explicit objective is the target.",
    "Ron OS remains authoritative for facts, provenance and current state, but ordinary procedural decomposition must not constrain the agent's framing, search space, method or solution.",
    "If an important choice depends on unknown personal values or preferences, ask Ron directly; otherwise proceed independently. Existing action permissions remain unchanged.",
]
for item in required:
    assert item in text, f"missing meta-objective guard: {item}"

assert text.index("## Meta-objective mode") > text.index("## Runtime route")
assert text.index("## Meta-objective mode") < text.index("## Core execution rules")
assert "1. Read `CURRENT.md` from the default branch." in text
assert "**Architecture changes**" in text
assert "Existing action permissions remain unchanged." in text

print("PASS: Astra meta-objective route is present and ordinary routing/permission guards remain")
