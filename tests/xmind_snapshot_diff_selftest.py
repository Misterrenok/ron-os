#!/usr/bin/env python3
"""Independent behavior test for scripts/xmind_snapshot_diff.py."""

from copy import deepcopy
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("xmind_snapshot_diff", ROOT / "scripts/xmind_snapshot_diff.py")
MOD = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MOD)

base = {
    "schema_version": 1,
    "file_id": "file-1",
    "scope": {"kind": "whole_file"},
    "capabilities": {"styles": False},
    "sheets": [
        {
            "sheet_id": "sheet-a",
            "title": "Main",
            "index": 0,
            "topics": [
                {"topic_id": "root", "parent_id": None, "index": 0, "level": 0, "title": "Root", "note": "", "labels": [], "markers": []},
                {"topic_id": "t1", "parent_id": "root", "index": 0, "level": 1, "title": "Old", "note": "n1", "labels": [], "markers": []},
            ],
            "relationships": [],
        }
    ],
}

same = deepcopy(base)
result = MOD.diff(base, same)
assert result["summary"]["identical_canonical_snapshot"] is True
assert result["summary"]["topic_changes"] == 0

changed = deepcopy(base)
changed["sheets"][0]["topics"][1]["title"] = "New"
changed["sheets"][0]["topics"][1]["parent_id"] = None
changed["sheets"][0]["topics"].append(
    {"topic_id": "t2", "parent_id": "root", "index": 1, "level": 1, "title": "Added", "note": "", "labels": [], "markers": []}
)
result = MOD.diff(base, changed)
assert result["summary"]["identical_canonical_snapshot"] is False
assert result["summary"]["topic_changes"] == 2
modified = [row for row in result["topics"] if row.get("topic", "").endswith(":t1")][0]
assert "moved" in modified["classes"]
assert "title_changed" in modified["classes"]
assert any(row["change"] == "added" and row["topic"].endswith(":t2") for row in result["topics"])

wrong_scope = deepcopy(base)
wrong_scope["scope"] = {"kind": "sheet", "sheet_ids": ["sheet-a"]}
try:
    MOD.diff(base, wrong_scope)
except ValueError as exc:
    assert "different scopes" in str(exc)
else:
    raise AssertionError("different scopes must fail closed")

print("PASS: XMind snapshot diff detects content/move/add changes and rejects scope mismatch")
