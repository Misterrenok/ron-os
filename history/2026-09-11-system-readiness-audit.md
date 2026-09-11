# System readiness audit — 2026-09-11

Scope: end-to-end readiness for using ChatGPT as Ron's Solo Leveling-style System controller, covering message -> controller -> Ron OS/live evidence -> Neon ledger -> XP/coins/stats/quests -> PWA/notifications -> cross-chat recovery.

## Verdict
The cloud core is real and production-capable, but the whole product is **not yet daily-driver / seamless-System ready**. The strongest layer is persistence/integrity. The weakest layers are controller/routing consistency, quest semantics, phone interaction/proactivity and live-evidence coverage.

## Verified strong foundation
- Production Neon `system_events` is live and responsive; current live ledger has 6 persisted events.
- Append-only UPDATE/DELETE guard is live.
- `system_apply_action(...)` is the shared production write gate with idempotency.
- DB uniqueness protects quest IDs, one terminal event per quest, one progression award per completion basis, achievement IDs, notification IDs/acks and redemption IDs.
- Calibration guard enforces canonical quest rewards, Level derivation, attribute/skill scales and the Rank review floor.
- Level projection recalculates from cumulative verified XP; zero-XP launch is Level 1 / 500 XP to next.
- Production player launch is valid: Level 1, Rank null, 0 XP, 0 coins, economy CALIBRATED, Turkish Tier 3, Marketplace Operations Tier 3, no fabricated attributes.
- Cloud core is phone-independent; prior deployment verification established public Northflank health/PWA/API operation and durable Neon persistence.

## Blocking defects / gaps
### 1. Routing/continuity conflict
Canonical project owner says Neon/PostgreSQL `system_events` is the one mutable derived-state owner and LifeUp is optional downstream sync. However current `references/domain-routing.md`, `skills/lifeup-system.md` and parts of `CURRENT.md` still describe LifeUp/MCP as the primary/live System route. A new chat can therefore recover the wrong architecture. This must be repaired through Architecture Mode, not edited ad hoc on main.

### 2. Production player ledger contains an infrastructure quest
`persist-probe` / `Persistence probe` remains an ACTIVE unscored SIDE quest in production. It is infrastructure residue, not a real player quest, and the PWA renders it as ACTIVE. `chatgpt-gate-probe` was correctly cancelled.

A prior assistant statement that Ron had explicitly required `only one active quest at a time` was not supported by recovered user evidence. Historical design did use a sequential `QUEST -> COMPLETE -> reward -> next QUEST` flow, but no explicit numeric active-quest cap was found. The desired active-quest concurrency policy must therefore be decided and then enforced, not attributed to Ron retroactively.

### 3. Quest model is too thin for the target experience
Current quest payload is primarily `title + description + class + rank + reward_xp + reward_coins`. Missing structured semantics include objectives/checklist, progress, deadline/timer, recurrence/cadence, expiry/failure, dependencies, domain/evidence requirement and hidden/reveal conditions.

Quest classes `DAILY/SIDE/MAIN/RECOVERY/HIDDEN` currently have no class-specific runtime semantics. In particular, HIDDEN is only a label: the PWA renders all quests, so a HIDDEN quest would be visible immediately. Historical target behavior included Daily preparation/checklist behavior and Hidden quests revealed by conditions; those behaviors are not implemented.

### 4. Quest rank assignment is not calibrated
Reward amounts are deterministic once a quest rank is chosen, but there is no canonical v1 rubric that maps a real task to E/D/C/B/A/S. `CALIBRATION_SPEC.md` says to classify honestly / leave ambiguous quests unscored, but does not provide a reproducible difficulty-classification contract. Therefore the XP economy is protected against arbitrary reward amounts but still depends on controller judgment at the rank-assignment step.

### 5. Completion and reward are separate writes
`quest.complete` and `progression.award` are separate actions. Integrity prevents invalid/double rewards, but the HTTP API has no composite resolve action, so a failure between the two steps can leave a verified completed quest temporarily unrewarded. The ledger is recoverable, but the user experience is not atomic.

### 6. PWA is a dashboard, not yet a full execution interface
The PWA reads `/api/v1/snapshot` and renders Status, Quests, Skills, Achievements, Shop, Notifications and Log, but it has no create/complete/cancel/redeem/ack controls. It also requires manual bearer-token entry per browser session because the token is stored in `sessionStorage`.

The quest card does not show XP/coin rewards. There is no objective/progress/timer UI because the model lacks those fields.

The XP progress bar formula is incorrect: it renders `total XP / xp_to_next`. Since `xp_to_next` is remaining XP, the bar becomes wrong as soon as XP grows (and can reach 100% long before level-up). CI currently smoke-tests that the PWA shell returns HTTP 200, not the correctness of frontend projection math.

### 7. Notifications are ledger-only, not proactive delivery
`notification.push/ack` and unread/read projection exist, but `sw.js` only handles install/activate/fetch cache. There is no Web Push subscription or push event handler. Thus a System notification is visible only after the user opens/polls the PWA; it is not a Solo-Leveling-style proactive alert.

### 8. Shop / achievements / player attributes are not operationalized yet
- Reward shop schema and redemption safety exist, but there are no configured production items or calibrated shop prices.
- Achievement unlock semantics exist, but there is no automatic achievement-detection policy and production has no achievements.
- STR/VIT/INT/DISC/CHA intentionally remain null because current evidence is insufficient; a defensible onboarding/calibration path is still needed if the UI should show player stats.

### 9. Adaptive controller loop is not canonical yet
ChatGPT can reason over Ron OS and current owners, but there is no versioned System Controller policy covering natural-language intents, quest selection, active-quest policy, difficulty/rank assignment, failure/recovery, completion verification, reward resolution, hidden triggers, adaptive difficulty or anti-burnout feedback. This is the main missing layer between a strong ledger and a seamless intelligent System.

### 10. Live-evidence coverage is partial in the current ChatGPT tool surface
Google Calendar/TickTick/GitHub/Neon are available in the current runtime. Current plugin discovery did not expose Cronometer, Liftosaur or LifeUp, and XMind is available in the directory but is not installed. Therefore some real-world claims can currently be verified live while others must fall back to Ron OS/direct Ron evidence until their live connectors are restored/connected.

### 11. Documentation drift remains
- `projects/lifeup-system.md` correctly owns the cloud-first architecture.
- `references/domain-routing.md`, `skills/lifeup-system.md` and `CURRENT.md` still contain pre-cloud-first LifeUp-primary wording.
- `system/lifeup/cloud/README.md` still includes old uncalibrated-language text.
- `system/lifeup/CALIBRATION_SPEC.md` header still says CANDIDATE although calibration v1 is promoted/live.
These conflicts are dangerous mainly because they affect future-chat recovery, not because the live Neon core is broken.

## Readiness classification
- Durable ledger / provenance / idempotency: READY.
- DB integrity for implemented event types: READY.
- XP/Level/reward amount enforcement: READY.
- Current production profile baseline: READY.
- Cross-chat routing to the correct cloud-first owner: NOT READY until architecture drift is repaired.
- Quest lifecycle for Solo Leveling-style use: PARTIAL.
- Quest difficulty classification: NOT READY for consistent scoring.
- Natural-language System controller: PARTIAL / informal.
- PWA read-only dashboard: READY as dashboard, NOT READY as execution UI.
- Proactive notifications: NOT READY.
- Reward shop: engine READY, content/economy pricing NOT READY.
- Achievements: engine READY, detection/content NOT READY.
- Attribute calibration: intentionally OPEN.
- Optional LifeUp sync: OPEN and non-blocking for cloud core.
- Full end-to-end daily-driver System: NOT READY YET.

## Required next architecture sequence
1. Enter Architecture Mode on a candidate branch and repair routing/authority drift so every recovery path routes System mutable state to Neon `system_events`, with LifeUp explicitly optional downstream.
2. Define System Controller v1: natural-language intent contract, quest-selection policy, active-quest concurrency policy, reproducible E-S difficulty rubric, completion/evidence semantics, adaptive difficulty and safe failure/recovery behavior.
3. Extend Quest model (versioned migration) with structured objectives/checklist, progress, deadline/timer, cadence/recurrence, expiry/failure and hidden reveal conditions; preserve backward compatibility.
4. Add a composite/transactional quest-resolve path or deterministic reconciliation so verified completion cannot remain silently unrewarded.
5. Remove or neutralize the production `persist-probe` only after exact live-mutation permission; ensure future deployment probes cannot create player-visible production quests.
6. Upgrade PWA: correct XP progress math, show rewards/objectives/timers, add intended action controls, safer persistent device session, frontend tests and phone read-back.
7. Add proactive System delivery (Web Push and/or explicitly designed ChatGPT automation integration) tied to ledger notifications rather than a separate mutable game state.
8. Calibrate starter reward shop; add achievement detection rules; design evidence-based attribute onboarding.
9. Restore/verify required live-source connectors or explicitly define fallback behavior per domain.
10. Run an end-to-end adversarial acceptance suite for real natural-language flows (`STATUS`, `GIVE QUEST`, `COMPLETE`, `CANCEL`, `REDEEM`, hidden trigger, retry/idempotency, stale-source conflict, offline/phone case) before calling the System daily-driver ready.

No production System mutation was performed during this audit.