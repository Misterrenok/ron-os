#!/usr/bin/env python3
"""Regression guard for continuity-guard cancellation semantics on main pushes."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
workflow = (ROOT / ".github" / "workflows" / "continuity-guard.yml").read_text(encoding="utf-8")

required = [
    "push:",
    "pull_request:",
    "cancel-in-progress: ${{ github.event_name == 'pull_request' }}",
    "ARCH_BASE: ${{ github.event.before }}",
    "run: python3 tests/architecture_change_guard.py",
]
missing = [needle for needle in required if needle not in workflow]
if missing:
    raise SystemExit(f"FAIL: continuity-guard missing required main-enforcement markers: {missing}")

if "cancel-in-progress: true" in workflow:
    raise SystemExit("FAIL: continuity-guard must not cancel a main push run when a later push arrives")

print("PASS: main push continuity checks cannot be cancelled by a later push; PR cancellation remains scoped")
