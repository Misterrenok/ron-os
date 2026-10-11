"""One saved natural fragment replay; remaining tests are synthetic code checks."""
import copy
import json
from pathlib import Path
import subprocess
import sys
import unittest

from information_action import prepare

HERE = Path(__file__).parent
RECORD = json.loads((HERE / 'natural-e2-fragment.json').read_text(encoding='utf-8'))


class InformationActionTests(unittest.TestCase):
    def setUp(self):
        self.contract = copy.deepcopy(RECORD['contract'])

    def test_saved_natural_candidate_omission_replay(self):
        self.assertNotIn('ask_rough_allocation', [c['kind'] for c in RECORD['observed_candidates']])
        result = prepare(self.contract)
        self.assertEqual(result['action']['kind'], 'ask_rough_allocation')
        self.assertFalse(result['action']['requires_measurement'])
        self.assertIn('Можете', result['action']['text'])
        self.assertNotIn('10 секунд', result['action']['text'])

    def test_e3_dominant_pilot_preserved(self):
        self.contract['dominant_safe_pilot'] = 'yes'
        self.assertEqual(prepare(self.contract)['status'], 'preserve_existing_action')

    def test_e1_correction_never_becomes_execution(self):
        self.contract['intent'] = 'correction'
        self.assertIsNone(prepare(self.contract)['action'])

    def test_e4_other_task_not_hijacked(self):
        self.contract['intent'] = 'other'
        self.assertIsNone(prepare(self.contract)['action'])

    def test_no_unnecessary_question_when_allocation_known(self):
        self.contract['allocation_unknown'] = 'no'
        self.assertIsNone(prepare(self.contract)['action'])

    def test_decision_insensitive_unknown_does_not_trigger(self):
        self.contract['allocation_can_change_choice'] = 'no'
        self.assertIsNone(prepare(self.contract)['action'])

    def test_exact_accuracy_and_unknown_accuracy_do_not_trigger(self):
        for state in ('no', 'unknown'):
            self.contract['approximation_sufficient'] = state
            self.assertIsNone(prepare(self.contract)['action'])

    def test_no_question_if_estimate_unavailable(self):
        self.contract['estimate_available'] = 'no'
        self.assertIsNone(prepare(self.contract)['action'])

    def test_pilot_uncertainty_not_silently_resolved(self):
        self.contract['dominant_safe_pilot'] = 'unknown'
        self.assertIsNone(prepare(self.contract)['action'])

    def test_source_required_for_applicability(self):
        self.contract['evidence'].pop('approximation_sufficient')
        with self.assertRaises(ValueError):
            prepare(self.contract)

    def test_no_default_from_missing_field(self):
        self.contract.pop('allocation_unknown')
        with self.assertRaises(ValueError):
            prepare(self.contract)

    def test_renamed_domain_and_available_estimate(self):
        self.contract['blocks'] = ['приём заявок', 'выезд', 'отчётность']
        self.contract['estimate_available'] = 'yes'
        text = prepare(self.contract)['action']['text']
        self.assertIn('выезд', text)
        self.assertNotIn('Можете', text)

    def test_cli_readback(self):
        run = subprocess.run([sys.executable, str(HERE / 'information_action.py')],
                             input=json.dumps(self.contract), text=True,
                             encoding='utf-8', capture_output=True, check=True)
        self.assertEqual(json.loads(run.stdout), prepare(self.contract))

    def test_invalid_cli_does_not_produce_action(self):
        run = subprocess.run([sys.executable, str(HERE / 'information_action.py')],
                             input='{}', text=True, capture_output=True)
        self.assertEqual(run.returncode, 2)
        self.assertEqual(json.loads(run.stdout)['status'], 'invalid_contract')


if __name__ == '__main__':
    unittest.main()
