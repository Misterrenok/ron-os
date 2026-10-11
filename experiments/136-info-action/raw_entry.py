"""Experimental raw request -> extraction -> compulsory CLI -> user response.

No expected contract/action is supplied to the actor. Validation is structural
and checks exact quotes, never certifies semantic applicability.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
FIELDS = ('intent', 'allocation_unknown', 'allocation_can_change_choice',
          'approximation_sufficient', 'estimate_available', 'dominant_safe_pilot')
BASE = '''Read only the supplied user request. Return a structured extraction and
a concise Russian response you would give to that request. No tools or file reads.
Do not infer facts from the output field names. Distinguish direct statements,
your derived judgements, and UNKNOWN; absence of evidence is not evidence of no.
Every direct or derived record needs an exact nonempty quote from the request
and a rationale explaining its support or the inferential gap. UNKNOWN uses an
empty quote and explains what is missing. Confidence is supported or uncertain;
uncertain judgements must have value unknown. Quotes are evidence pointers,
not a claim that semantic interpretation is independently verified.
The response must answer the user's communicative intent. Do not execute actions.'''

DESCRIPTIONS = {
    'intent': 'User communicative intent: choose_first_action, correction, other, or unknown.',
    'allocation_unknown': 'Are the shares of working time across relevant blocks unknown?',
    'allocation_can_change_choice': 'Can plausible time allocations change the decision?',
    'approximation_sufficient': 'Is approximate information sufficient for the requested decision stage? This may require derived judgement, not a direct fact.',
    'estimate_available': 'Does the request establish that the person can give an approximate allocation now?',
    'dominant_safe_pilot': 'Does the request establish a feasible safe pilot that dominates further allocation inquiry? Do not treat lack of mention as no.'}


def record_schema(field):
    values = ['choose_first_action', 'correction', 'other', 'unknown'] if field == 'intent' else ['yes', 'no', 'unknown']
    return {'type': 'object', 'description': DESCRIPTIONS[field], 'properties': {
        'value': {'enum': values}, 'basis': {'enum': ['direct', 'derived', 'unknown']},
        'quote': {'type': 'string'}, 'rationale': {'type': 'string'},
        'confidence': {'enum': ['supported', 'uncertain']}},
        'required': ['value', 'basis', 'quote', 'rationale', 'confidence'], 'additionalProperties': False}


SCHEMA = {'type': 'object', 'properties': {
    'conditions': {'type': 'object', 'properties': {f: record_schema(f) for f in FIELDS},
                   'required': list(FIELDS), 'additionalProperties': False},
    'blocks': {'type': 'array', 'items': {'type': 'object', 'properties': {
        'label': {'type': 'string'}, 'quote': {'type': 'string'}},
        'required': ['label', 'quote'], 'additionalProperties': False}},
    'response': {'type': 'string'}}, 'required': ['conditions', 'blocks', 'response'],
    'additionalProperties': False}


def contract_from(request, extraction):
    if not isinstance(extraction, dict) or set(extraction) != {'conditions', 'blocks', 'response'}:
        raise ValueError('extraction shape')
    if not isinstance(extraction['response'], str) or not extraction['response'].strip():
        raise ValueError('response required')
    records = extraction['conditions']
    if not isinstance(records, dict) or set(records) != set(FIELDS):
        raise ValueError('conditions shape')
    contract = {'version': 1, 'evidence': {}, 'blocks': []}
    for field in FIELDS:
        r = records[field]
        if not isinstance(r, dict) or set(r) != {'value', 'basis', 'quote', 'rationale', 'confidence'}:
            raise ValueError('condition shape: ' + field)
        if r['value'] not in record_schema(field)['properties']['value']['enum']:
            raise ValueError('condition value: ' + field)
        if r['basis'] not in ('direct', 'derived', 'unknown') or r['confidence'] not in ('supported', 'uncertain'):
            raise ValueError('basis/confidence: ' + field)
        if not isinstance(r['rationale'], str) or not r['rationale'].strip():
            raise ValueError('rationale required: ' + field)
        if not isinstance(r['quote'], str):
            raise ValueError('quote type: ' + field)
        if r['basis'] == 'unknown':
            if r['value'] != 'unknown' or r['quote'] != '':
                raise ValueError('UNKNOWN cannot carry a claimed value/source: ' + field)
        elif not r['quote'] or r['quote'] not in request:
            raise ValueError('quote not found: ' + field)
        if r['confidence'] == 'uncertain' and r['value'] != 'unknown':
            raise ValueError('uncertain value must be unknown: ' + field)
        contract[field] = r['value']
        contract['evidence'][field] = json.dumps(r, ensure_ascii=False)
    if not isinstance(extraction['blocks'], list):
        raise ValueError('blocks shape')
    for block in extraction['blocks']:
        if (not isinstance(block, dict) or set(block) != {'label', 'quote'} or
                not isinstance(block['label'], str) or not block['label'].strip() or
                not isinstance(block['quote'], str) or not block['quote'] or block['quote'] not in request):
            raise ValueError('block source invalid')
        contract['blocks'].append(block['label'])
    return contract


def finish(request, extraction, lane='candidate'):
    result = {'lane': lane, 'extraction': extraction, 'operator_calls': 0}
    try:
        contract = contract_from(request, extraction)
        result['validation'] = 'exact_quotes_and_structure_only'
    except (ValueError, TypeError) as exc:
        contract = {}  # Still invoke the compulsory operator: invalid input is not bypassed.
        result['validation'] = 'invalid_extraction'
        result['validation_error'] = str(exc)
    result['contract'] = contract
    if lane == 'candidate':
        run = subprocess.run([sys.executable, str(HERE / 'information_action.py')],
            input=json.dumps(contract, ensure_ascii=False), encoding='utf-8',
            capture_output=True, timeout=10)
        result.update(operator_calls=1, operator_exit=run.returncode,
                      operator_result=json.loads(run.stdout))
    if result['validation'] == 'invalid_extraction':
        response = 'Не удалось проверить извлечённые условия запроса; действие не выполнено.'
    elif lane == 'candidate' and result['operator_exit'] != 0:
        response = 'Оператор отклонил контракт; действие не выполнено.'
    elif lane == 'candidate' and result['operator_result'].get('action'):
        response = result['operator_result']['action']['text']
    else:
        response = extraction['response']
    result['user_response'] = response
    result['request_sha256'] = hashlib.sha256(request.encode('utf-8')).hexdigest()
    result['semantic_applicability'] = 'not_certified_by_quote_validation'
    return result


def call_actor(codex, request, cwd):
    run = subprocess.run([sys.executable, str(HERE / 'raw_actor.py'), codex],
        input=json.dumps({'request': request}, ensure_ascii=False), encoding='utf-8',
        capture_output=True, cwd=cwd, timeout=180)
    if run.returncode:
        raise RuntimeError('actor barrier: ' + run.stderr[-1000:] + run.stdout[-1000:])
    return json.loads(run.stdout)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--request', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--codex', required=True)
    p.add_argument('--cwd', type=Path, required=True)
    args = p.parse_args()
    request = args.request.read_text(encoding='utf-8')
    actor = call_actor(args.codex, request, args.cwd)
    result = finish(request, actor['extraction'])
    result['actor'] = actor
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    print(result['user_response'])


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
