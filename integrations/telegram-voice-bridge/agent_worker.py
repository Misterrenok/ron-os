"""A warm native Hermes process, serialized JSON-lines IPC and bounded teardown."""
import asyncio
import contextlib
import json
import os
import signal
import uuid


class AgentWorker:
    def __init__(self, command, user_id, timeout=35):
        self.command, self.user_id, self.timeout = command, str(user_id), timeout
        self.proc = None
        self.lock = asyncio.Lock()

    async def close(self):
        proc, self.proc = self.proc, None
        if proc is not None and proc.returncode is None:
            with contextlib.suppress(ProcessLookupError):os.killpg(proc.pid,signal.SIGTERM)
            try:await asyncio.wait_for(proc.wait(),2)
            except asyncio.TimeoutError:
                with contextlib.suppress(ProcessLookupError):os.killpg(proc.pid,signal.SIGKILL)
                await proc.wait()

    async def start(self):
        if self.proc is not None and self.proc.returncode is None:return
        try:
            self.proc = await asyncio.create_subprocess_exec(*self.command,'--server',
                stdin=asyncio.subprocess.PIPE,stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,start_new_session=True)
            self.proc.stdin.write(json.dumps({'call_tag':'worker-'+uuid.uuid4().hex[:12],
                'user_id':self.user_id}).encode()+b'\n')
            await self.proc.stdin.drain()
            ready=json.loads(await asyncio.wait_for(self.proc.stdout.readline(),90))
            if ready.get('ready') is not True:raise RuntimeError('agent_not_ready')
        except BaseException:
            await self.close()
            raise

    async def ask(self, payload):
        async with self.lock:
            try:
                await self.start()
                self.proc.stdin.write(json.dumps(payload,ensure_ascii=False).encode()+b'\n')
                await self.proc.stdin.drain()
                raw=await asyncio.wait_for(self.proc.stdout.readline(),self.timeout)
                result=json.loads(raw)
                answer=result.get('answer')
                if not isinstance(answer,str) or not answer.strip():raise RuntimeError('agent_failed')
                return answer.strip()
            except BaseException:
                # Inference cancellation owns this process; never return a stale answer.
                await self.close()
                raise
