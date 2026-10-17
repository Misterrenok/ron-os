"""Run with the installed Hermes interpreter; exercise its real shutdown mixin."""
import asyncio
import importlib.util
import json
import os
from pathlib import Path
import sys
import types
import unittest

from gateway.run_shutdown import GatewayShutdownMixin

spec = importlib.util.spec_from_file_location("restart_plugin", Path(__file__).with_name("__init__.py"))
plugin = importlib.util.module_from_spec(spec)
spec.loader.exec_module(plugin)


class Runner:
    request_restart = GatewayShutdownMixin.request_restart

    def __init__(self, loop):
        self._gateway_loop = loop
        self._restart_task_started = False
        self._restart_requested = False
        self._draining = False
        self._restart_after_turn_timeout = 60
        self.reply_sent = asyncio.Event()
        self.stopped = False

    def _mark_api_runs_shutdown_requested(self):
        pass

    async def _await_active_work_before_restart(self):
        await self.reply_sent.wait()

    async def stop(self, **kwargs):
        assert self.reply_sent.is_set()
        assert kwargs == {"restart": True, "detached_restart": False, "service_restart": True}
        self.stopped = True


class RestartTest(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.old_module = sys.modules.get("gateway.run")
        self.old_supervised = os.environ.get("HERMES_SUPERVISED_CHILD")
        os.environ["HERMES_SUPERVISED_CHILD"] = "1"
        self.runner = Runner(asyncio.get_running_loop())
        sys.modules["gateway.run"] = types.SimpleNamespace(_gateway_runner_ref=lambda: self.runner)

    async def asyncTearDown(self):
        if self.old_module is None:
            sys.modules.pop("gateway.run", None)
        else:
            sys.modules["gateway.run"] = self.old_module
        if self.old_supervised is None:
            os.environ.pop("HERMES_SUPERVISED_CHILD", None)
        else:
            os.environ["HERMES_SUPERVISED_CHILD"] = self.old_supervised

    async def test_worker_thread_request_waits_for_reply_then_native_exit(self):
        self.assertTrue(plugin.available())
        result = json.loads(await asyncio.to_thread(plugin.handle, {"action": "request"}))
        self.assertTrue(result["accepted"])
        self.assertTrue(self.runner._draining)
        await asyncio.sleep(0.06)
        self.assertFalse(self.runner.stopped)
        duplicate = json.loads(plugin.handle({"action": "request"}))
        self.assertTrue(duplicate["already_requested"])
        self.runner.reply_sent.set()
        await self.runner._restart_task
        self.assertTrue(self.runner.stopped)

    async def test_disabled_after_turn_wait_refuses_restart(self):
        self.runner._restart_after_turn_timeout = 0
        result = json.loads(plugin.handle({"action": "request"}))
        self.assertFalse(result["ok"])
        self.assertFalse(self.runner._restart_requested)

    async def test_status_and_no_live_runner_do_not_restart(self):
        self.assertFalse(json.loads(plugin.handle({"action": "status"}))["restart_requested"])
        sys.modules.pop("gateway.run", None)
        self.assertFalse(plugin.available())
        self.assertFalse(json.loads(plugin.handle({"action": "request"}))["ok"])


if __name__ == "__main__":
    unittest.main()
