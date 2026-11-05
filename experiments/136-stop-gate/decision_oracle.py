"""Finite decision oracle for synthetic tasks, not general expert judgment.

The model gets cases, never answer keys. Compute expected net payoff with exact
fractions; information actions observe a signal then take the best available act.
Assumptions (declared synthetic payoffs and signal accuracy) are part of the task.
"""
from fractions import Fraction
import json


def scores(case):
    states = case['states']
    if sum(Fraction(s['probability']) for s in states) != 1:
        raise ValueError('state probabilities must sum to one')
    actions = case['actions']
    if not actions or len({a['id'] for a in actions}) != len(actions):
        raise ValueError('nonempty unique actions required')
    values = {}
    for action in actions:
        if len(action['payoffs']) != len(states):
            raise ValueError('one payoff per state required')
        values[action['id']] = sum(Fraction(s['probability']) * Fraction(v)
            for s, v in zip(states, action['payoffs'])) - Fraction(action['cost'])
    for query in case.get('queries', []):
        if query['id'] in values:
            raise ValueError('duplicate option')
        columns = query['signals_given_state']
        if len(columns) != len(states) or not columns or not columns[0]:
            raise ValueError('invalid signal matrix')
        count = len(columns[0])
        if any(len(row) != count or
               any(Fraction(x) < 0 for x in row) or
               sum(Fraction(x) for x in row) != 1 for row in columns):
            raise ValueError('invalid signal probabilities')
        # Weighted joint payoff avoids division by zero for impossible signals.
        value = -Fraction(query['cost'])
        for signal in range(count):
            joint = [Fraction(s['probability']) * Fraction(columns[i][signal])
                     for i, s in enumerate(states)]
            value += max(sum(p * (Fraction(payoff) - Fraction(a['cost']))
                             for p, payoff in zip(joint, a['payoffs']))
                         for a in actions)
        values[query['id']] = value
    return values


def grade(case, content):
    try:
        answer = json.loads(content)
    except (ValueError, TypeError):
        return {'accepted': False, 'reason': 'invalid_json'}
    if not isinstance(answer, dict) or set(answer) != {'choice'}:
        return {'accepted': False, 'reason': 'require_choice_only'}
    value = scores(case)
    choice = answer['choice']
    if not isinstance(choice, str) or choice not in value:
        return {'accepted': False, 'reason': 'unknown_choice'}
    return {'accepted': value[choice] == max(value.values()),
            'reason': 'optimal' if value[choice] == max(value.values()) else 'suboptimal'}


CASES = [
    {'id': 'cheap-signal', 'states': [
        {'probability': '1/2'}, {'probability': '1/2'}],
     'actions': [
         {'id': 'A', 'cost': 0, 'payoffs': [100, -80]},
         {'id': 'B', 'cost': 0, 'payoffs': [-80, 100]},
         {'id': 'wait', 'cost': 0, 'payoffs': [0, 0]}],
     'queries': [{'id': 'inspect', 'cost': 5,
                  'signals_given_state': [[1, 0], [0, 1]]}]},
    {'id': 'dominant-action', 'states': [
        {'probability': '1/2'}, {'probability': '1/2'}],
     'actions': [
         {'id': 'A', 'cost': 10, 'payoffs': [90, 90]},
         {'id': 'B', 'cost': 0, 'payoffs': [65, 70]}],
     'queries': [{'id': 'inspect', 'cost': 8,
                  'signals_given_state': [[1, 0], [0, 1]]}]},
    {'id': 'uninformative-signal', 'states': [
        {'probability': '1/4'}, {'probability': '3/4'}],
     'actions': [
         {'id': 'A', 'cost': 0, 'payoffs': [80, -20]},
         {'id': 'B', 'cost': 0, 'payoffs': [25, 25]}],
     'queries': [{'id': 'inspect', 'cost': 2,
                  'signals_given_state': [['1/2', '1/2'], ['1/2', '1/2']]}]},
]
