# J5 MSM8916 audio test observations — 2026-10-27

State: **FAILED / OPEN**, experiment only. No fix verified.

Device: Samsung J5 SM-J510FN, Android 7.1.2, msm8916. Existing privileged GSM2SIP experimental Magisk 1.3.1 build. User-reported GSM↔SIP bridging not functioning; do not mark resolved.

Evidence from actual J5 app log at 20:22, 20:25, 20:26 local:
- Runtime selects `Galaxy J5 MSM8916 (experimental)`, as intended.
- During bridged GSM call, `Incall_Music Audio Mixer MultiMedia2: On`, `MultiMedia1 Mixer VOC_REC_DL: On` and `UL: On`. This is mixer control state, **not proof of HAL PCM routing**.
- `VOICE_DOWNLINK rate=8000 gain=6x` starts, then `Source VOICE_DOWNLINK SILENT (100 non-echo frames) — trying fallback` after ~2s in **all three calls**.
- Falls back to `VOICE_RECOGNITION` (physical microphone source); `rawCapRMS=6–51`, `capRMS=0–310`, `fwd` increments due to lower noise gate.
- RTP `tx/rx/play` increments, showing packet transport works. `playRMS=0–16` most of the time (occasional 151), indicating nearly silent decoded signal at logged instants; unknown if A55 user was speaking during those instants.
- Independent Phoenix Asterisk confirmed CDRs at 17:22, 17:25 and 17:26 UTC, both 105 and 106 registered and RTP firewall accepts UDP 10000:10019.
- User's prior test on v1.3.0: audio from J5 physical microphone heard on A55 and audio from A55 heard on J5, but neither side heard the external GSM party, and that party heard neither side.
- User earlier verified CAPTURE_AUDIO_OUTPUT granted=true, `voice.record.conc.disabled=false`, `voice.voip.conc.disabled=false`, `voice.playback.conc.disabled=false`, `mixer_paths.xml` has `incall-rec-downlink` on MultiMedia1 and `incall_music_uplink` on MultiMedia2.
- SMS RECEIVE/SEND grants continue to fail; warnings indicate SMS features nonfunctional and **incoming SMS can be dropped** while this app is the default dialer. This is an independent unresolved problem.

Likely diagnosis: app captures mic instead of modem digital downlink; injected AudioTrack not proven routed to modem uplink. QualComm AOSP HAL `voice_check_and_set_incall_rec_usecase` only enables incall recording when `voice_is_call_state_active(adev)` is true. This is a **hypothesis for this ROM**, not yet measured; see `android.googlesource.com/platform/hardware/qcom/audio/.../hal/voice.c`.

Next smallest safe diagnostic: while J5 logcat ring still contains the attempted call, use privileged `logcat -d` filtering for `voice_extn`, `voice call not active`, `Audio init`, `Preferred device -> TELEPHONY`, `No TYPE_TELEPHONY`, `Playback started`, `Capture routedFrom`, `incall_music`, `in-call recording` and `audio_hw_primary`. A subsequent planned test could snapshot AudioFlinger/PCM activity during a controlled call without recording payload. **Do not randomly change Asterisk, codecs, Magisk or HAL call state.** Old v1.3.0 and test v1.3.1 Magisk archives available from prior GitHub workflow artifacts (beware artifact expiration). Confirm rollback before risky device changes.

The isolated test build was compiled on branch `experiment/gsm2sip-j5-msm8916-audio` (workflow run 40546803823, GitHub success). No changes to production Ron OS `main`.

## 2026-10-27 20:41 local: user-provided logcat fragment

The pasted excerpt shows **20:39:22**: `audio_hw_primary start_output_stream: usecase(1: low-latency-playback) devices(0x2)`; `select_devices: out_snd_device(2: speaker)`, `in_snd_device(0: dummy)`. This establishes a **speaker-directed low-latency output at 20:39**, but **does not identify its client or associate it with the GSM2SIP calls at 20:22–20:28**. Do not mark this as a confirmed gateway route. Paste is truncated after a partial `enable_audio_route` log line.

Source inspection: experimental J5 profile has `playbackBufferMs=0` and `playbackLowLatency=false` defaults, `incallMusicBeforeTrack=true`, `playbackToTelephonyTx=true`. Underlying Android/QCOM 7.1 msm8916 HAL has **different** PCM mappings for low-latency, deep-buffer and multi-channel (`platform.c`, AOSP tag android-cts-7.1_r20); do not assume switching to deep-buffer necessarily selects the required MultiMedia2.

Smallest next evidence: filter `logcat -d` to 20:22–20:28 for `Audio init:`, `Playback started`, `Preferred device -> TELEPHONY`, `No TYPE_TELEPHONY`, `Capture routedFrom`, `voice_extn` and audio_hw output. If previous log wrapped, gather a fresh *during-call* filtered log and distinguish the Gateway's AudioTrack from other app outputs. No further APK or mixer writes justified solely by the 20:39 output.
