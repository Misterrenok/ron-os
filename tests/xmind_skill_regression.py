#!/usr/bin/env python3
"""Fail if the thin XMind router regresses into mutable snapshots or loses change detection."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TEXT = (ROOT / "skills/xmind.md").read_text(encoding="utf-8")
SNAPSHOT_CONTRACT = ROOT / "snapshots/xmind/README.md"

# Absolute node-count pairs are mutable live-map state and must never be embedded in the skill.
if re.search(r"\b\d{2,4}\s*/\s*\d{2,4}\b", TEXT):
    raise SystemExit("FAIL: skills/xmind.md embeds mutable absolute node counts")

# The real 2026-08-29 regression reintroduced a fixed quarterly vitamin-D routine.
bad_medical = [
    r"quarterly\s+vitamin[- ]?d",
    r"vitamin[- ]?d.{0,40}quarter",
    r"квартальн\w*.{0,40}витамин\w*\s*d",
    r"витамин\w*\s*d.{0,40}квартальн",
]
for pattern in bad_medical:
    if re.search(pattern, TEXT, flags=re.IGNORECASE | re.DOTALL):
        raise SystemExit("FAIL: skills/xmind.md embeds a fixed vitamin-D testing routine")

for needle, message in [
    ("Live XMind owns exact **current**", "current-state live-owner boundary missing"),
    ("health/nutrition owner", "medical-policy routing boundary missing"),
    ("snapshots/xmind/", "historical snapshot route missing"),
    ("complete same-scope", "comparable-baseline requirement missing"),
    ("change history is `UNKNOWN`", "no-baseline uncertainty rule missing"),
    ("pre-snapshot -> write", "pre/post mutation snapshot gate missing"),
]:
    if needle not in TEXT:
        raise SystemExit(f"FAIL: XMind skill {message}")

if not SNAPSHOT_CONTRACT.is_file():
    raise SystemExit("FAIL: snapshots/xmind/README.md change-detection contract missing")
contract = SNAPSHOT_CONTRACT.read_text(encoding="utf-8")
for needle in [
    "Snapshots are append-only evidence",
    "partial sheet/subtree read",
    "expected delta vs actual delta",
    "cannot prove exact per-node no-change",
]:
    if needle not in contract:
        raise SystemExit(f"FAIL: XMind snapshot contract missing: {needle!r}")

print("PASS: XMind current authority, historical diff evidence, and stale-snapshot guards are separated")
