# Hermes personal Telegram voice bridge

Work in progress for ron-os issue #170. **Not accepted until a real two-way
Telegram call has passed the checklist below.** Unit tests do not prove media,
STT quality, TTS delivery, provider availability, or conversation latency.

Uses PyTgCalls 3.0.0 / NTgCalls 3.0.5 for 1:1 signaling and external PCM in both
directions. gotd/td was examined: it currently omits Telegram reflector support,
so direct ICE is required. Native NTgCalls avoids that known constraint.

The existing bot is not touched. Bootstrap privately from the existing authorized
Telethon session, then isolate_session.py uses Telegram acceptLoginToken to
authorize an independent voice connection for the same account. No QR display
or new phone-code request is involved. The voice daemon never opens or writes
the original SQLite session; its separate auth key avoids competing for updates.

Pipeline: Telegram decrypted PCM → bounded VAD → local faster-whisper CPU int8
→ native Hermes AIAgent with existing configured credentials/provider → Edge
Russian neural speech (Svetlana) → paced external NTgCalls PCM frames. The first
Dmitry voice failed NoAudioReceived on the VPS; Svetlana returned real audio.
An offline Silero v5.6 Russian neural voice is the fallback if Edge fails.
Install CPU-only torch from requirements-local-tts.txt and cache the official
v5_6_ru.pt model before enabling that fallback. Edge receives response text at
Microsoft's speech endpoint; STT and fallback TTS run locally. No paid speech
API is configured.

All speech audio and call history in the bridge
are memory-only. Hermes' own storage policy applies to its agent turns.

VAD keeps listening while an answer runs. Remote speech cancels audible playback
without cancelling STT or killing the warm Hermes worker. Completed utterances
wait in a bounded two-item queue; overflow retains the latest two. Replies wait
for the current utterance to end before playback. One active call and an
explicit positive Telegram-user allowlist are mandatory. Unknown callers are
not automatically answered. Initial max duration is 60 seconds, from connection;
connection timeout is 35 seconds.

## Private installation contract

Install as an isolated venv under `/home/hermes/.hermes/telegram-voice-bridge`.
Do not replace the existing MTProto client's dependencies or session. Pre-download
the configured faster-whisper model; daemon uses `local_files_only=True` so service
startup cannot surprise-download model weights. Keep config.json mode 0600,
owned by hermes, out of git. It must contain api_id, api_hash, session_file (independent voice SQLite authorization),
allowed_peers (verified owner ID), runtime_dir (`/run/telegram-voice-bridge`),
stt_model (local directory), hermes_command (private native launcher), voice,
language and max_call_seconds=60. Existing systemd unit example is a template;
adapt repository/venv paths and required writable directories after live inspection.

Use voice_ctl.py CONFIG status / dial [ALLOWED_PEER] / hangup. Only the service
user can access the private 0600 Unix control socket. Install `native-skill/SKILL.md` into the existing Hermes skills directory as
`telegram-voice/SKILL.md` for owner-commanded outbound calls. No public admin listener.

## Acceptance (all required)

- [ ] Original bot text and voice-message operations before and after.
- [ ] Existing test user session refreshed/authorized; no QR required by default.
- [ ] Service active, enabled, restart/recovery observed; safe journal output.
- [ ] Incoming owner call auto-answered; unknown caller not answered.
- [ ] Outgoing owner call seen and accepted.
- [ ] Actual nonzero incoming/outgoing media counters in each direction.
- [ ] Two different spoken questions understood and two audible relevant answers.
- [ ] Interrupt an answer, hear it stop, then receive the next relevant answer.
- [ ] Automatic test hangup at 60 seconds; local/remote hangup and repeat call.
- [ ] Record observed latency and user's confirmation, not inferred success.

The native Hermes worker stays warm between turns; it is preloaded before service
readiness. Barge-in cancels speech immediately. Inference continues across barge-in; only
call teardown or a failed/timed-out agent request cancels the native worker.

Keep issue #170 open until these pass. A ready control socket proves only that
the daemon connected to MTProto, not that Telegram media works.
