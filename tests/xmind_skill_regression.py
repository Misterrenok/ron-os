#!/usr/bin/env python3
"""Fail if the thin XMind router regresses into mutable map/medical snapshots."""

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TEXT = (ROOT / "skills/xmind.md").read_text(encoding="utf-8")

# Absolute node-count pairs are mutable live-map state and must never be embedded here.
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

if "Live XMind owns exact current" not in TEXT:
    raise SystemExit("FAIL: XMind live-owner boundary missing")
if "health/nutrition owner" not in TEXT:
    raise SystemExit("FAIL: medical-policy routing boundary missing")

print("PASS: XMind skill contains routing only; no mutable counts or fixed vitamin-D routine")
