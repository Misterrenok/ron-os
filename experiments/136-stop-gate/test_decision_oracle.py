import json
import unittest
from fractions import Fraction
from decision_oracle import CASES, grade, scores


class OracleTests(unittest.TestCase):
    def test_information_has_value(self):
        self.assertEqual(scores(CASES[0]), {
            'A': Fraction(10), 'B': Fraction(10),
            'wait': Fraction(0), 'inspect': Fraction(95)})

    def test_no_unnecessary_question(self):
        self.assertEqual(scores(CASES[1]), {
            'A': Fraction(80), 'B': Fraction('135/2'), 'inspect': Fraction(72)})

    def test_useless_signal_costs_money(self):
        self.assertEqual(scores(CASES[2]), {
            'A': Fraction(5), 'B': Fraction(25), 'inspect': Fraction(23)})

    def test_wrong_action_never_passes(self):
        for case, correct in zip(CASES, ['inspect', 'A', 'B']):
            for choice in scores(case):
                self.assertEqual(grade(case, json.dumps({'choice': choice}))['accepted'],
                                 choice == correct)

    def test_prose_and_extra_fields_do_not_pass(self):
        for value in ['PASS', '{}', '{"choice":"inspect","claim":"done"}',
                      '{"choice":null}', '{"choice":"unknown"}']:
            self.assertFalse(grade(CASES[0], value)['accepted'])

    def test_ties_are_not_arbitrarily_failed(self):
        case = {'states': [{'probability': 1}], 'actions': [
            {'id': 'a', 'cost': 0, 'payoffs': [1]},
            {'id': 'b', 'cost': 0, 'payoffs': [1]}]}
        self.assertTrue(grade(case, '{"choice":"a"}')['accepted'])
        self.assertTrue(grade(case, '{"choice":"b"}')['accepted'])
