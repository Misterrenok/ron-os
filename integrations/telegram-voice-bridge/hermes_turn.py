#!/usr/bin/env python3
"""Native Hermes one-shot or warm JSON-lines worker; no gateway restart."""
import contextlib
import inspect
import json
import os
from pathlib import Path
import sys

server='--server' in sys.argv
payload=json.loads(sys.stdin.readline()) if server else json.load(sys.stdin)
with contextlib.redirect_stdout(sys.stderr):
    from dotenv import load_dotenv
    load_dotenv(Path(os.environ.get('HERMES_HOME',str(Path.home()/'.hermes')))/'.env',override=False)
    from hermes_cli.config import load_config
    from hermes_cli.runtime_provider import resolve_runtime_provider
    from run_agent import AIAgent
    cfg=load_config()
    model_cfg=cfg.get('model',{})
    if isinstance(model_cfg,str):model_cfg={'default':model_cfg}
    runtime=resolve_runtime_provider(requested=model_cfg.get('provider','auto'))
    params=dict(model=model_cfg.get('default',''),provider=runtime.get('provider'),
                api_key=runtime.get('api_key'),base_url=runtime.get('base_url'),
                api_mode=runtime.get('api_mode'),max_iterations=6,quiet_mode=True,
                save_trajectories=False,verbose_logging=False,max_tokens=256,
                reasoning_config={'effort':os.environ.get('HERMES_VOICE_REASONING_EFFORT','low')},
                ephemeral_system_prompt='Сейчас идёт живой телефонный разговор с Ron. '
                'Отвечай по-русски естественно, обычно одной-тремя короткими фразами. '
                'Не используй Markdown, списки или таблицы. Сохраняй контекст разговора. '
                'Не утверждай выполнение действия, пока инструмент не подтвердил результат.',
                platform='telegram',load_soul_identity=True,user_id=payload.get('user_id'),
                session_id='voice-'+payload['call_tag'])
    accepted=inspect.signature(AIAgent).parameters
    agent=AIAgent(**{k:v for k,v in params.items() if k in accepted and v is not None})


def turn(request):
    with contextlib.redirect_stdout(sys.stderr):
        result=agent.run_conversation(request['text'],conversation_history=request.get('history',[]))
    answer=result.get('final_response')
    if not isinstance(answer,str) or not answer.strip():raise RuntimeError('no_final_response')
    return {'answer':answer}


if server:
    print(json.dumps({'ready':True}),flush=True)
    for line in sys.stdin:
        try:response=turn(json.loads(line))
        except Exception as e:response={'error':type(e).__name__}
        print(json.dumps(response,ensure_ascii=False),flush=True)
else:
    print(json.dumps(turn(payload),ensure_ascii=False),flush=True)
