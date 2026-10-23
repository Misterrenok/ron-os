import asyncio
import unittest
from unittest.mock import AsyncMock
from audio_core import Segmenter


class Vad:
    def is_speech(self, frame, rate):
        return frame[0] != 0


class TranscriptTests(unittest.TestCase):
    def test_noise_fragments_and_backchannels_while_replying(self):
        from audio_core import accept_transcript
        for text in ['', 'А', 'Нуу', 'Угу', 'Да', 'Прив', 'Продолжение следует']:
            self.assertFalse(accept_transcript(text,True),text)

    def test_full_questions_and_stop_commands_can_interrupt(self):
        from audio_core import accept_transcript
        for text in ['Как дела?', 'Ты тут?', 'Стоп', 'Почему?', 'Нет, стоп.']:
            self.assertTrue(accept_transcript(text,True),text)

    def test_single_word_answers_work_when_idle(self):
        from audio_core import accept_transcript
        for text in ['Да', 'Нет', 'Привет', '4']:
            self.assertTrue(accept_transcript(text,False),text)


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

    def test_short_burst_is_captured_without_interrupting_playback(self):
        s=Segmenter(Vad());n=s.frame_bytes
        es=list(s.push(b'\1'*(n*6)+b'\0'*(n*18)))
        self.assertEqual([k for k,v in es],['start','utterance'])

    def test_sustained_speech_confirms_one_interrupt_and_keeps_first_samples(self):
        s=Segmenter(Vad());n=s.frame_bytes
        audio=b'\1'*(n*12)+b'\0'*(n*18)
        es=list(s.push(audio))
        self.assertEqual([k for k,v in es],['start','interrupt','utterance'])
        self.assertEqual(es[-1][1],audio)



class LifecycleTests(unittest.IsolatedAsyncioTestCase):
    def make(self):
        from voice_bridge import Bridge
        b=Bridge.__new__(Bridge)
        b.peer=123;b.generation=1;b.connected=True;b.lock=asyncio.Lock()
        b.speech=None;b.audible=False;b.utterance_queue=asyncio.Queue(maxsize=2)
        b.cfg={};b.text_queue=asyncio.Queue(maxsize=2);b.processing=False;b.transcriber=None
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

    async def test_local_primary_failure_falls_back_to_edge(self):
        b=self.make();b.cfg={'tts_backend':'silero'};b.tts=object()
        b.speak_local=AsyncMock(side_effect=RuntimeError('failed'))
        b.speak_edge=AsyncMock()
        await b.speak('hello',1)
        b.speak_edge.assert_awaited_once_with('hello',1)

    async def test_local_primary_cancellation_never_starts_edge(self):
        b=self.make();b.cfg={'tts_backend':'silero'};b.tts=object()
        b.speak_local=AsyncMock(side_effect=asyncio.CancelledError)
        b.speak_edge=AsyncMock()
        with self.assertRaises(asyncio.CancelledError):await b.speak('hello',1)
        b.speak_edge.assert_not_awaited()

    async def test_timeout_releases_call(self):
        b=self.make();b.turn=None;b.cfg={'max_call_seconds':.01}
        await b.limit(1)
        self.assertIsNone(b.peer);b.calls.leave_call.assert_awaited_once()

    async def test_raw_vad_never_cancels_playback_or_inference(self):
        b=self.make();b.queue=asyncio.Queue();b.metrics={'interruptions':0}
        b.segmenter=type('Segments',(),{'push':lambda _,x:[('interrupt',None)]})()
        b.turn=asyncio.create_task(asyncio.sleep(100))
        b.speech=asyncio.create_task(asyncio.sleep(100));b.audible=True
        await b.queue.put(b'audio')
        t=asyncio.create_task(b.receive(1));await asyncio.sleep(.02)
        self.assertFalse(b.speech.done());self.assertFalse(b.turn.done())
        self.assertEqual(b.metrics['interruptions'],0)
        b.speech.cancel();await asyncio.gather(b.speech,return_exceptions=True)
        b.turn.cancel();await asyncio.gather(b.turn,return_exceptions=True)
        t.cancel();await asyncio.gather(t,return_exceptions=True)

    async def test_new_utterances_are_bounded_without_cancelling_inference(self):
        b=self.make();b.queue=asyncio.Queue();b.metrics={'interruptions':0}
        b.segmenter=type('Segments',(),{'push':lambda _,x:[('interrupt',None),('utterance',x)]})()
        b.turn=asyncio.create_task(asyncio.sleep(100))
        for i in range(4):await b.queue.put(bytes([i]))
        t=asyncio.create_task(b.receive(1));await asyncio.sleep(.03)
        self.assertFalse(b.turn.done());self.assertEqual(b.metrics['interruptions'],0)
        self.assertEqual(b.utterance_queue.qsize(),2)
        self.assertEqual(await b.utterance_queue.get(),(b'\2',False))
        t.cancel();b.turn.cancel();await asyncio.gather(t,b.turn,return_exceptions=True)

    async def test_interrupted_playback_returns_without_cancelling_dialogue(self):
        b=self.make();b.segmenter=type('Segments',(),{'active':None})()
        b.speak=AsyncMock(side_effect=asyncio.CancelledError)
        self.assertFalse(await b.play_reply('hello',1))


    async def test_stream_plays_first_sentence_before_native_answer_finishes(self):
        import time
        b=self.make();b.segmenter=type('Segments',(),{'active':None})()
        b.response_started_at=time.monotonic();release=asyncio.Event();heard=[]
        async def ask(payload,on_delta):
            await on_delta('Привет. ')
            await release.wait()
            await on_delta('Как дела?')
            return 'Привет. Как дела?'
        b.worker=type('Worker',(),{'ask':staticmethod(ask)})()
        async def speak(text,gen):heard.append(text)
        b.speak=speak
        task=asyncio.create_task(b.stream_reply('test',1))
        while not heard:await asyncio.sleep(.005)
        self.assertFalse(task.done());self.assertEqual(heard,['Привет.'])
        release.set();self.assertEqual(await task,('Привет. Как дела?',True))
        self.assertEqual(heard,['Привет.','Как дела?'])

    async def test_stream_barge_in_suppresses_remaining_sentences_without_cancelling_worker(self):
        import time
        b=self.make();b.segmenter=type('Segments',(),{'active':None})()
        b.response_started_at=time.monotonic();release=asyncio.Event();heard=[]
        async def ask(payload,on_delta):
            await on_delta('Первая. ')
            await release.wait()
            await on_delta('Вторая. ')
            return 'Первая. Вторая.'
        b.worker=type('Worker',(),{'ask':staticmethod(ask)})()
        async def speak(text,gen):heard.append(text);await asyncio.sleep(30)
        b.speak=speak
        task=asyncio.create_task(b.stream_reply('test',1))
        while not heard:await asyncio.sleep(.005)
        b.speech.cancel();await asyncio.sleep(0)
        self.assertFalse(task.done())
        release.set();self.assertEqual(await asyncio.wait_for(task,1),('Первая. Вторая.',False))
        self.assertEqual(heard,['Первая.']);self.assertFalse(b.stream_playing)

    async def test_stream_preserves_decimal_and_partial_tail_without_duplication(self):
        import time
        b=self.make();b.segmenter=type('Segments',(),{'active':None})()
        b.response_started_at=time.monotonic();heard=[]
        async def ask(payload,on_delta):
            for part in ['Число 3.','14. ','Ответ го']:await on_delta(part)
            return 'Число 3.14. Ответ готов.'
        b.worker=type('Worker',(),{'ask':staticmethod(ask)})()
        async def speak(text,gen):heard.append(text)
        b.speak=speak
        self.assertEqual(await b.stream_reply('test',1),('Число 3.14. Ответ готов.',True))
        self.assertEqual(heard,['Число 3.14.','Ответ готов.'])

    async def test_stream_without_deltas_keeps_full_answer_fallback(self):
        import time
        b=self.make();b.segmenter=type('Segments',(),{'active':None})()
        b.response_started_at=time.monotonic();b.speak=AsyncMock()
        b.worker=type('Worker',(),{'ask':AsyncMock(return_value='Полный ответ.')})()
        self.assertEqual(await b.stream_reply('test',1),('Полный ответ.',True))
        b.speak.assert_awaited_once_with('Полный ответ.',1)

    async def test_slow_native_answer_gets_one_cue_without_history_pollution(self):
        import time
        b=self.make();b.segmenter=type('Segments',(),{'active':None})()
        b.response_started_at=time.monotonic();b.thinking_cues=[b'cue']
        b.cfg={'thinking_cues':True,'thinking_cue_delay':.01};heard=[]
        async def ask(payload,on_delta):
            await asyncio.sleep(.04)
            await on_delta('Ответ.')
            return 'Ответ.'
        b.worker=type('Worker',(),{'ask':staticmethod(ask)})()
        async def cue(pcm,gen):heard.append('cue')
        async def speak(text,gen):heard.append(text)
        b.play_thinking_cue=cue;b.speak=speak
        self.assertEqual(await b.stream_reply('question',1),('Ответ.',True))
        self.assertEqual(heard,['cue','Ответ.']);self.assertEqual(b.history,[])
        heard.clear()
        self.assertEqual(await b.stream_reply('again',1),('Ответ.',True))
        self.assertEqual(heard,['Ответ.'])

    async def test_first_text_suppresses_cue_even_before_sentence_is_complete(self):
        import time
        b=self.make();b.segmenter=type('Segments',(),{'active':None})()
        b.response_started_at=time.monotonic();b.thinking_cues=[b'cue']
        b.cfg={'thinking_cues':True,'thinking_cue_delay':.01}
        async def ask(payload,on_delta):
            await on_delta('Готовый')
            await asyncio.sleep(.03)
            return 'Готовый ответ.'
        b.worker=type('Worker',(),{'ask':staticmethod(ask)})()
        b.play_thinking_cue=AsyncMock();b.speak=AsyncMock()
        self.assertEqual(await b.stream_reply('question',1),('Готовый ответ.',True))
        b.play_thinking_cue.assert_not_awaited();b.speak.assert_awaited_once_with('Готовый ответ.',1)

    async def test_cue_barge_in_does_not_restart_reply_or_cancel_native(self):
        import time
        b=self.make();b.segmenter=type('Segments',(),{'active':None})()
        b.response_started_at=time.monotonic();b.thinking_cues=[b'cue']
        b.cfg={'thinking_cues':True,'thinking_cue_delay':.005};release=asyncio.Event();started=asyncio.Event()
        async def ask(payload,on_delta):
            await release.wait();await on_delta('Ответ.')
            return 'Ответ.'
        async def cue(pcm,gen):started.set();await asyncio.sleep(30)
        b.worker=type('Worker',(),{'ask':staticmethod(ask)})()
        b.play_thinking_cue=cue;b.speak=AsyncMock()
        task=asyncio.create_task(b.stream_reply('question',1));await started.wait()
        b.speech.cancel();await asyncio.sleep(0);self.assertFalse(task.done())
        release.set();self.assertEqual(await asyncio.wait_for(task,1),('Ответ.',False))
        b.speak.assert_not_awaited()

    async def test_answer_ready_during_cue_waits_for_cue_to_finish(self):
        import time
        b=self.make();b.segmenter=type('Segments',(),{'active':None})()
        b.response_started_at=time.monotonic();b.thinking_cues=[b'cue']
        b.cfg={'thinking_cues':True,'thinking_cue_delay':.005};started=asyncio.Event();release=asyncio.Event();heard=[]
        async def ask(payload,on_delta):
            await started.wait();await on_delta('Ответ.')
            return 'Ответ.'
        async def cue(pcm,gen):started.set();await release.wait();heard.append('cue-ended')
        async def speak(text,gen):heard.append(text)
        b.worker=type('Worker',(),{'ask':staticmethod(ask)})()
        b.play_thinking_cue=cue;b.speak=speak
        task=asyncio.create_task(b.stream_reply('question',1));await started.wait();await asyncio.sleep(.01)
        self.assertEqual(heard,[]);release.set();await task
        self.assertEqual(heard,['cue-ended','Ответ.'])

    async def test_recognized_noise_and_backchannels_do_not_stop_answer(self):
        b=self.make();b.metrics={'utterances':0,'interruptions':0}
        texts=iter(['угу','а','','Продолжение следует','прив'])
        b.recognize_input=lambda pcm:next(texts)
        b.speech=asyncio.create_task(asyncio.sleep(30))
        b.turn=asyncio.create_task(asyncio.sleep(30))
        for i in range(2):await b.utterance_queue.put((b'pcm',True))
        # Keep the bounded queue; feed and let recognition drain between items.
        task=asyncio.create_task(b.transcribe(1))
        await asyncio.sleep(.03)
        for i in range(3):
            await b.utterance_queue.put((b'pcm',True));await asyncio.sleep(.01)
        self.assertFalse(b.speech.done());self.assertFalse(b.turn.done())
        self.assertTrue(b.text_queue.empty());self.assertEqual(b.metrics['interruptions'],0)
        for t in [task,b.speech,b.turn]:t.cancel()
        await asyncio.gather(task,b.speech,b.turn,return_exceptions=True)

    async def test_recognized_question_interrupts_but_keeps_native_inference(self):
        b=self.make();b.metrics={'utterances':0,'interruptions':0}
        b.recognize_input=lambda pcm:'Стоп. Сколько будет пять плюс пять?'
        b.speech=asyncio.create_task(asyncio.sleep(30));b.turn=asyncio.create_task(asyncio.sleep(30))
        await b.utterance_queue.put((b'pcm',True));task=asyncio.create_task(b.transcribe(1))
        text,_=await asyncio.wait_for(b.text_queue.get(),1);await asyncio.sleep(0)
        self.assertIn('Сколько',text);self.assertTrue(b.speech.cancelled());self.assertFalse(b.turn.done())
        self.assertEqual(b.metrics['interruptions'],1)
        task.cancel();b.turn.cancel();await asyncio.gather(task,b.turn,return_exceptions=True)

    async def test_stop_only_does_not_generate_a_new_answer(self):
        b=self.make();b.metrics={'utterances':0,'interruptions':0};b.recognize_input=lambda pcm:'Стоп, пожалуйста.'
        b.speech=asyncio.create_task(asyncio.sleep(30));await b.utterance_queue.put((b'pcm',True))
        task=asyncio.create_task(b.transcribe(1));await asyncio.sleep(.03)
        self.assertTrue(b.speech.cancelled());self.assertTrue(b.text_queue.empty());self.assertEqual(b.metrics['utterances'],0)
        task.cancel();await asyncio.gather(task,return_exceptions=True)

    async def test_raw_active_segment_does_not_delay_an_answer(self):
        b=self.make();b.segmenter=type('Segments',(),{'active':[b'noise']})()
        b.speak=AsyncMock()
        self.assertTrue(await asyncio.wait_for(b.play_reply('Ответ.',1),.2))
        b.speak.assert_awaited_once_with('Ответ.',1)

    async def test_uncertain_asr_segments_cannot_trigger_interruption(self):
        import threading
        from types import SimpleNamespace as S
        b=self.make();b.stt_lock=threading.Lock()
        b.stt=type('STT',(),{'transcribe':lambda *a,**k:([S(text='Шум',no_speech_prob=.9,avg_logprob=-.1),S(text='Что-то',no_speech_prob=.1,avg_logprob=-1.5),S(text='Как дела?',no_speech_prob=.1,avg_logprob=-.2)],None)})()
        pcm=b'\0'*9600
        self.assertEqual(b.recognize_input(pcm),'Как дела?')
        self.assertEqual(b.recognize(pcm),'Шум Что-то Как дела?')

    async def test_full_decoder_pipe_is_drained_on_interrupt(self):
        import sys
        from voice_bridge import kill_process
        p=await asyncio.create_subprocess_exec(sys.executable,'-c',
            'import sys,time;sys.stdout.buffer.write(b"x"*1048576);sys.stdout.flush();time.sleep(60)',
            stdout=asyncio.subprocess.PIPE,start_new_session=True)
        await asyncio.sleep(.1)
        await asyncio.wait_for(kill_process(p),3)
        self.assertIsNotNone(p.returncode)
        self.assertTrue(p.stdout.at_eof())

    async def test_slow_playback_cleanup_does_not_block_incoming_utterance(self):
        b=self.make();b.queue=asyncio.Queue();b.metrics={'interruptions':0}
        b.segmenter=type('Segments',(),{'push':lambda _,x:[('interrupt',None),('utterance',x)]})()
        async def slow_cleanup():
            try:await asyncio.Future()
            finally:await asyncio.sleep(.2)
        b.speech=asyncio.create_task(slow_cleanup());b.audible=True
        await asyncio.sleep(0);await b.queue.put(b'new speech')
        t=asyncio.create_task(b.receive(1));await asyncio.sleep(.03)
        self.assertEqual(b.utterance_queue.qsize(),1)
        t.cancel();b.speech.cancel();await asyncio.gather(t,b.speech,return_exceptions=True)





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

    async def test_deltas_arrive_before_answer_and_worker_is_reused(self):
        import sys
        from agent_worker import AgentWorker
        code="import sys,json,time\njson.loads(sys.stdin.readline())\nprint(json.dumps({'ready':True}),flush=True)\nfor line in sys.stdin:\n p=json.loads(line)\n print(json.dumps({'delta':'First. '}),flush=True)\n time.sleep(.05)\n print(json.dumps({'answer':'First. Done.'}),flush=True)\n"
        w=AgentWorker([sys.executable,'-u','-c',code],123,timeout=2)
        seen=[]
        async def delta(text):seen.append(text)
        try:
            task=asyncio.create_task(w.ask({'text':'first'},on_delta=delta))
            while not seen:await asyncio.sleep(.005)
            self.assertFalse(task.done())
            self.assertEqual(await task,'First. Done.')
            pid=w.proc.pid
            self.assertEqual(await w.ask({'text':'second'}),'First. Done.')
            self.assertEqual(w.proc.pid,pid)
            self.assertEqual(seen,['First. '])
        finally:await w.close()

    async def test_delta_activity_cannot_extend_turn_deadline(self):
        import sys
        from agent_worker import AgentWorker
        code="import sys,json,time\njson.loads(sys.stdin.readline())\nprint(json.dumps({'ready':True}),flush=True)\njson.loads(sys.stdin.readline())\nwhile True:\n print(json.dumps({'delta':'x'}),flush=True)\n time.sleep(.01)\n"
        w=AgentWorker([sys.executable,'-u','-c',code],123,timeout=.08)
        try:
            with self.assertRaises(TimeoutError):await w.ask({'text':'test'})
            self.assertIsNone(w.proc)
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

if __name__=='__main__':unittest.main()
