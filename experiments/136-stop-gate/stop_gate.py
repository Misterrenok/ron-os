#!/usr/bin/env python3
"""Opt-in evidence gate. No model/API calls; not a semantic verifier or sandbox."""
import hashlib
import json
from pathlib import Path
import re
import sys

LIMIT = 1024 * 1024


def load(path):
    if path.stat().st_size > LIMIT:
        raise ValueError('JSON exceeds size limit')
    return json.loads(path.read_text(encoding='utf-8'))


def validate(contract):
    if not isinstance(contract, dict):
        raise ValueError('contract object required')
    if contract.get('version') != 1:
        raise ValueError('unsupported contract')
    for key in ('session_id', 'turn_id', 'objective'):
        if not isinstance(contract.get(key), str) or not contract[key].strip():
            raise ValueError('missing ' + key)
    root = Path(contract['root'])
    if not root.is_absolute() or not root.is_dir():
        raise ValueError('root must be an existing absolute directory')
    root = root.resolve()
    items = contract.get('checks')
    if not isinstance(items, list) or not 1 <= len(items) <= 64:
        raise ValueError('require 1..64 checks')
    seen = set()
    for item in items:
        if not isinstance(item, dict):
            raise ValueError('check object required')
        name = item['path']
        if not isinstance(name, str):
            raise ValueError('path string required')
        path = Path(name)
        if path.is_absolute() or '..' in path.parts or name in seen or not path.parts:
            raise ValueError('invalid or duplicate check path')
        seen.add(name)
        # Resolve on every invocation, so symlink changes cannot escape the root.
        target = (root / path).resolve()
        if not target.is_relative_to(root) or target == root:
            raise ValueError('check escapes root')
        if item.get('kind') not in ('sha256', 'absent'):
            raise ValueError('unsupported check kind')
        if item['kind'] == 'sha256' and not re.fullmatch('[0-9a-f]{64}', item.get('expected', '')):
            raise ValueError('expected SHA256 required')
    return root


def evaluate(event, contract):
    if not isinstance(event, dict):
        raise ValueError('event object required')
    root = validate(contract)
    if event.get('hook_event_name') != 'Stop':
        raise ValueError('Stop event required')
    if (event.get('session_id'), event.get('turn_id')) != (contract['session_id'], contract['turn_id']):
        return {'systemMessage': 'Evidence gate inactive: task binding mismatch; no verification performed.'}
    if type(event.get('stop_hook_active')) is not bool:
        raise ValueError('stop_hook_active boolean required')
    failed = []
    for item in contract['checks']:
        target = root / item['path']
        if item['kind'] == 'absent':
            ok = not target.exists() and not target.is_symlink()
        else:
            ok = (target.is_file() and target.stat().st_size <= LIMIT
                  and hashlib.sha256(target.read_bytes()).hexdigest() == item['expected'])
        if not ok:
            failed.append(item['path'])
    if not failed:
        return {'systemMessage': 'Pinned file checks verified. Semantic quality and external execution remain unverified.'}
    reason = ('Unverified task: ' + contract['objective'][:500] + '. Failed file checks: '
              + ', '.join(failed)[:1000]
              + '. Complete only already-authorized work, verify it, or report the exact blocker. '
              + 'Do not change the contract or claim completion.')
    if not event['stop_hook_active']:
        return {'decision': 'block', 'reason': reason}
    return {'systemMessage': 'UNVERIFIED / continuation budget exhausted. ' + reason}


def main():
    try:
        event = json.loads(sys.stdin.read(LIMIT + 1))
        result = evaluate(event, load(Path(sys.argv[1])))
    except (ValueError, KeyError, TypeError, OSError, IndexError) as exc:
        # Do not create unbounded continuation on broken configuration.
        result = {'systemMessage': 'UNVERIFIED / evidence gate configuration error: ' + str(exc)[:300]}
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    main()
