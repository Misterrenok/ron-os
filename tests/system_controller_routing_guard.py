from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

current = (ROOT / "CURRENT.md").read_text(encoding="utf-8")
routing = (ROOT / "references/domain-routing.md").read_text(encoding="utf-8")
controller = (ROOT / "skills/system-controller.md").read_text(encoding="utf-8")
lifeup = (ROOT / "skills/lifeup-system.md").read_text(encoding="utf-8")

joined = "\n".join([current, routing, controller, lifeup])

for needle in [
    "Neon/PostgreSQL `system_events`",
    "sole intended interactive System controller",
    "LifeUp",
]:
    assert needle in joined, f"missing System routing marker: {needle}"

assert "LifeUp is retired from the target runtime architecture" in current or "LifeUp is **retired from the target runtime architecture**" in current
assert "Neon/PostgreSQL `system_events`" in routing
assert "skills/system-controller.md" in routing
assert "legacy" in lifeup.lower() or "retired" in lifeup.lower()

for forbidden in [
    "Primary technical implementation: official `Ayagikei/LifeUp-SDK` MCP",
    "LifeUp via LifeUp Cloud + official MCP; Northflank/Tailscale is transport only",
]:
    assert forbidden not in joined, f"stale primary-LifeUp route still present: {forbidden}"

print("system controller routing guard: PASS")
