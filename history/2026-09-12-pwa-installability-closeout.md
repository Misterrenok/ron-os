# PWA installability closeout — 2026-09-12

Status: CLOSED / PROMOTED / CI PASS / NORTHFLANK BUILD SUCCESS / DIRECT HTTP READ-BACK UNVERIFIED.

- PR #17 promoted the first installability surface as `020c29ac95005158ae308409fa7363adaadfdd9f`; post-main `system-pwa-ci` run `34702233003` passed and Northflank build `awesome-insight-7274` succeeded.
- Final review found one remaining Chromium installability defect: the manifest had only a 512x512 icon while Chromium installability checks require 192x192 and 512x512 icons.
- PR #18 promoted the closure as `f674253f1753ccfe0dfe2e370d5ae66b266040cd`, adding `/system-icon-192.svg` and regression coverage for `start_url`, `scope`, `display=standalone`, and both icon sizes.
- PR `system-pwa-ci` run `34703260772` passed; post-main `system-pwa-ci` run `34703277507` passed; Northflank build `curious-stamp-3318` succeeded.
- No player state, Neon data/schema, credentials, automation definition, or external resource was changed.
- Direct public HTTP read-back could not be completed from the controller environment because the canonical `code.run` hostname failed DNS resolution there. A real Android install is the remaining acceptance observation, not an open engineering implementation item.
