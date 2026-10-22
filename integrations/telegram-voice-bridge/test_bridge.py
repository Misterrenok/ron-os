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
