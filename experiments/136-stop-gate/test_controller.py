import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from controller import apply_proposal, load_contract, resume_command, verify

SCRIPT = Path(__file__).with_name('controller.py')
ACTOR = Path(__file__).with_name('fake_actor.py')


class ControllerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'work'
        self.root.mkdir()
        self.expected = b'verified\n'
        self.path = Path(self.tmp.name) / 'contract.json'
        self.path.write_text(json.dumps({
            'version': 2, 'root': str(self.root), 'objective': 'create result',
            'scope': 'only result.txt', 'checks': [{
                'path': 'result.txt', 'kind': 'sha256',
                'expected': hashlib.sha256(self.expected).hexdigest()}]}), encoding='utf-8')
        self.contract = load_contract(self.path)

    def test_verified_write_and_readback(self):
        state, _ = apply_proposal(self.contract, {
            'status': 'ready', 'writes': [{'path': 'result.txt', 'content': 'verified\n'}]})
        self.assertEqual(state, 'applied')
        self.assertEqual(verify(self.contract), [])

    def test_incomplete_is_detected(self):
        state, _ = apply_proposal(self.contract, {'status': 'ready', 'writes': []})
        self.assertEqual(state, 'applied')
        self.assertEqual(verify(self.contract), ['result.txt'])

    def test_does_not_repeat_verified_write(self):
        (self.root / 'result.txt').write_bytes(self.expected)
        state, notes = apply_proposal(self.contract, {
            'status': 'ready', 'writes': [{'path': 'result.txt', 'content': 'verified\n'}]})
        self.assertEqual(state, 'applied')
        self.assertEqual(notes, ['already_verified:result.txt'])

    def test_prior_conflict_is_barrier(self):
        (self.root / 'result.txt').write_text('other', encoding='utf-8')
        state, _ = apply_proposal(self.contract, {
            'status': 'ready', 'writes': [{'path': 'result.txt', 'content': 'verified\n'}]})
        self.assertEqual(state, 'state_conflict')
        self.assertEqual((self.root / 'result.txt').read_text(encoding='utf-8'), 'other')

    def test_scope_violation(self):
        state, _ = apply_proposal(self.contract, {
            'status': 'ready', 'writes': [{'path': 'outside.txt', 'content': 'verified\n'}]})
        self.assertEqual(state, 'scope_violation')

    def test_model_barrier_is_not_success(self):
        state, _ = apply_proposal(self.contract, {
            'status': 'blocked', 'barrier': {'kind': 'tool', 'evidence': 'denied'}})
        self.assertEqual(state, 'reported_barrier')
        self.assertEqual(verify(self.contract), ['result.txt'])

    def run_controller(self, mode):
        env = os.environ.copy()
        env['FAKE_ACTOR_MODE'] = mode
        run = subprocess.run(
            [sys.executable, str(SCRIPT), str(self.path), '--actor',
             sys.executable, str(ACTOR)], capture_output=True, text=True,
            timeout=10, env=env)
        return run, json.loads(run.stdout)

    def test_full_success(self):
        run, result = self.run_controller('success')
        self.assertEqual(run.returncode, 0)
        self.assertEqual(result['status'], 'verified')
        self.assertEqual(result['attempts'], 1)

    def test_full_bounded_recovery(self):
        run, result = self.run_controller('recover')
        self.assertEqual(run.returncode, 0)
        self.assertEqual(result['status'], 'verified')
        self.assertEqual(result['attempts'], 2)

    def test_full_true_actor_barrier(self):
        run, result = self.run_controller('barrier')
        self.assertEqual(run.returncode, 2)
        self.assertEqual(result['status'], 'tool_barrier')
        self.assertEqual(result['attempts'], 1)
        self.assertEqual(result['failed_checks'], ['result.txt'])

    def test_resume_uses_supported_options(self):
        command = resume_command(
            ['codex', 'exec', '--json', '--sandbox', 'read-only', '-C', 'root',
             '--ignore-user-config'], 'thread')
        self.assertEqual(command, ['codex', 'exec', 'resume', 'thread', '--json',
                                   '--ignore-user-config'])


if __name__ == '__main__':
    unittest.main()
