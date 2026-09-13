#!/usr/bin/env python3
"""Regression guard: current System is ChatGPT+Neon; legacy LifeUp bridge remains recoverable and safe."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    p = ROOT / path
    if not p.is_file():
        fail(f"missing required file: {path}")
    return p.read_text(encoding="utf-8")


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def require(text: str, needle: str, where: str) -> None:
    if needle not in text:
        fail(f"{where} missing required anchor: {needle!r}")


def forbid(text: str, needle: str, where: str) -> None:
    if needle in text:
        fail(f"{where} contains stale primary-LifeUp route: {needle!r}")


def forbid_regex(text: str, pattern: str, where: str) -> None:
    if re.search(pattern, text, re.IGNORECASE):
        fail(f"{where} appears to contain a committed secret matching {pattern!r}")


def require_lifeup_retired(text: str, where: str) -> None:
    lower = text.lower()
    if "lifeup" not in lower or not any(
        marker in lower
        for marker in (
            "retired/rollback-only",
            "retired system integration only",
            "retired from the target runtime architecture",
            "lifeup retired from target runtime",
        )
    ):
        fail(f"{where} must preserve the LifeUp retirement/rollback-only boundary")


def main() -> int:
    bootstrap = read("BOOTSTRAP.md")
    current = read("CURRENT.md")
    routing = read("references/domain-routing.md")
    registry = read("references/continuity-owner-registry.tsv")
    controller = read("skills/system-controller.md")
    lifeup_skill = read("skills/lifeup-system.md")
    owner = read("projects/lifeup-system.md")
    spec = read("system/lifeup/SYSTEM_SPEC.md")
    northflank = read("system/lifeup/northflank/README.md")
    dockerfile = read("system/lifeup/northflank/Dockerfile")
    server = read("system/lifeup/northflank/server.mjs")

    # Current discovery/routing must point to ChatGPT + Neon, not LifeUp. CURRENT is
    # only a routing index, so guard the invariant rather than one frozen prose sentence.
    require(registry, "projects/lifeup-system.md\tproject\t", "owner registry")
    require(bootstrap, "`projects/lifeup-system.md`", "BOOTSTRAP.md")
    require(current, "`skills/system-controller.md` + `projects/lifeup-system.md`", "CURRENT.md")
    require(current, "Neon/PostgreSQL `system_events`", "CURRENT.md")
    require_lifeup_retired(current, "CURRENT.md")
    require(routing, "| System / gamified execution | `skills/system-controller.md` | `projects/lifeup-system.md` |", "domain-routing.md")
    require(routing, "| Legacy LifeUp integration | `skills/lifeup-system.md` |", "domain-routing.md")
    require(controller, "ChatGPT is the sole intended interactive System controller", "skills/system-controller.md")
    require(controller, "Neon/PostgreSQL `system_events` is the single mutable owner", "skills/system-controller.md")
    require(lifeup_skill, "retired from the target runtime architecture", "skills/lifeup-system.md")
    require(owner, "LIFEUP RETIRED FROM TARGET RUNTIME", "projects/lifeup-system.md")
    require(owner, "Neon/PostgreSQL `system_events` is the one mutable owner", "projects/lifeup-system.md")

    combined_current = "\n".join([current, routing, controller, lifeup_skill])
    forbid(combined_current, "Primary technical implementation: official `Ayagikei/LifeUp-SDK` MCP", "current System routing")
    forbid(combined_current, "LifeUp via LifeUp Cloud + official MCP; Northflank/Tailscale is transport only", "current System routing")

    # Legacy implementation remains physically recoverable and its old safety contract still exists.
    require(spec, "Real outcome > XP", "SYSTEM_SPEC.md")
    require(spec, "No cross-domain laundering", "SYSTEM_SPEC.md")
    require(spec, "REQUIRES LIVE CALIBRATION BEFORE LIFEUP MUTATION", "SYSTEM_SPEC.md")
    require(dockerfile, "https://github.com/Ayagikei/LifeUp-SDK.git", "Dockerfile")
    require(dockerfile, "f057ea4fcd2c6c6f38a51d092c29026f344b7c4b", "Dockerfile")
    require(dockerfile, "@modelcontextprotocol/express@^2", "Dockerfile")
    require(dockerfile, "@modelcontextprotocol/node@^2", "Dockerfile")
    require(server, "MCP_BEARER_TOKEN", "server.mjs")
    require(server, "timingSafeEqual", "server.mjs")
    require(server, "new Map()", "server.mjs")
    require(server, "sessionIdGenerator: () => randomUUID()", "server.mjs")
    require(server, "isInitializeRequest", "server.mjs")
    require(server, "createLifeUpServer", "server.mjs")
    require(server, "'/healthz'", "server.mjs")
    require(server, "'/mcp'", "server.mjs")
    require(northflank, "exactly **1 replica**", "northflank/README.md")
    require(northflank, "Tailscale", "northflank/README.md")
    require(northflank, "LIFEUP_HOST", "northflank/README.md")
    require(northflank, "RON_LIFEUP_MCP_TOKEN", "northflank/README.md")

    # Obvious secret regressions remain forbidden in legacy artifacts too.
    for path, text in {
        "projects/lifeup-system.md": owner,
        "northflank/README.md": northflank,
        "server.mjs": server,
    }.items():
        forbid_regex(text, r"MCP_BEARER_TOKEN\s*=\s*[0-9a-f]{32,}", path)
        forbid_regex(text, r"LIFEUP_TOKEN\s*=\s*[A-Za-z0-9_-]{24,}", path)
        forbid_regex(text, r"tskey-[A-Za-z0-9_-]{16,}", path)

    print("PASS: ChatGPT/Neon owns current System routing; legacy LifeUp bridge remains recoverable and secret-safe")
    return 0


if __name__ == "__main__":
    sys.exit(main())
