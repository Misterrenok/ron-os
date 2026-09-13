from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

current = (ROOT / "CURRENT.md").read_text(encoding="utf-8")
routing = (ROOT / "references/domain-routing.md").read_text(encoding="utf-8")
controller = (ROOT / "skills/system-controller.md").read_text(encoding="utf-8")
lifeup = (ROOT / "skills/lifeup-system.md").read_text(encoding="utf-8")
project = (ROOT / "projects/lifeup-system.md").read_text(encoding="utf-8")

joined = "\n".join([current, routing, controller, lifeup, project])

for needle in [
    "Neon/PostgreSQL `system_events`",
    "sole intended interactive System controller",
    "LifeUp",
]:
    assert needle in joined, f"missing System routing marker: {needle}"

# CURRENT is a routing index, not a second mutable System owner. It only needs to
# route to the project/live owner and preserve the retirement boundary; exact prose
# and live ledger snapshots belong elsewhere.
assert "`projects/lifeup-system.md`" in current
assert "Neon/PostgreSQL `system_events`" in current
current_lower = current.lower()
assert "lifeup" in current_lower and (
    "retired/rollback-only" in current_lower
    or "retired system integration only" in current_lower
    or "retired from the target runtime architecture" in current_lower
), "CURRENT.md must preserve the LifeUp retirement boundary without freezing one sentence"

assert "Neon/PostgreSQL `system_events`" in routing
assert "skills/system-controller.md" in routing

# The exact current target architecture is owned by the System project/controller,
# not by a duplicated mutable snapshot in CURRENT.md.
project_lower = project.lower()
assert "lifeup retired from target runtime" in project_lower or "lifeup retired" in project_lower
assert "neon/postgresql `system_events` is the one mutable owner" in project_lower

for needle in [
    "system-quest-difficulty:v1",
    "QUEST_DIFFICULTY_SPEC.md",
    "UNSCORED",
]:
    assert needle in controller, f"missing Quest difficulty controller marker: {needle}"

assert "Until Quest v2 is promoted" not in controller, "stale pre-Quest-v2 controller policy remains"
assert "legacy" in lifeup.lower() or "retired" in lifeup.lower()

for forbidden in [
    "Primary technical implementation: official `Ayagikei/LifeUp-SDK` MCP",
    "LifeUp via LifeUp Cloud + official MCP; Northflank/Tailscale is transport only",
]:
    assert forbidden not in joined, f"stale primary-LifeUp route still present: {forbidden}"

print("system controller routing guard: PASS")
