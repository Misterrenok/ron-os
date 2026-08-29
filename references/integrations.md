# Ron OS — integration contracts and verified quirks

Purpose: stable routing/connector notes only. This file does not own mutable user/app state and must not duplicate domain policy.

## Domain-package relation
`references/domain-routing.md` decides which skills, owners and live surfaces are needed for a request. Plugins/MCP/browser integrations are live owners or executors only for the claim classes listed below; they are not general memory and do not replace domain rationale/current fallback.

## Global live-mutation gate
All live apps/executors are read-only unless Ron explicitly authorizes the exact intended mutation. A request to read, audit, build or organize; apparent clutter/staleness/non-use; and permission to write Ron OS owners do not authorize moving, archiving, updating, creating or deleting live objects.

BUILDING projections may intentionally exist before execution starts. Their non-use is not execution evidence and never creates cleanup authority.

## Ownership model
- **TickTick** owns tasks/reminders and exact task fields.
- **Google Calendar** owns events/availability and exact event timing.
- **Cronometer** owns live nutrition diary/log/target state. Planned/prefilled rows are app state, not proof of real-world ingestion.
- **Cronometer MCP code** is owned by live GitHub repo `Misterrenok/cronometer-api-mcp`. Repository code/commits/tests must not be conflated with deployed/live service behavior; verify deployment/live path separately when consequential.
- **Liftosaur** owns exact mutable training app state when accessible; `domains/training.md` is only the documented dated fallback.
- **Neon Ron OS DB** owns its own database records but is a derived integration/analytics layer; those records cannot override upstream domain/live owners.
- **XMind goal map** owns the exact structure/content of the map artifact when live access is available. Measurements, policies and current facts copied into that map are downstream projections of their upstream owners and cannot override them. Historical main map identifier: `SzWCLc5N`. If live XMind is unavailable, exact current map contents are `UNVERIFIED`; do not reconstruct them from archived counts/snapshots.
- **XMind is read-only by default.** Any XMind mutation requires Ron's separate explicit permission for the exact intended map change; authorization to work in a related domain does not transfer to XMind.
- **GitHub repositories** own repository/code state; `Misterrenok/ron-os` owns Ron OS runtime/canonical files.
- **Scheduled automations** own their schedules/prompts as executable projections. Ron OS-related automations must bootstrap from GitHub `BOOTSTRAP.md`, not retired Library artifacts.

## Cronometer connector quirks
- Windowed `get_biometrics` is a time-series view, not an event log. Cronometer may carry the last pre-range value forward and stamp it at the requested `start_date`; therefore a first point equal to the boundary is not proof of a measurement on that date.
- For exact biometric entry dates, use raw `get_biometrics_export`. The live wrapper exposes `interpretation.first_point_may_be_range_seed` and `exact_entry_dates_source` as a warning, but the export remains the exact-date source.
- Verified 2026-08-28 against weight data: window starts 2026-04-01/05-01/06-01/07-01 all surfaced 64 kg at the chosen boundary, while raw export showed the real entry on 2026-03-29. This dated observation documents connector semantics; it does not own current bodyweight.

## TickTick connector quirks
- Ron's canonical timezone is `Europe/Istanbul`. TickTick profile/server preference may return `Asia/Ashgabat`; this is not authoritative for Ron and is not by itself evidence that a concrete task is wrong.
- Ron has repeatedly confirmed that the `Asia/Ashgabat` profile value cannot be changed because no such setting is exposed. Do not ask him to change it again; ignore the profile metadata and preserve/pass explicit `Europe/Istanbul` on consequential task timing. Existing default task creation has produced Istanbul-timed tasks.
- For consequential dated-task writes, pre-read the exact task, preserve its intended instant/recurrence, pass explicit `Europe/Istanbul`, and read back the concrete task after writing. Historical connector testing found that some update paths can fall back to `Asia/Ashgabat` when timing fields are only partially supplied; when changing timing, send the coherent timing tuple rather than a partial time mutation.
- Concurrent chats can overwrite the same task. Re-read immediately before a consequential update and verify after it.
- Avoid resending a checklist `items` array unless intentionally replacing it; connector behavior can regenerate item IDs.
- After destructive operations, verify the exact task/project state rather than trusting the mutation response alone.

## Projection rule
An operational/analytical surface may contain a useful copy of owner data, but it must be marked/routed as a projection where confusion is plausible. If owner and projection conflict: owner wins -> repair owner only if authorized -> update/read back projection if it still has value, otherwise retire the projection.
