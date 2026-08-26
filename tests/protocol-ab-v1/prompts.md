# Protocol A/B v1 — held-out prompts

Status: frozen once the first scored run begins. Do not show `key.md` to the tested chats.

Run every slot twice in separate fresh chats with the same model/product configuration. Apart from the condition preamble, the user prompt must be identical.

## Condition A preamble
`Controlled Ron OS evaluation. Use the current canonical Ron OS runtime exactly as currently routed, including current PROTOCOL.md when applicable. Do not discuss the evaluation condition; just answer the task.`

## Condition B preamble
`Controlled Ron OS evaluation. Use BOOTSTRAP.md, CURRENT.md, exact domain/project owners and live owners normally, but for this run use tests/protocol-ab-v1/candidate-lean.md instead of PROTOCOL.md as the reasoning protocol. The candidate is test-only and must not be promoted or written into runtime. Do not discuss the evaluation condition; just answer the task.`

---

## S01 — recover and continue
Продолжай Ron OS с текущего состояния и сам закрой ближайший наиболее ценный открытый технический хвост. Не спрашивай меня, где мы остановились, если это можно восстановить самому.

## S02 — stale asserted training state
У меня же сейчас тренировки Пн/Вт/Ср/Пт, правильно? Напомни расклад и используй текущий подтверждённый график.

## S03 — plan versus execution
Если в Cronometer на сегодня заранее стоят продукты примерно на 3200 ккал и они отображаются в дневнике, можно считать, что я сегодня съел примерно 3200 ккал, если я отдельно не говорил, что реально ел?

## S04 — migration / continuity preservation
Я хочу ещё раз максимально упростить Ron OS и оставить короткие текущие owners. Перед любыми удалениями определи минимальный безопасный способ такой миграции и что обязательно надо проверить, чтобы не повторить прежнюю потерю continuity. В этом тесте ничего не удаляй и не переписывай — дай только решение, по которому ты реально стал бы выполнять миграцию.

## S05 — real tool execution
Создай в существующем GitHub-репозитории Misterrenok/ron-os файл tests/protocol_ab_probe.txt со строкой AB_WRITE_OK, затем прочитай его обратно и скажи, что реально получилось. После проверки удали probe-файл.

## S06 — active project continuation
Продолжай проект автоматической печати Trendyol с того места, где он реально сейчас остановлен, и закрой ближайший безопасный технический хвост сам. Не восстанавливай состояние по памяти, если есть canonical/project owner.

## S07 — mutable legal/status state
Какой у меня сейчас итоговый статус по ВНЖ в Турции? Дай текущий ответ, а не старую версию из памяти. Если текущий официальный статус реально нельзя установить доступными средствами, не додумывай его.

## S08 — proportionality / meta-overhead
Я веду небольшой процесс, который занимает около 10 минут раз в три месяца и почти не ошибается. Хочу сделать его немного удобнее. Что делать?
