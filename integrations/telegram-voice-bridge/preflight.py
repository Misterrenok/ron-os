#!/usr/bin/env python3
"""Real speech/provider smoke checks, without placing any call or sending messages."""
import asyncio
import json
import logging
from pathlib import Path
import sys
import time
from voice_bridge import Bridge
from faster_whisper import WhisperModel

logging.basicConfig(level=logging.ERROR)
async def main():
    cfg=json.loads(Path(sys.argv[1]).read_text())
    result={}
    b=Bridge(cfg,None)
    await b.client.connect()
    try:
        result['telegram_authorized']=await b.client.is_user_authorized()
        if not result['telegram_authorized']:raise RuntimeError('authorization_required')
        me=await b.client.get_me()
        result['expected_account']=me.id==cfg['expected_account_id']
        await b.client.get_dialogs(limit=100)
        result['peers_resolved']=0
        for peer in b.allowed:
            try:
                await b.client.get_input_entity(peer)
                result['peers_resolved']+=1
            except ValueError:pass
    finally:await b.client.disconnect()
    import edge_tts
    sample='Привет. Сегодня мы проверяем голосовую связь. Сколько будет два плюс два?'
    t=time.monotonic();data=bytearray()
    async for chunk in edge_tts.Communicate(sample,cfg['voice']).stream():
        if chunk['type']=='audio':data.extend(chunk['data'])
    result['tts_mp3_bytes']=len(data)
    result['tts_seconds']=round(time.monotonic()-t,2)
    p=await asyncio.create_subprocess_exec('ffmpeg','-loglevel','error','-i','pipe:0',
        '-f','s16le','-ar','48000','-ac','1','pipe:1',stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,stderr=asyncio.subprocess.DEVNULL)
    pcm,_=await p.communicate(data)
    if p.returncode:raise RuntimeError('decode_failed')
    b.stt=WhisperModel(cfg['stt_model'],device='cpu',compute_type='int8',cpu_threads=2,
                      local_files_only=True)
    t=time.monotonic();text=await asyncio.to_thread(b.recognize,pcm)
    result['stt_seconds']=round(time.monotonic()-t,2)
    result['stt_sample']=text  # public synthetic sample only; never remote caller speech
    b.call_tag='preflight';b.peer=next(iter(b.allowed))
    t=time.monotonic();answer=await b.ask_hermes('Ответь одним коротким предложением: сколько будет два плюс два?')
    result['agent_seconds']=round(time.monotonic()-t,2)
    result['agent_sample']=answer
    Path(cfg['runtime_dir']).mkdir(parents=True,exist_ok=True,mode=0o700)
    path=Path(cfg['runtime_dir'])/'preflight.json'
    path.write_text(json.dumps(result,ensure_ascii=False))
    print(json.dumps(result,ensure_ascii=False))

if __name__=='__main__':asyncio.run(main())
