# Ron expert decision — UNINSTALLED candidate v0.1

This is a skills-only plugin prototype, **not** an installed feature or a verified repair.

It has no MCP server, API credentials, billable API calls, account rights, external network requests, or ability to hook/intercept every answer.

## Scope and mechanism

The tested hypothesis is **delivery/activation**: packaged skill metadata could make an expert decision procedure available automatically in an ordinary chat when relevant, whereas Ron OS instructions sitting in GitHub might not be loaded. Writing another rule does not by itself fix model competence.

## Contents

- `plugin.json`: portable plugin declaration.
- `skills/expert-decision/SKILL.md`: limited activation and counter-option, cheap-information, intention and execution checks.
- Separate evaluator-only plan: `tests/expert-skill-delivery-v0-probes.md` (not bundled as model-visible skill knowledge).

## Verified

- Local syntax, UTF-8, JSON structure, YAML-frontmatter envelope and ZIP integrity were checked.

## Not verified

- Whether the user can install a personal plugin on the current Plus plan and app.
- Whether ordinary ChatGPT automatically loads the skill on relevant requests.
- Whether it improves first-answer behavior or completes external actions.

## Test gate

Do not install or modify ordinary Custom Instructions without Ron's explicit choice. First confirm the candidate is eligible for installation in the user's interface. If unavailable, **do not build a hosted MCP server solely to test this**.

If enabled, run one or two novel held-out cases with matched model and ordinary chat controls; score first answers and verify activation if observably available. A trivial out-of-scope question must remain short. If no material improvement, disable/remove the plugin rather than expand rules.

This candidate is on a separate branch; do not merge into `main` without real behavioral evidence. Current canonical procedure: `PROTOCOL.md`, `skills/total-value-optimizer.md`. Investigation: https://github.com/Misterrenok/ron-os/issues/136

Official plugin docs: https://developers.openai.com/plugins/build/skills and https://developers.openai.com/plugins/build/plugins
