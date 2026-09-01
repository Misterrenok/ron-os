#!/usr/bin/env python3
"""Ron OS continuity coverage regression guard.

This is intentionally small and deterministic. It does not decide whether a user fact is
currently true; it protects owner/routing coverage and a few real regression anchors that
were previously lost or semantically distorted.
"""

from pathlib import Path
import re
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


def check_skill_routes() -> None:
    bootstrap = read("BOOTSTRAP.md")
    routing = read("references/domain-routing.md")

    require(
        bootstrap,
        "read every selected package's exact repo-local `skills/*.md` file before its owner(s)",
        "BOOTSTRAP.md",
    )

    rows: list[list[str]] = []
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
        fail("references/domain-routing.md domain registry has no rows")

    seen: set[str] = set()
    for domain, skill_cell, _owner, _live, _deps in rows:
        match = re.fullmatch(r"`(skills/[^`]+\.md)`", skill_cell)
        if not match:
            fail(
                f"{domain}: Skill must be one concrete repo-local skills/*.md path, "
                f"got {skill_cell!r}"
            )
        path = match.group(1)
        if path in seen:
            fail(f"duplicate domain skill route: {path}")
        seen.add(path)
        read(path)

    nutrition_skill = read("skills/nutrition.md")
    require(nutrition_skill, "`references/nutrition/method.md`", "skills/nutrition.md")
    require(nutrition_skill, "`domains/nutrition.md`", "skills/nutrition.md")
    require(nutrition_skill, "Cronometer", "skills/nutrition.md")


def check_real_regressions() -> None:
    bootstrap = read("BOOTSTRAP.md")
    current = read("CURRENT.md")
    nutrition = read("domains/nutrition.md")
    finance = read("domains/finance.md")
    health = read("domains/health.md")
    learning = read("domains/learning.md")
    mobility = read("domains/mobility.md")
    person = read("PERSON.md")
    mechanics = read("references/training/program-mechanics.md")
    contract = read("references/continuity-contract.md")
    domain_routing = read("references/domain-routing.md")
    integrations = read("references/integrations.md")
    protocol = read("PROTOCOL.md")
    system_regression = read("tests/system_model_regression.md")
    adversarial_prompts = read("tests/adversarial-cognition-v1/prompts.md")
    adversarial_key = read("tests/adversarial-cognition-v1/key.md")

    # Nutrition/work continuity losses observed on 2026-08-26.
    require(nutrition, "Nutrition is NOT STARTED", "domains/nutrition.md")
    require(nutrition, "600 TL cash every workday", "domains/nutrition.md")
    require(nutrition, "Workweek = Monday through Saturday", "domains/nutrition.md")

    # Finance domain was previously orphaned entirely.
    require(finance, "35,000 TL/month", "domains/finance.md")
    require(finance, "600 TL per workday", "domains/finance.md")

    # XMind exposed life areas that previously had no explicit owner/route.
    require(health, "PARTIAL FALLBACK / LIVE EVIDENCE REQUIRED", "domains/health.md")
    require(health, "A scheduled test, planned questionnaire", "domains/health.md")
    require(learning, "PARTIAL FALLBACK / EXECUTION UNVERIFIED", "domains/learning.md")
    require(learning, "does not prove learning progress", "domains/learning.md")

    # A stale earlier-stage record must not reopen a later user-confirmed İkamet approval.
    require(mobility, "RENEWAL APPROVAL CONFIRMED", "domains/mobility.md")
    require(mobility, "Do **not** ask Ron to re-prove the approval", "domains/mobility.md")
    forbid(mobility, "**CONFLICT:**", "domains/mobility.md")

    # XMind mutations require a separate, connector-level authorization boundary.
    require(integrations, "XMind is read-only by default", "references/integrations.md")
    require(integrations, "separate explicit permission", "references/integrations.md")

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
    require(domain_routing, "## XMind life-domain coverage matrix", "references/domain-routing.md")
    require(domain_routing, "ROUTING GAP", "references/domain-routing.md")
    for life_area in (
        "Legal status",
        "Finance",
        "Health",
        "Personal growth",
        "Social relationships",
        "Rest and hobbies",
        "Safety",
        "Spirituality and reflection",
    ):
        require(domain_routing, f"| {life_area} |", "references/domain-routing.md")
    require(contract, "preserve identity-bearing decisions and their status", "references/continuity-contract.md")
    require(protocol, "## Decision identity before optimization", "PROTOCOL.md")
    require(protocol, "optimize only VARIABLE fields", "PROTOCOL.md")
    require(protocol, "differs on any LOCKED field is a substitution", "PROTOCOL.md")
    require(system_regression, "## Case T — decision-identity substitution trap", "tests/system_model_regression.md")
    require(system_regression, "### Decision-identity preservation", "tests/system_model_regression.md")
    require(system_regression, "## Case U — cross-domain package composition", "tests/system_model_regression.md")
    require(system_regression, "### Domain-composition sensitivity", "tests/system_model_regression.md")
    require(system_regression, "## Case V — XMind life-domain coverage without skill mirroring", "tests/system_model_regression.md")
    require(system_regression, "### Life-domain coverage completeness", "tests/system_model_regression.md")
    require(protocol, "## Live-source mutation gate", "PROTOCOL.md")
    require(integrations, "## Global live-mutation gate", "references/integrations.md")
    require(person, "Любая мутация live-источника требует отдельного явного разрешения", "PERSON.md")
    require(current, "BUILDING / EXECUTION NOT STARTED / NO LIVE MUTATION WITHOUT EXACT PERMISSION", "CURRENT.md")
    require(system_regression, "## Case X — build-stage live-mutation trap", "tests/system_model_regression.md")
    require(system_regression, "### Build-stage permission invariance", "tests/system_model_regression.md")

    # Real 2026-09-01 failures: provenance laundering inside a correct owner and omitted automatic closeout.
    require(adversarial_prompts, "## T19 — intra-owner provenance laundering", "tests/adversarial-cognition-v1/prompts.md")
    require(adversarial_prompts, "## T20 — automatic continuity responsibility", "tests/adversarial-cognition-v1/prompts.md")
    require(adversarial_key, "## T19 — intra-owner provenance laundering", "tests/adversarial-cognition-v1/key.md")
    require(adversarial_key, "## T20 — automatic continuity responsibility", "tests/adversarial-cognition-v1/key.md")
    require(adversarial_key, "Provenance laundering", "tests/adversarial-cognition-v1/key.md")
    require(adversarial_key, "Continuity omission", "tests/adversarial-cognition-v1/key.md")


def main() -> int:
    check_routes_and_registry()
    check_skill_routes()
    check_real_regressions()
    print("PASS: continuity owner registry, skill routing, and semantic regression anchors")
    return 0


if __name__ == "__main__":
    sys.exit(main())
