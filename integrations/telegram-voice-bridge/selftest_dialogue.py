#!/usr/bin/env python3
"""Real STT/Hermes/TTS dialogue replay; replaces only Telegram transport.
Synthetic speech only. Never opens a Telegram session or calls a recipient.
"""
import asyncio
import json
import logging
from pathlib import Path
import sys
import threading
import time
from types import SimpleNamespace
import webrtcvad
from faster_whisper import WhisperModel
from voice_bridge import Bridge, Device
from audio_core import Segmenter
from agent_worker import AgentWorker
from local_tts import LocalTTS

class Capture:
    def __init__(self):self.pcm=bytearray()
    async def send_frame(self, peer, device, frame):self.pcm.extend(frame)
    async def leave_call(self, peer):pass

class Audit(logging.Handler):
    def __init__(self):super().__init__();self.counts={};self.timings=[]
    def emit(self, record):
        try:
            row=json.loads(record.getMessage());e=row['event']
            if e=='speech_playback_started' and row.get('processing_ms') is not None:self.timings.append(row['processing_ms'])
            self.counts[e]=self.counts.get(e,0)+1
        except Exception:pass

async def until(test, timeout=45):
    async with asyncio.timeout(timeout):
        while not test():await asyncio.sleep(.02)

async def main():
    cfg=json.loads(Path(sys.argv[1]).read_text());out=Path(sys.argv[2])
    b=Bridge.__new__(Bridge);b.cfg=cfg;b.peer=next(iter(cfg['allowed_peers']))
    b.generation=1;b.connected=True;b.call_tag='synthetic-dialogue-selftest'
    b.allowed=set(cfg['allowed_peers']);b.history=[];b.lock=asyncio.Lock()
    b.queue=asyncio.Queue(maxsize=200);b.utterance_queue=asyncio.Queue(maxsize=2)
    b.segmenter=Segmenter(webrtcvad.Vad(2));b.audible=False
    b.turn=b.speech=b.receiver=b.timer=None;b.stt_lock=threading.Lock()
    b.metrics=dict(received_bytes=0,sent_bytes=0,utterances=0,answers=0,interruptions=0)
    b.write_status=lambda:None;b.calls=Capture()
    b.worker=AgentWorker(cfg['hermes_command'],b.peer,cfg.get('agent_timeout',35))
    b.stt=WhisperModel(cfg['stt_model'],device='cpu',compute_type='int8',cpu_threads=2,local_files_only=True)
    b.tts=LocalTTS(cfg['tts_model'],cfg.get('tts_speaker','eugene'))
    audit=Audit();logger=logging.getLogger('voice_bridge');logger.addHandler(audit);logger.setLevel(logging.INFO)
    result={'scope':'synthetic PCM through real VAD/STT/native Hermes/TTS; no Telegram transport','pass':False}
    async def feed(text):
        pcm=await asyncio.to_thread(b.tts.synthesize,text)
        pcm+=b'\0'*86400
        deadline=time.monotonic()
        for i in range(0,len(pcm),1920):
            update=SimpleNamespace(chat_id=b.peer,device=Device.MICROPHONE,frames=[SimpleNamespace(frame=pcm[i:i+1920])])
            await b.frames(None,update)
            deadline+=.02;await asyncio.sleep(max(0,deadline-time.monotonic()))
    try:
        await b.worker.start();await b.worker.ask({'text':'Ответь одним словом: готов.','history':[]})
        pid=b.worker.proc.pid
        b.speech=asyncio.create_task(b.greet(1));b.turn=asyncio.create_task(b.dialogue(1));b.receiver=asyncio.create_task(b.receive(1))
        await until(lambda:b.speech.done())
        result['greeting_bytes']=len(b.calls.pcm)
        exchanges=[]
        for question in ['Сколько будет два плюс два? Ответь одним словом.','А если к этому результату прибавить три? Ответь одним словом.']:
            start=len(b.calls.pcm);n=b.metrics['answers'];t=time.monotonic()
            await feed(question);await until(lambda:b.metrics['answers']>n)
            audio=bytes(b.calls.pcm[start:]);heard=await asyncio.to_thread(b.recognize,audio)
            exchanges.append({'synthetic_input':question,'recognized':b.history[-2]['content'],'answer':b.history[-1]['content'],'output_stt':heard,'output_bytes':len(audio),'total_seconds':round(time.monotonic()-t,2)})
        result['exchanges']=exchanges
        baseline=len(b.calls.pcm)
        await feed('Перечисли числа от одного до десяти.')
        await until(lambda:b.audible and len(b.calls.pcm)>baseline+1920)
        interrupts=b.metrics['interruptions'];answers=b.metrics['answers'];t=time.monotonic()
        await feed('Стоп. Сколько будет пять плюс пять? Ответь одним словом.')
        await until(lambda:b.metrics['interruptions']>interrupts,5)
        await until(lambda:b.metrics['answers']>answers)
        result['after_interrupt_answer']=b.history[-1]['content']
        result['interrupt_followup_seconds']=round(time.monotonic()-t,2)
        result['worker_pid_preserved']=b.worker.proc is not None and b.worker.proc.pid==pid
        result['metrics']=dict(b.metrics);result['events']=audit.counts;result['first_audio_processing_ms']=audit.timings
        first=exchanges[0]['answer'].lower();second=exchanges[1]['answer'].lower();last=result['after_interrupt_answer'].lower()
        result['correct_arithmetic']=('четыр' in first or '4' in first) and ('семь' in second or '7' in second) and ('десят' in last or '10' in last)
        result['pass']=result['correct_arithmetic'] and result['worker_pid_preserved'] and not audit.counts.get('audio_overrun') and all(x['output_bytes']>9600 and x['output_stt'] for x in exchanges)
    except Exception as e:
        result['error']=type(e).__name__;result['metrics']=dict(b.metrics);result['events']=audit.counts;result['first_audio_processing_ms']=audit.timings
        for name in ['turn','speech','receiver']:
            task=getattr(b,name)
            if task and task.done() and not task.cancelled():
                exc=task.exception()
                if exc:result[name+'_error']=type(exc).__name__
    finally:
        await b.finish('selftest_finished',1);await b.worker.close()
        out.write_text(json.dumps(result,ensure_ascii=False));out.chmod(0o600)
    print(json.dumps({'pass':result['pass'],'error':result.get('error'),'metrics':result.get('metrics'),'events':result.get('events')}))
    return 0 if result['pass'] else 1

if __name__=='__main__':raise SystemExit(asyncio.run(main()))
