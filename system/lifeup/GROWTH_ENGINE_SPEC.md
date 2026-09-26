# Growth Engine v1

Policy ref: **`system-growth:v1`**  
Skill Mastery ref: **`system-skill-mastery:v1`**  
Skill evidence ref: **`system-skill-evidence:v1`**  
Status: **ACTIVE TARGET — candidate until production promotion/read-back**

## Objective

Turn verified Quest execution into a richer Solo-inspired growth loop without making game numbers pretend to be real competence.

```text
Quest -> verified outcome
      -> global XP / Coins (existing reward policy)
      -> Skill Mastery XP (frequent game feedback)
      -> skill evidence + attribute evidence (real-capability evidence)
      -> evidence-gated Skill/Attribute Evolution
      -> Growth Scan feedback
```

Global Level, Skill Mastery, Skill Competency and STR/VIT/INT/DISC/CHA are deliberately different layers.

## 1. Quest growth mapping

Growth is never inferred from a quest title after the fact. An **active Quest v2** may receive exactly one append-only `quest.growth.assign` event before it becomes terminal.

The mapping may contain:
- one **primary skill**;
- up to two **secondary skills**;
- up to two **attribute evidence** targets.

A skill mapping records:
- stable normalized `skill_id`;
- player-facing name;
- domain;
- evidence kind.

An attribute mapping records:
- one of `STR / VIT / INT / DISC / CHA`;
- the exact evidence kind that successful completion can support.

The mapping itself grants nothing. Only verified completion can create growth evidence, and only the existing canonical Quest reward can create Skill Mastery XP.

## 2. Skill Mastery — frequent feedback, not competence

Mastery XP is a derived, non-spendable game counter.

For a verified mapped Quest with canonical XP:
- primary skill receives **100%** of Quest XP as Mastery XP;
- each secondary skill receives **50% rounded down to a 5-XP quantum**;
- a 5-XP E quest therefore gives 0 secondary Mastery XP;
- no growth multiplier changes global Quest XP or Coins.

Skill Mastery Level uses its own curve:

```text
Level 1 -> 2: 50 mastery XP
each next span ~= previous span * 1.15
each span is quantized to nearest 5 XP
```

Mastery Level is intentionally easy to see moving. It means only **verified practice invested in this skill inside the System**. It is not a certificate, CEFR level, professional seniority or proof of independent competence.

## 3. Skill Competency — evidence-gated

Numeric skill Tier remains the existing `system-skill-competency5:v1` 1..5 scale.

Growth Engine v1 uses `system-skill-evidence:v1` as a conservative executable preflight. Verified mapped completions become skill evidence. A skill can therefore:
- appear as tracked with a Mastery bar while competence remains unknown;
- accumulate Mastery XP without Tier promotion;
- evolve only when the evidence floor for a higher Tier is fully supported.

Global Level never promotes a skill. Mastery Level alone never promotes a skill.

When the evidence evaluator supports a higher Tier, Growth Engine may deterministically write the exact `skill.upsert` increase under Ron's explicit 2026-09-26 authorization of this architecture. It never lowers a skill automatically.

## 4. Attributes — evidence, not stat points

There are no free stat points and no rule such as “Level up -> +1 INT”.

A Quest may contribute attribute evidence only when its verified outcome genuinely bears on that attribute. The evidence kind is fixed in the pre-completion growth mapping.

The existing `system-attribute-evidence:v1` gate remains authoritative:
- stale/unverified/wrong-attribute evidence fails closed;
- Tier 1..5 keeps its existing time-span/benchmark/difficult-outcome requirements;
- Growth Engine may promote only to the highest fully supported higher Tier;
- it never auto-lowers an attribute;
- no Quest mapping can substitute for real upstream evidence.

Examples:
- a guided German lesson with recall can support a conservative INT baseline signal;
- repeated follow-through may support DISC only when the Quest outcome actually demonstrates follow-through, not merely because a task exists;
- gym attendance alone does not automatically prove STR;
- a verified strength performance/benchmark can support STR;
- a communication/sales result may support CHA when the outcome actually evidences it.

## 5. Skill evidence kinds

Ordered from weaker to stronger:
1. `guided_practice`
2. `independent_output`
3. `objective_benchmark`
4. `difficult_outcome`
5. `external_validation`
6. `exceptional_milestone`

A stronger class may satisfy a weaker qualitative requirement, but distinct-record and time-span requirements remain.

## 6. Growth feedback

Every mapped verified rewarded completion can add a **Скан роста** line to the existing reward notification, for example:

```text
+10 XP · До уровня 2: 70 XP ·
Скан роста: Немецкий язык +10 мастерства · ИНТЕЛЛЕКТ: +1 доказательство
```

When a new evidence package crosses a real competency threshold, Growth Engine writes the evidence-gated skill/attribute update and creates one idempotent evolution notification for that completion. Multiple simultaneous evolutions are consolidated rather than spamming one push per field.

The existing full-screen SUCCESS/REWARD celebration surface is reused.

## 7. Activation / no retroactive farming

Growth v1 activation starts on 2026-09-26.

- Historical Quest/XP/skill/attribute events are immutable.
- **No automatic historical Skill Mastery backfill.**
- A growth mapping cannot be added after a Quest is terminal.
- Existing Quest XP is never re-awarded.
- Existing skill/attribute tiers are never rewritten merely to fit the new mechanic.
- A currently active Quest may be assigned a mapping prospectively before completion.

## 8. Automatic evolution boundary

Ron explicitly approved this Growth Engine design on 2026-09-26.

That approval authorizes bounded internal deterministic follow-through for:
- growth assignment when the controller has already selected an unambiguous skill/attribute mapping for an authorized Quest;
- evidence-gated upward `skill.upsert`;
- evidence-gated upward `attribute.set`;
- idempotent Growth evolution feedback.

This does **not** authorize:
- fabricating completion/evidence;
- choosing a strategic direction;
- retroactive mapping after completion;
- external app/source writes;
- arbitrary skill creation from one-off labels;
- stat allocation based on global Level;
- automatic downward re-calibration.

If the mapping itself is materially ambiguous, the controller keeps it narrower or omits that target rather than guessing.

## 9. Skill creation filter

A new skill target is allowed only when it is:
- reusable across more than one possible task;
- meaningfully improvable;
- capable of having evidence criteria;
- not merely a lesson, product, page or one-off action;
- not already covered by a better existing skill identity.

Examples:
- `German Language` — valid.
- `Marketplace Operations` — valid.
- `Bebris Lesson 3` — invalid as a skill.
- `Watching a German video` — invalid as a skill.

## 10. Invariants

- Real life remains the objective.
- Quest reward policy remains `system-quest-reward:v1`.
- Global Level remains `system-level-xp:v2`.
- Rank stays separate.
- Skill Mastery is not spendable and grants no Coins.
- Attribute/skill competency changes require verified evidence.
- No growth for unmapped Quests.
- No duplicate growth assignment.
- No terminal retrofitting.
- No second mutable state owner.
