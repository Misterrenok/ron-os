#!/usr/bin/env python3
"""Fail-closed calibration; fixtures are synthetic, NOT model baseline outputs."""
import copy
import json
import shutil
import tempfile
from pathlib import Path
import mechanism_space_evidence_guard as guard
from mechanism_space_evidence_guard import validate_case

raw = "Agree acceptance before work. Compare the skill pilot."
good = {"id": "L1", "verdict": "PASS", "rationale": "Two supported causal paths.",
        "check_annotations": [{"criterion": "spontaneous coverage", "passed": True,
                                "quote": "Agree acceptance before work.", "reason": "Stops repeated rework."}],
        "mechanisms": [
            {"target": "rework", "causal_change": "acceptance agreement prevents recurrence", "recurrence": True, "quote": "Agree acceptance before work."},
            {"target": "capability", "causal_change": "skill pilot creates productive value", "recurrence": False, "quote": "Compare the skill pilot."}]}
validate_case(good, raw)


def rejects(label, case, output):
    try:
        validate_case(case, output)
    except ValueError:
        print(f"PASS negative: {label}")
        return
    raise SystemExit(f"FAIL: accepted {label}")


# Reported old behavior's structure: many positive amplifiers, no recurrence path.
# It is a reconstruction/calibration witness, not a fabricated model run.
bad = copy.deepcopy(good)
bad_raw = "Use a useful skill. Use AI. Save capital. Build a network."
bad["check_annotations"] = [{"criterion": "candidate breadth", "passed": True,
                              "quote": "Use a useful skill.", "reason": "Many variants are offered."}]
bad["mechanisms"] = [{"target": f"growth option {i}", "causal_change": "increase productive capacity",
                      "recurrence": False, "quote": "Use a useful skill."} for i in range(50)]
rejects("50 growth-only variants cannot replace missing mechanism", bad, bad_raw)
bad = copy.deepcopy(good); bad["mechanisms"] = [good["mechanisms"][0]]
rejects("loss-only answer lacks strong comparison", bad, raw)
bad = copy.deepcopy(good); bad["mechanisms"][0]["quote"] = "invented causal evidence"
rejects("fabricated evidence excerpt", bad, raw)
bad = copy.deepcopy(good); bad["check_annotations"][0]["passed"] = False
rejects("failed rubric criterion", bad, raw)
bad = copy.deepcopy(good); bad["verdict"] = "FAIL"
rejects("behavioral failure relabelled by CI", bad, raw)
bad = copy.deepcopy(good); bad["id"] = "C1"; bad["mechanisms"] = []; bad["check_annotations"] = [{"criterion":"directness", "passed":True, "quote":"water", "reason":"fixture"}]
rejects("low-stakes checklist expansion", bad, "water " * 100)
print("PASS: mechanism-space evidence guard rejects the old failure shape without reading runtime policy text")

# Integration falsification: annotations cannot outlive their measured runtime,
# raw transcript or complete contra set.
with tempfile.TemporaryDirectory() as scratch:
    root = Path(scratch)
    for path in guard.RUNTIME_PATHS:
        target = root / path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(guard.ROOT / path, target)
    shutil.copytree(guard.SUITE, root / "tests/mechanism-space-v1")
    guard.ROOT = root
    guard.SUITE = root / "tests/mechanism-space-v1"
    guard.RUN = guard.SUITE / "runs/2026-10-01/baseline"
    guard.main()

    def reject_run(label):
        try:
            guard.main()
        except ValueError:
            print(f"PASS negative: {label}")
            return
        raise SystemExit(f"FAIL: accepted {label}")

    runtime = root / "skills/total-value-optimizer.md"
    original = runtime.read_bytes(); runtime.write_bytes(original + b"\nchanged procedure\n")
    reject_run("runtime changed without fresh replay")
    runtime.write_bytes(original)
    raw_path = guard.RUN / "L1.md"
    original = raw_path.read_bytes(); raw_path.write_bytes(original + b"tampered\n")
    reject_run("raw transcript tampering")
    raw_path.write_bytes(original)
    scores_path = guard.RUN / "scores.json"
    scores = json.loads(scores_path.read_text()); scores["cases"].pop()
    scores_path.write_text(json.dumps(scores))
    reject_run("missing preserved contra case")
