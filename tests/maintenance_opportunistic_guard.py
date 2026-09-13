#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"FAIL: {message}")


bootstrap = read("BOOTSTRAP.md")
protocol = read("PROTOCOL.md")

require(
    "Use Ron OS only when the request materially depends on Ron's current personal/project/app state" in bootstrap,
    "narrow Ron OS routing scope was lost",
)
require(
    "For self-contained/general questions, answer directly without loading Ron OS." in bootstrap,
    "unrelated self-contained fast path was lost",
)
require(
    "When Ron OS is already loaded for the request" in bootstrap,
    "opportunistic maintenance pickup is missing",
)
require(
    "execute only safe authorized assistant-owned fixes with verification" in bootstrap,
    "safe verified repair boundary is missing",
)
require(
    "Never load Ron OS solely to hunt maintenance on an unrelated self-contained request." in bootstrap,
    "maintenance must not broaden routing scope",
)
require(
    "## Live-source mutation gate" in protocol
    and "requires Ron's explicit permission for the exact intended change" in protocol,
    "live-source write gate was weakened",
)
require(
    "For any authority/routing/owner/snapshot/write-gate architecture change" in protocol
    and "Architecture Mode" in protocol,
    "architecture change gate was weakened",
)

print("PASS: opportunistic maintenance pickup preserves fast path and write gates")
