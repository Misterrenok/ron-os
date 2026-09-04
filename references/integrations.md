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
- **Liftosaur** owns exact mutable training app state when accessible. When live read is subscription-gated, `domains/training.md` owns the current fallback and the newest Ron-supplied export is its exact dated evidence.
- Until subscription/live read returns, Ron edits Liftosaur manually. Each new export is hashed, stripped of account identifiers without dropping training data, diffed against the previous dated snapshot and promoted through `domains/training.md`. An export never proves post-export state, and no Liftosaur mutation is authorized without exact permission.
- **Neon Ron OS DB** owns its own database records but is a derived integration/analytics layer; those records cannot override upstream domain/live owners.
- **XMind goal map** owns the exact current structure/content of the map artifact when live access is available. Measurements, policies and current facts copied into that map are downstream projections of their upstream owners and cannot override them. Historical main map identifier: `SzWCLc5N`.
- **XMind change history is separate from XMind current-state authority.** Dated normalized snapshots under `snapshots/xmind/` are append-only evidence used only to compare prior and current live reads. They never become a second current owner. Without a complete same-scope prior snapshot, a live read can establish current state but cannot establish whether a field changed.
- If live XMind is unavailable, exact current map contents are `UNVERIFIED`; do not reconstruct them from archived counts/snapshots. Snapshot evidence may still answer historical/provenance questions with its own `AS_OF` boundary.
- **XMind is read-only by default.** Any XMind mutation requires Ron's separate explicit permission for the exact intended map change; authorization to work in a related domain does not transfer to XMind. Structural writes additionally require pre-write snapshot evidence and post-write affected-scope reread/diff before success is claimed.
- **GitHub repositories** own repository/code state; `Misterrenok/ron-os` owns Ron OS runtime/canonical files.
- **Scheduled automations** own their schedules/prompts as executable projections. Ron OS-related automations must bootstrap from GitHub `BOOTSTRAP.md`, not retired Library artifacts.

## Cronometer connector quirks
- Windowed `get_biometrics` is a time-series view, not an event log. Cronometer may carry the last pre-range value forward and stamp it at the requested `start_date`; therefore a first point equal to the boundary is not proof of a measurement on that date.
- For exact biometric entry dates, use raw `get_biometrics_export`. The live wrapper exposes `interpretation.first_point_may_be_range_seed` and `exact_entry_dates_source` as a warning, but the export remains the exact-date source.
- Verified 2026-08-28 against weight data: window starts 2026-04-01/05-01/06-01/07-01 all surfaced 64 kg at the chosen boundary, while raw export showed the real entry on 2026-03-29. This dated observation documents connector semantics; it does not own current bodyweight.

## Cronometer MCP deployment evidence
- **2026-09-05 Europe/Istanbul:** after Railway Trial expiry paused deployments, Ron migrated the `Misterrenok/cronometer-api-mcp` remote service to a Northflank free Sandbox combined Git/Docker deployment. Northflank reported the service `Running 1/1`; `/healthz` returned `{"status":"ok"}`; Ron then replaced the ChatGPT Cronometer app endpoint with the new Northflank `/mcp` URL and directly confirmed from a new chat that the connector works.
- Ron explicitly accepted running this Cronometer MCP without adding a separate authentication layer and does not want protection work treated as a blocker for this diary integration unless he later reopens that decision.
- Treat this as dated deployment evidence, not a permanent mutable-state owner. For consequential use, verify the live ChatGPT app/MCP path rather than assuming the 2026-09-05 host is still current. The old Railway deployment should not be treated as the active path unless live evidence shows it was restored.

## Marketfiyati MCP deployment evidence
- **2026-09-05 Europe/Istanbul:** Ron created a Northflank service from `Misterrenok/marketfiyati_mcp`, but reported that it did not work and explicitly decided the integration is not needed. The migration is **ABANDONED / NOT REQUIRED**; do not treat Marketfiyati MCP as an active dependency or continuation item unless Ron later reopens it.

## TickTick connector quirks
- Ron's canonical timezone is `Europe/Istanbul`. TickTick profile/server preference may return `Asia/Ashgabat`; this is not authoritative for Ron and is not by itself evidence that a concrete task is wrong.
- Ron has repeatedly confirmed that the `Asia/Ashgabat` profile value cannot be changed because no such setting is exposed. Do not ask him to change it again; ignore the profile metadata and preserve/pass explicit `Europe/Istanbul` on consequential task timing. Existing default task creation has produced Istanbul-timed tasks.
- For consequential dated-task writes, pre-read the exact task, preserve its intended instant/recurrence, pass explicit `Europe/Istanbul`, and read back the concrete task after writing. Historical connector testing found that some update paths can fall back to `Asia/Ashgabat` when timing fields are only partially supplied; when changing timing, send the coherent timing tuple rather than a partial time mutation.
- Concurrent chats can overwrite the same task. Re-read immediately before a consequential update and verify after it.
- Avoid resending a checklist `items` array unless intentionally replacing it; connector behavior can regenerate item IDs.
- After destructive operations, verify the exact task/project state rather than trusting the mutation response alone.

## Projection rule
An operational/analytical surface may contain a useful copy of owner data, but it must be marked/routed as a projection where confusion is plausible. If owner and projection conflict: owner wins -> repair owner only if authorized -> update/read back projection if it still has value, otherwise retire the projection.