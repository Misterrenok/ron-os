"""Deterministic plumbing tests, not additional model/behavioral trials."""
import copy
import json
from pathlib import Path
import unittest

from raw_entry import FIELDS, contract_from, finish

REQUEST = 'Это пример ошибки, а не поручение.'


def extraction():
    conditions = {f: {'value': 'unknown', 'basis': 'unknown', 'quote': '',
                     'rationale': 'В запросе нет данных.', 'confidence': 'uncertain'} for f in FIELDS}
    conditions['intent'] = {'value': 'correction', 'basis': 'direct', 'quote': REQUEST,
                            'rationale': 'Явно пример.', 'confidence': 'supported'}
    return {'conditions': conditions, 'blocks': [], 'response': 'Принял замечание об ошибке.'}


class RawEntryTests(unittest.TestCase):
    def test_actual_saved_e2_contract_recovers_at_cli_boundary(self):
        saved = json.loads((Path(__file__).parent /
            'raw-request-results-2026-10-11.json').read_text(encoding='utf-8'))
        old = next(r for r in saved['results'] if r['case'] == 'E2' and r['lane'] == 'candidate')
        self.assertIsNone(old['operator_result']['action'])  # Historical negative unchanged.
        original = copy.deepcopy(old['extraction'])
        result = finish(saved['request_texts']['E2'], old['extraction'])
        self.assertEqual(old['extraction'], original)
        self.assertEqual(result['contract'], old['contract'])
        self.assertEqual(result['operator_calls'], 1)
        self.assertEqual(result['operator_exit'], 0)
        self.assertEqual(result['operator_result']['status'], 'information_action_ready')
        self.assertEqual(result['contract']['dominant_safe_pilot'], 'unknown')
        self.assertFalse(result['operator_result']['action']['requires_measurement'])
        self.assertEqual(result['user_response'], result['operator_result']['action']['text'])

    def test_actual_saved_e1_remains_correction(self):
        saved = json.loads((Path(__file__).parent /
            'raw-request-results-2026-10-11.json').read_text(encoding='utf-8'))
        old = next(r for r in saved['results'] if r['case'] == 'E1')
        result = finish(saved['request_texts']['E1'], old['extraction'])
        self.assertEqual(result['operator_result'], old['operator_result'])
        self.assertEqual(result['user_response'], old['user_response'])

    def test_compulsory_cli_even_for_correction(self):
        result = finish(REQUEST, extraction())
        self.assertEqual(result['operator_calls'], 1)
        self.assertEqual(result['operator_result']['reason'], 'intent')
        self.assertEqual(result['user_response'], extraction()['response'])

    def test_compulsory_cli_even_for_invalid_extraction(self):
        result = finish(REQUEST, {})
        self.assertEqual(result['operator_calls'], 1)
        self.assertEqual(result['operator_exit'], 2)
        self.assertEqual(result['validation'], 'invalid_extraction')

    def test_fabricated_quote_rejected(self):
        value = extraction()
        value['conditions']['intent']['quote'] = 'Подключи магазин'
        with self.assertRaises(ValueError):
            contract_from(REQUEST, value)

    def test_uncertain_yes_not_promoted(self):
        value = extraction()
        value['conditions']['approximation_sufficient'].update(value='yes')
        with self.assertRaises(ValueError):
            contract_from(REQUEST, value)

    def test_derived_is_retained_not_certified(self):
        value = extraction()
        value['conditions']['intent']['basis'] = 'derived'
        result = finish(REQUEST, value)
        self.assertIn('derived', result['contract']['evidence']['intent'])
        self.assertEqual(result['semantic_applicability'], 'not_certified_by_quote_validation')

    def test_baseline_identical_extraction_without_operator(self):
        value = extraction()
        baseline = finish(REQUEST, copy.deepcopy(value), 'baseline')
        candidate = finish(REQUEST, copy.deepcopy(value), 'candidate')
        self.assertEqual(baseline['contract'], candidate['contract'])
        self.assertEqual(baseline['operator_calls'], 0)
        self.assertEqual(baseline['user_response'], candidate['user_response'])

    def test_unknown_stays_unknown(self):
        result = contract_from(REQUEST, extraction())
        self.assertEqual(result['estimate_available'], 'unknown')
        self.assertEqual(result['dominant_safe_pilot'], 'unknown')


if __name__ == '__main__':
    unittest.main()
