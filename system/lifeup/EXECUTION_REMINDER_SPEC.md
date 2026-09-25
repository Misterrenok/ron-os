# Execution Reminder v1

Policy ref: `system-execution-reminder:v1`

## Purpose

Quest reminders belong to Ron System/PWA. ChatGPT task automations are not the execution surface for ordinary System quest reminders.

## Contract

- A future reminder is persisted in the canonical System event ledger as `reminder.scheduled`.
- Every schedule is bound to one existing active Quest v2 and an absolute `remind_at`.
- The server reminder engine checks schedules independently of whether the PWA is open.
- At/after `remind_at`, the engine emits exactly one idempotent `notification.pushed` only if the bound quest is still ACTIVE.
- The existing web-push delivery pipeline then sends that System notification to subscribed PWA devices.
- If the quest is already COMPLETED/CANCELLED/FAILED/EXPIRED, the scheduled reminder produces no notification.
- A reminder never creates a deadline, expires a quest, changes XP/Coins/reward, or acts as a punishment.
- Multiple reminders may be scheduled for a quest when there is a concrete execution reason; frequency is a Ron-specific execution choice, not a scientifically optimal dose.
- Push transport success must be verified from `system_push_deliveries`; configured VAPID keys or an existing subscription alone are not proof that a push reached the transport.
- Delivery failures must preserve status-code/body diagnostics when the push provider exposes them, so stale subscriptions and server/VAPID failures are distinguishable.

## Current use

For the active German Bebris quest, reminders should be sparse high-signal execution cues tied to realistic availability, with a direct start instruction. No external ChatGPT reminder automation should duplicate them.
