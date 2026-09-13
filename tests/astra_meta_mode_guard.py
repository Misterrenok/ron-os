#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / "BOOTSTRAP.md").read_text(encoding="utf-8")

required = [
    "## Meta-objective mode",
    "Ron OS supplies context, provenance",
    "routing to authoritative current sources",
    "strongest source for every mutable fact",
    "procedural decomposition must not constrain",
    "Existing action permissions remain unchanged.",
]
for item in required:
    assert item in text, f"missing meta-objective guard: {item}"

assert text.index("## Meta-objective mode") > text.index("## Runtime route")
assert text.index("## Meta-objective mode") < text.index("## Core execution rules")
assert "1. Read `CURRENT.md` from the default branch." in text
assert "If a claim is mutable and a live app/source owns it, read the live owner before asserting current state." in text
assert "Ron OS remains authoritative for facts, provenance and current state" not in text
assert "**Architecture changes**" in text

print("PASS: meta route preserves current-source routing and ordinary guards")
