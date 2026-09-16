#!/usr/bin/env python3
"""Decide whether a change set must rebuild the retired LifeUp rollback image."""

from __future__ import annotations

import sys

LEGACY_DOCKER_EXACT = {".github/workflows/lifeup-system-ci.yml"}
LEGACY_DOCKER_PREFIXES = ("system/lifeup/northflank/",)


def normalize_path(raw_path: str) -> str:
    path = raw_path.strip()
    return path[2:] if path.startswith("./") else path


def requires_legacy_docker(paths: list[str]) -> bool:
    """Fail closed for bridge/workflow changes; ignore unrelated current-System files."""
    for raw_path in paths:
        path = normalize_path(raw_path)
        if not path:
            continue
        if path in LEGACY_DOCKER_EXACT or path.startswith(LEGACY_DOCKER_PREFIXES):
            return True
    return False


def self_test() -> int:
    cases = [
        (["projects/lifeup-system.md"], False, "owner-only change"),
        (["skills/system-controller.md"], False, "current controller-only change"),
        (["references/domain-routing.md"], False, "current routing-only change"),
        (["system/lifeup/northflank/server.mjs"], True, "legacy server change"),
        (["system/lifeup/northflank/Dockerfile"], True, "legacy Dockerfile change"),
        ([".github/workflows/lifeup-system-ci.yml"], True, "workflow change"),
        (["./.github/workflows/lifeup-system-ci.yml"], True, "workflow change with explicit relative prefix"),
        (["projects/lifeup-system.md", "system/lifeup/northflank/README.md"], True, "mixed current + legacy change"),
    ]
    for paths, expected, label in cases:
        actual = requires_legacy_docker(paths)
        if actual is not expected:
            print(f"FAIL: {label}: expected {expected}, got {actual}")
            return 1
    print("PASS: retired LifeUp Docker CI scope is deterministic and fail-closed for legacy/workflow changes")
    return 0


def main(argv: list[str]) -> int:
    if argv == ["--self-test"]:
        return self_test()
    print("true" if requires_legacy_docker(argv) else "false")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
