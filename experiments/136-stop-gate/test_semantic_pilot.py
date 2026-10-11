import unittest
import contextlib
import io
import json
from unittest.mock import patch
from run_semantic_pilot import main, outcome, prompt
from decision_oracle import CASES


class PilotTests(unittest.TestCase):
    def test_prompt_contains_facts_not_answer_key(self):
        text = prompt(CASES[0])
        self.assertIn('signals_given_state', text)
        self.assertNotIn('expected_choice', text)
        self.assertNotIn('optimal_choice', text)

    def test_valid_file_proposal_can_be_wrong(self):
        proposal = {'status': 'ready', 'writes': [
            {'path': 'decision.json', 'content': '{"choice":"A"}'}]}
        self.assertEqual(outcome(CASES[0], proposal),
                         {'accepted': False, 'reason': 'suboptimal'})

    def test_useful_information_choice_accepted(self):
        proposal = {'status': 'ready', 'writes': [
            {'path': 'decision.json', 'content': '{"choice":"inspect"}'}]}
        self.assertTrue(outcome(CASES[0], proposal)['accepted'])

    def test_unapproved_output_rejected(self):
        proposal = {'status': 'ready', 'writes': [
            {'path': 'outside.txt', 'content': '{"choice":"inspect"}'}]}
        self.assertEqual(outcome(CASES[0], proposal)['reason'], 'scope_violation')

    def test_entire_pilot_request_budget(self):
        invalid = {'status': 'ready', 'writes': []}
        output = io.StringIO()
        with patch('sys.argv', ['pilot', '--actor', 'fake']), \
             patch('run_semantic_pilot.call', return_value=('same-thread', invalid)) as actor, \
             contextlib.redirect_stdout(output):
            self.assertEqual(main(), 0)
        report = json.loads(output.getvalue())
        self.assertEqual(actor.call_count, 8)
        self.assertEqual(report['recoveries'], 2)
        self.assertEqual(len(report['results']), 6)
        self.assertTrue(all(not x['final']['accepted'] for x in report['results']))

    def test_actor_barrier_stops_whole_pilot(self):
        output = io.StringIO()
        with patch('sys.argv', ['pilot', '--actor', 'fake']), \
             patch('run_semantic_pilot.call', side_effect=RuntimeError('auth blocked')) as actor, \
             contextlib.redirect_stdout(output):
            self.assertEqual(main(), 2)
        self.assertEqual(actor.call_count, 1)
        self.assertEqual(json.loads(output.getvalue())['status'], 'blocked')
