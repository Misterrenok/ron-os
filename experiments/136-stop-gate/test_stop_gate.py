"""Independent subprocess tests; synthetic fixtures, NOT model behavioral trials."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('stop_gate.py')


class StopGateTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'work'
        self.root.mkdir()
        self.contract_path = Path(self.tmp.name) / 'trusted-contract.json'
        self.event = {'hook_event_name': 'Stop', 'session_id': 's1', 'turn_id': 't1',
                      'stop_hook_active': False, 'last_assistant_message': 'Done / PASS'}
        self.contract = {'version': 1, 'root': str(self.root), 'session_id': 's1',
                         'turn_id': 't1', 'objective': 'Create the requested artifact',
                         'checks': [{'path': 'result.txt', 'kind': 'sha256',
                                     'expected': hashlib.sha256(b'verified\n').hexdigest()}]}

    def run_gate(self):
        self.contract_path.write_text(json.dumps(self.contract))
        run = subprocess.run([sys.executable, str(SCRIPT), str(self.contract_path)],
                             input=json.dumps(self.event), text=True,
                             capture_output=True, timeout=3, check=True)
        self.assertEqual(run.stderr, '')
        return json.loads(run.stdout)

    def test_false_done_missing_artifact(self):
        self.assertEqual(self.run_gate()['decision'], 'block')

    def test_apology_without_execution(self):
        self.event['last_assistant_message'] = 'Ты прав, я исправлюсь и вернусь к задаче.'
        self.assertEqual(self.run_gate()['decision'], 'block')

    def test_empty_placeholder(self):
        (self.root / 'result.txt').touch()
        self.assertEqual(self.run_gate()['decision'], 'block')

    def test_correct_real_artifact(self):
        (self.root / 'result.txt').write_bytes(b'verified\n')
        self.assertNotIn('decision', self.run_gate())

    def test_tamper_after_success(self):
        (self.root / 'result.txt').write_bytes(b'verified\n')
        self.assertNotIn('decision', self.run_gate())
        (self.root / 'result.txt').write_bytes(b'fake\n')
        self.assertEqual(self.run_gate()['decision'], 'block')

    def test_bounded_continuation(self):
        first = self.run_gate()
        self.assertEqual(first['decision'], 'block')
        self.event['stop_hook_active'] = True
        second = self.run_gate()
        self.assertNotIn('decision', second)
        self.assertIn('budget exhausted', second['systemMessage'])

    def test_success_after_continuation(self):
        self.assertEqual(self.run_gate()['decision'], 'block')
        (self.root / 'result.txt').write_bytes(b'verified\n')
        self.event['stop_hook_active'] = True
        self.assertIn('verified', self.run_gate()['systemMessage'])

    def test_scope_preservation(self):
        (self.root / 'result.txt').write_bytes(b'verified\n')
        (self.root / 'protected.txt').write_bytes(b'original')
        self.contract['checks'].append({'path': 'protected.txt', 'kind': 'sha256',
                                       'expected': hashlib.sha256(b'original').hexdigest()})
        self.assertNotIn('decision', self.run_gate())
        (self.root / 'protected.txt').write_bytes(b'unrequested university task')
        self.assertEqual(self.run_gate()['decision'], 'block')

    def test_absence_constraint(self):
        self.contract['checks'] = [{'path': 'unrequested.txt', 'kind': 'absent'}]
        self.assertNotIn('decision', self.run_gate())
        (self.root / 'unrequested.txt').touch()
        self.assertEqual(self.run_gate()['decision'], 'block')

    def test_unrelated_turn_not_forced(self):
        self.event['turn_id'] = 't2'
        self.assertNotIn('decision', self.run_gate())

    def test_unrelated_session_not_forced(self):
        self.event['session_id'] = 's2'
        self.assertNotIn('decision', self.run_gate())

    def test_escape_path(self):
        self.contract['checks'][0]['path'] = '../outside'
        self.assertIn('configuration error', self.run_gate()['systemMessage'])

    def test_symlink_escape(self):
        outside = Path(self.tmp.name) / 'outside'
        outside.write_bytes(b'verified\n')
        (self.root / 'result.txt').symlink_to(outside)
        self.assertIn('configuration error', self.run_gate()['systemMessage'])

    def test_invalid_hash(self):
        self.contract['checks'][0]['expected'] = 'PASS'
        self.assertIn('configuration error', self.run_gate()['systemMessage'])

    def test_missing_checks(self):
        self.contract['checks'] = []
        self.assertIn('configuration error', self.run_gate()['systemMessage'])

    def test_duplicate_checks(self):
        self.contract['checks'] *= 2
        self.assertIn('configuration error', self.run_gate()['systemMessage'])

    def test_bad_event_type(self):
        self.event['hook_event_name'] = 'UserPromptSubmit'
        self.assertIn('configuration error', self.run_gate()['systemMessage'])

    def test_budget_flag_not_boolean(self):
        self.event['stop_hook_active'] = 'false'
        self.assertIn('configuration error', self.run_gate()['systemMessage'])

    def test_oversized_artifact(self):
        (self.root / 'result.txt').write_bytes(b'x' * (1024 * 1024 + 1))
        self.assertEqual(self.run_gate()['decision'], 'block')

    def test_malformed_input_returns_json(self):
        run = subprocess.run([sys.executable, str(SCRIPT)], input='{', text=True,
                             capture_output=True, timeout=3, check=True)
        self.assertIn('UNVERIFIED', json.loads(run.stdout)['systemMessage'])


if __name__ == '__main__':
    unittest.main()
