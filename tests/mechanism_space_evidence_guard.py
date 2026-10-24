#!/usr/bin/env python3
"""Validate frozen behavioral evidence, never substitute text anchors for inference.

Semantic judgments come from a fresh-context evaluator and remain inspectable with
raw outputs. CI checks their integrity and rejects known-bad coverage judgments;
it does not run a model or promise compliance in every future conversational turn.
"""
from __future__ import annotations
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SUITE = ROOT / "tests/mechanism-space-v1"
RUN = SUITE / "runs/2026-10-13/source-reuse"
HISTORICAL_RUN = "tests/mechanism-space-v1/runs/2026-10-01/baseline"
HISTORICAL_BASE = "f7ad0a89ef3bdc8a036a2b5104b10e1f6dd3c260"
CASE_IDS = {"L1", "L2", "B1", "B2", "E1", "S1", "C1", "C2", "C3", "C4", "P1", "P2"}
RECURRENCE_CASES = {"L1", "L2", "B1", "E1", "S1"}
COMPARISON_CASES = {"L1", "L2", "B1"}
RUNTIME_PATHS = {"BOOTSTRAP.md", "PROTOCOL.md", "references/domain-routing.md",
                 "skills/ron-work-protocol.md", "skills/total-value-optimizer.md"}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate_case(case: dict, raw: str) -> None:
    case_id = case.get("id")
    require(case_id in CASE_IDS, f"unknown case {case_id}")
    require(case.get("verdict") == "PASS", f"{case_id}: behavioral failure")
    require(bool(case.get("rationale")), f"{case_id}: no semantic assessment")
    checks = case.get("check_annotations", [])
    require(bool(checks), f"{case_id}: no rubric criteria assessed")
    for check in checks:
        require(check.get("passed") is True, f"{case_id}: failed criterion {check.get('criterion')}")
        require(bool(check.get("criterion")) and bool(check.get("reason")), f"{case_id}: unreasoned criterion")
        require(bool(check.get("quote")) and check["quote"] in raw, f"{case_id}: invented criterion quote")
    mechanisms = case.get("mechanisms", [])
    for mechanism in mechanisms:
        require(bool(mechanism.get("target")) and bool(mechanism.get("causal_change")), f"{case_id}: label without causal edge")
        require(isinstance(mechanism.get("recurrence"), bool), f"{case_id}: recurrence annotation absent")
        require(bool(mechanism.get("quote")) and mechanism["quote"] in raw, f"{case_id}: invented intervention quote")
    if case_id in RECURRENCE_CASES:
        require(any(m["recurrence"] for m in mechanisms), f"{case_id}: no supported recurrence intervention")
    if case_id in COMPARISON_CASES:
        # Evidence-specific contrast, not a universal runtime taxonomy or count.
        comparison = any(not m["recurrence"] for m in mechanisms) or any(
            c["criterion"] == "compare productive alternatives" for c in checks
        )
        require(comparison, f"{case_id}: no materially different comparison")
    if case_id == "C1":
        answer = raw.split("Appendix:")[0].strip()
        require(len(answer.split()) <= 35, "C1: low-stakes response expanded")


def validate_run(run: Path, runtime_digest) -> None:
    metadata = json.loads((run / "metadata.json").read_text())
    require(metadata.get("execution") == "fresh_context_subagents", "missing actual execution provenance")
    require(metadata.get("evaluator") == "fresh_context_semantic_review", "missing separate semantic review")
    require(len(metadata.get("tested_revision", "")) == 40, "exact revision absent")
    require(set(metadata.get("runtime_sha256", {})) == RUNTIME_PATHS, "runtime provenance incomplete")
    for path, expected in metadata["runtime_sha256"].items():
        require(runtime_digest(path) == expected, f"runtime changed: {path}; rerun behavioral suite")
    for name in ("prompts.md", "key.md"):
        require(digest(SUITE / name) == metadata["suite_sha256"][name], f"frozen {name} changed")
    scores = json.loads((run / "scores.json").read_text())
    cases = scores["cases"] if isinstance(scores, dict) else scores
    require(len(cases) == len(CASE_IDS) and {c["id"] for c in cases} == CASE_IDS, "missing/duplicate behavioral case")
    for case in cases:
        path = run / (case["id"] + ".md")
        require(digest(path) == metadata["raw_sha256"][case["id"]], f"{case['id']}: raw evidence changed")
        validate_case(case, path.read_text())
    print("PASS: 12 fresh-context behavioral records, semantic witnesses, proportionality, and exact runtime provenance")


def validate_history() -> None:
    """Keep old evidence immutable and scoped to the runtime it actually tested."""
    def git_bytes(revision: str, path: str) -> bytes:
        return subprocess.check_output(["git", "show", f"{revision}:{path}"], cwd=ROOT)
    frozen_paths = subprocess.check_output(
        ["git", "ls-tree", "-r", "--name-only", HISTORICAL_BASE, "--", HISTORICAL_RUN],
        cwd=ROOT, text=True,
    ).splitlines()
    actual_paths = sorted(str(p.relative_to(ROOT)) for p in (ROOT / HISTORICAL_RUN).rglob("*") if p.is_file())
    require(sorted(frozen_paths) == actual_paths, "historical evidence file set changed")
    for path in frozen_paths:
        require((ROOT / path).read_bytes() == git_bytes(HISTORICAL_BASE, path), f"historical evidence changed: {path}")
    revision = json.loads((ROOT / HISTORICAL_RUN / "metadata.json").read_text())["tested_revision"]
    validate_run(ROOT / HISTORICAL_RUN, lambda path: hashlib.sha256(git_bytes(revision, path)).hexdigest())
    print("PASS: original behavioral evidence unchanged and checked against its original runtime")


def main() -> None:
    validate_run(RUN, lambda path: digest(ROOT / path))


if __name__ == "__main__":
    try:
        validate_history()
        main()
    except (ValueError, KeyError, OSError, TypeError) as exc:
        raise SystemExit(f"FAIL: {exc}")
