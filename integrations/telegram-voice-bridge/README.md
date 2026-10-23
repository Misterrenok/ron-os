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
→ native Hermes AIAgent with existing configured credentials/provider →
Russian neural speech → paced external NTgCalls PCM frames. Edge Svetlana and
offline Silero v5.6 are supported; the active backend and local speaker are set
in private VPS configuration. A local primary is warmed before readiness.
The fallback direction follows
`tts_backend`: local failures fall back to Edge; Edge failures fall back to local.
Install CPU-only torch from requirements-local-tts.txt and cache the official
v5_6_ru.pt model before enabling local speech. Edge sends response text to
Microsoft's speech endpoint; STT and Silero speech run locally. No paid speech
API is configured.

Set `stream_answers=true` to speak complete sentences while native Hermes is
still generating its response. Currently enabled only for the phase-aware
`codex_responses` route: native reasoning and commentary are excluded. Other
providers keep full-answer delivery. Barge-in cancels the entire remaining
speech stream while native inference and conversation history finish normally.
The IPC has a total turn deadline and a bounded sentence queue. A native stream
probe checks exact final-text agreement and a real harmless terminal-tool turn;
full PCM replay separately checks interruption and spoken answers before deploy.

Optional `thinking_cues=true` pre-renders three short Edge phrases in RAM using
the configured voice. After `thinking_cue_delay` (default 0.9 seconds of native
waiting), one cue may play if no text has arrived. `thinking_cue_interval`
(default 15 seconds) limits repetition across turns. Cue audio never overlaps
answer audio, never enters conversation history, and follows the same barge-in
cancellation. A cue already being spoken finishes before the answer; its duration
is bounded to two seconds. Failed cue preparation leaves normal replies working.
Cue onset is logged separately from first answer audio, so it cannot falsely
improve answer-latency measurements. No caller audio is cached.

All speech audio and call history in the bridge
are memory-only. Hermes' own storage policy applies to its agent turns.

VAD keeps listening while an answer runs. Speech capture starts after 90 ms;
raw VAD activity never stops or pauses a reply. Independent bounded STT
processing confirms interruption from a meaningful transcript or explicit
«стоп». Short fragments and backchannels («угу», «а», «да») during playback
or generation are ignored. Single-word answers still work when idle. Low
confidence/no-speech ASR segments are rejected. Confirmation is intentionally
slower than raw acoustic cancellation. The endpoint hangover remains 540 ms.
Replies no longer wait for arbitrary VAD activity to end. Native inference
survives confirmed interruption; a pure stop command does not request another
answer. Audio and recognized-text queues each retain the latest two items.
One active call and an
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
readiness. A recognized meaningful interruption cancels speech. Inference continues across barge-in; only
call teardown or a failed/timed-out agent request cancels the native worker.

Keep issue #170 open until these pass. A ready control socket proves only that
the daemon connected to MTProto, not that Telegram media works.

`voice_reasoning_effort` scopes `low`/`none` to this native voice worker only.
The optional synthetic effort benchmark selects `none` only with exact final
stream agreement, correct arithmetic, and >=20% lower median native latency;
provider errors or no measured gain retain `low`. The real native tool-turn
probe and full speech replay still gate deployment. Main Hermes config stays
unchanged. This does not promise instantaneous end-to-end calls.
