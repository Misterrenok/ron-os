#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
text = (ROOT / "BOOTSTRAP.md").read_text(encoding="utf-8")
protocol = (ROOT / "PROTOCOL.md").read_text(encoding="utf-8")

required = [
    "## Meta-objective mode",
    "Ron OS supplies context, provenance",
    "routing to authoritative current sources",
    "strongest source for every mutable fact",
    "procedural decomposition must not constrain",
    "Legacy `ron-continuity` and other non-authoritative continuity surfaces must not govern framing, method, or current state in meta-objective mode.",
    "working objective and evidence of current preference",
    "not automatically as terminal ground truth",
    "preference epistemics before locking it",
    "proportionate reversible preference discovery",
    "Existing action permissions remain unchanged.",
]
for item in required:
    assert item in text, f"missing meta-objective guard: {item}"

assert text.index("## Meta-objective mode") > text.index("## Runtime route")
assert text.index("## Meta-objective mode") < text.index("## Core execution rules")

runtime = text[text.index("## Runtime route"):text.index("## Meta-objective mode")]
assert "`references/domain-routing.md`" in runtime
assert "`CURRENT.md`" in runtime
assert "cross-domain/global" in runtime
assert "not a mandatory pre-read" in runtime
assert "If a claim is mutable and a live app/source owns it, read the live owner before asserting current state." in text
assert "Ron OS remains authoritative for facts, provenance and current state" not in text
assert "his latest explicit objective is the target" not in text
assert "a stated goal/preference is not LOCKED merely because it is explicit" in protocol
assert "consequential life-shaping objectives must pass total-value preference epistemics" in protocol
assert "**Architecture changes**" in text

print("PASS: meta route preserves current-source routing, conditional cross-domain checkpoint access, legacy precedence, and ordinary guards")
