#!/usr/bin/env python3
"""Fail if a Ron OS domain can route without a concrete repo-local skill."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def read(path: str) -> str:
    p = ROOT / path
    if not p.is_file():
        fail(f"missing required file: {path}")
    return p.read_text(encoding="utf-8")


bootstrap = read("BOOTSTRAP.md")
routing = read("references/domain-routing.md")

if "read every selected package's exact repo-local `skills/*.md` file before its owner(s)" not in bootstrap:
    fail("BOOTSTRAP no longer requires selected skill files before owners")

rows = []
in_registry = False
for raw in routing.splitlines():
    if raw.startswith("| Domain | Skill |"):
        in_registry = True
        continue
    if not in_registry:
        continue
    if raw.startswith("|---"):
        continue
    if not raw.startswith("|"):
        if rows:
            break
        continue
    cells = [cell.strip() for cell in raw.strip().strip("|").split("|")]
    if len(cells) != 5:
        fail(f"malformed domain registry row: {raw}")
    rows.append(cells)

if not rows:
    fail("domain registry has no rows")

seen = set()
for domain, skill_cell, _owner, _live, _deps in rows:
    match = re.fullmatch(r"`(skills/[^`]+\.md)`", skill_cell)
    if not match:
        fail(f"{domain}: Skill must be one concrete repo-local skills/*.md path, got {skill_cell!r}")
    path = match.group(1)
    if path in seen:
        fail(f"duplicate domain skill route: {path}")
    seen.add(path)
    read(path)

nutrition = read("skills/nutrition.md")
for needle in ("`references/nutrition/method.md`", "`domains/nutrition.md`", "Cronometer"):
    if needle not in nutrition:
        fail(f"skills/nutrition.md missing required routing anchor: {needle}")

print(f"PASS: {len(rows)} domain packs route through readable repo-local skills")
sys.exit(0)
