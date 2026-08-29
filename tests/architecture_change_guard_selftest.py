#!/usr/bin/env python3
"""Contra-tests for Architecture Mode preservation and change-gate validation."""

from __future__ import annotations

import copy
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUARD_PATH = ROOT / "tests" / "architecture_change_guard.py"
spec = importlib.util.spec_from_file_location("architecture_change_guard", GUARD_PATH)
guard = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(guard)

BASE = {
    "schema_version": 1,
    "change_id": "selftest",
    "status": "candidate",
    "base_sha": "a" * 40,
    "branch": "architecture-selftest",
    "objective": "test preservation semantics",
    "trigger_classes": ["authority"],
    "roles_before": [
        {"id": "current_truth", "artifact": "live"},
        {"id": "history_diff", "artifact": "snapshot"},
    ],
    "role_dispositions": [
        {"role_id": "current_truth", "disposition": "PRESERVE", "destination": "live"},
        {"role_id": "history_diff", "disposition": "PRESERVE", "destination": "snapshot"},
    ],
    "capability_probes": [
        {"id": "old", "class": "existing_capability", "assertion": "old capability remains"},
        {"id": "contra", "class": "contra", "assertion": "local fix cannot destroy adjacent role"},
        {"id": "peripheral", "class": "peripheral", "assertion": "unrelated route remains"},
        {"id": "history", "class": "rollback_provenance", "assertion": "history remains usable"},
    ],
    "tests": [
        {"id": "new", "class": "new_behavior", "command": "new-test", "expected": "PASS"},
        {"id": "old", "class": "regression", "command": "old-test", "expected": "PASS"},
    ],
    "known_intentional_losses": [],
    "unintended_capability_loss": [],
    "verification": {"base_head_diff_reviewed": False, "ci_result": "pending", "readback": False},
}


def must_pass(name: str, data: dict) -> None:
    guard.validate_manifest(data, source=name)
    print(f"PASS self-test: {name}")


def must_fail(name: str, data: dict, contains: str) -> None:
    try:
        guard.validate_manifest(data, source=name)
    except guard.GuardError as exc:
        if contains not in str(exc):
            raise AssertionError(f"{name}: wrong failure: {exc}") from exc
        print(f"PASS self-test: {name} rejected")
        return
    raise AssertionError(f"{name}: expected rejection")


def gate_pass(name: str, changes: list[tuple[str, str]], manifests: list[dict], ref: str) -> None:
    guard.validate_change_gate(changes, manifests, ref_name=ref)
    print(f"PASS self-test: {name}")


def gate_fail(name: str, changes: list[tuple[str, str]], manifests: list[dict], ref: str, contains: str) -> None:
    try:
        guard.validate_change_gate(changes, manifests, ref_name=ref)
    except guard.GuardError as exc:
        if contains not in str(exc):
            raise AssertionError(f"{name}: wrong failure: {exc}") from exc
        print(f"PASS self-test: {name} rejected")
        return
    raise AssertionError(f"{name}: expected rejection")


must_pass("valid preservation manifest", copy.deepcopy(BASE))

x = copy.deepcopy(BASE)
x["role_dispositions"] = [x["role_dispositions"][0]]
must_fail("stale-current fix drops history role", x, "every prior role")

x = copy.deepcopy(BASE)
x["capability_probes"] = [p for p in x["capability_probes"] if p["class"] != "contra"]
must_fail("no adversarial contra-case", x, "missing required capability probe")

x = copy.deepcopy(BASE)
x["tests"] = [t for t in x["tests"] if t["class"] != "regression"]
must_fail("tests only new behavior", x, "both new_behavior and regression")

x = copy.deepcopy(BASE)
x["unintended_capability_loss"] = ["history diff no longer works"]
must_fail("known unintended capability loss", x, "must be empty")

x = copy.deepcopy(BASE)
x["branch"] = "main"
must_fail("candidate written directly to main", x, "cannot target main directly")

x = copy.deepcopy(BASE)
x["role_dispositions"][1] = {"role_id": "history_diff", "disposition": "INTENTIONAL_REMOVE", "rationale": "explicitly retired"}
must_fail("intentional removal without consequence", x, "explicit consequence")

x = copy.deepcopy(BASE)
x["status"] = "promoted"
x["verification"] = {"base_head_diff_reviewed": True, "ci_result": "success", "readback": True}
must_pass("valid promoted manifest", x)

gate_fail("architecture-sensitive change without manifest", [("M", "PROTOCOL.md")], [], "architecture-selftest", "no Architecture Mode manifest")
gate_pass("candidate branch with matching manifest", [("M", "PROTOCOL.md"), ("A", "architecture/changes/selftest.json")], [copy.deepcopy(BASE)], "architecture-selftest")
gate_fail("candidate architecture push to main", [("M", "PROTOCOL.md"), ("A", "architecture/changes/selftest.json")], [copy.deepcopy(BASE)], "main", "requires a promoted manifest")
promoted = copy.deepcopy(BASE)
promoted["status"] = "promoted"
promoted["verification"] = {"base_head_diff_reviewed": True, "ci_result": "success", "readback": True}
gate_pass("promoted manifest on candidate branch before merge", [("M", "tests/architecture_change_guard.py"), ("M", "architecture/changes/selftest.json")], [promoted], "architecture-selftest")
gate_pass("promoted architecture push to main", [("M", "PROTOCOL.md"), ("M", "architecture/changes/selftest.json")], [promoted], "main")

print("PASS: Architecture Mode fail-closed self-test")
