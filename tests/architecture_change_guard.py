#!/usr/bin/env python3
"""Validate Ron OS Architecture Mode preservation manifests."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_DIR = ROOT / "architecture" / "changes"
ALLOWED_STATUS = {"candidate", "promoted"}
ALLOWED_DISPOSITIONS = {"PRESERVE", "REPLACE", "INTENTIONAL_REMOVE"}
REQUIRED_PROBE_CLASSES = {"existing_capability", "contra", "peripheral"}
REQUIRED_TEST_CLASSES = {"new_behavior", "regression"}


class GuardError(ValueError):
    pass


def require(condition: bool, message: str) -> None:
    if not condition:
        raise GuardError(message)


def validate_manifest(data: dict, *, source: str = "<memory>") -> None:
    require(data.get("schema_version") == 1, f"{source}: schema_version must be 1")
    require(bool(data.get("change_id")), f"{source}: change_id missing")
    status = data.get("status")
    require(status in ALLOWED_STATUS, f"{source}: invalid status {status!r}")
    base_sha = data.get("base_sha", "")
    require(bool(re.fullmatch(r"[0-9a-f]{40}", base_sha)), f"{source}: base_sha must be a 40-char lowercase SHA")
    branch = data.get("branch", "")
    require(bool(branch), f"{source}: branch missing")
    if status == "candidate":
        require(branch != "main", f"{source}: candidate architecture work cannot target main directly")
    require(bool(data.get("objective")), f"{source}: objective missing")
    require(bool(data.get("trigger_classes")), f"{source}: trigger_classes missing")

    roles = data.get("roles_before") or []
    require(roles, f"{source}: roles_before must not be empty")
    role_ids = [r.get("id") for r in roles]
    require(all(role_ids), f"{source}: every role needs an id")
    require(len(role_ids) == len(set(role_ids)), f"{source}: duplicate role ids")
    require(all(r.get("artifact") for r in roles), f"{source}: every role needs an artifact")

    dispositions = data.get("role_dispositions") or []
    by_role: dict[str, list[dict]] = {}
    for item in dispositions:
        by_role.setdefault(item.get("role_id"), []).append(item)
    require(set(by_role) == set(role_ids), f"{source}: every prior role must have exactly one disposition and no unknown role may appear")
    for role_id in role_ids:
        items = by_role[role_id]
        require(len(items) == 1, f"{source}: role {role_id!r} must have exactly one disposition")
        item = items[0]
        disposition = item.get("disposition")
        require(disposition in ALLOWED_DISPOSITIONS, f"{source}: role {role_id!r} has invalid disposition")
        if disposition in {"PRESERVE", "REPLACE"}:
            require(bool(item.get("destination")), f"{source}: role {role_id!r} needs a destination")
        if disposition == "INTENTIONAL_REMOVE":
            require(bool(item.get("rationale")), f"{source}: intentional removal {role_id!r} needs rationale")
            require(bool(item.get("consequence")), f"{source}: intentional removal {role_id!r} needs explicit consequence")

    probes = data.get("capability_probes") or []
    probe_classes = {p.get("class") for p in probes}
    missing_probes = REQUIRED_PROBE_CLASSES - probe_classes
    require(not missing_probes, f"{source}: missing required capability probe classes: {sorted(missing_probes)}")
    require(all(p.get("id") and p.get("assertion") for p in probes), f"{source}: every capability probe needs id + assertion")

    has_history_role = any(any(token in r["id"] for token in ("history", "provenance", "rollback", "snapshot", "diff")) for r in roles)
    if has_history_role:
        require("rollback_provenance" in probe_classes, f"{source}: historical/recovery roles require rollback_provenance probe")

    tests = data.get("tests") or []
    test_classes = {t.get("class") for t in tests}
    missing_tests = REQUIRED_TEST_CLASSES - test_classes
    require(not missing_tests, f"{source}: both new_behavior and regression tests are required")
    require(all(t.get("id") and t.get("command") and t.get("expected") for t in tests), f"{source}: every test needs id + command + expected")

    require(data.get("unintended_capability_loss") == [], f"{source}: unintended_capability_loss must be empty before candidate can pass")
    require(isinstance(data.get("known_intentional_losses"), list), f"{source}: known_intentional_losses must be a list")

    verification = data.get("verification") or {}
    if status == "promoted":
        require(verification.get("base_head_diff_reviewed") is True, f"{source}: promoted change requires base→head review")
        require(verification.get("ci_result") == "success", f"{source}: promoted change requires successful candidate CI")
        require(verification.get("readback") is True, f"{source}: promoted change requires runtime read-back")


def load_and_validate(path: Path) -> None:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        raise GuardError(f"{path}: invalid JSON: {exc}") from exc
    validate_manifest(data, source=str(path.relative_to(ROOT)))


def main() -> int:
    paths = [Path(arg) for arg in sys.argv[1:]]
    if not paths:
        paths = sorted(MANIFEST_DIR.glob("*.json"))
    require(bool(paths), "no architecture change manifests found")
    for path in paths:
        if not path.is_absolute():
            path = ROOT / path
        load_and_validate(path)
    print(f"PASS: validated {len(paths)} architecture change manifest(s)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except GuardError as exc:
        print(f"FAIL: {exc}")
        raise SystemExit(1)
