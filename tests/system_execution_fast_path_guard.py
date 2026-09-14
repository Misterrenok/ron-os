from pathlib import Path

FAST_PATH = Path("system/lifeup/EXECUTION_FAST_PATH.md").read_text(encoding="utf-8")
PROTOCOL = Path("PROTOCOL.md").read_text(encoding="utf-8")

required_fast_path = [
    "unchanged and still non-tool-executable is deferred",
    "not re-selected as the primary slice",
    "capability, authority, target state or evidence materially changes",
    "surface it to Ron only when it blocks the current outcome",
    "Never trade away required safety, permission, integrity, architecture or production verification gates",
]

for marker in required_fast_path:
    assert marker in FAST_PATH, f"missing fast-path blocker contract: {marker}"

required_protocol = [
    "blocked cleanup is an explicit unresolved blocker",
    "Any Calendar, TickTick, Cronometer, Liftosaur, XMind, marketplace or other live-source write requires Ron's explicit permission",
    "verify cleanup is tool-executable under current authority",
]

for marker in required_protocol:
    assert marker in PROTOCOL, f"permission/cleanup regression: {marker}"

def should_select(*, known: bool, executable: bool, changed: bool, blocks_current_outcome: bool) -> bool:
    if blocks_current_outcome:
        return True
    if known and not executable and not changed:
        return False
    return True

assert not should_select(known=True, executable=False, changed=False, blocks_current_outcome=False)
assert should_select(known=True, executable=True, changed=True, blocks_current_outcome=False)
assert should_select(known=True, executable=False, changed=True, blocks_current_outcome=False)
assert should_select(known=False, executable=False, changed=False, blocks_current_outcome=True)

print("system execution fast-path blocker deferral: PASS")
