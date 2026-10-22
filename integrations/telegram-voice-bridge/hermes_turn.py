#!/usr/bin/env python3
"""Run one native Hermes turn, with its existing provider and voice-call history.

Invoke with the installed Hermes venv; its repository path is passed by the
private launcher via PYTHONPATH. This does not start or restart the gateway.
"""
import contextlib
import inspect
import json
import os
from pathlib import Path
import sys

payload=json.load(sys.stdin)
# Keep imports/provider diagnostics and tool progress out of the JSON audio IPC.
with contextlib.redirect_stdout(sys.stderr):
    from dotenv import load_dotenv
    load_dotenv(Path(os.environ.get('HERMES_HOME',str(Path.home()/'.hermes')))/'.env',override=False)
    from hermes_cli.config import load_config
    from hermes_cli.runtime_provider import resolve_runtime_provider
    from run_agent import AIAgent
    cfg=load_config()
    model_cfg=cfg.get('model',{})
    if isinstance(model_cfg,str): model_cfg={'default':model_cfg}
    runtime=resolve_runtime_provider(requested=model_cfg.get('provider','auto'))
    params=dict(model=model_cfg.get('default',''),provider=runtime.get('provider'),
                api_key=runtime.get('api_key'),base_url=runtime.get('base_url'),
                api_mode=runtime.get('api_mode'),max_iterations=6,quiet_mode=True,
                save_trajectories=False,verbose_logging=False,
                ephemeral_system_prompt='Сейчас идёт живой телефонный разговор с Ron. '
                'Отвечай по-русски естественно, обычно одной-тремя короткими фразами. '
                'Не используй Markdown, списки или таблицы. Сохраняй контекст разговора. '
                'Не утверждай выполнение действия, пока инструмент не подтвердил результат.',
                platform='telegram_voice',session_id='voice-'+payload['call_tag'])
    accepted=inspect.signature(AIAgent).parameters
    params={k:v for k,v in params.items() if k in accepted and v is not None}
    agent=AIAgent(**params)
    result=agent.run_conversation(payload['text'],conversation_history=payload.get('history',[]))
answer=result.get('final_response')
if not isinstance(answer,str) or not answer.strip(): raise RuntimeError('no_final_response')
print(json.dumps({'answer':answer},ensure_ascii=False))
