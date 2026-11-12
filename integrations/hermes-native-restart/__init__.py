"""An agent-facing entry to the same restart path used by native /restart.

No shell, signals, detached processes, dashboard, or changes to core guards.
"""

import asyncio
import concurrent.futures
import contextvars
import json
import os
import sys


def _runner():
    # Do not import gateway.run in a standalone CLI: only the live process owns it.
    ref = getattr(sys.modules.get("gateway.run"), "_gateway_runner_ref", None)
    return ref() if callable(ref) else None


def available():
    runner = _runner()
    loop = getattr(runner, "_gateway_loop", None)
    return bool(runner and loop and loop.is_running())


def _on_gateway_loop(runner, action):
    result = {
        "pid": os.getpid(),
        "restart_requested": bool(getattr(runner, "_restart_requested", False)),
        "draining": bool(getattr(runner, "_draining", False)),
    }
    if action == "status":
        return {"ok": True, **result}
    from gateway.restart import is_supervised_gateway_launch

    if not is_supervised_gateway_launch():
        return {"ok": False, "error": "No external supervisor; restart was not requested."}
    if result["restart_requested"]:
        return {"ok": True, "accepted": False, "already_requested": True, **result}
    if float(getattr(runner, "_restart_after_turn_timeout", 0) or 0) <= 0:
        return {"ok": False, "error": "After-turn wait is disabled; restart was not requested."}
    accepted = runner.request_restart(detached=False, via_service=True)
    return {
        "ok": bool(accepted),
        "accepted": bool(accepted),
        "pid": os.getpid(),
        "restart_requested": bool(getattr(runner, "_restart_requested", False)),
        "note": "Request accepted, not completed. Finish your response now; the native gateway waits for active work, exits, then systemd relaunches it. A changed PID and restored Telegram must be verified afterward.",
    }


def handle(args, **_kwargs):
    action = args.get("action", "status")
    if action not in {"request", "status"}:
        return json.dumps({"ok": False, "error": "Expected action=request or status."})
    runner = _runner()
    loop = getattr(runner, "_gateway_loop", None)
    if not runner or not loop or not loop.is_running():
        return json.dumps({"ok": False, "error": "This tool must run inside the live gateway."})
    try:
        current_loop = asyncio.get_running_loop()
    except RuntimeError:
        current_loop = None
    if current_loop is loop:
        return json.dumps(_on_gateway_loop(runner, action))
    result = concurrent.futures.Future()

    def apply():
        # If dispatch timed out before starting, do not initiate a late restart.
        if not result.set_running_or_notify_cancel():
            return
        try:
            result.set_result(_on_gateway_loop(runner, action))
        except Exception as exc:
            result.set_exception(exc)

    try:
        loop.call_soon_threadsafe(apply, context=contextvars.Context())
        return json.dumps(result.result(timeout=5))
    except concurrent.futures.TimeoutError:
        result.cancel()
        return json.dumps({"ok": False, "error": "Gateway did not acknowledge dispatch; check status before retrying."})
    except Exception as exc:
        return json.dumps({"ok": False, "error": type(exc).__name__})


def register(ctx):
    ctx.register_tool(
        name="gateway_restart",
        toolset="gateway_restart",
        schema={
            "name": "gateway_restart",
            "description": "Штатный перезапуск собственного Hermes gateway через systemd. action=request ставит запрос, ждёт завершения активной работы и не требует dashboard. После accepted=true немедленно заверши текущий ответ; не жди завершения перезапуска в этом же ходе и не вызывай systemctl/terminal. action=status только читает состояние. Принятие запроса не означает успешного перезапуска.",
            "parameters": {
                "type": "object",
                "properties": {"action": {"type": "string", "enum": ["request", "status"]}},
                "required": ["action"],
                "additionalProperties": False,
            },
        },
        handler=handle,
        check_fn=available,
    )
