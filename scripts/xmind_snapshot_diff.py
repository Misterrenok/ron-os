#!/usr/bin/env python3
"""Canonical hash and semantic diff for normalized XMind snapshots.

Snapshots are historical evidence only. This utility never decides current truth;
current truth still requires a live XMind read.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


def canonical_bytes(data: Any) -> bytes:
    return json.dumps(
        data,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def sha256(data: Any) -> str:
    return hashlib.sha256(canonical_bytes(data)).hexdigest()


def load(path: str) -> dict[str, Any]:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def scope_key(snapshot: dict[str, Any]) -> str:
    return json.dumps(snapshot.get("scope"), sort_keys=True, ensure_ascii=False)


def topic_map(snapshot: dict[str, Any]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for sheet in snapshot.get("sheets", []):
        sheet_id = str(sheet.get("sheet_id", ""))
        for topic in sheet.get("topics", []):
            topic_id = topic.get("topic_id") or topic.get("id")
            if not topic_id:
                raise ValueError(f"topic without stable id in sheet {sheet_id!r}")
            key = f"{sheet_id}:{topic_id}"
            if key in out:
                raise ValueError(f"duplicate topic identity: {key}")
            row = dict(topic)
            row["_sheet_id"] = sheet_id
            out[key] = row
    return out


def relation_identity(sheet_id: str, rel: dict[str, Any]) -> str:
    rel_id = rel.get("relationship_id") or rel.get("id")
    if rel_id:
        return f"{sheet_id}:id:{rel_id}"
    # Lower-confidence fallback when the connector exposes no relationship id.
    return "{}:edge:{}->{}:{}".format(
        sheet_id,
        rel.get("source_id"),
        rel.get("target_id"),
        rel.get("label") or rel.get("title") or "",
    )


def relation_map(snapshot: dict[str, Any]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for sheet in snapshot.get("sheets", []):
        sheet_id = str(sheet.get("sheet_id", ""))
        for rel in sheet.get("relationships", []):
            key = relation_identity(sheet_id, rel)
            if key in out:
                raise ValueError(f"duplicate relationship identity: {key}")
            row = dict(rel)
            row["_sheet_id"] = sheet_id
            out[key] = row
    return out


def sheet_map(snapshot: dict[str, Any]) -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for index, sheet in enumerate(snapshot.get("sheets", [])):
        sheet_id = sheet.get("sheet_id") or sheet.get("id")
        if not sheet_id:
            raise ValueError("sheet without stable id")
        row = {k: v for k, v in sheet.items() if k not in {"topics", "relationships"}}
        row.setdefault("index", index)
        out[str(sheet_id)] = row
    return out


def changed_fields(before: dict[str, Any], after: dict[str, Any], fields: list[str]) -> dict[str, Any]:
    delta: dict[str, Any] = {}
    for field in fields:
        if before.get(field) != after.get(field):
            delta[field] = {"before": before.get(field), "after": after.get(field)}
    return delta


def diff(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    if before.get("file_id") != after.get("file_id"):
        raise ValueError("snapshots belong to different XMind files")
    if scope_key(before) != scope_key(after):
        raise ValueError("snapshots have different scopes; exact change claim is invalid")

    result: dict[str, Any] = {
        "before_sha256": sha256(before),
        "after_sha256": sha256(after),
        "sheets": [],
        "topics": [],
        "relationships": [],
        "capability_changes": {},
    }

    bs, as_ = sheet_map(before), sheet_map(after)
    for key in sorted(bs.keys() - as_.keys()):
        result["sheets"].append({"change": "removed", "sheet": key, "before": bs[key]})
    for key in sorted(as_.keys() - bs.keys()):
        result["sheets"].append({"change": "added", "sheet": key, "after": as_[key]})
    for key in sorted(bs.keys() & as_.keys()):
        fields = changed_fields(bs[key], as_[key], ["title", "index", "order"])
        if fields:
            result["sheets"].append({"change": "modified", "sheet": key, "fields": fields})

    bt, at = topic_map(before), topic_map(after)
    for key in sorted(bt.keys() - at.keys()):
        result["topics"].append({"change": "removed", "topic": key, "before": bt[key]})
    for key in sorted(at.keys() - bt.keys()):
        result["topics"].append({"change": "added", "topic": key, "after": at[key]})
    topic_fields = [
        "parent_id", "index", "order", "level", "title", "note", "labels", "markers",
        "hyperlink", "image", "rich_content", "rich_content_flags",
    ]
    for key in sorted(bt.keys() & at.keys()):
        fields = changed_fields(bt[key], at[key], topic_fields)
        if fields:
            classes = []
            if any(f in fields for f in ["parent_id", "index", "order", "level"]):
                classes.append("moved")
            if "title" in fields:
                classes.append("title_changed")
            if "note" in fields:
                classes.append("note_changed")
            if any(f in fields for f in ["labels", "markers"]):
                classes.append("marker_or_label_changed")
            if any(f in fields for f in ["hyperlink", "image", "rich_content", "rich_content_flags"]):
                classes.append("rich_content_changed")
            result["topics"].append({
                "change": "modified",
                "topic": key,
                "classes": classes,
                "fields": fields,
            })

    br, ar = relation_map(before), relation_map(after)
    for key in sorted(br.keys() - ar.keys()):
        result["relationships"].append({"change": "removed", "relationship": key, "before": br[key]})
    for key in sorted(ar.keys() - br.keys()):
        result["relationships"].append({"change": "added", "relationship": key, "after": ar[key]})
    rel_fields = ["source_id", "target_id", "label", "title", "type"]
    for key in sorted(br.keys() & ar.keys()):
        fields = changed_fields(br[key], ar[key], rel_fields)
        if fields:
            result["relationships"].append({"change": "modified", "relationship": key, "fields": fields})

    if before.get("capabilities") != after.get("capabilities"):
        result["capability_changes"] = {
            "before": before.get("capabilities"),
            "after": after.get("capabilities"),
        }

    result["summary"] = {
        "sheet_changes": len(result["sheets"]),
        "topic_changes": len(result["topics"]),
        "relationship_changes": len(result["relationships"]),
        "identical_canonical_snapshot": result["before_sha256"] == result["after_sha256"],
    }
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("before")
    parser.add_argument("after", nargs="?")
    parser.add_argument("--hash-only", action="store_true")
    args = parser.parse_args()

    before = load(args.before)
    if args.hash_only:
        print(sha256(before))
        return 0
    if not args.after:
        parser.error("after snapshot is required unless --hash-only is used")
    after = load(args.after)
    print(json.dumps(diff(before, after), ensure_ascii=False, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
