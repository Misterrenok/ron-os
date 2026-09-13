# Ron System

Status: **CLOUD-FIRST / CHATGPT CONTROLLER / QUEST V2 / LIFEUP RETIRED**

This directory contains the current cloud-first Ron System plus preserved legacy LifeUp rollback material. The directory name is historical; it does not make LifeUp part of the current runtime.

## Current target architecture

```text
Ron
 |
 v
ChatGPT / System Controller
 |
 +----> Ron OS + claim-specific live owners
 |       (real-world truth, goals, constraints, evidence)
 |
 +----> Neon/PostgreSQL system_apply_action(...)
              |
              v
       append-only system_events
              |
              v
       rebuildable Quest v2 projections
              |
              +----> Northflank PWA/API
                     (projection + bounded System actions)
```

- ChatGPT is the sole intended interactive System controller.
- Neon/PostgreSQL `system_events` is the single mutable owner of derived RPG state.
- Ron OS and claim-specific live sources remain authoritative for real-world truth.
- The Northflank PWA/API is a runtime/projection surface, never a second state owner.
- LifeUp, LifeUp Cloud, Tailscale and the former LifeUp MCP bridge are retired from the target runtime. They are retained only as rollback/history unless Ron explicitly reopens that architecture.

## Current runtime

- Cloud service: `system/lifeup/cloud/`
- Player UI: `system/lifeup/cloud/public/index-v2.html` + `app-v2.js` + `sw-v2.js`
- Controller procedure: `skills/system-controller.md`
- Project owner: `projects/lifeup-system.md`
- System mechanics: `system/lifeup/SYSTEM_SPEC.md`
- Quest scoring: `system/lifeup/QUEST_DIFFICULTY_SPEC.md`
- Soft targets: `system/lifeup/SOFT_TARGET_SPEC.md`
- Shop: `system/lifeup/SHOP_SPEC.md`
- Achievements: `system/lifeup/ACHIEVEMENT_SPEC.md`
- Attribute evidence: `system/lifeup/ATTRIBUTE_EVIDENCE_SPEC.md`
- Strategy bridge: `system/lifeup/XMIND_STRATEGY_BRIDGE_SPEC.md`
- Engineering fast path: `system/lifeup/EXECUTION_FAST_PATH.md`

## Legacy rollback surface

`system/lifeup/northflank/` is the former LifeUp remote-MCP bridge. Its README is explicitly marked `RETIRED / ROLLBACK-ONLY`. Do not use it for normal development, deployment, readiness or recovery unless Ron explicitly restores the LifeUp architecture.

Historical implementation and retired files remain recoverable from Git history; current runtime documentation must not present them as active alternatives.
