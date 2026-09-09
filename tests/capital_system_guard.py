#!/usr/bin/env python3
"""Regression guard for Ron OS Skill Capital and Social Capital domains."""

from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class GuardError(ValueError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise GuardError(message)


def read(path: str) -> str:
    file_path = ROOT / path
    require(file_path.is_file(), f"missing required file: {path}")
    return file_path.read_text(encoding="utf-8")


def registry_paths() -> list[str]:
    paths: list[str] = []
    for raw in read("references/continuity-owner-registry.tsv").splitlines():
        if not raw or raw.startswith("#"):
            continue
        paths.append(raw.split("\t", 1)[0])
    return paths


def check_new_behavior() -> None:
    required_files = [
        "skills/skill-capital.md",
        "skills/social-capital.md",
        "domains/skill-capital.md",
        "domains/social-capital.md",
    ]
    for path in required_files:
        require((ROOT / path).is_file(), f"new capital-system artifact missing: {path}")

    registry = registry_paths()
    for owner in ("domains/skill-capital.md", "domains/social-capital.md"):
        require(registry.count(owner) == 1, f"{owner} must appear exactly once in owner registry")

    bootstrap = read("BOOTSTRAP.md")
    current = read("CURRENT.md")
    routing = read("references/domain-routing.md")
    for owner in ("domains/skill-capital.md", "domains/social-capital.md"):
        require(owner in bootstrap, f"{owner} missing from BOOTSTRAP.md")
        require(owner in current, f"{owner} missing from CURRENT.md")
        require(owner in routing, f"{owner} missing from domain-routing.md")

    require(
        "| Skill capital | `skills/skill-capital.md` | `domains/skill-capital.md`" in routing,
        "Skill Capital exact skill/owner route missing",
    )
    require(
        "| Social capital | `skills/social-capital.md` | `domains/social-capital.md`" in routing,
        "Social Capital exact skill/owner route missing",
    )

    skill = read("skills/skill-capital.md")
    skill_owner = read("domains/skill-capital.md")
    require("one primary build skill" in skill.lower(), "Skill Capital needs an explicit WIP-limit/default focus rule")
    require("real capability + evidence of capability" in skill, "Skill Capital needs capability/evidence before credential signal")
    require("UNKNOWN / NOT SELECTED BY THIS SYSTEM YET" in skill_owner, "Skill Capital owner must not fabricate an active skill")
    require("Last portfolio ranking: **NOT RUN**" in skill_owner, "Skill Capital owner must expose uninitialized ranking state")

    social = read("skills/social-capital.md")
    social_owner = read("domains/social-capital.md")
    require("family, friendship or romantic" in social, "Social Capital scope must exclude ordinary intimate/social relationships")
    require("Never mass-message" in social, "Social Capital must prohibit unsolicited mass outreach")
    require("Contact/network inventory: **NOT IMPORTED**" in social_owner, "Social Capital owner must not fabricate a contact graph")
    require("Trusted/reciprocal relationship count: **UNKNOWN**" in social_owner, "Social Capital owner must preserve unknown relationship quality")


def check_regressions() -> None:
    routing = read("references/domain-routing.md")
    registry = registry_paths()
    protocol = read("PROTOCOL.md")

    legacy_owners = (
        "domains/learning.md",
        "domains/finance.md",
        "domains/nutrition.md",
        "domains/training.md",
        "domains/ecommerce.md",
        "domains/mobility.md",
    )
    for owner in legacy_owners:
        require(registry.count(owner) == 1, f"legacy owner disappeared or duplicated: {owner}")

    require(
        "| Learning/languages | `skills/ron-learning.md` | `domains/learning.md` + `PERSON.md`" in routing,
        "Learning route was displaced by Skill Capital",
    )
    require(
        "goals/map + durable context for ordinary relationships" in routing,
        "ordinary social relationships no longer retain goals/map + context ownership",
    )
    require("| Finance | `skills/ron-finance.md` | `domains/finance.md`" in routing, "Finance route regressed")
    require("| Nutrition/health-food | `skills/nutrition.md` | `domains/nutrition.md`" in routing, "Nutrition route regressed")
    require(
        "live-source write requires Ron's explicit permission" in protocol,
        "live-source mutation permission gate was weakened or removed",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--regression", action="store_true", help="run preserved-capability checks only")
    args = parser.parse_args()

    if not args.regression:
        check_new_behavior()
    check_regressions()
    print("PASS: Skill Capital/Social Capital routing, initialization and preserved-capability checks")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except GuardError as exc:
        print(f"FAIL: {exc}")
        raise SystemExit(1)
