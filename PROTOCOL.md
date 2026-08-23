# Ron OS — compact protocol

## Scope
Ron OS is continuity/current-state infrastructure, not a mandatory reasoning wrapper.

## Authority
- Current user correction in the active turn wins for the fact it corrects.
- Exact domain/live owner wins for mutable state.
- `CURRENT.md` is a thin routing/checkpoint index, not a substitute for live owners.
- `PERSON.md` owns durable background/preferences only.
- Memory, chat history, ChatGPT Library, exports, and archives are evidence only for mutable/project state.

## Retrieval
For a request that depends on current Ron state: `BOOTSTRAP.md` -> `CURRENT.md` -> exact domain owner -> live owner if mutable.
Do not choose the first semantic search hit as truth.

## Execution vs plan
A scheduled, prefilled, planned, projected, or app-entered item does not prove real-world execution. Ron's explicit execution report is authoritative for real-world execution unless a stronger execution record exists.

## Writes
Before a consequential persistent write, identify the real owner and likely downstream effects. Write only to the owner, then read back. Do not synchronize the same volatile state into multiple stores.

## Failure handling
If an owner/tool is unavailable, use an explicitly documented last-confirmed fallback only within its freshness boundary. Otherwise state `UNVERIFIED/UNKNOWN`; never silently fill gaps with memory.

## Capture
After substantial work, update only the proper owner. Update `CURRENT.md` only for cross-domain state/residue needed by a future continuation. Historical incident detail belongs in Git history/archive, not current runtime files.

## User-facing behavior
Do all safely executable assistant-owned work before asking Ron. Ask for only the irreducible user-only action. Keep technical plumbing out of normal replies unless requested or necessary.
