import asyncio
import unittest
from unittest.mock import AsyncMock
from audio_core import Segmenter


class Vad:
    def is_speech(self, frame, rate):
        return frame[0] != 0


class SegmentTests(unittest.TestCase):
    def test_fragmented_pcm_and_hangover(self):
        s=Segmenter(Vad(), start_frames=3, end_frames=2)
        n=s.frame_bytes
        data=b'\0'*n+b'\1'*(n*4)+b'\0'*(n*2)
        events=[]
        for i in range(0,len(data),79):events.extend(s.push(data[i:i+79]))
        self.assertEqual([x[0] for x in events],['start','utterance'])
        self.assertEqual(events[1][1],data)

    def test_noise_does_not_interrupt(self):
        s=Segmenter(Vad());n=s.frame_bytes
        self.assertEqual(list(s.push(b'\1'*n+b'\0'*n+b'\1'*n+b'\0'*n)),[])

    def test_long_speech_is_bounded(self):
        s=Segmenter(Vad(), max_frames=6)
        es=list(s.push(b'\1'*(s.frame_bytes*30)))
        self.assertTrue(any(k=='utterance' for k,v in es))
        self.assertLessEqual(len(s.active or []),6)


class LifecycleTests(unittest.IsolatedAsyncioTestCase):
    def make(self):
        from voice_bridge import Bridge
        b=Bridge.__new__(Bridge)
        b.peer=123;b.generation=1;b.connected=True;b.lock=asyncio.Lock()
        b.history=[];b.call_tag='test';b.metrics={};b.receiver=None;b.timer=None
        b.calls=type('Calls',(),{'leave_call':AsyncMock()})()
        b.write_status=lambda:None
        return b

    async def test_constructor_uses_active_loop_and_rejects_empty_allowlist(self):
        from voice_bridge import Bridge
        cfg={'allowed_peers':[123],'session':'','api_id':1,'api_hash':'0'*32}
        b=Bridge(cfg,None)
        self.assertIs(b.calls.loop,asyncio.get_running_loop())
        cfg['allowed_peers']=[]
        with self.assertRaises(ValueError):Bridge(cfg,None)

    async def test_unknown_peer_cannot_be_dialed(self):
        b=self.make();b.allowed={123}
        with self.assertRaises(PermissionError):await b.connect(456)

    async def test_hangup_cancels_answer_and_is_idempotent(self):
        b=self.make();cancelled=asyncio.Event()
        async def answer():
            try: await asyncio.Future()
            finally:cancelled.set()
        b.turn=asyncio.create_task(answer());await asyncio.sleep(0)
        await b.finish('test',1)
        self.assertTrue(cancelled.is_set());self.assertIsNone(b.peer)
        await b.finish('again',1)
        b.calls.leave_call.assert_awaited_once_with(123)

    async def test_stale_call_cannot_hangup_new_call(self):
        b=self.make();b.turn=None
        await b.finish('stale',0)
        self.assertEqual(b.peer,123);b.calls.leave_call.assert_not_awaited()

    async def test_tts_failure_uses_local_fallback(self):
        b=self.make();b.cfg={'tts_backend':'edge'};b.tts=object()
        b.speak_edge=AsyncMock(side_effect=RuntimeError('no audio'))
        b.speak_local=AsyncMock()
        await b.speak('hello',1)
        b.speak_local.assert_awaited_once_with('hello',1)

    async def test_tts_cancellation_never_restarts_fallback(self):
        b=self.make();b.cfg={'tts_backend':'edge'};b.tts=object()
        b.speak_edge=AsyncMock(side_effect=asyncio.CancelledError)
        b.speak_local=AsyncMock()
        with self.assertRaises(asyncio.CancelledError):await b.speak('hello',1)
        b.speak_local.assert_not_awaited()

    async def test_timeout_releases_call(self):
        b=self.make();b.turn=None;b.cfg={'max_call_seconds':.01}
        await b.limit(1)
        self.assertIsNone(b.peer);b.calls.leave_call.assert_awaited_once()

    async def test_barge_in_cancels_inflight_answer(self):
        b=self.make();b.queue=asyncio.Queue();b.metrics={'interruptions':0}
        b.segmenter=type('Segments',(),{'push':lambda _,x:[('start',None)]})()
        b.turn=asyncio.create_task(asyncio.sleep(100))
        await b.queue.put(b'audio')
        t=asyncio.create_task(b.receive(1));await asyncio.sleep(.02)
        self.assertTrue(b.turn.cancelled());self.assertEqual(b.metrics['interruptions'],1)
        t.cancel();await asyncio.gather(t,return_exceptions=True)


if __name__=='__main__':unittest.main()


class WorkerTests(unittest.IsolatedAsyncioTestCase):
    def worker(self):
        import sys
        from agent_worker import AgentWorker
        code="import sys,json,time\njson.loads(sys.stdin.readline())\nprint(json.dumps({'ready':True}),flush=True)\nfor line in sys.stdin:\n p=json.loads(line)\n if p['text']=='slow':time.sleep(30)\n print(json.dumps({'answer':p['text']}),flush=True)\n"
        return AgentWorker([sys.executable,'-u','-c',code],123,timeout=2)

    async def test_process_is_reused_between_turns(self):
        w=self.worker()
        try:
            self.assertEqual(await w.ask({'text':'first'}),'first')
            pid=w.proc.pid
            self.assertEqual(await w.ask({'text':'second'}),'second')
            self.assertEqual(w.proc.pid,pid)
        finally:await w.close()

    async def test_cancel_reaps_worker_and_next_turn_recovers(self):
        w=self.worker()
        try:
            await w.start();old=w.proc
            task=asyncio.create_task(w.ask({'text':'slow'}))
            await asyncio.sleep(.03);task.cancel()
            await asyncio.gather(task,return_exceptions=True)
            self.assertIsNone(w.proc);self.assertIsNotNone(old.returncode)
            self.assertEqual(await w.ask({'text':'next'}),'next')
        finally:await w.close()
