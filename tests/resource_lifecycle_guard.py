#!/usr/bin/env python3
"""Executable regression guard for temporary external-resource lifecycle decisions."""

from __future__ import annotations

# Intentionally tests decision behavior rather than scanning policy text for matching words.


def decide_creation(
    *,
    temporary: bool,
    cleanup_verified: bool = False,
    reusable_existing: bool = False,
    local_or_transactional_isolation: bool = False,
    intentional_persistent: bool = False,
    explicit_residue_acceptance: bool = False,
) -> str:
    """Return the required creation strategy before any external resource is created."""
    if local_or_transactional_isolation:
        return "USE_LOCAL_OR_TRANSACTIONAL"
    if reusable_existing:
        return "REUSE_EXISTING"
    if temporary:
        if cleanup_verified:
            return "CREATE_TEMP"
        if explicit_residue_acceptance:
            return "CREATE_ACCEPTED_RESIDUE"
        return "BLOCK"
    if intentional_persistent:
        return "CREATE_PERSISTENT"
    return "BLOCK"


def closeout_state(
    *,
    temporary_created: bool,
    cleanup_succeeded: bool = False,
    intentionally_promoted: bool = False,
) -> str:
    """A run with assistant-created temporary residue is not complete until it is gone or promoted."""
    if not temporary_created:
        return "COMPLETE"
    if cleanup_succeeded or intentionally_promoted:
        return "COMPLETE"
    return "INCOMPLETE"


def expect(actual: str, expected: str, case: str) -> None:
    if actual != expected:
        raise AssertionError(f"{case}: expected {expected}, got {actual}")


def main() -> int:
    expect(decide_creation(temporary=True, cleanup_verified=True), "CREATE_TEMP", "verified-cleanup")
    expect(decide_creation(temporary=True, reusable_existing=True), "REUSE_EXISTING", "reuse-beats-new")
    expect(
        decide_creation(temporary=True, local_or_transactional_isolation=True),
        "USE_LOCAL_OR_TRANSACTIONAL",
        "local-beats-remote",
    )
    expect(decide_creation(temporary=True), "BLOCK", "no-cleanup-no-residue")
    expect(
        decide_creation(temporary=True, explicit_residue_acceptance=True),
        "CREATE_ACCEPTED_RESIDUE",
        "explicit-residue-exception",
    )
    expect(
        decide_creation(temporary=False, intentional_persistent=True),
        "CREATE_PERSISTENT",
        "intentional-persistent-resource",
    )
    expect(decide_creation(temporary=False), "BLOCK", "unclassified-persistent-resource")

    expect(closeout_state(temporary_created=False), "COMPLETE", "no-temp-created")
    expect(
        closeout_state(temporary_created=True, cleanup_succeeded=True),
        "COMPLETE",
        "temp-cleaned",
    )
    expect(
        closeout_state(temporary_created=True, intentionally_promoted=True),
        "COMPLETE",
        "temp-promoted",
    )
    expect(closeout_state(temporary_created=True), "INCOMPLETE", "residue-remains")

    print("PASS: resource lifecycle decision matrix")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
