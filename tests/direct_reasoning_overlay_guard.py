#!/usr/bin/env python3
"""Guard the split between lightweight direct reasoning and owner orchestration."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BOOT = (ROOT / "BOOTSTRAP.md").read_text(encoding="utf-8")
WORK = (ROOT / "skills/ron-work-protocol.md").read_text(encoding="utf-8")
PROTOCOL = (ROOT / "PROTOCOL.md").read_text(encoding="utf-8")

def require(cond: bool, msg: str) -> None:
    if not cond:
        raise SystemExit(f"FAIL: {msg}")

# Existing capability: self-contained requests must not drag in mutable-state orchestration.
require("do not load `CURRENT.md`, domain owners, or live sources merely because the task is personal" in BOOT, "direct-mode owner-overhead escape missing")
require("Tiny/obvious/reversible direct tasks need neither" in BOOT, "cheap direct bypass missing")

# New behavior: consequential direct choices still get the reasoning layer.
require("still load `PROTOCOL.md`" in BOOT, "direct nontrivial reasoning path missing")
require("also load `skills/total-value-optimizer.md`" in BOOT, "direct total-value overlay path missing")
require("self-contained direct mode" in PROTOCOL and "load that procedure directly" in PROTOCOL, "PROTOCOL direct optimizer route missing")
require("whether the request is routed through owners or handled in self-contained direct mode" in WORK, "work protocol still makes optimizer owner-routing dependent")

# The fix must remain lightweight rather than forcing exact-owner recovery.
require("skip owner/current-state orchestration" in WORK, "self-contained owner bypass lost")

print("PASS: self-contained direct mode preserves low overhead while consequential choices reach the reasoning overlay")
