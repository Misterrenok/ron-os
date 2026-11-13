"""Regression tests: rejected batches must not perform early writes."""
from unittest.mock import patch
import unittest

from controller import apply_proposal, digest, execute
import test_controller as fixtures


class BatchValidationTests(unittest.TestCase):
    setUp = fixtures.ControllerTests.setUp
    def proposal(self, extra):
        return {'status': 'ready', 'writes': [
            {'path': 'result.txt', 'content': 'verified\n'}, extra]}

    def test_late_scope_rejection_has_no_write(self):
        state, _ = apply_proposal(self.contract, self.proposal(
            {'path': 'outside.txt', 'content': 'bad'}))
        self.assertEqual(state, 'scope_violation')
        self.assertFalse((self.root / 'result.txt').exists())

    def test_late_hash_rejection_has_no_write(self):
        self.contract['checks'].append({
            'path': 'second.txt', 'expected': digest(b'good')})
        state, _ = apply_proposal(self.contract, self.proposal(
            {'path': 'second.txt', 'content': 'bad'}))
        self.assertEqual(state, 'incomplete')
        self.assertFalse((self.root / 'result.txt').exists())

    def test_late_conflict_has_no_write(self):
        self.contract['checks'].append({
            'path': 'second.txt', 'expected': digest(b'good')})
        (self.root / 'second.txt').write_bytes(b'prior')
        state, _ = apply_proposal(self.contract, self.proposal(
            {'path': 'second.txt', 'content': 'good'}))
        self.assertEqual(state, 'state_conflict')
        self.assertFalse((self.root / 'result.txt').exists())
        self.assertEqual((self.root / 'second.txt').read_bytes(), b'prior')

    def test_duplicate_destination_rejected_before_write(self):
        state, _ = apply_proposal(self.contract, self.proposal(
            {'path': 'result.txt', 'content': 'verified\n'}))
        self.assertEqual(state, 'incomplete')
        self.assertFalse((self.root / 'result.txt').exists())

    def test_recovery_scope_violation_retains_class(self):
        trace = {'returncode': 0, 'thread_id': 'same-thread'}
        with patch('controller.run_actor', side_effect=[
            ('same-thread', {'status': 'ready', 'writes': []}, trace),
            ('same-thread', {'status': 'ready', 'writes': [
                {'path': 'outside.txt', 'content': 'bad'}]}, trace)]):
            result = execute(self.contract, ['fake'])
        self.assertEqual(result['status'], 'scope_violation')
        self.assertEqual(result['attempts'], 2)
        self.assertFalse((self.root / 'result.txt').exists())
