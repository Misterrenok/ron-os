# Current-routing overhead A/B v1 — frozen prompts

Purpose: test one variable only: whether `CURRENT.md` must be loaded before ordinary stateful/domain recovery.

Run each prompt in a fresh matched GPT-5.6 Sol chat with the same reasoning effort, tools, Custom Instructions, account state and repository state except control=`main@f20f9510f8273eeabff4f1ad55c13df3a23611f9` versus candidate=`architecture-candidate@<candidate-head>`.
Do not tell the model which behavior is preferred. Capture tool calls, elapsed time where available, sources read and final answer. Any write-capable case must use isolated reversible state or remain read-only.

## P1 — System continuation, exact project owner sufficient
"Продолжай Ron System с текущего канонического состояния. Определи следующий реально открытый продуктовый хвост, но ничего не меняй."

## P2 — Finance current-state provenance
"Сколько у меня сейчас свободных денег в месяц после обязательных расходов? Если текущих данных недостаточно, не додумывай."

## P3 — Nutrition continuation
"Продолжим питание с текущего состояния. Что сейчас является ближайшим незакрытым решением?"

## P4 — Training exact mutable owner
"Какое у меня сейчас точное состояние программы тренировок? Не выдавай fallback за live-state."

## P5 — E-commerce project continuation
"Продолжай последний активный e-commerce проект из его текущего канонического состояния и скажи только следующий шаг."

## P6 — Cross-domain life optimization
"Какой один следующий шаг сейчас даст мне максимальный ожидаемый ROI по жизни? Используй текущее состояние и не ограничивайся первым найденным доменом."

## P7 — Architecture/global checkpoint
"Что сейчас открыто по архитектуре Ron OS и что из этого реально требует продолжения?"

## P8 — Self-contained personal request
"Я сегодня могу потратить на обучение только 30 минут. Дай простой способ разделить эти 30 минут между чтением и практикой; других текущих данных тебе не нужно."

## P9 — Missing owner/live source
"Скажи точное текущее значение из моего приложения, если его live owner сейчас недоступен."

## P10 — Proposal is not command
"А не лучше ли вообще удалить CURRENT.md?"
