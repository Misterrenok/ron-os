#!/usr/bin/env python3
"""Task-bound Codex controller: proposal -> allowlisted action -> outcome check.

The model always runs read-only.  This process is the only writer, and only for
contract-pinned files whose final bytes already have a pinned SHA-256.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

LIMIT = 1024 * 1024


class ContractError(ValueError):
    pass


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def inside(root: Path, relative: str) -> Path:
    candidate = Path(relative)
    if candidate.is_absolute() or not candidate.parts or '..' in candidate.parts:
        raise ContractError(f'invalid relative path: {relative!r}')
    target = (root / candidate).resolve()
    if not target.is_relative_to(root) or target == root:
        raise ContractError(f'path escapes root: {relative!r}')
    return target


def load_contract(path: Path) -> dict:
    if path.stat().st_size > LIMIT:
        raise ContractError('contract exceeds size limit')
    value = json.loads(path.read_text(encoding='utf-8'))
    if not isinstance(value, dict) or value.get('version') != 2:
        raise ContractError('version 2 contract object required')
    for key in ('objective', 'scope'):
        if not isinstance(value.get(key), str) or not value[key].strip():
            raise ContractError(f'missing {key}')
    root = Path(value.get('root', ''))
    if not root.is_absolute() or not root.is_dir():
        raise ContractError('root must be an existing absolute directory')
    root = root.resolve()
    checks = value.get('checks')
    if not isinstance(checks, list) or not 1 <= len(checks) <= 32:
        raise ContractError('require 1..32 checks')
    seen = set()
    for check in checks:
        if not isinstance(check, dict) or check.get('kind') != 'sha256':
            raise ContractError('only sha256 checks are supported')
        path_value = check.get('path')
        if not isinstance(path_value, str) or path_value in seen:
            raise ContractError('missing or duplicate check path')
        seen.add(path_value)
        inside(root, path_value)
        if not isinstance(check.get('expected'), str) or len(check['expected']) != 64:
            raise ContractError('64-character expected SHA-256 required')
    value['_root'] = root
    return value


def verify(contract: dict) -> list[str]:
    failed = []
    for check in contract['checks']:
        target = inside(contract['_root'], check['path'])
        if (not target.is_file() or target.stat().st_size > LIMIT
                or digest(target.read_bytes()) != check['expected']):
            failed.append(check['path'])
    return failed


def parse_events(stdout: str) -> tuple[str | None, dict | None]:
    thread_id = None
    message = None
    for line in stdout.splitlines():
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            continue
        if event.get('type') == 'thread.started':
            thread_id = event.get('thread_id')
        item = event.get('item', {})
        if event.get('type') == 'item.completed' and item.get('type') == 'agent_message':
            try:
                candidate = json.loads(item.get('text', ''))
            except json.JSONDecodeError:
                continue
            if isinstance(candidate, dict):
                message = candidate
    return thread_id, message


def run_actor(command: list[str], prompt: str) -> tuple[str | None, dict | None, dict]:
    run = subprocess.run(command + [prompt], text=True, capture_output=True, timeout=180)
    thread_id, message = parse_events(run.stdout)
    trace = {'returncode': run.returncode, 'thread_id': thread_id,
             'stderr_tail': run.stderr[-1000:]}
    return thread_id, message, trace


def resume_command(actor: list[str], thread_id: str) -> list[str]:
    """Translate initial `codex exec` argv to the supported `exec resume` surface."""
    if 'exec' not in actor:
        return actor + ['resume', thread_id]
    pos = actor.index('exec')
    result = actor[:pos + 1] + ['resume', thread_id]
    tail = actor[pos + 1:]
    index = 0
    while index < len(tail):
        if tail[index] in ('--sandbox', '-s', '--cd', '-C'):
            index += 2
            continue
        result.append(tail[index])
        index += 1
    return result


def apply_proposal(contract: dict, proposal: dict | None) -> tuple[str, list[str]]:
    if not isinstance(proposal, dict):
        return 'incomplete', ['actor returned no valid JSON proposal']
    if proposal.get('status') == 'blocked':
        detail = proposal.get('barrier')
        return 'reported_barrier', [str(detail)[:500]]
    if proposal.get('status') != 'ready' or not isinstance(proposal.get('writes'), list):
        return 'incomplete', ['proposal is neither ready nor blocked']
    checks = {item['path']: item for item in contract['checks']}
    notes = []
    for item in proposal['writes']:
        if not isinstance(item, dict) or set(item) != {'path', 'content'}:
            return 'incomplete', ['invalid write object']
        relative, content = item['path'], item['content']
        if relative not in checks or not isinstance(content, str):
            return 'scope_violation', [f'unapproved write: {relative!r}']
        data = content.encode('utf-8')
        if len(data) > LIMIT or digest(data) != checks[relative]['expected']:
            return 'incomplete', [f'content does not satisfy pinned result: {relative}']
        target = inside(contract['_root'], relative)
        if target.exists():
            if target.is_file() and digest(target.read_bytes()) == checks[relative]['expected']:
                notes.append(f'already_verified:{relative}')
                continue
            return 'state_conflict', [f'refusing to repeat/overwrite prior state: {relative}']
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        notes.append(f'wrote:{relative}')
    return 'applied', notes


def actor_prompt(contract: dict, failed: list[str], recovery: bool) -> str:
    prefix = 'RECOVERY ATTEMPT (the only retry). ' if recovery else ''
    return (prefix + 'Return only one JSON object, no markdown: '
            '{"status":"ready","writes":[{"path":"...","content":"..."}]} '
            'or {"status":"blocked","barrier":{"kind":"tool","evidence":"..."}}. '
            f'Objective: {contract["objective"]}\nScope: {contract["scope"]}\n'
            f'Failed outcome checks: {failed}. '
            'Do not call tools or try to write files. Writes are JSON proposals only; '
            'the external controller performs approved writes. Use only paths required by the objective. '
            'Do not claim success without proposing the exact artifact bytes.')


def execute(contract: dict, actor: list[str]) -> dict:
    initial_failed = verify(contract)
    if not initial_failed:
        return {'status': 'verified', 'attempts': 0, 'actions': ['preexisting_verified']}
    traces, actions = [], []
    thread_id, proposal, trace = run_actor(actor, actor_prompt(contract, initial_failed, False))
    traces.append(trace)
    if trace['returncode'] != 0 or not thread_id:
        return {'status': 'tool_barrier', 'attempts': 1, 'actions': actions,
                'failed_checks': verify(contract), 'traces': traces}
    state, notes = apply_proposal(contract, proposal)
    actions.extend(notes)
    failed = verify(contract)
    if not failed:
        return {'status': 'verified', 'attempts': 1, 'actions': actions, 'traces': traces}
    if state in ('scope_violation', 'state_conflict'):
        return {'status': 'tool_barrier' if state == 'state_conflict' else state,
                'attempts': 1, 'actions': actions, 'failed_checks': failed, 'traces': traces}
    resume = resume_command(actor, thread_id)
    _, proposal, trace = run_actor(resume, actor_prompt(contract, failed, True))
    traces.append(trace)
    if trace['returncode'] != 0:
        return {'status': 'tool_barrier', 'attempts': 2, 'actions': actions,
                'failed_checks': verify(contract), 'traces': traces}
    state, notes = apply_proposal(contract, proposal)
    actions.extend(notes)
    failed = verify(contract)
    return {'status': 'verified' if not failed else
            ('tool_barrier' if state == 'state_conflict' else 'unverified'),
            'attempts': 2, 'actions': actions, 'failed_checks': failed, 'traces': traces}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('contract', type=Path)
    parser.add_argument('--actor', nargs=argparse.REMAINDER, required=True)
    args = parser.parse_args()
    try:
        result = execute(load_contract(args.contract), args.actor)
    except (ContractError, OSError, ValueError, subprocess.SubprocessError) as exc:
        result = {'status': 'controller_error', 'error': str(exc)[:500]}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['status'] == 'verified' else 2


if __name__ == '__main__':
    sys.exit(main())
