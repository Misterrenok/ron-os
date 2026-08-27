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
OWNER_CLASS_DIR = {"domain": "domains", "project": "projects"}


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


def registry_entries() -> dict[str, str]:
    entries: dict[str, str] = {}
    for line_no, raw in enumerate(read(REGISTRY).splitlines(), 1):
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        parts = raw.split("\t")
        if len(parts) != 3 or not all(part.strip() for part in parts):
            fail(f"{REGISTRY}:{line_no} must be path<TAB>class<TAB>purpose")
        path, owner_class, _purpose = (part.strip() for part in parts)
        if owner_class not in OWNER_CLASS_DIR:
            fail(f"{REGISTRY}:{line_no} invalid class {owner_class!r}")
        if path in entries:
            fail(f"duplicate owner in {REGISTRY}: {path}")

        owner_path = Path(path)
        expected_dir = OWNER_CLASS_DIR[owner_class]
        if (
            len(owner_path.parts) != 2
            or owner_path.parts[0] != expected_dir
            or owner_path.suffix != ".md"
        ):
            fail(
                f"{REGISTRY}:{line_no} class/path mismatch: "
                f"{owner_class!r} owner must be {expected_dir}/*.md, got {path!r}"
            )
        entries[path] = owner_class
    if not entries:
        fail(f"{REGISTRY} contains no owners")
    return entries


def is_bootstrap_route(line: str, owner: str) -> bool:
    stripped = line.strip()
    return stripped.startswith(f"- `{owner}` —")


def is_current_route(line: str, owner: str) -> bool:
    stripped = line.strip()
    return (
        stripped.startswith(f"Owner: `{owner}`")
        or stripped.startswith(f"Fallback owner: `{owner}`")
        or (stripped.startswith("-") and f"-> `{owner}`" in stripped)
    )


def require_route(text: str, owner: str, where: str, route_check) -> None:
    if not any(route_check(line, owner) for line in text.splitlines()):
        fail(f"{where} does not actually route current owner: {owner}")


def check_routes_and_registry() -> None:
    bootstrap = read("BOOTSTRAP.md")
    current = read("CURRENT.md")

    actual_entries = {
        str(p.relative_to(ROOT)): "domain"
        for p in (ROOT / "domains").glob("*.md")
        if p.is_file()
    }
    actual_entries.update(
        {
            str(p.relative_to(ROOT)): "project"
            for p in (ROOT / "projects").glob("*.md")
            if p.is_file()
        }
    )
    registered = registry_entries()

    actual_paths = set(actual_entries)
    registered_paths = set(registered)
    missing_files = sorted(registered_paths - actual_paths)
    unregistered_files = sorted(actual_paths - registered_paths)
    if missing_files:
        fail(f"registered owner file(s) disappeared: {missing_files}")
    if unregistered_files:
        fail(f"new owner file(s) not registered: {unregistered_files}")

    wrong_class = sorted(
        path
        for path, owner_class in registered.items()
        if actual_entries.get(path) != owner_class
    )
    if wrong_class:
        fail(f"registered owner class mismatch: {wrong_class}")

    for owner in sorted(registered_paths):
        require_route(bootstrap, owner, "BOOTSTRAP.md", is_bootstrap_route)
        require_route(current, owner, "CURRENT.md", is_current_route)

    require(bootstrap, "`PERSON.md`", "BOOTSTRAP.md")
    require(current, "`PERSON.md`", "CURRENT.md")
    require(bootstrap, "`references/continuity-contract.md`", "BOOTSTRAP.md")
    require(current, "`references/continuity-contract.md`", "CURRENT.md")
    require(bootstrap, f"`{REGISTRY}`", "BOOTSTRAP.md")
    require(current, f"`{REGISTRY}`", "CURRENT.md")


def check_real_regressions() -> None:
    nutrition = read("domains/nutrition.md")
    finance = read("domains/finance.md")
    person = read("PERSON.md")
    mechanics = read("references/training/program-mechanics.md")
    contract = read("references/continuity-contract.md")
    protocol = read("PROTOCOL.md")

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
    require(protocol, "Continuity coverage gate", "PROTOCOL.md")


def main() -> int:
    check_routes_and_registry()
    check_real_regressions()
    print("PASS: continuity owner registry, routing, and semantic regression anchors")
    return 0


if __name__ == "__main__":
    sys.exit(main())
