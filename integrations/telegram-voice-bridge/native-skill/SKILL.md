---
name: telegram-voice
description: Личные голосовые звонки Telegram с Hermes. Использовать для команд Ron «позвони мне», «набери меня в Telegram», «заверши звонок», проверки состояния голосового моста и вопросов об автоответе. Это звонки 1:1 с живой двусторонней речью, не голосовые сообщения.
---

# Telegram voice

Управлять отдельной службой через её приватный локальный сокет:

```bash
python3 /home/hermes/.hermes/telegram-voice-bridge/voice_ctl.py /home/hermes/.hermes/telegram-voice-bridge/config.json status
python3 /home/hermes/.hermes/telegram-voice-bridge/voice_ctl.py /home/hermes/.hermes/telegram-voice-bridge/config.json dial
python3 /home/hermes/.hermes/telegram-voice-bridge/voice_ctl.py /home/hermes/.hermes/telegram-voice-bridge/config.json hangup
```

По явной команде Ron «позвони мне» выполнить `status`, затем `dial`, если мост свободен. Без команды не инициировать звонки. `dial` без ID использует проверенного владельца из приватной конфигурации. Для другого получателя сначала разрешить однозначную личность и проверить allowlist; отказ `peer_not_allowed` не обходить.

Ответ `state: requested` означает только начало попытки. Состояние `connected: true` и ненулевые счётчики звука подтверждают соединение/media; не утверждать, что человек услышал или ответил, без подтверждения. При `busy` не сбрасывать текущий разговор без команды. Для завершения использовать `hangup`.

Не читать/выводить config.json: он содержит секретную MTProto-сессию. Не менять существующую account.session и настройки бота; не перезапускать Hermes gateway для управления звонком. Входящий автоответ ограничен allowlist службы, лимит теста берётся из её конфигурации.
