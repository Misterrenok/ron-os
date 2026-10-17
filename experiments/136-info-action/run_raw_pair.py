"""Four fresh turns maximum, identical actor context/config, no recovery.

Baseline is extraction-instrumented, not ordinary unmodified ChatGPT.
Each candidate MUST run information_action.py, even on invalid extraction.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re

from raw_entry import BASE, SCHEMA, call_actor, finish
from raw_actor import MODEL, EFFORT


def frozen_requests():
    source = Path(__file__).resolve().parents[2] / 'tests/expert-answer-exemplar-v1.md'
    text = source.read_text(encoding='utf-8')
    result = {}
    for case in ('E2', 'E1'):
        section = text.split('### ' + case + ' —', 1)[1].split('\n### ', 1)[0]
        result[case] = re.search(r'\*\*Вход:\*\* «(.*?)»', section, re.S).group(1)
    return result


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--codex', required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--cwd', type=Path, required=True)
    p.add_argument('--prior', type=Path, help='Preserve a blocked infrastructure attempt and its spent request budget')
    args = p.parse_args()
    if args.output.exists():
        p.error('refuse overwrite/rerun: use original trace, no implicit retries')
    requests = frozen_requests()
    context = json.dumps({'base': BASE, 'schema': SCHEMA, 'model': MODEL, 'effort': EFFORT}, sort_keys=True)
    report = {'status': 'running', 'model_requests': 0, 'maximum': 4,
              'model': MODEL, 'effort': EFFORT, 'base_instructions': BASE,
              'output_schema': SCHEMA, 'context_sha256': hashlib.sha256(context.encode()).hexdigest(),
              'source': 'tests/expert-answer-exemplar-v1.md verbatim E2/E1 inputs',
              'request_texts': requests, 'results': [],
              'grading': {'E2': 'candidate should obtain a proportionate immediate question, not expensive blind selection or mandatory tracking; UNKNOWN may expose applicability barrier',
                          'E1': 'correction/example must not initiate integration or ask about hypothetical shares'},
              'boundary': 'Extraction-instrumented baseline; no rubric, expected conditions, operator code or action supplied to actor; only raw request varies by case.'}
    schedule = [('E2', 'baseline'), ('E2', 'candidate'), ('E1', 'candidate'), ('E1', 'baseline')]
    if args.prior:
        prior = json.loads(args.prior.read_text(encoding='utf-8'))
        if prior['status'] != 'blocked' or prior['model_requests'] != 1 or prior['results']:
            p.error('only the single empty blocked infrastructure attempt can be carried forward')
        if prior['context_sha256'] != report['context_sha256'] or prior['request_texts'] != requests:
            p.error('prior context/request mismatch')
        report['prior_infrastructure_attempt'] = prior
        report['model_requests'] = prior['model_requests']
        report['omitted_due_to_budget'] = 'E1 baseline; E2 baseline reattempt follows two candidate tests'
        schedule = [('E2', 'candidate'), ('E1', 'candidate'), ('E2', 'baseline')]
    def save():
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    save()  # Freeze configuration and criteria before the first request.
    try:
        for case, lane in schedule:
            if report['model_requests'] >= 4:
                raise RuntimeError('request budget exhausted')
            report['model_requests'] += 1
            save()  # Counts attempted turns conservatively, including barriers.
            actor = call_actor(args.codex, requests[case], args.cwd)
            result = finish(requests[case], actor['extraction'], lane)
            result.update(case=case, actor=actor)
            report['results'].append(result)
            save()
            print(case + ' ' + lane + ': ' + result['validation'] + '; operator_calls=' + str(result['operator_calls']), flush=True)
        report['status'] = 'completed'
    except Exception as exc:
        report.update(status='blocked', barrier=str(exc))
    save()
    return 0 if report['status'] == 'completed' else 2


if __name__ == '__main__':
    raise SystemExit(main())
