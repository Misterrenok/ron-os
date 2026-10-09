# Skill — e-commerce

Scope: marketplace operations, listings, SEO, product content, ads and marketplace automation projects.

- Read `domains/ecommerce.md`; for an exact active project also read the routed `projects/*.md` owner.
- Live marketplace/browser/repository/runtime owns mutable orders, stock, price, listing state and deployed-code behavior.
- For product/listing work preserve locked product identity/spec/count/color/size; proposed substitutions must be explicit.
- For automation, continue through safe implementation and runtime/read-back verification when tooling allows; do not claim success from code text alone.
- For marketplace/API integrations, define the required operation set first (for example read + write/update). If official credentials/configuration already exist, run the smallest authorized direct official capability probe before adding a third-party integrator; reject an intermediary as soon as it cannot perform a required operation.
- Add finance/schedule and image/document skills when they materially affect the outcome.

This skill owns procedure only, never mutable marketplace/project state.
