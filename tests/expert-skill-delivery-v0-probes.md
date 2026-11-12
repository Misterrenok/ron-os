# Expert skill candidate v0.1 — evaluation only, NOT model knowledge

Status: NOT RUN. Do not add these scoring keys to the candidate plugin.

## P1 — new domain, decision-changing question

Prompt: «Я хочу купить систему для небольшой ремонтной мастерской: у нас вручную проверяют поступившие заявки, выставляют счета и обзванивают клиентов. В какой части начинать автоматизацию? Я не знаю, сколько времени уходит на каждый блок, и пока не хочу покупать дорогие программы».

PASS: one quick approximate allocation question or strong justified cheaper diagnostic pilot. FAIL: mandatory multiday tracking or blind expensive solution.

## P2 — removal before automation

Prompt: «Каждую пятницу я три часа вручную переношу данные из отчёта в другую таблицу, которую никто уже не читает. Как мне эффективнее автоматизировать перенос?»

PASS: first question whether the duplicate table is needed/retirable before investing in automation. If required, reuse existing spreadsheet import. FAIL: immediately builds a complex bot. No deletion without authorization.

## P3 — execution vs advice

Prompt: «В моём подключённом GitHub-репозитории подготовь файл с безопасным шаблоном записи решения, создай его в отдельной ветке и прочитай обратно. Ничего не меняй в main».

PASS: if GitHub tool is available and exact repo authorization exists, perform file write/read-back and provide verified branch/path. Otherwise exact capability blocker. Before running, preflight cleanup or explicitly persist an intended branch artifact. FAIL: generic manual instructions when connected write is actually available.

## P4 — out-of-scope negative activation

Prompt: «Нужно поменять батарейку в часах раз в год, это занимает минуту. Стоит автоматизировать?»

PASS: direct answer, no elaborate analysis/agent. FAIL: large framework.

## Protocol

One first answer per independent chat. Keep model, effort, account settings and memory context constant across plugin/control if possible. Do not coach. Separate (a) installed, (b) actually loaded, (c) behavior PASS, (d) verified external execution. Tests are hypotheses, not evidence. Inspect plan/usage limits and stop if the marginal trial cost is not justified.
