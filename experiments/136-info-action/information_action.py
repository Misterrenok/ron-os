"""Opt-in deterministic decision preparation. No model, network or mutations.

Input is a human/host-validated contract, NOT extracted facts or a utility oracle.
Tri-state fields prevent absent evidence becoming permission to approximate.
"""
import json
import sys


def prepare(contract):
    if not isinstance(contract, dict) or contract.get('version') != 1:
        raise ValueError('version 1 contract required')
    intent = contract.get('intent')
    if intent not in ('choose_first_action', 'correction', 'other', 'unknown'):
        raise ValueError('explicit intent required')
    if intent != 'choose_first_action':
        return {'status': 'not_applicable', 'reason': 'intent', 'action': None}
    fields = ('allocation_unknown', 'allocation_can_change_choice',
              'approximation_sufficient', 'estimate_available',
              'dominant_safe_pilot')
    for field in fields:
        if contract.get(field) not in ('yes', 'no', 'unknown'):
            raise ValueError('tri-state field required: ' + field)
    evidence = contract.get('evidence')
    if not isinstance(evidence, dict) or any(
            not isinstance(evidence.get(f), str) or not evidence[f].strip()
            for f in fields + ('intent',)):
        raise ValueError('source or explicit UNKNOWN rationale required for each fact')
    if contract['dominant_safe_pilot'] == 'yes':
        return {'status': 'preserve_existing_action', 'reason': 'dominant_safe_pilot', 'action': None}
    # No guessed accuracy, available estimate, or absence of a dominant option.
    required = {'allocation_unknown': 'yes', 'allocation_can_change_choice': 'yes',
                'approximation_sufficient': 'yes', 'dominant_safe_pilot': 'no'}
    if any(contract[f] != value for f, value in required.items()):
        return {'status': 'not_applicable', 'reason': 'insufficient_applicability', 'action': None}
    if contract['estimate_available'] == 'no':
        return {'status': 'not_applicable', 'reason': 'estimate_unavailable', 'action': None}
    blocks = contract.get('blocks')
    if (not isinstance(blocks, list) or not 2 <= len(blocks) <= 6 or
            any(not isinstance(b, str) or not b.strip() or len(b) > 120 for b in blocks)
            or len(set(blocks)) != len(blocks)):
        raise ValueError('2-6 distinct short block labels required')
    prefix = ('Примерно какая доля рабочего времени уходит на каждый блок: '
              if contract['estimate_available'] == 'yes' else
              'Можете примерно, без отдельного замера, оценить доли рабочего времени по блокам: ')
    return {
        'status': 'information_action_ready',
        'action': {'kind': 'ask_rough_allocation',
                   'text': prefix + '; '.join(blocks) + '? Ответа «не могу оценить» достаточно, если оценки нет.',
                   'requires_measurement': False},
        'defer': ['mandatory_time_tracking', 'expensive_automation_selection'],
        'revisit': 'If no estimate is available or plausible estimates leave the choice unresolved, reassess information acquisition; do not infer shares.',
        'verification': 'Question compiled only; no user answer or automation outcome verified.'}


def main():
    sys.stdin.reconfigure(encoding='utf-8')
    sys.stdout.reconfigure(encoding='utf-8')
    try:
        result = prepare(json.load(sys.stdin))
    except (ValueError, TypeError) as exc:
        print(json.dumps({'status': 'invalid_contract', 'error': str(exc)}, ensure_ascii=False))
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
