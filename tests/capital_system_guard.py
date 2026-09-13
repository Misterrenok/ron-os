#!/usr/bin/env python3
"""Regression guard for Ron OS Skill Capital and Social Capital domains."""

from __future__ import annotations

import argparse
import re
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


def validate_skill_owner_state(text: str) -> None:
    """Allow uninitialized, initialized-under-review, or evidenced initialized state."""
    if "PORTFOLIO UNINITIALIZED" in text:
        require(
            "UNKNOWN / NOT SELECTED BY THIS SYSTEM YET" in text,
            "uninitialized Skill Capital must not fabricate an active skill",
        )
        require("Last portfolio ranking: **NOT RUN**" in text, "uninitialized Skill Capital must expose NOT RUN")
        return

    require("PORTFOLIO INITIALIZED" in text, "Skill Capital must declare initialized or uninitialized state")

    allocation_review = re.search(
        r"^- Primary skill allocation:\s*\*\*UNDER REVIEW\b.*?\*\*",
        text,
        flags=re.MULTILINE,
    )
    if allocation_review is not None:
        require(
            re.search(r"^- Last review:\s*\*\*\d{4}-\d{2}-\d{2}\*\*", text, flags=re.MULTILINE) is not None,
            "under-review Skill Capital needs a dated review",
        )
        require("- Review:" in text, "under-review Skill Capital needs a next review trigger/date")
        require(
            re.search(r"^- Primary skill:\s*\*\*(?!UNKNOWN|NOT SELECTED|UNDER REVIEW).+?\*\*", text, flags=re.MULTILINE) is None,
            "under-review Skill Capital must not simultaneously claim a selected primary skill",
        )
        return

    primary = re.search(r"^- Primary skill:\s*\*\*(.+?)\*\*", text, flags=re.MULTILINE)
    require(primary is not None, "initialized Skill Capital needs an explicit primary skill or UNDER REVIEW allocation")
    primary_value = primary.group(1).upper()
    require("UNKNOWN" not in primary_value and "NOT SELECTED" not in primary_value, "initialized primary skill cannot be UNKNOWN")
    require(re.search(r"^- Last ranking:\s*\*\*\d{4}-\d{2}-\d{2}\*\*", text, flags=re.MULTILINE) is not None,
            "initialized Skill Capital needs a dated ranking")
    require("## Proof target" in text, "initialized Skill Capital needs an explicit proof target")
    require("Review:" in text, "initialized Skill Capital needs a review trigger/date")
    require("baseline" in text.lower(), "initialized Skill Capital must expose current baseline evidence/status")
    require("Why" in text or "bottleneck" in text.lower(), "initialized Skill Capital needs ranking rationale")


def validate_social_owner_state(text: str) -> None:
    """Allow role-level initialization without fabricating a private contact graph."""
    if "NETWORK INVENTORY UNINITIALIZED" in text:
        require("Contact/network inventory: **NOT IMPORTED**" in text, "uninitialized Social Capital must not fabricate contacts")
        require("Trusted/reciprocal relationship count: **UNKNOWN**" in text, "uninitialized Social Capital must preserve unknown quality")
        return

    require("FIRST GAP MAP INITIALIZED" in text, "Social Capital must declare initialized or uninitialized state")
    require("NOT IMPORTED" in text, "initialized role-level Social Capital must not fabricate/import a contact graph")
    require("UNKNOWN" in text, "initialized Social Capital must preserve unknown relationship quality where unverified")
    require("OUTREACH NOT AUTHORIZED" in text, "Social Capital initialization must not silently authorize outreach")
    require("P0" in text and "P1" in text, "initialized Social Capital needs prioritized target circles")
    require("Gap map" in text, "initialized Social Capital needs an explicit gap map")


def selftest_state_machine() -> None:
    valid_uninitialized = """Status: **ACTIVE SYSTEM / PORTFOLIO UNINITIALIZED**\n- Active primary skill: **UNKNOWN / NOT SELECTED BY THIS SYSTEM YET**.\n- Last portfolio ranking: **NOT RUN**.\n"""
    validate_skill_owner_state(valid_uninitialized)

    valid_under_review = """Status: **ACTIVE SYSTEM / PORTFOLIO INITIALIZED**\n- Primary skill allocation: **UNDER REVIEW — no winner yet**.\n- Last review: **2026-09-13**, broad review.\n- Review: **2026-10-09**.\n"""
    validate_skill_owner_state(valid_under_review)

    invalid_under_review_with_primary = """Status: **ACTIVE SYSTEM / PORTFOLIO INITIALIZED**\n- Primary skill allocation: **UNDER REVIEW — no winner yet**.\n- Primary skill: **Some Skill**.\n- Last review: **2026-09-13**.\n- Review: **2026-10-09**.\n"""
    try:
        validate_skill_owner_state(invalid_under_review_with_primary)
    except GuardError:
        pass
    else:
        raise GuardError("self-test failed: under-review allocation also claiming a selected primary skill was accepted")

    valid_initialized = """Status: **ACTIVE SYSTEM / PORTFOLIO INITIALIZED**\n- Primary skill: **German B1/B2** (`ACTIVE`).\n- Current baseline: **UNKNOWN**.\n- Last ranking: **2026-09-09**.\n- Review: **2026-10-09**.\n## Why this wins\nCurrent bottleneck.\n## Proof target\nObserved performance.\n"""
    validate_skill_owner_state(valid_initialized)

    invalid_fabricated = """Status: **ACTIVE SYSTEM / PORTFOLIO INITIALIZED**\n- Primary skill: **Some Skill**.\n"""
    try:
        validate_skill_owner_state(invalid_fabricated)
    except GuardError:
        pass
    else:
        raise GuardError("self-test failed: fabricated initialized skill state was accepted")


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
    validate_skill_owner_state(skill_owner)

    social = read("skills/social-capital.md")
    social_owner = read("domains/social-capital.md")
    require("family, friendship or romantic" in social, "Social Capital scope must exclude ordinary intimate/social relationships")
    require("Never mass-message" in social, "Social Capital must prohibit unsolicited mass outreach")
    validate_social_owner_state(social_owner)


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

    selftest_state_machine()
    if not args.regression:
        check_new_behavior()
    check_regressions()
    print("PASS: Skill/Social Capital state machine, routing and preserved-capability checks")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except GuardError as exc:
        print(f"FAIL: {exc}")
        raise SystemExit(1)
