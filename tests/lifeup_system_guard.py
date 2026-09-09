#!/usr/bin/env python3
"""Static regression guard for the LifeUp System architecture and deployment contract."""

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


def forbid_regex(text: str, pattern: str, where: str) -> None:
    if re.search(pattern, text, re.IGNORECASE):
        fail(f"{where} appears to contain a committed secret matching {pattern!r}")


def main() -> int:
    bootstrap = read("BOOTSTRAP.md")
    current = read("CURRENT.md")
    routing = read("references/domain-routing.md")
    registry = read("references/continuity-owner-registry.tsv")
    skill = read("skills/lifeup-system.md")
    owner = read("projects/lifeup-system.md")
    spec = read("system/lifeup/SYSTEM_SPEC.md")
    northflank = read("system/lifeup/northflank/README.md")
    dockerfile = read("system/lifeup/northflank/Dockerfile")
    server = read("system/lifeup/northflank/server.mjs")

    # Owner/discovery/routing.
    require(registry, "projects/lifeup-system.md\tproject\t", "owner registry")
    require(bootstrap, "`projects/lifeup-system.md`", "BOOTSTRAP.md")
    require(current, "`projects/lifeup-system.md`", "CURRENT.md")
    require(routing, "| LifeUp System / gamified execution | `skills/lifeup-system.md` | `projects/lifeup-system.md` |", "domain-routing.md")

    # Authority and mutation boundaries.
    require(skill, "derived RPG ledger/execution UI", "skills/lifeup-system.md")
    require(skill, "live-mutation gate", "skills/lifeup-system.md")
    require(owner, "derived RPG ledger + execution UI", "projects/lifeup-system.md")
    require(owner, "No LifeUp/Cloud token", "projects/lifeup-system.md")
    require(spec, "Real outcome > XP", "SYSTEM_SPEC.md")
    require(spec, "No cross-domain laundering", "SYSTEM_SPEC.md")
    require(spec, "REQUIRES LIVE CALIBRATION BEFORE LIFEUP MUTATION", "SYSTEM_SPEC.md")

    # Official upstream + pinned reproducible build.
    require(owner, "Ayagikei/LifeUp-SDK", "projects/lifeup-system.md")
    require(dockerfile, "https://github.com/Ayagikei/LifeUp-SDK.git", "Dockerfile")
    require(dockerfile, "f057ea4fcd2c6c6f38a51d092c29026f344b7c4b", "Dockerfile")
    require(dockerfile, "@modelcontextprotocol/express@^2", "Dockerfile")
    require(dockerfile, "@modelcontextprotocol/node@^2", "Dockerfile")

    # Remote MCP must be authenticated and stateful.
    require(server, "MCP_BEARER_TOKEN", "server.mjs")
    require(server, "timingSafeEqual", "server.mjs")
    require(server, "new Map()", "server.mjs")
    require(server, "sessionIdGenerator: () => randomUUID()", "server.mjs")
    require(server, "isInitializeRequest", "server.mjs")
    require(server, "createLifeUpServer", "server.mjs")
    require(server, "'/healthz'", "server.mjs")
    require(server, "'/mcp'", "server.mjs")

    # Northflank/Tailscale operating contract.
    require(northflank, "exactly **1 replica**", "northflank/README.md")
    require(northflank, "Tailscale", "northflank/README.md")
    require(northflank, "LIFEUP_HOST", "northflank/README.md")
    require(northflank, "RON_LIFEUP_MCP_TOKEN", "northflank/README.md")
    require(northflank, "Codex", "northflank/README.md")

    # Obvious secret regressions. Placeholders like <...> remain allowed.
    for path, text in {
        "projects/lifeup-system.md": owner,
        "northflank/README.md": northflank,
        "server.mjs": server,
    }.items():
        forbid_regex(text, r"MCP_BEARER_TOKEN\s*=\s*[0-9a-f]{32,}", path)
        forbid_regex(text, r"LIFEUP_TOKEN\s*=\s*[A-Za-z0-9_-]{24,}", path)
        forbid_regex(text, r"tskey-[A-Za-z0-9_-]{16,}", path)

    print("PASS: LifeUp System routing, authority boundaries, remote MCP and secret contract")
    return 0


if __name__ == "__main__":
    sys.exit(main())
