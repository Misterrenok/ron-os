# Ron OS — domain package routing

Purpose: map a request to the smallest complete set of domain skills, current owners and live execution surfaces. This is a routing contract, not a mutable-state owner.

## Domain-pack invariant

A domain pack has three different layers:

1. **Skill** — stable procedure and tool/owner routing.
2. **Owner** — current decisions, constraints, OPEN/CLOSED/CONFLICT and dated fallback.
3. **Live owner/executor** — current mutable app/external state and actions.

Skills must not duplicate mutable owner/app state. Live apps do not own the rationale of Ron's decisions. Projections in Calendar, TickTick, XMind or Neon do not override their upstream owners.

## Selection algorithm

1. Identify the **primary domain** named or implied by the requested outcome.
2. For a personal-life request, use the XMind life-domain coverage matrix below as an independent completeness check.
3. Treat relevant live XMind relationship edges as candidates for **supporting domains**, not mandatory loads.
4. Add a supporting domain only when one of its constraints/resources materially changes feasibility, value, safety or execution.
5. Load the union of the selected skills, owners and claim-relevant live sources.
6. Resolve each claim by its owner class; apply the Ron OS decision contract `LOCKED / VARIABLE / UNKNOWN`.
7. Write only to the real owner/executor and read back. Update `CURRENT.md` only when cross-domain continuation materially changes.

Do not load every domain defensively. Do not stop at the noun in the request when the decision causally depends on another domain.

## Domain registry

| Domain | Skill | Current owner/fallback | Live owner/executor | Common supporting dependencies |
|---|---|---|---|---|
| Continuity/meta | `ron-work-protocol` | `BOOTSTRAP.md`, `CURRENT.md`, `PROTOCOL.md` | GitHub Ron OS | exact affected domains |
| Durable personal context | `ron-context` | `PERSON.md` | direct Ron evidence; claim-specific live owner | schedule, finance, mobility |
| General health/sleep/medical | `ron-health` | `domains/health.md` | direct symptoms/execution; device/lab/medical document; current clinical source | schedule, nutrition, training, XMind |
| Learning/languages | `ron-learning` | `domains/learning.md` + `PERSON.md` | direct/app execution; TickTick/Calendar; current official exam source | schedule, mobility, health, XMind |
| Nutrition/health-food | `nutrition` | `domains/nutrition.md` | Cronometer; current retailers/Market Fiyatı; TickTick for exact tasks | schedule, finance, training, health |
| Training | `liftosaur` | `domains/training.md` | Liftosaur | schedule, nutrition, XMind |
| Schedule/time/workday | `ron-schedule` | `PERSON.md` + relevant domain/project owner | Google Calendar; TickTick | any domain whose execution uses time |
| Finance | `ron-finance` | `domains/finance.md` | direct transaction/report; current market/rate source | schedule plus purchased/income domain |
| E-commerce | `ron-ecommerce` | `domains/ecommerce.md`; exact `projects/*.md` | marketplace/browser; live repo/runtime | finance, schedule, image/document skills |
| Mobility/education/legal | `ron-mobility` | `domains/mobility.md` + `PERSON.md` | official personal portal/document; current official public source | finance, schedule, XMind |
| Goals/map/strategy | `xmind` | affected upstream domain owners | live XMind for map structure/content | every domain materially affecting the decision |

## XMind life-domain coverage matrix

Live XMind owns exact branch names, scores, ladders and relationships. This matrix records durable routing dispositions only; it must not copy current scores, targets or node IDs.

| XMind life area | Disposition | Primary route | Material supporting routes |
|---|---|---|---|
| Current phase / development slots | composite strategy | `ron-work-protocol` + `xmind` | packs for each active direction that changes the decision |
| Legal status | dedicated | `ron-mobility` | schedule, finance, learning, XMind |
| Finance | dedicated + leaf composition | `ron-finance` | e-commerce/career, mobility, learning and schedule where causal |
| Health | dedicated family | `ron-health` | `nutrition`, `liftosaur`, schedule and XMind by claim |
| Personal growth | dedicated learning + strategy composition | `ron-learning` for languages/study; `xmind` for map strategy | schedule, mobility, health, context |
| Social relationships | composed; no dedicated skill yet | `xmind` + `ron-context` | schedule and direct Ron evidence |
| Rest and hobbies | strategy-only; no dedicated skill | `xmind` + `ron-schedule` | health/finance only when material |
| Safety | composed; no catch-all skill | `xmind` + `ron-context` | mobility, finance, health and current official/technical sources by claim |
| Spirituality and reflection | strategy-only; no dedicated skill | `xmind` + `ron-context` | schedule when a concrete cadence/action is requested |

A top-level personal-life branch found in live XMind with no disposition here is a **ROUTING GAP**. Do not treat the missing row as evidence that the area is irrelevant; either map it to existing packs or deliberately create a new thin pack when it has a distinct reusable procedure/owner/live surface.

Do not create one skill per XMind node. A dedicated skill is justified only when it contributes discriminating reusable procedure, ownership routing or tool behavior beyond what existing packs already provide.

## Claim routing

- Actual bought/eaten/trained/spent/completed state -> Ron's direct execution report or stronger direct record.
- Current app value -> that live app.
- Durable decision/preference -> latest explicit Ron statement and exact owner.
- Current external price/law/schedule -> current primary/live source.
- Historical rationale -> Git history/archive evidence only when needed.
- Missing required owner -> `UNKNOWN/UNVERIFIED`, never reconstructed from a stale skill snapshot.

## Cross-domain examples

- “What should I eat before training after work?” -> nutrition + training + schedule; Cronometer/Liftosaur/Calendar only where the answer needs their mutable state.
- “Is this grocery basket worth it?” -> nutrition + finance; add schedule only if trip/logistics materially matter.
- “Change training days because of university” -> training + schedule + mobility/education.
- “Which business task should I prioritize?” -> e-commerce + finance + schedule + XMind when strategic map state is material.
- “How do I fix my sleep without breaking German and training?” -> health + learning + training + schedule; nutrition only if the intervention materially uses it.
- “How should I prepare for an earthquake?” -> XMind + context, then health/finance/mobility and current official sources only for the claims they own.

## Skill hygiene

Domain skills should remain thin. Stable connector quirks and reusable procedures may live in skill references. Current numbers, statuses, selected SKUs, balances, event times, program state and map scores belong only to owners/live sources.
