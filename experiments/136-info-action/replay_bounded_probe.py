"""Replay immutable observed extractions through current CLI, with zero inference.

Does not splice the browser C failure into another model's extraction or claim
the historical responses were changed. Outputs separate post-change evidence.
"""
import copy
import hashlib
import json
from pathlib import Path

from raw_entry import finish

HERE = Path(__file__).resolve().parent


def replay():
    source = HERE / 'raw-request-results-2026-10-11.json'
    raw = source.read_bytes()
    saved = json.loads(raw)
    results = []
    for old in saved['results']:
        if old['lane'] != 'candidate':
            continue
        extraction = copy.deepcopy(old['extraction'])
        new = finish(saved['request_texts'][old['case']], extraction)
        assert new['contract'] == old['contract']
        assert extraction == old['extraction']
        results.append({'case': old['case'], 'historical_operator': old['operator_result'],
                        'historical_user_response': old['user_response'], 'replay': new})
    assert source.read_bytes() == raw
    return {'kind': 'deterministic_replay_not_model_trial', 'new_model_calls': 0,
            'source_sha256': hashlib.sha256(raw).hexdigest(),
            'operator_sha256': hashlib.sha256((HERE / 'information_action.py').read_bytes()).hexdigest(),
            'limits': 'Saved E2 draft already asks for rough shares. This repairs CLI applicability, not demonstrated model behavior. Browser C has no extracted contract and is not represented as one.',
            'results': results}


if __name__ == '__main__':
    output = HERE / 'bounded-probe-replay-2026-10-11.json'
    output.write_text(json.dumps(replay(), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(output)
