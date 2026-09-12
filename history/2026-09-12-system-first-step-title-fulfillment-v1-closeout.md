# First-Step title fulfillment v1 — closeout

Date: 2026-09-12 Europe/Istanbul
Status: CLOSED / IMPLEMENTED / VERIFIED / PROMOTED / NOT ACTIVATED

## Scope
Starter item: `system-title-first-step-v1` / `Титул: Первый шаг` / 1 coin.

The fulfillment is System-controlled and cosmetic. Ownership is derived only from ledger shop state: the PWA applies `data-system-title="first-step"` only when the item has `redemptions > 0`. The hero then renders the Russian title `ПЕРВЫЙ ШАГ`. No local toggle, localStorage flag, external side effect, XP, coin issuance, or separate mutable title state is introduced.

The effect remains available after redemption even if the catalog item is later inactive, matching the existing Violet Shadow ownership semantics.

## Verification
Exact base: `126ffd24684a8a41ab52571ed796b270da646017`.
Implementation proof head: `04069fc06e75c56b626609be351c968b85df6baa`.
Final promoted head: `8f35395863e44316105ed07090eb6312e09a16fb`.

Implementation proof:
- system-pwa-ci `34678331752`: PASS;
- system-cloud-ci `34678331819`: PASS;
- continuity `34678331746`: PASS.

After marking fulfillment VERIFIED, an existing shop-policy negative test was correctly exposed as coupled to `candidates[0]` still being PLANNED. The test was repaired to explicitly null the verification ref for its false-verification case and to assert both verified starter cosmetics independently. The failed intermediate gate was not promoted.

Final candidate head `8f35395863e44316105ed07090eb6312e09a16fb`:
- system-cloud-ci `34678401817`: PASS (model, Docker, real PostgreSQL action gate, HTTP-through-Postgres);
- continuity `34678401830`: PASS;
- full base-to-head diff reviewed: exactly five intended paths (`STARTER_SHOP_CANDIDATES.json`, cosmetic JS/CSS, cosmetic tests, shop-policy tests), with no migration, SQL gate, owner, secret, or unrelated-domain change.

Post-promotion main on the same exact head:
- system-pwa-ci `34678481420`: PASS;
- system-cloud-ci `34678481424`: PASS;
- continuity `34678481443`: PASS;
- Northflank `system-core` build `decorous-stove-8584`: SUCCESS.

## Production state
The starter candidate is now fulfillment `VERIFIED` but remains `active:false`.

Production Neon after deployment remains exactly:
- 11 total events;
- max seq 13;
- 0 progression awards;
- 0 attribute events;
- 0 achievement unlocks;
- 0 shop upserts;
- 0 shop redemptions.

Therefore the production catalog remains empty and the title is not owned or displayed yet.

## Exact activation payload — NOT APPLIED
Activation remains a separate exact-permission mutation under `system-shop-economy:v1`:

```json
{
  "type": "shop.item.upsert",
  "payload": {
    "item_id": "system-title-first-step-v1",
    "title": "Титул: Первый шаг",
    "description": "Косметический титул профиля за первое подтверждённое продвижение.",
    "cost_coins": 1,
    "active": true,
    "repeatable": false
  }
}
```

This payload has not been applied. Redemption would be a second separately authorized player-state mutation and is currently impossible with live coin balance 0.
