# Accepted framework source-lineage audit — 2026-08-24

Status: **HISTORICAL / NON-GOVERNING**  
Runtime owners remain `PROTOCOL.md` for general process/meta behavior and `PERSON.md` for durable personal goals/preferences/frameworks.

## Why this exists
The deep migration audit initially focused on 2026-08-23/24 state and executors. Ron then remembered an older explicit source: Anthropic `system-prompts.md`, supplied on 2026-08-18. That exposed a broader migration risk: an accepted framework can disappear even when the current owners are internally consistent if its source lineage is older than the migration window.

This file records source lineage only. It does not duplicate or override the governing rules.

## Reconciled sources/frameworks

### 1. Anthropic `system-prompts.md` — supplied 2026-08-18
Historical audit evidence shows the whole third-party system prompt was **not** adopted as ChatGPT system configuration. Instead, a narrow nonduplicating Ron-specific subset was explicitly accepted and fresh-chat tested:
- completion discipline;
- premise/correction verification;
- current-turn constraint anchoring;
- decisive recommendation;
- proactive-but-relevant behavior;
- epistemic restraint about people;
- custom provenance discipline: Ron report/decision != assistant proposal != inference != summary; raw source/transcript beats a conflicting summary; general positive reaction does not silently accept every assistant-added detail; one mention does not automatically become a durable preference/fact.

2026-08-24 action: missing explicit semantics were restored compactly in `PROTOCOL.md`; regression coverage lives in `tests/meta-governance-architecture-v1.md`. Anthropic product/safety/personality rules remain source evidence only and cannot override OpenAI system/developer instructions.

### 2. Ron partner/compass framework — consolidated 2026-08-23
The old process canon explicitly included preferences-as-defaults, leverage/opportunity-cost, constructive dissent, epistemic humility, decision-value communication, unknown-unknown/blind-spot scan, global compass/agenda check, action-over-advice, truth-preserving influence, lifecycle/transferability, deletion/consumer test and review thresholds.

2026-08-24 action: most semantics already survived through the compact meta-controller; two weakly represented items were restored explicitly in `PROTOCOL.md`:
- proportional blind-spot/global-compass scan for meaningful commitments;
- truth-preserving influence: defaults/friction/reminders/framing/commitment devices are allowed, fabricated facts/evidence/diagnoses/outcomes/false certainty are not.

### 3. Naval Ravikant / “How to Get Rich” — explicitly adopted as durable decision filter
Prior conversation evidence shows Ron explicitly asked to use this as a long-term working decision framework, not a temporary discussion. Accepted themes:
- wealth/assets over status or only selling time;
- ownership/equity/IP/products;
- specific knowledge;
- build + sell/distribution;
- permissionless leverage via code/media/digital products/automation;
- accountability/track record and judgment;
- long-term games with ethical trusted relationships;
- compounding;
- uniqueness/non-substitutability;
- freedom.

2026-08-24 action: restored to `PERSON.md` as a durable strategic filter. It is not a dogma and does not replace case-specific expected-value analysis.

### 4. Decision-integrity / meta-controller / self-improvement loop — Ron-internal process constructs
These are not third-party philosophical sources. They were developed through Ron/assistant failures, adversarial tests and remediation. Their semantics now live in `PROTOCOL.md` and are regression-guarded; historical benchmark keys/results remain frozen evidence rather than governing text.

## Search conclusion
A broader search for other explicitly adopted external authors/philosophies/named third-party frameworks did not recover another confirmed durable framework beyond Anthropic/Claude-derived working rules and Naval. Casual mentions or domain-specific evidence are not promoted merely because they resemble a framework.

## Migration rule learned
Future architecture migrations must audit not only current files and recent chats but also **accepted-source lineage**: any external prompt/framework or named internal framework that was explicitly adopted must end in one of three states — (1) represented in its proper current owner, (2) explicitly superseded by Ron/new evidence, or (3) source/evidence only with no runtime authority. Silent disappearance is a migration defect.
