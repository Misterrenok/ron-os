"""Small paired choice-only pilot; not a deployment or an E1-E5 benchmark.

Baseline and candidate see identical facts. Candidate alone receives one bounded
oracle rejection when wrong. Exactly six initial calls, at most two recoveries.
No filesystem proposal is applied and no external side effect is authorized.
"""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile

from controller import parse_events, resume_command
from decision_oracle import CASES, grade


def prompt(case):
    return ('Synthetic decision task. Maximize expected payoff minus all costs. '
            'Queries reveal a signal, then you may choose the best action; '
            'signals_given_state rows give conditional signal probabilities. '
            'Do not execute tools. Return the standard ready proposal with exactly '
            'one write: path decision.json, content a JSON object with only the '
            'key choice and the selected option ID. barrier must be null. '
            'Facts: ' + json.dumps(case, sort_keys=True))


def outcome(case, proposal):
    if not isinstance(proposal, dict) or proposal.get('status') != 'ready':
        return {'accepted': False, 'reason': 'missing_ready_proposal'}
    writes = proposal.get('writes')
    if not isinstance(writes, list) or len(writes) != 1:
        return {'accepted': False, 'reason': 'require_single_proposal'}
    item = writes[0]
    if not isinstance(item, dict) or set(item) != {'path', 'content'} or item['path'] != 'decision.json':
        return {'accepted': False, 'reason': 'scope_violation'}
    return grade(case, item['content'])


def call(command, text, cwd):
    run = subprocess.run(command + [text], cwd=cwd, capture_output=True,
                         text=True, timeout=180)
    thread, proposal = parse_events(run.stdout)
    if run.returncode != 0 or not thread:
        raise RuntimeError(f'actor barrier (exit {run.returncode}): {run.stderr[-500:]}')
    return thread, proposal


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--actor', nargs=argparse.REMAINDER, required=True)
    args = parser.parse_args()
    if not args.actor:
        parser.error('actor command required')
    # Resolve caller-provided paths before entering isolated work directories.
    actor = [str(Path(x).resolve()) if Path(x).is_file() else x for x in args.actor]
    results, calls, recoveries = [], 0, 0
    status = 'completed'
    try:
        for index, case in enumerate(CASES):
            # Alternate order to avoid attributing temporal/provider shifts to one lane.
            for lane in (['baseline', 'candidate'] if index % 2 == 0 else ['candidate', 'baseline']):
                with tempfile.TemporaryDirectory(prefix='ron-choice-') as root:
                    calls += 1
                    thread, proposal = call(actor, prompt(case), root)
                    initial = outcome(case, proposal)
                    final = initial
                    retried = False
                    if lane == 'candidate' and not initial['accepted'] and recoveries < 2:
                        calls += 1
                        recoveries += 1
                        retried = True
                        resumed_thread, proposal = call(resume_command(actor, thread),
                            'The external check rejected your previous decision: '
                            + initial['reason'] + '. Reconsider the original facts. '
                            'This is the only recovery for this case. Return the same proposal schema.', root)
                        if resumed_thread != thread:
                            raise RuntimeError('recovery did not retain original thread')
                        final = outcome(case, proposal)
                    results.append({'case': case['id'], 'lane': lane, 'thread': thread,
                                    'initial': initial, 'final': final, 'recovered': retried})
    except (RuntimeError, OSError, subprocess.SubprocessError) as exc:
        status = 'blocked'
        results.append({'barrier': str(exc)})
    print(json.dumps({'status': status, 'actor_requests': calls, 'recoveries': recoveries,
        'usage_tokens': None, 'usage_note': 'Not exposed by actor; retrieve provider usage separately.',
        'boundary': 'Choice-only synthetic pilot; not real execution or broad E1-E5 evidence.',
        'results': results}, indent=2))
    return 0 if status == 'completed' else 2


if __name__ == '__main__':
    raise SystemExit(main())
