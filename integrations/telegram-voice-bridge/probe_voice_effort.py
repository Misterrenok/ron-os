#!/usr/bin/env python3
"""Bounded synthetic native latency comparison; no Telegram and no paid API."""
import asyncio,json,statistics,sys,time
from pathlib import Path
from agent_worker import AgentWorker


async def main():
    cfg=json.loads(Path(sys.argv[1]).read_text());workers={};r={'chosen':'low','samples':{},'errors':{}}
    try:
        async with asyncio.timeout(70):
            for effort in ['low','none']:
                w=AgentWorker(cfg['hermes_command'],next(iter(cfg['allowed_peers'])),timeout=18,reasoning_effort=effort)
                workers[effort]=w;r['samples'][effort]=[]
                try:await w.ask({'text':'Ответь одним словом: готов.','history':[]})
                except Exception as e:r['errors'][effort]=type(e).__name__
            prompts=['Привет, как твои дела? Ответь одной короткой фразой.',
                     'Сколько будет два плюс два? Ответь одним словом.',
                     'Коротко, в одном предложении: что ты умеешь в этом звонке?']
            for i,text in enumerate(prompts):
                for effort in (['low','none'] if i%2==0 else ['none','low']):
                    if effort in r['errors']:continue
                    parts=[];start=time.monotonic()
                    async def delta(part):parts.append(part)
                    try:
                        answer=await workers[effort].ask({'text':text,'history':[],'stream':True},on_delta=delta)
                        good=bool(parts) and ''.join(parts).strip()==answer.strip()
                        if i==1:good=good and ('четыр' in answer.lower() or '4' in answer)
                        r['samples'][effort].append({'ms':round((time.monotonic()-start)*1000),'valid':good})
                    except Exception as e:r['errors'][effort]=type(e).__name__
            if not r['errors'] and all(len(v)==3 and all(s['valid'] for s in v) for v in r['samples'].values()):
                r['median_ms']={k:statistics.median(s['ms'] for s in v) for k,v in r['samples'].items()}
                if r['median_ms']['none']<=r['median_ms']['low']*.8:r['chosen']='none'
    except Exception as e:
        r['chosen']='low';r['errors']['budget']=type(e).__name__
    finally:
        for w in workers.values():await w.close()
        Path(sys.argv[2]).write_text(json.dumps(r))
    print(json.dumps(r))


if __name__=='__main__':asyncio.run(main())
