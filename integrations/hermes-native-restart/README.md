# Hermes native gateway restart

An agent tool for a **systemd-supervised Linux gateway**. `gateway_restart(action="request")` calls the existing `GatewayRunner.request_restart(detached=False, via_service=True)` on the gateway's own event loop. It uses the native after-turn wait and shutdown path; systemd performs the relaunch. It does not invoke shell lifecycle commands, alter terminal guards, use the dashboard, or grant cloud permissions.

Install this directory as `~/.hermes/plugins/ron_gateway_restart/`, then enable it with `hermes plugins enable ron_gateway_restart`. Existing cached toolsets refresh on the next session or gateway restart. The tool is available only inside the live gateway. After acceptance the agent must finish its answer instead of polling in the same turn: the native restart is waiting for active work to finish.

`action="status"` reads the current PID and restart flags. Acceptance is not completion; verify a changed PID and platform reconnection independently. The tool refuses to request a restart when no supervisor is present or the configured native after-turn wait is disabled. It does not change the native drain timeout or recover a completely wedged/dead process; those remain systemd/operator responsibilities.

Run `test_native_restart.py` with the installed Hermes runtime. The tests exercise the real shutdown mixin with a controlled active-turn barrier, including worker-thread dispatch, duplicate requests, and unavailable/disabled contexts.

Implementation compatibility: uses the same live runner weak reference and `_gateway_loop` that bundled messaging/cron tools use. These are upstream internals, so revalidate after major Hermes updates. No core files are patched.
