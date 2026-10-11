#!/usr/bin/env python3
"""Deterministic actor fixture for controller orchestration tests."""
import json
import os
import sys

mode = os.environ.get('FAKE_ACTOR_MODE', 'success')
if mode == 'barrier':
    print('simulated actor transport failure', file=sys.stderr)
    sys.exit(17)
prompt = sys.argv[-1]
if mode == 'recover' and 'RECOVERY ATTEMPT' not in prompt:
    proposal = {'status': 'ready', 'writes': []}
else:
    proposal = {'status': 'ready', 'writes': [
        {'path': 'result.txt', 'content': 'verified\n'}]}
print(json.dumps({'type': 'thread.started', 'thread_id': 'fixture-thread'}))
print(json.dumps({'type': 'item.completed', 'item': {
    'type': 'agent_message', 'text': json.dumps(proposal)}}))
