#!/usr/bin/env python3
"""Check scoped migration preservation, not model behavior or global reliability."""
from pathlib import Path
import subprocess
R=Path(__file__).resolve().parents[1]
BASE='79de88ba32e48db1cf6460a6dc50aebf993b933d'
def before(path):
 return subprocess.check_output(['git','show',f'{BASE}:{path}'],cwd=R,text=True)
def now(path): return (R/path).read_text()
prefixes=('- **Эталон экспертного ответа, прямое предпочтение Ron 2026-10-10:', '- **Атрибуция в операторском режиме:**', '- **Один сильный проход по умолчанию:**')
def untouched(s): return '\n'.join(x for x in s.splitlines() if not x.startswith(prefixes))
assert untouched(before('PERSON.md'))==untouched(now('PERSON.md')), 'Unrelated personal context lost/changed'
for prefix in prefixes:
 assert sum(x.startswith(prefix) for x in now('PERSON.md').splitlines())==1
assert len(now('PERSON.md'))<len(before('PERSON.md'))
assert now('tests/expert-answer-exemplar-v1.md')==before('tests/expert-answer-exemplar-v1.md')
assert now('BOOTSTRAP.md')==before('BOOTSTRAP.md')
assert now('references/domain-routing.md')==before('references/domain-routing.md')
assert now('references/continuity-owner-registry.tsv')==before('references/continuity-owner-registry.tsv')
assert now('PROTOCOL.md')==before('PROTOCOL.md')
assert now('skills/ron-work-protocol.md')==before('skills/ron-work-protocol.md')
print('PASS: scoped deduplication; all other facts, routing, freshness and permission constraints preserved. Not a behavioral test.')
