from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
bootstrap = (ROOT / "BOOTSTRAP.md").read_text(encoding="utf-8")
protocol = (ROOT / "PROTOCOL.md").read_text(encoding="utf-8")
plan_path = ROOT / "system/lifeup/STRATEGIC_LIFE_TRAJECTORY_PLAN_V1.md"
plan = plan_path.read_text(encoding="utf-8")

# Existing fast path must remain: unrelated/self-contained chats do not pay Ron OS overhead.
assert "For self-contained/general questions, answer directly without loading Ron OS." in bootstrap
assert "answer directly and do not load Ron OS further" in bootstrap

# Memory is convenience only, never a mutable/current owner.
assert "memory entry may serve only as a durable pointer" in bootstrap
assert "must not carry mutable Ron OS state" in bootstrap

# Strategic baseline must be discoverable from the single BOOTSTRAP entry point,
# but only for material strategic choice, not routine System/status work.
assert plan_path.exists(), "strategic life trajectory plan missing"
assert "Status: APPROVED DESIGN BASELINE / NOT YET RUNTIME POLICY" in plan
assert "system/lifeup/STRATEGIC_LIFE_TRAJECTORY_PLAN_V1.md" in bootstrap
for marker in [
    "choosing among life trajectories",
    "allocating scarce resources across strategic directions",
    "an open-ended System Pulse",
    "selecting/replacing execution focus/quest across materially different directions",
    "Do **not** load it merely for ordinary System status/profile/XP/current-quest lookup",
]:
    assert marker in bootstrap, f"missing conditional strategic-route marker: {marker}"

# GitHub fallback is transport-only and lazy: no parallel dual-read and no second owner.
for marker in [
    "connected GitHub route",
    "raw/public GitHub",
    "transport fallback to the same canonical files, not a second owner",
    "must not add routine dual-reading when the primary path works",
]:
    assert marker in bootstrap, f"missing GitHub recovery marker: {marker}"

# A recovery snapshot must fail closed for mutable/current truth and canonical writes.
for marker in [
    "recovery snapshot may be used only as `FALLBACK/ARCHIVE_EVIDENCE`",
    "mutable/current claims as `UNVERIFIED`",
    "never promote architecture or perform a canonical write from snapshot evidence alone",
]:
    assert marker in bootstrap, f"missing snapshot fail-closed marker: {marker}"

# This architecture slice must not weaken live-source mutation authority.
assert (
    "Any Calendar, TickTick, Cronometer, Liftosaur, XMind, marketplace or other live-source write requires Ron's explicit permission for the exact intended change"
    in protocol
), "external live-source mutation gate regressed"

print("continuation resilience guard: PASS")
