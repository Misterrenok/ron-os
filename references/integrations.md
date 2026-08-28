# Ron OS — integration contracts and verified quirks

Purpose: stable routing/connector notes only. This file does not own mutable user/app state and must not duplicate domain policy.

## Domain-package relation
`references/domain-routing.md` decides which skills, owners and live surfaces are needed for a request. Plugins/MCP/browser integrations are live owners or executors only for the claim classes listed below; they are not general memory and do not replace domain rationale/current fallback.

## Ownership model
- **TickTick** owns tasks/reminders and exact task fields.
- **Google Calendar** owns events/availability and exact event timing.
- **Cronometer** owns live nutrition diary/log/target state. Planned/prefilled rows are app state, not proof of real-world ingestion.
- **Cronometer MCP code** is owned by live GitHub repo `Misterrenok/cronometer-api-mcp`. Repository code/commits/tests must not be conflated with deployed/live service behavior; verify deployment/live path separately when consequential.
- **Liftosaur** owns exact mutable training app state when accessible; `domains/training.md` is only the documented dated fallback.
- **Neon Ron OS DB** owns its own database records but is a derived integration/analytics layer; those records cannot override upstream domain/live owners.
- **XMind goal map** owns the exact structure/content of the map artifact when live access is available. Measurements, policies and current facts copied into that map are downstream projections of their upstream owners and cannot override them. Historical main map identifier: `SzWCLc5N`. If live XMind is unavailable, exact current map contents are `UNVERIFIED`; do not reconstruct them from archived counts/snapshots.
- **GitHub repositories** own repository/code state; `Misterrenok/ron-os` owns Ron OS runtime/canonical files.
- **Scheduled automations** own their schedules/prompts as executable projections. Ron OS-related automations must bootstrap from GitHub `BOOTSTRAP.md`, not retired Library artifacts.

## TickTick connector quirks
- Ron's canonical timezone is `Europe/Istanbul`. TickTick profile/server preference may return `Asia/Ashgabat`; this is not authoritative for Ron and is not by itself evidence that a concrete task is wrong.
- For consequential dated-task writes, pre-read the exact task, preserve its intended instant/recurrence, pass explicit `Europe/Istanbul`, and read back the concrete task after writing. Historical connector testing found that some update paths can fall back to `Asia/Ashgabat` when timing fields are only partially supplied; when changing timing, send the coherent timing tuple rather than a partial time mutation.
- Concurrent chats can overwrite the same task. Re-read immediately before a consequential update and verify after it.
- Avoid resending a checklist `items` array unless intentionally replacing it; connector behavior can regenerate item IDs.
- After destructive operations, verify the exact task/project state rather than trusting the mutation response alone.

## Projection rule
An operational/analytical surface may contain a useful copy of owner data, but it must be marked/routed as a projection where confusion is plausible. If owner and projection conflict: owner wins -> repair owner only if authorized -> update/read back projection if it still has value, otherwise retire the projection.
