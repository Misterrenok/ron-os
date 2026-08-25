# E-commerce / marketplace work — domain fallback

Status: **ACTIVE DOMAIN / LIVE PLATFORM STATE EXTERNAL**  
Updated: 2026-08-25 Europe/Istanbul

Purpose: preserve durable marketplace-working constraints and small current continuity residue without pretending GitHub owns live prices, stock, orders or listing state. Trendyol/Hepsiburada/Shopier and Ron's current operational tools own their live platform data.

## Durable working constraints
- Preserve the real product's color/form; do not invent a materially different product just to make an attractive listing image.
- Do not put a price into a marketplace image unless Ron explicitly asks for that specific creative.
- Prefer separate purposeful images over repetitive collage-style duplication when building a listing set.
- Product-role accuracy matters: do not describe a component/accessory as the finished product it is used inside.
- Do not invent pack quantity, dimensions, claims or platform rules from memory. Use current product evidence/current platform source when consequential.
- For content work, optimize for clear recognition + conversion/SEO while keeping the actual item visually distinguishable from the background.

## Current Trendyol content residue — 2026-08-24
Product under active image/listing work: artificial flower-center element used inside chenille flowers; customers may call it **tohum / tomurcuk / ercik**.

Last explicit constraints:
- sell as one bundle; **do not write a numeric quantity claim** on the creative;
- visually show the stems/items more sparsely rather than as an unrealistically dense 500-piece-looking mass;
- color wording: **kırık beyaz**;
- pure white background can make the near-white item disappear, so use enough tonal/background contrast to keep the product legible while remaining marketplace-clean;
- include at least one usage example showing the item in the center of a chenille flower;
- the center element itself is not the finished flower.

These are current content-project constraints, not universal rules for every future product. New explicit product facts supersede this section.

## Public Trendyol sales audit — 2026-08-25
Public live pages exposed several conversion/trust leaks worth fixing before scaling paid traffic. Seller-panel impressions/clicks/orders/margin remain unavailable, so ranking among fixes is provisional until live analytics are supplied.

### P0 — decorative string moss 20 g
Public listing: `Mutkin KARAASLAN Yapay Dekoratif İpli Yosun 20 Gr`.
Observed contradiction: title says **20 Gr**, while public attribute `Metraj` shows **500-999** and the generated description opens with a **500-999 gram** claim. Reviews/questions also show repeated size/quantity uncertainty; two positive reviewers explicitly say the amount feels very small for the price, and one buyer asks whether a 40 g or larger option exists.
Action: correct false/mismatched attributes/description first; show real 20 g scale/coverage visually; then evaluate a larger pack/variant (e.g. 40 g+) from actual stock economics rather than hiding the small quantity.

### P0 — ercik/tohum numeric-count trust leak
Public gold ercik listing has reviews complaining that a former 500-count claim and later 300-count claim did not match received quantity. This reinforces the current project decision to avoid unverified numeric quantity claims on creatives/listing surfaces. Action: audit all ercik variants for stale 500/300/250 count claims and replace only where the physical packing unit has been measured/standardized; otherwise sell/describe the verified bundle unit and show scale/use examples.

### P0 — lint-roller offer architecture / price-positioning leak
Public Trendyol category evidence on 2026-08-25 shows two Mutkin 24-roll offers far down category pages: a `24’lü Yedek Rulo + Sap` offer at **600 TL** with 5.0/2 reviews, and a `24’lü + Sap + Saç Açıcı Tarak` offer at **500 TL** with 5.0/2 reviews. By contrast, the category front page contains a Dory `24’lü + aparat` offer at about **323.96 TL** with 4.6/223 reviews; current first-page leaders also include 12-roll entry offers such as Proff around **199.90 TL** with ~972 ratings and Sista around **199.90 TL** with ~1292 ratings, while SMARTER can sustain a higher 12-roll price because it has very large accumulated review/social-proof volume.
Interpretation: the plain 600 TL Mutkin offer is structurally weak against current category reference points, and the 500 TL + comb offer is materially more defensible only if the extra value is made obvious in the hero/title. Do not assume traffic or SEO can repair an offer gap of this magnitude.
Action: test an offer ladder rather than blindly discounting everything: create/feature a lower-ticket 12-roll + handle entry SKU if current stock/packing supports it, and separately keep a 24-roll value pack. Exact test price must be derived from live contribution margin/fees/shipping, not guessed. If the 24-roll unit economics can support a materially more competitive price while preserving target contribution profit, test that; otherwise use the 12-roll entry SKU to lower purchase friction. Judge on conversion + contribution profit/order + total contribution profit, not unit sales alone.

### P1 — flower-material kit specification friction
Public `Yapay Çiçek Malzeme Seti` title names the components but omits quantities that shoppers then ask in Q&A. Seller answer confirms 30 m tape and 10 flower wires. Action: surface verified component quantities prominently in title/first image/description so buyers do not need Q&A to understand the bundle.

A second existing Mutkin flower-making set is already stronger: public category text exposes `Çiçek Tohumu/Ercik + 30 m Yeşil Floral Tape + 30 m Kahverengi Floral Tape + 10 Adet 30 cm Çiçek Teli`, currently around 210 TL with 5.0/20 ratings. Preserve that clear quantity-first structure; it is a better pattern than vague component-only naming.

### P1 — chenille listing copy cleanup
Public silver glitter chenille listing is competitively positioned and has 5.0/2 reviews, but title/copy is noisy (`RENK KOD`, emoji, awkward phrasing) versus cleaner category leaders. Action: prioritize clearer search-language ordering (`100 Adet`, `Gümüş Simli Şönil Tel`, `30 cm`, `Çiçek Yapımı / DIY Hobi`) while preserving verified facts only.

Current public category evidence also shows Mutkin/KARAASLAN single-color 100-count chenille SKUs appearing on later pages around roughly 240–289 TL, while first-page demand is concentrated in thematic 100-count color mixes and complete flower-making kits. Action: create a small number of curated color-theme bundles from **live in-stock** existing colors rather than adding new inventory. Candidate themes should follow demonstrated demand (e.g. pastel/pink, blue palette, sunflower/earth palette), but exact colors must be verified against live stock before listing. Treat bundles as search-entry/merchandising experiments; do not create dozens of low-evidence variants.

### P1 — lint roller title/merchandising structure
For any verified 24 x 60-sheet offer, title/hero should make total value immediately legible: 24 rolls, handle, 60 sheets per roll / 1440 sheets total, intended surfaces/pet-hair use, plus any included comb only when actually packed. The 500 TL + comb SKU should visually communicate the comb as part of the bundle so it is not compared as if it were identical to cheaper roll-only sets.

### Current platform capability boundary
No installed direct Trendyol ChatGPT connector/plugin was found on 2026-08-25. Official Trendyol Marketplace API is nevertheless a viable capability-acquisition path: it supports product transfer/update, stock and price updates, order operations, invoice submission and customer-question workflows once seller credentials are securely connected. Product V2 is the current migration path; Trendyol documentation shows product titles are limited to **100 characters**. Credentials/API secrets must not be stored in this repository or pasted into public surfaces.

### Measurement / closed-loop gate
Before paid-traffic scaling, obtain Seller Panel last-30-day metrics for at least the top products: impressions, product-page clicks/CTR, add-to-cart, orders/conversion, revenue, ad spend if any, and contribution margin. Use the funnel to distinguish discovery (impressions), click-through (hero/title/price), conversion (trust/specification/reviews), and economics (margin) problems. Do not treat higher traffic alone as success.

For pricing/offer tests, compare variants over a sufficient number of visits/orders and optimize **total contribution profit**, with conversion rate and contribution profit/order as diagnostic sensors. A lower price that raises units but lowers total contribution profit is not a win.

## Routing
- Live order/stock/price/listing state -> current marketplace/platform evidence.
- Browser print/order automation -> `projects/trendyol-print-automation.md`.
- Stable personal e-commerce background -> `PERSON.md` only at the durable level.
- If a current product/listing thread becomes substantial, either keep a small dated project residue here or create a dedicated project owner; do not store mutable catalog state in memory.
