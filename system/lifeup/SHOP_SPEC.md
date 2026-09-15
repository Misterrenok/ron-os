# System Reward Economy v2

Status: **LIVE / POLICY V2 PROMOTED / PRODUCTION SHOP EMPTY**

Policy ref: `system-reward-economy:v2`

Promotion: PR #41 was squash-merged to `main` as `ccc90368b2e02843299d75a082387976327b505a`. Post-merge cloud/PWA/System/continuity CI passed, and production Neon readback confirmed migration `010_reward_economy_v2.sql` is live with the reward-v2 action wrapper present. The ledger remained at 18 events / max seq 20 with 0 shop events, so promotion activated policy/runtime capability only and did not configure a reward, spend Coins, or authorize external spending.

This policy defines how Coins may create immediate reinforcement without becoming money, replacing real-world finance, or giving the System authority to spend. Neon/PostgreSQL `system_events` remains the only mutable owner of configured System shop items and redemptions. Current balances, affordability and discretionary spending capacity remain owned by Finance/live evidence, not by the System ledger.

## Core model

- **XP = irreversible progression.** XP is not spendable and this policy does not change Quest v2 XP calculation or level progression.
- **Coins = scarce reward tokens.** Coins are useful because they can unlock a bounded choice; they are not TRY, USD or any other currency.
- **No fixed exchange rate.** `1 Coin = X TRY/USD` and equivalent formulas are forbidden. No catalog, finance gate or redemption payload may encode a fixed Coin-to-money conversion.
- **Real-world loot remains real-world truth.** Salary, meal cash, savings, purchases and other natural consequences may be described from their authoritative real-world owner, but they are not mirrored into Neon as Coin value.
- **No routine faucet is added here.** Existing Quest Difficulty/Reward v1 issuance remains E/D/C/B/A/S = `0/0/1/2/4/8` Coins after a verified scored completion. Outcome-key anti-farming remains authoritative. This slice does not add daily attendance Coins, streak Coins or arbitrary manual Coin grants.

## Protected baseline

The following can never be conditioned on Coins or offered as a reward for withholding them:

- sleep, ordinary rest, food, water, medication, medical care or safe training;
- emergency response, transport needed for safety, and basic hygiene;
- legal, immigration, work, education, debt or other mandatory duties;
- access to Ron's own money, accounts, files, relationships or communications.

A reward must be discretionary. The System must not create scarcity around a basic need or excuse unsafe/materially harmful behavior.

## Reward classes

### 1. COSMETIC

A non-repeatable effect fulfilled entirely by the System, such as a title, theme or frame.

Required contract:

- `reward_type = COSMETIC`
- `external_value = NONE`
- `fulfillment.mode = SYSTEM`
- `fulfillment.status = PLANNED | VERIFIED`
- activation requires `VERIFIED` fulfillment and an exact verification reference
- no finance gate

### 2. REAL_WORLD_CHOICE

A non-repeatable internal unlock recording that Ron may choose one discretionary real-world reward from the relevant tier. The redemption is **not** the purchase and does not transfer money.

Required contract:

- `reward_type = REAL_WORLD_CHOICE`
- `external_value = BUDGET_GATED`
- `fulfillment.mode = RON`
- `fulfillment.status = GATED`
- `finance_gate.mode = CURRENT_DISCRETIONARY_BUDGET`
- finance gate is required again at redemption and may be at most 24 hours old
- `external_action_authorized = false`

The finance gate records only redemption-time provenance: approval status, checked time, currency, maximum currently safe discretionary spend and evidence reference. It does **not** make Neon the finance owner and it does not establish a permanent budget.

## Price ladder

Allowed prices are `1 / 2 / 4 / 8 / 16` Coins.

The first four preserve the existing C/B/A/S issuance anchors. `16` is a deliberate savings tier: it cannot be earned from one canonical Quest v2 completion and therefore supports a rarer reward without defining a cash conversion rate.

| Coins | Intended role |
|---:|---|
| 1 | small cosmetic |
| 2 | cosmetic |
| 4 | larger cosmetic or SMALL real-world choice |
| 8 | MEDIUM real-world choice |
| 16 | RARE accumulated real-world choice |

These are reinforcement tiers, not monetary price bands. The actual permissible spend for a real-world reward is decided independently by current Finance evidence at redemption.

## Finance gate

Before a `REAL_WORLD_CHOICE` redemption, the controller must obtain fresh Finance/live evidence sufficient to defend a discretionary spending cap. If consequential current inputs are stale or unknown, the gate fails closed and the Coins remain untouched.

A valid gate requires:

- `status = APPROVED`
- `mode = CURRENT_DISCRETIONARY_BUDGET`
- `checked_at` no more than 24 hours old and not materially future-dated
- a 3-letter currency code
- a positive finite `max_spend`
- a concrete `evidence_ref`

The cap answers only: **"up to what real-world amount is safe to spend now if Ron separately chooses to do so?"** It never answers "what is a Coin worth?".

## Activation and redemption boundary

1. Validate the candidate under `system-reward-economy:v2`.
2. For COSMETIC, implement and verify the System effect before activation.
3. For REAL_WORLD_CHOICE, require the redemption-time finance gate contract before activation; do not pre-bake a standing TL/USD amount.
4. Configuration/activation remains a user-directed internal System mutation.
5. Redemption separately requires an active item, enough live Coins, calibrated economy and Ron's unambiguous redemption choice.
6. REAL_WORLD_CHOICE additionally requires a fresh approved finance gate.
7. Redemption deducts Coins and records the internal unlock only.
8. Any purchase/payment/booking/subscription/message or other external follow-through is a separate action and requires its own authority. Redemption never performs it automatically.

## Starter proposal set

`STARTER_SHOP_CANDIDATES.json` contains six deliberately inactive proposals:

- `Титул: Первый шаг` — 1 Coin — COSMETIC;
- `Тема: Фиолетовая тень` — 2 Coins — COSMETIC;
- `Рамка: Охотник` — 4 Coins — COSMETIC;
- `Награда на выбор: малая` — 4 Coins — REAL_WORLD_CHOICE;
- `Награда на выбор: средняя` — 8 Coins — REAL_WORLD_CHOICE;
- `Награда на выбор: редкая` — 16 Coins — REAL_WORLD_CHOICE.

The three cosmetic effects keep their existing verified fulfillment evidence. The real-world entries are category templates, not permission to buy anything. Architecture promotion alone therefore produces **zero shop/player-state mutations and zero external spending**.

## Adaptive reinforcement boundary

The intended behavioral role of Coins is immediate reinforcement where it has marginal value, not permanent payment for every repeated action. V2 therefore adds no automatic Coin source for ordinary attendance, hygiene or other already-stable routine behavior. Existing C-S outcome rewards remain the conservative issuance mechanism in this slice; changing Coin issuance dynamically based on personal habit/friction evidence would require a separately tested reward-scoring version rather than silently overriding Quest Difficulty/Reward v1.
