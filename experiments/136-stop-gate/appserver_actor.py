#!/usr/bin/env python3
"""Small Codex app-server actor using the user's existing ChatGPT subscription."""
from __future__ import annotations

import json
from pathlib import Path
import subprocess
import sys


BASE = """You are the proposal stage of a task controller, not its executor.
Never call tools and never attempt filesystem changes. Return only the JSON object
requested by the user. The trusted outer controller validates and executes allowed
actions, then independently checks the result."""

OUTPUT_SCHEMA = {
    'type': 'object',
    'properties': {
        'status': {'enum': ['ready', 'blocked']},
        'writes': {'type': 'array', 'items': {'type': 'object', 'properties': {
            'path': {'type': 'string'}, 'content': {'type': 'string'}},
            'required': ['path', 'content'], 'additionalProperties': False}},
        'barrier': {'type': ['object', 'null'], 'properties': {
            'kind': {'type': 'string'}, 'evidence': {'type': 'string'}},
            'required': ['kind', 'evidence'], 'additionalProperties': False},
    },
    'required': ['status', 'writes', 'barrier'],
    'additionalProperties': False,
}


def rpc(proc, request_id, method, params):
    proc.stdin.write(json.dumps({'id': request_id, 'method': method, 'params': params}) + '\n')
    proc.stdin.flush()
    while True:
        line = proc.stdout.readline()
        if not line:
            raise RuntimeError(f'app-server ended before {method} response')
        value = json.loads(line)
        if value.get('id') == request_id:
            if 'error' in value:
                raise RuntimeError(f'{method}: {value["error"]}')
            return value.get('result', {})


def main():
    args = sys.argv[1:]
    resume = len(args) >= 4 and args[-3] == 'resume'
    if resume:
        codex, _, thread_id, prompt = args[-4:]
    else:
        codex, prompt = args[-2:]
        thread_id = None
    proc = subprocess.Popen(
        [codex, 'app-server', '--listen', 'stdio://', '--disable', 'plugins',
         '--disable', 'apps', '-c', 'mcp_servers={}'], stdin=subprocess.PIPE,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
    try:
        rpc(proc, 1, 'initialize', {'clientInfo': {
            'name': 'ron_os_136_controller', 'title': 'Ron OS 136 Controller', 'version': '0.1'}})
        proc.stdin.write(json.dumps({'method': 'initialized', 'params': {}}) + '\n')
        proc.stdin.flush()
        if resume:
            rpc(proc, 2, 'thread/resume', {'threadId': thread_id,
                'baseInstructions': BASE, 'model': 'gpt-5.6-sol',
                'sandbox': 'read-only', 'approvalPolicy': 'never'})
        else:
            started = rpc(proc, 2, 'thread/start', {
                'cwd': str(Path.cwd()), 'model': 'gpt-5.6-sol',
                'baseInstructions': BASE, 'developerInstructions': BASE,
                'sandbox': 'read-only', 'approvalPolicy': 'never', 'ephemeral': False,
                'config': {'features': {'skip_host_skill_discovery': True,
                                        'plugins': False, 'apps': False},
                           'mcp_servers': {}}})
            thread_id = started['thread']['id']
        print(json.dumps({'type': 'thread.started', 'thread_id': thread_id}), flush=True)
        request = {'threadId': thread_id, 'input': [{'type': 'text', 'text': prompt}],
                   'outputSchema': OUTPUT_SCHEMA, 'sandboxPolicy': {'type': 'readOnly'},
                   'approvalPolicy': 'never', 'model': 'gpt-5.6-sol'}
        proc.stdin.write(json.dumps({'id': 3, 'method': 'turn/start', 'params': request}) + '\n')
        proc.stdin.flush()
        message = None
        completed = None
        while True:
            line = proc.stdout.readline()
            if not line:
                raise RuntimeError('app-server ended before turn/completed')
            value = json.loads(line)
            if value.get('id') == 3 and 'error' in value:
                raise RuntimeError(f'turn/start: {value["error"]}')
            if value.get('method') == 'item/completed':
                item = value.get('params', {}).get('item', {})
                if item.get('type') == 'agentMessage':
                    message = item.get('text')
            if value.get('method') == 'turn/completed':
                completed = value.get('params', {}).get('turn', {})
                break
        if completed.get('status') != 'completed' or not isinstance(message, str):
            raise RuntimeError(f'turn did not complete with an agent message: {completed}')
        print(json.dumps({'type': 'item.completed', 'item': {
            'type': 'agent_message', 'text': message}}), flush=True)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 2
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()
    return 0


if __name__ == '__main__':
    sys.exit(main())
