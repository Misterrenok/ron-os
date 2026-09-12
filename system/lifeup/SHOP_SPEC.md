# System Shop Policy v1

Status: **CANDIDATE / NO PRODUCTION SHOP ITEMS**

Policy ref: `system-shop-economy:v1`

This policy defines what may become a System reward-shop item. It does not create, activate or redeem an item. Neon/PostgreSQL `system_events` remains the only mutable owner of configured items and redemptions, and every production shop mutation still requires Ron's separate exact permission.

## Purpose

Coins should unlock motivating System extras without becoming money, coercion or a hidden external-action authority. A redemption is valid only when the System can actually deliver the described internal effect. It must never be a promise that somebody else will buy, book, send, subscribe, cancel or grant something.

## Protected baseline

The following can never be conditioned on coins:

- sleep, ordinary rest, food, water, medication, medical care or safe training;
- emergency response, transport needed for safety, and basic hygiene;
- legal, immigration, work, education, debt or other mandatory duties;
- access to Ron's own money, accounts, files, relationships or communications.

The shop must not turn a basic need into a prize or use a reward to excuse an unsafe or materially harmful action.

## Starter reward class

V1 permits only `COSMETIC` rewards fulfilled entirely inside the System runtime. Examples are a profile title, theme or frame. This makes fulfillment auditable and keeps redemptions free of external purchases and user-only promises.

Every candidate must declare:

- `policy_ref = system-shop-economy:v1`;
- `reward_type = COSMETIC`;
- `external_value = NONE`;
- `protected_need = false`;
- `mandatory_duty = false`;
- `repeatable = false`;
- fulfillment mode `SYSTEM`, a stable `effect_key`, and status `PLANNED` or `VERIFIED`.

`VERIFIED` fulfillment requires a concrete test/read-back reference. A planned effect cannot be activated merely because a catalog entry exists.

## Price ladder

Starter prices are limited to `1 / 2 / 4 / 8` coins. These values deliberately mirror the existing C/B/A/S issuance ladder in `system-quest-reward:v1`:

| Coins | Existing issuance anchor |
|---:|---|
| 1 | one C-rank verified completion |
| 2 | one B-rank verified completion |
| 4 | one A-rank verified completion |
| 8 | one S-rank verified completion |

This is not a TRY, USD, time or labor conversion. Prices outside the ladder require a new versioned policy and fresh economy evidence rather than discretionary rounding.

## Activation and mutation boundary

1. Design and validate the candidate.
2. Implement its System-controlled effect.
3. Verify the effect and record the exact verification reference.
4. Present the exact `shop.item.upsert` payload and request Ron's permission.
5. Only after permission, write through the shared action gate with `source_ref = system-shop-economy:v1`.
6. Read back the ledger and PWA.

The validator can build a proposed action envelope, but that envelope is not mutation authorization. Redemption separately requires an existing active item, enough live coins and exact permission; it never performs an external side effect.

## Starter proposal set

`STARTER_SHOP_CANDIDATES.json` contains three deliberately inactive proposals:

- `Титул: Первый шаг` — 1 coin;
- `Тема: Фиолетовая тень` — 2 coins;
- `Рамка: Охотник` — 4 coins.

All three fulfillment states are `PLANNED`. Therefore the exact production write set for this policy release is **empty**. They may not be activated until their visual effects exist, pass tests/read-back and Ron authorizes the exact item write.

