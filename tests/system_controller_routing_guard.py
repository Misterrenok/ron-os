from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

bootstrap = (ROOT / "BOOTSTRAP.md").read_text(encoding="utf-8")
current = (ROOT / "CURRENT.md").read_text(encoding="utf-8")
routing = (ROOT / "references/domain-routing.md").read_text(encoding="utf-8")
controller = (ROOT / "skills/system-controller.md").read_text(encoding="utf-8")
lifeup = (ROOT / "skills/lifeup-system.md").read_text(encoding="utf-8")
project = (ROOT / "projects/lifeup-system.md").read_text(encoding="utf-8")
protocol = (ROOT / "PROTOCOL.md").read_text(encoding="utf-8")
strategic_context = (ROOT / "system/lifeup/STRATEGIC_CONTEXT_ORCHESTRATION_SPEC.md").read_text(encoding="utf-8")
evidence_followthrough = (ROOT / "system/lifeup/EVIDENCE_FOLLOWTHROUGH_SPEC.md").read_text(encoding="utf-8")
mechanics = (ROOT / "system/lifeup/SYSTEM_SPEC.md").read_text(encoding="utf-8")
achievement_spec = (ROOT / "system/lifeup/ACHIEVEMENT_SPEC.md").read_text(encoding="utf-8")
motivation = (ROOT / "system/lifeup/MOTIVATION_ARCHITECTURE_V2.md").read_text(encoding="utf-8")
progression_spec = (ROOT / "system/lifeup/PROGRESSION_HIERARCHY_SPEC.md").read_text(encoding="utf-8")

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

# Ordinary System continuation must follow the global conditional-CURRENT contract;
# a domain skill must not silently reintroduce CURRENT as a mandatory pre-read.
assert "BOOTSTRAP.md -> CURRENT.md -> references/domain-routing.md" not in controller
assert "Read `CURRENT.md` only when" in controller
assert "not a mandatory pre-read for ordinary System continuation" in controller

# BOOTSTRAP discovery must describe the same cloud-first target architecture.
assert "current cloud-first Ron System project owner" in bootstrap
assert "LifeUp is retired/rollback-only" in bootstrap
assert "current LifeUp real-life RPG System project owner; LifeUp is a derived game/execution surface" not in bootstrap

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

# Canonical mechanics must route to the already-promoted timing/reward/progression
# contracts. Challenge is now writable only through its compound atomic action;
# direct Quest creation, retrofits and all other progression writes remain fail-closed.
for needle in [
    "TIMING_PRESSURE_SPEC.md",
    "system-timing:v2",
    "RECOMMENDED_WINDOW",
    "HARD_EXTERNAL",
    "writable only through `challenge.create`",
    "Direct `quest.create` with Challenge timing remains fail-closed",
    "PROGRESSION_HIERARCHY_SPEC.md",
    "system-progression-hierarchy:v1",
    "Rank evolution writes remain locked",
    "system-reward-economy:v2",
]:
    assert needle in mechanics, f"canonical System mechanics missing current policy marker: {needle}"

for stale in [
    "Timing follows `SOFT_TARGET_SPEC.md`",
    "system-shop-economy:v1",
    "system-rank-review:v1",
    "hard deadline only for a real external deadline or explicitly accepted time-bounded challenge",
    "new Challenge writes remain fail-closed",
]:
    assert stale not in mechanics, f"stale System mechanics contract remains: {stale}"

# Achievement eligibility remains deterministic and ledger-derived. Immediate unlock
# may follow a verified completion only through the already-promoted non-choice
# Internal System authorization path; historical/backfill and engineering paths stay locked.
for needle in [
    "non-choice internal follow-through",
    "Internal System authorization v1",
    "Engineering-only maintenance/evaluation does not unlock achievements",
    "Historical/backfill eligibility",
    "remains user-directed",
]:
    assert needle in achievement_spec, f"achievement authorization boundary missing: {needle}"

for stale in [
    "requiring exact permission under the normal System mutation gate",
    "controller should not fabricate unlock events for old eligibility without exact permission",
]:
    assert stale not in achievement_spec, f"stale achievement permission wording remains: {stale}"

# Motivation architecture must preserve active runtime boundaries while using the
# evidence-backed compositional plan rather than a mandatory RPG ladder.
for needle in [
    "## Evidence-supported core loop",
    "REAL GOAL -> QUEST -> EXECUTION -> EVIDENCE -> PROGRESS MONITORING / FEEDBACK -> ADAPTED NEXT STEP",
    "## Candidate progression / motivation layers",
    "roles, not a mandatory sequential ladder",
    "Challenge Contract v1 is now the bounded writable Ron-specific experiment",
    "Progression composition — ACTIVE READ-ONLY EXCEPT CHALLENGE TIMING COMPOSITION",
    "Adaptive quest/reinforcement selection — PARTIALLY ACTIVE BY COMPOSITION",
    "system-strategic-context:v1",
    "system-strategic-decision-envelope:v1",
    "system-evidence-followthrough:v1",
    "Do **not** add a second persisted selector",
    "Adaptive Coin targeting/decay is **NOT ACTIVE**",
    "remains evidence-gated",
    "Identity/unlocks — PARTIAL / OPTIONAL",
    "Execution streak v1 — ACTIVE / EXPERIMENTAL",
    "## Working implementation plan / stop criterion",
    "Treat Challenge Contract v1 as a bounded active N-of-1 experiment",
    "system-execution-streak:v1",
    "system-pressure-profile:v1",
    "earned progression remain durable",
    "Keep visible Levels as another strong candidate feedback mechanic",
    "Keep Rank/Unlocks optional and evidence-gated",
]:
    assert needle in motivation, f"motivation evidence-backed plan missing boundary: {needle}"

mandatory_ladder = "Action -> Quest -> Challenge -> Boss Quest -> Arc milestone -> Rank evolution"
assert (
    f"## Progression hierarchy\n`{mandatory_ladder}`" not in motivation
), "motivation architecture must not assert the old linear progression ladder"
assert (
    f"Canonical hierarchy:\n\n`{mandatory_ladder}`" not in progression_spec
), "progression spec must not assert the old linear progression ladder"
assert (
    f"explicitly rejects `{mandatory_ladder}` as a required lifecycle" in progression_spec
), "progression spec must explicitly reject the old ladder as a required lifecycle"

for needle in [
    "compositional, not a mandatory hierarchy",
    "A Quest does not need to be a Challenge",
    "Boss does not require a prior Challenge",
    "Arc is optional long-horizon context",
    "The System is not committed to a global E->S ladder",
    "`system-challenge-contract:v1` is writable only through the compound `challenge.create` path",
    "ad-hoc post-miss recovery invention remain fail-closed",
    "No XP/coin multiplier merely for Challenge/Boss/Arc/Rank/Unlock labels",
    "Ron is an N-of-1 environment",
]:
    assert needle in progression_spec, f"progression composition contract missing: {needle}"

# Strategic Context Orchestration v1: long-horizon XMind alignment is prioritized
# without becoming a source of current factual truth or a hard dependency.
for needle in [
    "STRATEGIC_CONTEXT_ORCHESTRATION_SPEC.md",
    "system-strategic-context:v1",
    "verified XMind alignment as the primary strategic prior",
    "Calendar/TickTick scheduledness is execution context, not an intrinsic priority score",
    "`LIVE`, `FALLBACK` or `UNKNOWN`",
    "one connector failure must not block an unrelated quest",
]:
    assert needle in controller, f"missing strategic context controller marker: {needle}"

for needle in [
    "live XMind is the default strategic prior",
    "XMind is a strong prior, not a closed world",
    "A task being scheduled does not by itself make it more strategically valuable",
    "Do not persist connector availability as current truth",
    "Do not mirror Calendar, TickTick, Cronometer, Liftosaur or XMind into Neon",
    "Quest v2 scoring/rewards only after",
]:
    assert needle in strategic_context, f"missing strategic context spec marker: {needle}"

# Strategy must not override real-world authority, and the orchestration slice must
# not add a new source-of-truth service or weaken external mutation boundaries.
for needle in [
    "Mandatory reality gates",
    "hard external deadlines",
    "Current domain/live truth",
    "not a new mutable database owner",
    "does not create a new Context Broker service",
    "does not change external-source mutation permissions",
]:
    assert needle in strategic_context, f"strategic orchestration authority boundary missing: {needle}"

# Internal System authorization and Evidence Follow-through v1: clear player intent
# still authorizes exact bounded actions, while qualifying evidence may drive only
# deterministic resolution/achievement/same-trajectory continuation. Ambiguity,
# evidence integrity, strategic agency and external-write boundaries remain intact.
for needle in [
    "Internal System authorization v1",
    "unambiguously requests one exact internal System action",
    "do **not** ask for a redundant second confirmation",
    "qualifying evidence may flow through `system-evidence-followthrough:v1` into verified `quest.resolve`",
    "remain **user-directed**",
    "`CHALLENGE` is user-directed and writable only through `challenge.create`",
    "Engineering/maintenance automation cannot use this standing authorization to play for Ron",
    "If the requested action, target or any parameter that materially changes the effect is ambiguous, do not mutate.",
    "System internal authorization never weakens upstream truth/evidence requirements",
    "Evidence follow-through v1",
    "same-value `REPORTED -> VERIFIED` upgrade",
    "AUTO_CONTINUE",
]:
    assert needle in controller, f"missing internal System authorization/follow-through marker: {needle}"

for needle in [
    "Policy ref: `system-evidence-followthrough:v1`",
    "same numeric value + previous claim REPORTED + new claim VERIFIED -> allowed",
    "If a required objective is `MISSING`, return `NEEDS_EVIDENCE`",
    "If a required objective is only `REPORTED`, return `NEEDS_VERIFICATION`",
    "prepare one atomic `quest.resolve` payload",
    "exactly one candidate remains",
    "no external live-source write is required",
    "Automation removes ceremony; it does not remove Ron from real choices.",
]:
    assert needle in evidence_followthrough, f"missing evidence follow-through boundary: {needle}"

assert (
    "Any Calendar, TickTick, Cronometer, Liftosaur, XMind, marketplace or other live-source write requires Ron's explicit permission for the exact intended change"
    in protocol
), "external live-source mutation gate must remain intact"

for stale in [
    "Ron's separate exact permission for the presented `shop.item.upsert` payload",
    "request exact mutation permission before any unlock",
    "request exact mutation permission. Evaluation never writes by itself",
    "before requesting exact mutation permission",
]:
    assert stale not in controller, f"stale redundant second-confirmation wording remains: {stale}"

assert "Until Quest v2 is promoted" not in controller, "stale pre-Quest-v2 controller policy remains"
assert "legacy" in lifeup.lower() or "retired" in lifeup.lower()

for forbidden in [
    "Primary technical implementation: official `Ayagikei/LifeUp-SDK` MCP",
    "LifeUp via LifeUp Cloud + official MCP; Northflank/Tailscale is transport only",
]:
    assert forbidden not in joined, f"stale primary-LifeUp route still present: {forbidden}"

print("system controller routing guard: PASS")
