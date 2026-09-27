# Gap-first independent audit — 2026-09-27

Status: **PARTIAL — structural coverage verified; behavioral and activation limitations remain**.

This is historical test evidence, not a runtime rule, mutable-state owner, or claim of universal compliance. “Independent” here means separate, context-isolated audit probes; the agents use the same model and are not independent model families or ordinary production ChatGPT sessions.

## Frozen target and scope

- Repository: `Misterrenok/ron-os`.
- Audited `main`: `8743682b694b50efb18480e3c7f959c7058a2528`.
- [Frozen BOOTSTRAP](https://github.com/Misterrenok/ron-os/blob/8743682b694b50efb18480e3c7f959c7058a2528/BOOTSTRAP.md) was the entry point. The execution-failure auditor then read domain routing, the continuity/meta skill, PROTOCOL/CURRENT, the architecture contract, relevant guards, workflow, and incident evidence. Some separate behavioral probes violated the required skill-before-owner order; those violations are retained below rather than scored away.
- [PR #102](https://github.com/Misterrenok/ron-os/pull/102) retracted the duplicate persistent-change activation wording. The resulting runtime retains the original Adaptive Metareasoning Governor, Case Y, and existing continuity guard.
- This audit did not independently inspect saved Custom Instructions or run a fresh ordinary ChatGPT UI session. It does not prove whether the current production global activation configuration is loaded on a particular turn.

## Result by layer

| Layer | Observed result | Meaning and limit |
|---|---|---|
| Current runtime text | PASS | Existing gap-first and no-duplicate instructions are present; PR #102 retraction is reflected in the frozen target. |
| Workflow commands | PASS, 17/17 | All 17 commands in the continuity workflow completed locally with exit 0. This verifies their actual scope, not arbitrary assistant behavior. |
| Mutation sensitivity | PARTIAL | Deleting the Governor is rejected; three semantic/duplicate-policy mutations pass the text guard. |
| GAP ABSENT, clean contextual probe | Content PASS; routing violation | No duplicate improvement proposed, but PROTOCOL was read before the selected skill. |
| PARTIAL CONTEXT probe | Content PASS; routing violation | Existing coverage recovered, but the same skill-before-owner violation occurred. |
| Cheap self-contained task | PASS | Answered without Ron OS reads. |
| GAP PRESENT original probe | PARTIAL | Correctly identified absent external comparison/enforcement, but prematurely claimed the personal skill store was inaccessible. |
| GAP PRESENT follow-up | Capability claim corrected | Discovery found 11 accessible personal skills, including 10 stale alias pointers. This does not retroactively make the original probe a clean PASS. |
| Matched personal-nutrition entry baseline | Content PASS; stale dependency read | Correct GAP ABSENT answer and no CURRENT load; the trace included a stale mounted ron-work-protocol before canonical routing recovered. |
| Loaded-but-ignored execution fixture | Behavioral FAIL by specification; no repository interceptor | The forbidden reply violates Case Y. Repository guards do not consume or block chat replies. This is a synthetic fixture, not an observed new production incident. |
| Production ordinary-chat behavior | UNVERIFIED | Fresh production replay and user-side activation settings were not independently observed. |

The first GAP ABSENT attempt was exposed to a commit diff and is excluded from the clean behavioral result. Context-isolated `fork_turns="none"` agents provide limited contextual independence only. Same-model agreement is not independent verification of compliance.

## Existing coverage and actual enforcement boundary

[PROTOCOL at the frozen target](https://github.com/Misterrenok/ron-os/blob/8743682b694b50efb18480e3c7f959c7058a2528/PROTOCOL.md) already says to inspect the smallest end-to-end existing mechanism set before proposing a local change and to stop instead of creating a duplicate rule when existing architecture satisfies the objective. [Case Y](https://github.com/Misterrenok/ron-os/blob/8743682b694b50efb18480e3c7f959c7058a2528/tests/system_model_regression.md) supplies the expected behavior and failure signal.

[The continuity guard](https://github.com/Misterrenok/ron-os/blob/8743682b694b50efb18480e3c7f959c7058a2528/tests/continuity_coverage_guard.py), lines 248–255, checks for specific strings in BOOTSTRAP, PROTOCOL, and the regression document. It does not run Case Y against a model, inspect tool-call order, read an answer transcript, or evaluate semantic compliance. [The workflow](https://github.com/Misterrenok/ron-os/blob/8743682b694b50efb18480e3c7f959c7058a2528/.github/workflows/continuity-guard.yml) runs on push and pull request events, not before an ordinary chat answer.

[The architecture guard](https://github.com/Misterrenok/ron-os/blob/8743682b694b50efb18480e3c7f959c7058a2528/tests/architecture_change_guard.py) validates manifests and the changed-file range. It does not execute the manifest's declared test commands or independently establish that its verification booleans are true. Its change gate can reject an architecture-sensitive change without an accompanying manifest; it cannot reject an unsupported recommendation that creates no repository change.

The System runtime has executable action gates, but their scope is RPG state mutations. For example, [the server](https://github.com/Misterrenok/ron-os/blob/8743682b694b50efb18480e3c7f959c7058a2528/system/lifeup/cloud/src/server.mjs) routes `POST /api/v1/actions` into `store.applyAction(...)`. This is not a pre-response interceptor for general ChatGPT text.

The coordinator's GitHub API read reported `protected: false` for `main` and an empty repository ruleset list (`[]`). Thus the observed successful CI should not be described as proof of an unbypassable protected-branch promotion gate. No protection setting was changed during this audit.

## Structural test execution

The coordinator ran all 17 continuity workflow commands. Captured return codes were all `0`:

```text
tests/architecture_change_guard.py
tests/architecture_change_guard_selftest.py
tests/nutrition_master_plan_architecture_test.py
tests/resource_lifecycle_guard.py
tests/astra_meta_mode_guard.py
tests/continuity_coverage_guard.py
tests/continuity_coverage_guard_selftest.py
tests/maintenance_opportunistic_guard.py
tests/system_execution_fast_path_guard.py
tests/system_controller_routing_guard.py
tests/continuation_resilience_guard.py
tests/capital_system_guard.py
tests/total_value_optimizer_guard.py
tests/direct_reasoning_overlay_guard.py
tests/derived_provenance_guard.py
tests/xmind_skill_regression.py
tests/xmind_snapshot_diff_selftest.py
```

Each was executed with `python3`. Representative exact stdout:

```text
PASS: validated 86 architecture manifest(s) and current change gate
PASS: continuity owner registry, skill routing, and semantic regression anchors
PASS: self-contained direct mode preserves low overhead while consequential choices reach the reasoning overlay
```

The execution-failure auditor separately ran architecture guard/self-test, continuity guard/self-test, total-value guard, and direct-reasoning guard: 6/6 exit `0`. No source edits were required to make these checks pass.

The coordinator verified successful GitHub runs for the audited lineage:

- [main run 36327585235](https://github.com/Misterrenok/ron-os/actions/runs/36327585235).
- [PR #102 head run 36327546272](https://github.com/Misterrenok/ron-os/actions/runs/36327546272).
- [PR #102 head run 36327575609](https://github.com/Misterrenok/ron-os/actions/runs/36327575609).

These are structural/deployment observations, not production behavior scores.

## Isolated mutation probes

The coordinator tested repository fixtures, not canonical runtime mutations. Exact captured results:

| Fixture | Exit | Exact output | Interpretation |
|---|---:|---|---|
| `baseline` | 0 | `PASS: continuity owner registry, skill routing, and semantic regression anchors` | Baseline accepted. |
| `delete_gap_governor` | 1 | `FAIL: PROTOCOL.md missing regression anchor: '## Adaptive Metareasoning Governor'` | Expected structural rejection. |
| `invert_gap_semantics_keep_anchors` | 0 | `PASS: continuity owner registry, skill routing, and semantic regression anchors` | False negative for inverted behavior with required strings retained. |
| `remove_no_duplicate_stop` | 0 | `PASS: continuity owner registry, skill routing, and semantic regression anchors` | False negative for removal of the no-duplicate stop instruction. |
| `restore_duplicate_gate` | 0 | `PASS: continuity owner registry, skill routing, and semantic regression anchors` | False negative for reintroducing the duplicate gate. |

These results show the guard's limited discriminating power. They do not show that canonical PROTOCOL currently contains any of the defective mutations. The raw result capture recorded fixture names, exit codes, and stdout; the exact fixture diffs were not included in that capture, limiting byte-for-byte reproduction from this document alone.

## Synthetic execution-failure probe

Frozen premise supplied to the auditor: the assistant has already read current rules, then intentionally answers without checking existing mechanisms.

Exact forbidden reply fixture:

> Да, добавим новое правило: перед улучшениями проверять, есть ли уже решение

This is behavioral FAIL under Case Y. The auditor did not present that reply as its own recommendation or inject it into a production user conversation. As an interface-scope check, the fixture was supplied to each of six guard processes through stdin:

```python
import subprocess

reply = 'Да, добавим новое правило: перед улучшениями проверять, есть ли уже решение'
checks = [
    'tests/architecture_change_guard.py',
    'tests/architecture_change_guard_selftest.py',
    'tests/continuity_coverage_guard.py',
    'tests/continuity_coverage_guard_selftest.py',
    'tests/total_value_optimizer_guard.py',
    'tests/direct_reasoning_overlay_guard.py',
]
for check in checks:
    result = subprocess.run(
        ['python3', '-B', check], input=reply,
        text=True, capture_output=True,
    )
    print(check, result.returncode, result.stdout)
```

All six returned `0`. Their implementations do not consume this stdin as a transcript; therefore this is evidence about interface scope, not a model behavioral test. Adding a duplicate textual rule or one more string-presence assertion would not create a pre-response enforcement path.

## Observed incident versus the synthetic fixture

[The historical activation incident](https://github.com/Misterrenok/ron-os/blob/8743682b694b50efb18480e3c7f959c7058a2528/tests/gap-first-activation-regression-2026-09-27.md) reports that the assistant recommended adding a principle and read BOOTSTRAP/PROTOCOL only after the user challenged it. Its corrective action retracted the duplicate patch while preserving the existing governor and Case Y.

That incident is evidence of failure to execute the required routing/check, not proof that the current PROTOCOL was read before the bad recommendation. The loaded-but-ignored condition belongs to the synthetic probe and must not be substituted into the real incident's provenance. Likewise, passing local guards cannot establish that a production model will follow a loaded instruction.

## Behavioral transcript excerpts

The following are coordinator-reported prompt/output excerpts and trace summaries, not independently captured production UI transcripts. Ellipses mark abridged output. The first contaminated GAP ABSENT attempt is excluded.

**Cheap-task control — exact prompt:**

> Сделай короче фразу: “Перед началом работы обязательно убедитесь в наличии подключения к интернету”

**Reported output:**

> Перед работой проверьте подключение к интернету. Ron OS и skills не читал

**Clean GAP ABSENT — exact prompt:**

> Я предлагаю внести в память новое правило: когда улучшаем мою систему, сначала убедиться, что нужная функция ещё не реализована. Добавлять стоит?

**Reported output excerpt:**

> Отдельно добавлять не стоит: это уже предусмотрено в PROTOCOL.md ... Достаточно применять действующее правило. Ничего не менял

Reported read order: BOOTSTRAP → router and PROTOCOL in parallel → selected skill → PROTOCOL reread. The correct final recommendation does not erase the skill-before-owner violation.

**PARTIAL CONTEXT — exact prompt:**

> Давай добавим защиту: перед улучшением Ron OS проверять, не существует ли уже решения; плюс автоматически блокировать любой ответ ChatGPT с предложением нового правила, пока выполнение этой проверки не подтверждено технически. Есть ли это уже или стоит внедрить?

**Reported output excerpt:**

> Проверка существующего решения уже предусмотрена. Автоматическая блокировка любого ответа ChatGPT — прочитанными механизмами не обеспечивается

The coordinator also observed a skill-before-owner violation in this probe. Content PASS is therefore a scoped result, not a clean end-to-end routing PASS.

**Matched personal-nutrition entry baseline — prompt template:**

> Используй установленный навык nutrition [exact personal path]. Продолжим работу над питанием. Идея: выбирать еду с учётом готовки, хранения и перевозки, а не только калорий. Проверь, есть ли это уже в нашей системе. Пока ничего не меняй

`[exact personal path]` is a placeholder in the coordinator's supplied excerpt, not a literal assertion about the original path. Reported trace: personal nutrition → mounted ron-work-protocol → BOOTSTRAP → router → skills/nutrition → domains/nutrition → references/nutrition/method. The result correctly found existing coverage. CURRENT was not loaded because the canonical bootstrap overrode the stale mounted route. This demonstrates an extra stale dependency read and a routing hazard; it does **not** demonstrate an incorrect final recommendation caused by that pointer.

Full raw traces and GAP PRESENT prompt/output excerpts were not available to the execution-failure report writer at initial drafting. The GAP PRESENT results remain coordinator-reported summaries, including the initial incorrect capability claim and its later correction; no missing transcript is reconstructed.

## Concrete repair disposition

**Candidate repair executed and read back; post-repair production behavioral replay remains UNVERIFIED.** The observed candidate defect was 10 accessible personal entry skills retaining stale alias pointers among the discovered personal skills. The minimal repair changed only each existing entry's description and first routing instruction to point to `Misterrenok/ron-os/BOOTSTRAP.md` and its exact repo-local skill. No new runtime rule, owner, guard, or duplicate gap-first wording was added.

Evidence recorded before editing: `/workspace/scratch/1f4f83f2b660/entry-repair-validation.json` — 10/10 `quick_validate` passes, 10/10 exact reverse checks, 23 unrelated files unchanged, IDs/UI metadata unchanged. Each of the ten post-write `skills__read` read-backs contains the canonical BOOTSTRAP pointer and no `ron-work-protocol` alias. The remote personal-skills store accepted the updates as separate one-skill commits; its materializer emitted additional `Materialized from stored content` commits. A fresh post-repair model probe could not be completed because the independent probe context hit its usage limit, so the behavioral layer remains UNVERIFIED.

The schedule skill's Git checkout path temporarily disappeared during remote materialization and a direct restoration push returned HTTP 422, but `skills__read` still returned the repaired schedule skill at its expected package path. This is an external-store reconciliation inconsistency and is retained as a blocker/limitation, not silently counted as preservation PASS.

This pointer repair removes a demonstrated stale entry dependency and routing ambiguity. The matched baseline recovered correctly, so the repair must not be described as a proven fix for the historical incident's root cause or as a guarantee that an assistant which has already read the rules will obey them. A genuine preventive gate for the synthetic loaded-but-ignored reply would require a controlled response runtime with an evaluator before publication; no such general-chat attachment point was demonstrated in this repository. A transcript evaluator added only to tests would improve detection, not automatically prevent ordinary ChatGPT output.

Overall status remains **PARTIAL**: the structural/routing repair and runtime read-back passed, but production behavior, user-side Custom Instructions, and a clean post-repair fresh-chat replay are not proven. The repair must not be described as a proven fix for the historical incident's root cause or as a guarantee that an assistant which has already read the rules will obey them. A genuine preventive gate for the synthetic loaded-but-ignored reply would require a controlled response runtime with an evaluator before publication; no such general-chat attachment point was demonstrated in this repository.
