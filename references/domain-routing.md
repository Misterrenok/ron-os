# Ron OS — domain package routing

Purpose: map a request to the smallest complete set of domain skills, current owners and live execution surfaces. This is a routing contract, not a mutable-state owner.

## Domain-pack invariant

A domain pack has three different layers:

1. **Skill** — stable procedure and tool/owner routing. The registry must name a readable repository-relative `skills/*.md` path; abstract skill aliases are not valid runtime routes.
2. **Owner** — current decisions, constraints, OPEN/CLOSED/CONFLICT and dated fallback.
3. **Live owner/executor** — current mutable app/external state and actions.

Skills must not duplicate mutable owner/app state. Live apps do not own the rationale of Ron's decisions. Projections in Calendar, TickTick, XMind or Neon do not override their upstream owners.

## Selection algorithm

1. Identify the **primary domain** named or implied by the requested outcome.
2. For a personal-life request, use the XMind life-domain coverage matrix below as an independent completeness check.
3. Treat relevant live XMind relationship edges as candidates for **supporting domains**, not mandatory loads.
4. Add a supporting domain only when one of its constraints/resources materially changes feasibility, value, safety or execution.
5. For every selected package, **read its exact Skill file first**, then its owner(s), then claim-relevant live sources. A missing/unreadable required skill is a `ROUTING GAP`; never silently skip the procedural layer.
6. Resolve each claim by its owner class; apply the Ron OS decision contract `LOCKED / VARIABLE / UNKNOWN`.
7. Write only to the real owner/executor and read back. Update `CURRENT.md` only when cross-domain continuation materially changes.

Do not load every domain defensively. Do not stop at the noun in the request when the decision causally depends on another domain.

## Domain registry

| Domain | Skill | Current owner/fallback | Live owner/executor | Common supporting dependencies |
|---|---|---|---|---|
| Continuity/meta | `skills/ron-work-protocol.md` | `BOOTSTRAP.md`, `CURRENT.md`, `PROTOCOL.md` | GitHub Ron OS | exact affected domains |
| LifeUp System / gamified execution | `skills/lifeup-system.md` | `projects/lifeup-system.md` | LifeUp via LifeUp Cloud + official MCP; Northflank/Tailscale is transport only | every affected real-world domain whose goals/constraints determine a quest, reward, stat or completion interpretation |
| Durable personal context | `skills/ron-context.md` | `PERSON.md` | direct Ron evidence; claim-specific live owner | schedule, finance, mobility |
| General health/sleep/medical | `skills/ron-health.md` | `domains/health.md` | direct symptoms/execution; device/lab/medical document; current clinical source | schedule, nutrition, training, XMind |
| Learning/languages | `skills/ron-learning.md` | `domains/learning.md` + `PERSON.md` | direct/app execution; TickTick/Calendar; current official exam source | schedule, mobility, health, XMind, skill capital when capability prioritization matters |
| Skill capital | `skills/skill-capital.md` | `domains/skill-capital.md` | direct performance/application evidence; claim-specific learning/work/market source | learning, mobility, e-commerce, finance, schedule, health, XMind as causally needed |
| Nutrition/health-food | `skills/nutrition.md` | `domains/nutrition.md` | Cronometer; current retailers/Market Fiyatı; TickTick for exact tasks | schedule, finance, training, health |
| Training | `skills/liftosaur.md` | `domains/training.md` | Liftosaur | schedule, nutrition, XMind |
| Schedule/time/workday | `skills/ron-schedule.md` | `PERSON.md` + relevant domain/project owner | Google Calendar; TickTick | any domain whose execution uses time |
| Finance | `skills/ron-finance.md` | `domains/finance.md` | direct transaction/report; current market/rate source | schedule plus purchased/income domain |
| E-commerce | `skills/ron-ecommerce.md` | `domains/ecommerce.md`; exact `projects/*.md` | marketplace/browser; live repo/runtime | finance, schedule, skill capital, image/document skills |
| Mobility/education/legal | `skills/ron-mobility.md` | `domains/mobility.md` + `PERSON.md` | official personal portal/document; current official public source | finance, schedule, learning, skill capital, XMind |
| Social capital | `skills/social-capital.md` | `domains/social-capital.md` | direct Ron evidence; specific live contact/message source only when task-relevant | XMind/context, schedule, learning, e-commerce, mobility, finance as causally needed |
| Goals/map/strategy | `skills/xmind.md` | affected upstream domain owners | live XMind for map structure/content | every domain materially affecting the decision |

## XMind life-domain coverage matrix

Live XMind owns exact branch names, scores, ladders and relationships. This matrix records durable routing dispositions only; it must not copy current scores, targets or node IDs.

| XMind life area | Disposition | Primary route | Material supporting routes |
|---|---|---|---|
| Current phase / development slots | composite strategy | continuity/meta + goals/map/strategy | packs for each active direction that changes the decision, including skill/social capital when active |
| Legal status | dedicated | mobility/education/legal | schedule, finance, learning, skill capital, XMind |
| Finance | dedicated + leaf composition | finance | e-commerce/career, mobility, learning, skill capital and schedule where causal |
| Health | dedicated family | general health | nutrition, training, schedule and XMind by claim |
| Personal growth | dedicated learning + skill-capital + strategy composition | learning for concrete study/languages; goals/map for strategy | skill capital for capability prioritization; schedule, mobility, health, context where causal |
| Social relationships | composed; professional/opportunity networking has a dedicated social-capital route | goals/map + durable context for ordinary relationships | social capital only for professional/opportunity network goals; schedule and direct Ron evidence |
| Rest and hobbies | strategy-only; no dedicated skill | goals/map + schedule | health/finance only when material |
| Safety | composed; no catch-all skill | goals/map + durable context | mobility, finance, health and current official/technical sources by claim |
| Spirituality and reflection | strategy-only; no dedicated skill | goals/map + durable context | schedule when a concrete cadence/action is requested |

A top-level personal-life branch found in live XMind with no disposition here is a **ROUTING GAP**. Do not treat the missing row as evidence that the area is irrelevant; either map it to existing packs or deliberately create a new thin pack when it has a distinct reusable procedure/owner/live surface.

Do not create one skill per XMind node. A dedicated skill is justified only when it contributes discriminating reusable procedure, ownership routing or tool behavior beyond what existing packs already provide.

## Claim routing

- Actual bought/eaten/trained/spent/completed state -> Ron's direct execution report or stronger direct record.
- Actual practiced/applied skill performance -> Ron's direct report or stronger direct work/assessment evidence.
- Current contact detail/message state -> the relevant live contact/message source when task-relevant; relationship quality remains direct-evidence/owner state, never inferred from mere contact existence.
- Current app value -> that live app.
- Durable decision/preference -> latest explicit Ron statement and exact owner.
- Current external price/law/schedule/market requirement -> current primary/live source.
- Historical rationale -> Git history/archive evidence only when needed.
- Missing required owner or skill -> `UNKNOWN/UNVERIFIED` / `ROUTING GAP`, never silently bypassed or reconstructed from a stale snapshot.

## Cross-domain examples

- “What should I eat before training after work?” -> nutrition + training + schedule; Cronometer/Liftosaur/Calendar only where the answer needs their mutable state.
- “Is this grocery basket worth it?” -> nutrition + finance; add schedule only if trip/logistics materially matter.
- “Change training days because of university” -> training + schedule + mobility/education.
- “Which business task should I prioritize?” -> e-commerce + finance + schedule + XMind when strategic map state is material.
- “What one skill should I build next for the highest long-term payoff?” -> skill capital + the target-domain owners (for example learning + mobility/e-commerce) + finance/schedule only when cost/time changes the ranking.
- “How do I build useful professional connections for Germany/IT?” -> social capital + mobility + learning/skill capital; specific contacts only when named-person action is actually needed.
- “How do I fix my sleep without breaking German and training?” -> health + learning + training + schedule; nutrition only if the intervention materially uses it.
- “How should I prepare for an earthquake?” -> XMind + context, then health/finance/mobility and current official sources only for the claims they own.
- “Create a LifeUp quest for this goal” -> LifeUp System + every real-world domain whose current goal, constraint, safety condition or execution evidence determines the quest; LifeUp itself remains the derived game surface.

## Skill hygiene

Domain skills should remain thin. Stable connector quirks and reusable procedures may live in skill references. Current numbers, statuses, selected SKUs, balances, event times, program state, active skill priority, network inventory and map scores belong only to owners/live sources.
