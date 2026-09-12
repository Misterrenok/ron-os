# XMind Strategy Bridge v1

Policy ref: `system-xmind-strategy-bridge:v1`.

## Purpose

Connect Quest v2 execution to Ron's live strategic map without creating a second strategy owner or letting stale map projections override current real-world evidence.

## Authority

- Live XMind owns exact file, sheet, topic structure, labels, scores and ladders.
- Ron OS domain owners and claim-specific live sources own current real-world facts and decisions.
- Neon `system_events` owns only derived RPG state.
- ChatGPT is the bridge/controller. The PWA is a read-only projection.

## Contract

A linked quest stores one optional composite provenance value in the existing event `source_ref`. It may include:

- exact XMind file, sheet and topic ids plus a short display label;
- `READ_ONLY` mode;
- controller check timestamp;
- `VERIFIED` or `UNVERIFIED` status;
- conflict status;
- one or more exact upstream owner paths;
- existing quest policy provenance, including `system-quest-difficulty:v1`.

`VERIFIED` is allowed only when the live topic was read within 24 hours of quest construction, every decision-relevant claim was reconciled with its stronger owner, conflict status is `CLEAR`, and at least one upstream owner ref is present.

## Fail closed

If XMind is unavailable, the topic disappeared, the check is stale, an owner is missing, or map content conflicts with a stronger owner, the controller must omit the link or mark it `UNVERIFIED`. The System may still create a justified quest from stronger owners, but it must not call that quest XMind-verified.

The bridge must never:

- write, restructure or style XMind;
- import the full map into Neon;
- turn every topic into a quest;
- treat map scores as XP, attributes or completion evidence;
- replace Quest v2 scoring, evidence, mutation permission or reward gates;
- use a user-supplied URL. The PWA derives the only outbound link from the validated XMind file id and the fixed `https://app.xmind.com/share/` origin.

## Compatibility

Strategy metadata is optional. Existing Quest v1/v2 events and quests without the bridge source-ref prefix remain unchanged and expose `strategy_context: null`.
