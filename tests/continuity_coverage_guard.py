#!/usr/bin/env python3
"""Ron OS continuity coverage regression guard.

This is intentionally small and deterministic. It does not decide whether a user fact is
currently true; it protects owner/routing coverage and a few real regression anchors that
were previously lost or semantically distorted.
"""

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = "references/continuity-owner-registry.tsv"


def read(path: str) -> str:
    p = ROOT / path
    if not p.is_file():
        fail(f"missing required file: {path}")
    return p.read_text(encoding="utf-8")


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def require(text: str, needle: str, where: str) -> None:
    if needle not in text:
        fail(f"{where} missing regression anchor: {needle!r}")


def forbid(text: str, needle: str, where: str) -> None:
    if needle in text:
        fail(f"{where} contains known-bad semantic regression: {needle!r}")


def registry_paths() -> set[str]:
    paths: set[str] = set()
    for line_no, raw in enumerate(read(REGISTRY).splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = raw.split("\t")
        if len(parts) != 3 or not all(part.strip() for part in parts):
            fail(f"{REGISTRY}:{line_no} must be path<TAB>class<TAB>purpose")
        path, owner_class, _purpose = (part.strip() for part in parts)
        if owner_class not in {"domain", "project"}:
            fail(f"{REGISTRY}:{line_no} invalid class {owner_class!r}")
        expected_prefix = "domains/" if owner_class == "domain" else "projects/"
        if not path.startswith(expected_prefix):
            fail(
                f"{REGISTRY}:{line_no} class {owner_class!r} requires path under "
                f"{expected_prefix!r}: {path}"
            )
        if path in paths:
            fail(f"duplicate owner in {REGISTRY}: {path}")
        paths.add(path)
    if not paths:
        fail(f"{REGISTRY} contains no owners")
    return paths


def check_routes_and_registry() -> None:
    bootstrap = read("BOOTSTRAP.md")
    current = read("CURRENT.md")

    actual_paths = {
        str(p.relative_to(ROOT)) for p in (ROOT / "domains").glob("*.md")
    } | {
        str(p.relative_to(ROOT)) for p in (ROOT / "projects").glob("*.md")
    }
    registered = registry_paths()

    missing_files = sorted(registered - actual_paths)
    unregistered_files = sorted(actual_paths - registered)
    if missing_files:
        fail(f"registered owner file(s) disappeared: {missing_files}")
    if unregistered_files:
        fail(f"new owner file(s) not registered: {unregistered_files}")

    for owner in sorted(registered):
        require(bootstrap, f"`{owner}`", "BOOTSTRAP.md")
        require(current, f"`{owner}`", "CURRENT.md")

    require(bootstrap, "`PERSON.md`", "BOOTSTRAP.md")
    require(current, "`PERSON.md`", "CURRENT.md")
    require(bootstrap, "`references/continuity-contract.md`", "BOOTSTRAP.md")
    require(current, "`references/continuity-contract.md`", "CURRENT.md")
    require(bootstrap, f"`{REGISTRY}`", "BOOTSTRAP.md")
    require(current, f"`{REGISTRY}`", "CURRENT.md")


def check_real_regressions() -> None:
    bootstrap = read("BOOTSTRAP.md")
    current = read("CURRENT.md")
    nutrition = read("domains/nutrition.md")
    finance = read("domains/finance.md")
    person = read("PERSON.md")
    mechanics = read("references/training/program-mechanics.md")
    contract = read("references/continuity-contract.md")
    domain_routing = read("references/domain-routing.md")
    protocol = read("PROTOCOL.md")
    system_regression = read("tests/system_model_regression.md")

    # Nutrition/work continuity losses observed on 2026-08-26.
    require(nutrition, "Nutrition is NOT STARTED", "domains/nutrition.md")
    require(nutrition, "600 TL cash every workday", "domains/nutrition.md")
    require(nutrition, "Workweek = Monday through Saturday", "domains/nutrition.md")

    # Finance domain was previously orphaned entirely.
    require(finance, "35,000 TL/month", "domains/finance.md")
    require(finance, "600 TL per workday", "domains/finance.md")

    # Durable personal facts were over-compressed out of PERSON.
    require(person, "Русский: **C2**", "PERSON.md")
    require(person, "İstanbul Topkapı Üniversitesi", "PERSON.md")
    require(person, "3 лет операционного опыта", "PERSON.md")

    # Training mechanics were semantically altered during distillation.
    require(mechanics, "`stall = 3`", "references/training/program-mechanics.md")
    require(mechanics, "`min(completedWeights)`", "references/training/program-mechanics.md")
    forbid(
        mechanics,
        "After two consecutive failures, use a staged deload",
        "references/training/program-mechanics.md",
    )

    # Architecture must retain the generalized prevention mechanism.
    require(contract, "Lossless-disposition invariant", "references/continuity-contract.md")
    require(contract, "There is no `too stale to own, therefore silently drop` disposition", "references/continuity-contract.md")
    require(protocol, "## Migration / compaction", "PROTOCOL.md")
    require(protocol, "changed numbers/triggers/units/provenance", "PROTOCOL.md")
    require(protocol, "orphaned active work", "PROTOCOL.md")
    require(bootstrap, "`references/domain-routing.md`", "BOOTSTRAP.md")
    require(current, "`references/domain-routing.md`", "CURRENT.md")
    require(domain_routing, "## Domain-pack invariant", "references/domain-routing.md")
    require(domain_routing, "## Domain registry", "references/domain-routing.md")
    require(domain_routing, "Skills must not duplicate mutable owner/app state", "references/domain-routing.md")
    require(contract, "preserve identity-bearing decisions and their status", "references/continuity-contract.md")
    require(protocol, "## Decision identity before optimization", "PROTOCOL.md")
    require(protocol, "optimize only VARIABLE fields", "PROTOCOL.md")
    require(protocol, "differs on any LOCKED field is a substitution", "PROTOCOL.md")
    require(system_regression, "## Case T — decision-identity substitution trap", "tests/system_model_regression.md")
    require(system_regression, "### Decision-identity preservation", "tests/system_model_regression.md")
    require(system_regression, "## Case U — cross-domain package composition", "tests/system_model_regression.md")
    require(system_regression, "### Domain-composition sensitivity", "tests/system_model_regression.md")


def main() -> int:
    check_routes_and_registry()
    check_real_regressions()
    print("PASS: continuity owner registry, routing, and semantic regression anchors")
    return 0


if __name__ == "__main__":
    sys.exit(main())
