#!/usr/bin/env python3
"""Fail-closed self-test for tests/continuity_coverage_guard.py.

The production guard normally runs only against a valid repository state. This harness
builds isolated temporary copies, injects known regressions, and verifies that the guard
actually rejects them. If the guard is accidentally weakened into an always-PASS check,
this test must fail.
"""

from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
GUARD = "tests/continuity_coverage_guard.py"

STATIC_FILES = [
    "BOOTSTRAP.md",
    "CURRENT.md",
    "PERSON.md",
    "PROTOCOL.md",
    "references/continuity-owner-registry.tsv",
    "references/continuity-contract.md",
    "references/domain-routing.md",
    "references/training/program-mechanics.md",
    "tests/system_model_regression.md",
    GUARD,
]


def copy_fixture(destination: Path) -> None:
    for rel in STATIC_FILES:
        src = ROOT / rel
        dst = destination / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)

    for directory in ("domains", "projects"):
        for src in (ROOT / directory).glob("*.md"):
            dst = destination / src.relative_to(ROOT)
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)


def run_guard(case_root: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(case_root / GUARD)],
        cwd=case_root,
        capture_output=True,
        text=True,
        check=False,
    )


def expect_case(
    name: str,
    mutate,
    *,
    should_pass: bool,
    expected_fragment: str,
) -> None:
    with tempfile.TemporaryDirectory(prefix="ron-os-continuity-selftest-") as tmp:
        case_root = Path(tmp)
        copy_fixture(case_root)
        mutate(case_root)
        result = run_guard(case_root)
        output = result.stdout + result.stderr

        passed = result.returncode == 0
        if passed != should_pass:
            state = "PASS" if passed else "FAIL"
            raise AssertionError(
                f"{name}: guard returned {state}, expected "
                f"{'PASS' if should_pass else 'FAIL'}\n{output}"
            )
        if expected_fragment not in output:
            raise AssertionError(
                f"{name}: expected output fragment {expected_fragment!r}\n{output}"
            )
        print(f"PASS self-test: {name}")


def no_change(_root: Path) -> None:
    return None


def add_unregistered_owner(root: Path) -> None:
    (root / "domains" / "__probe_unregistered.md").write_text(
        "# probe\n", encoding="utf-8"
    )


def remove_registered_owner(root: Path) -> None:
    path = root / "domains" / "finance.md"
    if not path.is_file():
        raise AssertionError("fixture missing registered finance owner")
    path.unlink()


def break_current_route(root: Path) -> None:
    path = root / "CURRENT.md"
    text = path.read_text(encoding="utf-8")
    needle = "`domains/finance.md`"
    if needle not in text:
        raise AssertionError("fixture missing finance route anchor")
    path.write_text(
        text.replace(needle, "`domains/__missing_route_probe.md`", 1),
        encoding="utf-8",
    )


def break_bootstrap_route(root: Path) -> None:
    path = root / "BOOTSTRAP.md"
    text = path.read_text(encoding="utf-8")
    needle = "`domains/finance.md`"
    if needle not in text:
        raise AssertionError("fixture missing finance bootstrap route anchor")
    path.write_text(
        text.replace(needle, "`domains/__missing_route_probe.md`", 1),
        encoding="utf-8",
    )


def distort_training_semantics(root: Path) -> None:
    path = root / "references" / "training" / "program-mechanics.md"
    text = path.read_text(encoding="utf-8")
    needle = "`stall = 3`"
    if needle not in text:
        raise AssertionError("fixture missing stall regression anchor")
    path.write_text(text.replace(needle, "`stall = 2`", 1), encoding="utf-8")


def mismatch_registry_class(root: Path) -> None:
    path = root / "references" / "continuity-owner-registry.tsv"
    text = path.read_text(encoding="utf-8")
    needle = "domains/finance.md\tdomain\t"
    if needle not in text:
        raise AssertionError("fixture missing finance registry row")
    path.write_text(
        text.replace(needle, "domains/finance.md\tproject\t", 1),
        encoding="utf-8",
    )


def duplicate_registry_owner(root: Path) -> None:
    path = root / "references" / "continuity-owner-registry.tsv"
    text = path.read_text(encoding="utf-8")
    source_line = next(
        (line for line in text.splitlines() if line.startswith("domains/finance.md\t")),
        None,
    )
    if source_line is None:
        raise AssertionError("fixture missing finance registry row")
    path.write_text(text.rstrip() + "\n" + source_line + "\n", encoding="utf-8")


def remove_protocol_migration_anchor(root: Path) -> None:
    path = root / "PROTOCOL.md"
    text = path.read_text(encoding="utf-8")
    needle = "## Migration / compaction"
    if needle not in text:
        raise AssertionError("fixture missing promoted protocol migration anchor")
    path.write_text(
        text.replace(needle, "## Migration", 1),
        encoding="utf-8",
    )


def remove_decision_identity_case(root: Path) -> None:
    path = root / "tests" / "system_model_regression.md"
    text = path.read_text(encoding="utf-8")
    needle = "## Case T — decision-identity substitution trap"
    if needle not in text:
        raise AssertionError("fixture missing decision-identity regression case")
    path.write_text(
        text.replace(needle, "## Case T — removed identity probe", 1),
        encoding="utf-8",
    )


def remove_domain_composition_case(root: Path) -> None:
    path = root / "tests" / "system_model_regression.md"
    text = path.read_text(encoding="utf-8")
    needle = "## Case U — cross-domain package composition"
    if needle not in text:
        raise AssertionError("fixture missing domain-composition regression case")
    path.write_text(
        text.replace(needle, "## Case U — removed domain probe", 1),
        encoding="utf-8",
    )


def remove_xmind_life_coverage(root: Path) -> None:
    path = root / "references" / "domain-routing.md"
    text = path.read_text(encoding="utf-8")
    needle = "## XMind life-domain coverage matrix"
    if needle not in text:
        raise AssertionError("fixture missing XMind life-domain coverage matrix")
    path.write_text(
        text.replace(needle, "## Removed XMind coverage probe", 1),
        encoding="utf-8",
    )


def main() -> int:
    expect_case(
        "valid baseline",
        no_change,
        should_pass=True,
        expected_fragment="PASS: continuity owner registry",
    )
    expect_case(
        "unregistered owner is rejected",
        add_unregistered_owner,
        should_pass=False,
        expected_fragment="new owner file(s) not registered",
    )
    expect_case(
        "registered owner disappearance is rejected",
        remove_registered_owner,
        should_pass=False,
        expected_fragment="registered owner file(s) disappeared",
    )
    expect_case(
        "missing CURRENT route is rejected",
        break_current_route,
        should_pass=False,
        expected_fragment="CURRENT.md missing regression anchor",
    )
    expect_case(
        "missing BOOTSTRAP route is rejected",
        break_bootstrap_route,
        should_pass=False,
        expected_fragment="BOOTSTRAP.md missing regression anchor",
    )
    expect_case(
        "semantic drift is rejected",
        distort_training_semantics,
        should_pass=False,
        expected_fragment="program-mechanics.md missing regression anchor",
    )
    expect_case(
        "registry class/path mismatch is rejected",
        mismatch_registry_class,
        should_pass=False,
        expected_fragment="class 'project' requires path under 'projects/'",
    )
    expect_case(
        "duplicate registry owner is rejected",
        duplicate_registry_owner,
        should_pass=False,
        expected_fragment="duplicate owner in references/continuity-owner-registry.tsv",
    )
    expect_case(
        "promoted protocol migration guard is required",
        remove_protocol_migration_anchor,
        should_pass=False,
        expected_fragment="PROTOCOL.md missing regression anchor",
    )
    expect_case(
        "decision-identity regression case is required",
        remove_decision_identity_case,
        should_pass=False,
        expected_fragment="tests/system_model_regression.md missing regression anchor",
    )
    expect_case(
        "cross-domain composition regression case is required",
        remove_domain_composition_case,
        should_pass=False,
        expected_fragment="tests/system_model_regression.md missing regression anchor",
    )
    expect_case(
        "XMind life-domain coverage matrix is required",
        remove_xmind_life_coverage,
        should_pass=False,
        expected_fragment="references/domain-routing.md missing regression anchor",
    )
    print("PASS: continuity guard fail-closed self-test")
    return 0


if __name__ == "__main__":
    sys.exit(main())
