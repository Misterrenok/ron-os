#!/usr/bin/env python3
"""Regression guard for pragmatic reversible execution and integration path selection."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class GuardError(ValueError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise GuardError(message)


@dataclass(frozen=True)
class Scenario:
    authorized: bool
    reversible: bool
    blast_radius: str
    direct_official_path: bool = False
    existing_credentials: bool = False
    required_capabilities: tuple[str, ...] = ()
    intermediary_capabilities: tuple[str, ...] = ()
    secret_required: bool = False


def route(s: Scenario) -> str:
    """Executable decision contract, independent of runtime prose."""
    if not s.authorized:
        return "NO_MUTATION"
    if not s.reversible or s.blast_radius == "high":
        return "VERIFY_THEN_ACT"
    if s.direct_official_path and s.existing_credentials:
        return "PROBE_OFFICIAL_DIRECT_FIRST"
    if s.required_capabilities and not set(s.required_capabilities).issubset(set(s.intermediary_capabilities)):
        return "REJECT_INCOMPLETE_INTERMEDIARY"
    return "CHEAP_REVERSIBLE_PROBE"


def behavioral_contract() -> None:
    # Regression for the 2026-10-08 marketplace integration failure class:
    # existing official credentials + bounded reversible setup must be probed directly first.
    hepsiburada = Scenario(
        authorized=True,
        reversible=True,
        blast_radius="low",
        direct_official_path=True,
        existing_credentials=True,
        required_capabilities=("read", "write"),
        secret_required=True,
    )
    require(route(hepsiburada) == "PROBE_OFFICIAL_DIRECT_FIRST",
            "existing official credentials must beat speculative intermediary setup")

    read_only_intermediary = Scenario(
        authorized=True,
        reversible=True,
        blast_radius="low",
        required_capabilities=("read", "write"),
        intermediary_capabilities=("read",),
    )
    require(route(read_only_intermediary) == "REJECT_INCOMPLETE_INTERMEDIARY",
            "an intermediary missing write capability must be rejected before sunk setup effort")

    destructive = Scenario(authorized=True, reversible=False, blast_radius="high")
    require(route(destructive) == "VERIFY_THEN_ACT",
            "fast path must not swallow irreversible/high-blast-radius verification")

    unauthorized = Scenario(authorized=False, reversible=True, blast_radius="low")
    require(route(unauthorized) == "NO_MUTATION",
            "fast path changes sequencing, not authorization")


def runtime_contract() -> None:
    ecom = (ROOT / "skills" / "ron-ecommerce.md").read_text(encoding="utf-8")
    integrations = (ROOT / "references" / "integrations.md").read_text(encoding="utf-8")
    workflow = (ROOT / ".github" / "workflows" / "continuity-guard.yml").read_text(encoding="utf-8")

    require("define the required operation set first" in ecom,
            "e-commerce skill must force early read/write operation definition")
    require("direct official capability probe before adding a third-party integrator" in ecom,
            "e-commerce skill must prefer the official direct path")

    require("Credential handling is not itself a capability blocker" in integrations,
            "credential hygiene must not become a capability blocker")
    require("smallest authorized direct official capability probe before adding an intermediary" in integrations,
            "integration contract must prefer the existing official direct path")
    require("reject an intermediary as soon as it cannot perform a required operation" in integrations,
            "integration contract must reject missing capabilities before sunk setup effort")
    require("All live apps/executors are read-only unless Ron explicitly authorizes the exact intended mutation" in integrations,
            "existing live-mutation authorization gate must be preserved")
    require("never persist it in Ron OS/GitHub" in integrations,
            "secret persistence prohibition must remain explicit")

    require("python3 tests/pragmatic_execution_guard.py" in workflow,
            "CI must execute this regression guard")


def main() -> int:
    behavioral_contract()
    runtime_contract()
    print("PASS: pragmatic reversible-execution fast path and preserved safety gates")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except GuardError as exc:
        print(f"FAIL: {exc}")
        raise SystemExit(1)
