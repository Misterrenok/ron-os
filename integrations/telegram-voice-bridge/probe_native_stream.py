#!/usr/bin/env python3
"""Synthetic native IPC/phase probe; no Telegram session or real caller audio."""
import asyncio
import json
from pathlib import Path
import sys
import time
from agent_worker import AgentWorker


async def main():
    cfg=json.loads(Path(sys.argv[1]).read_text())
    w=AgentWorker(cfg['hermes_command'],next(iter(cfg['allowed_peers'])),timeout=60)
    result={'pass':False,'samples':[]}
    try:
        await w.start()
        prompts=[
            'Ответь ровно этими тремя предложениями: Привет! Всё хорошо, я на связи. Чем займёмся?',
            'Обязательно вызови инструмент terminal: выполни python3 -c "print(17+25)". '
            'После результата ответь только числом. Не выполняй других команд.',
        ]
        for text in prompts:
            chunks=[];first=None;start=time.monotonic()
            async def delta(part):
                nonlocal first
                if first is None:first=time.monotonic()
                chunks.append(part)
            answer=await w.ask({'text':text,'history':[],'stream':True},on_delta=delta)
            streamed=''.join(chunks).strip()
            result['samples'].append({'delta_count':len(chunks),'exact_final_match':streamed==answer.strip(),
                'first_delta_ms':round((first-start)*1000) if first else None,
                'total_ms':round((time.monotonic()-start)*1000),
                'answer':answer,'tool_calls':w.last_result.get('tool_calls',0)})
        result['pass']=all(s['delta_count']>0 and s['exact_final_match'] for s in result['samples']) and result['samples'][1]['tool_calls']>0 and '42' in result['samples'][1]['answer']
    except Exception as e:result['error']=type(e).__name__
    finally:
        await w.close()
        Path(sys.argv[2]).write_text(json.dumps(result,ensure_ascii=False))
    print(json.dumps(result,ensure_ascii=False))
    if not result['pass']:raise SystemExit(1)


if __name__=='__main__':asyncio.run(main())
