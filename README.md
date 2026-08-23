# ron-os

Canonical, versioned continuity/current-state store for Ron's ChatGPT workflows.

## Runtime architecture

`native durable memory pointer -> BOOTSTRAP.md -> CURRENT.md -> exact domain owner -> live owner`

Use Ron OS only when a request materially depends on Ron's current personal/project/app state, prior decisions, or continuation of past work. Self-contained/general questions should remain direct.

Native ChatGPT memory is allowed to store only the durable pointer to this repository/bootstrap. It must not store mutable Ron OS state.

`BOOTSTRAP.md` is the runtime entry. `CURRENT.md` is the thin cross-domain routing/checkpoint index. Domain files own their fallback/current policy state; live applications own their exact mutable state.

ChatGPT Library and old chats are legacy/history evidence only and are not runtime sources of truth. Custom Instructions are not required for the accepted architecture.
