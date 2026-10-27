# GSM2SIP J5 v1.3.2 digital-only experiment — 2026-10-27
Status: BUILT / UNTESTED ON DEVICE. This is NOT a confirmed working GSM↔SIP bridge.

Goal confirmed by user: dedicated J5 is GSM-to-SIP gateway, A55 Linphone is sole desired voice mic and listening endpoint. Physical J5 mic/speaker must not substitute for the GSM modem digital audio path.

Previous v1.3.1 call logs: actual profile selected, mixer VOC_REC_DL/UL MultiMedia1 and incall_music MM2 On, but VOICE_DOWNLINK source returned 100 consecutive near-silent frames and fell back to VOICE_RECOGNITION physical J5 mic, while audio decoded/play reached J5 without proven modem injection. Asterisk 105/106 signaling and RTP function. Do not mistake RTP packet counts for voice-bearing digital GSM bridge.

v1.3.2 branch: `experiment/gsm2sip-j5-hal-vsid-digital` built by GitHub Actions run 40554566286, all build/package/upload steps succeeded. Magisk v1.3.2 versionCode 379, same module id `sip-gsm-gateway`. Artifact `gsm2sip-j5-v132-digital-audio-test` within workflow and ZIP.

Changes (experimental):
- QCOM voice_extn ACTIVE VSID 0x10c01000 (hex prefix required by libcutils strtol(base0)); RtpSession already issues call_state=2 before opening AudioRecord and resets to 1 when releasing.
- J5-specific digitalCaptureOnly true: prevent application from using physical MIC/VOICE_RECOGNITION/CAMCORDER if digital downlink remains unavailable. This does **not** by itself mute the separate phone GSM physical uplink; do not claim only A55 mic is proven.
- J5-specific captureSilenceFrames 300 (~6s). Active digital capture still must be verified.
- Show A55↔J5 playback AudioTrack routed device, capture route, HAL VSID activation in app journal.
- Old v1.3.1 and all generic profiles unaffected. Oracle Asterisk and A55 Linphone settings untouched.

Outstanding: Android Qualcomm vendor HAL may not expose desired TelephonyTx output, and AudioTrack may still be physically routed to handset. Do not force mic mute using Android isMicrophoneMute=true until confirmed it does not also mute injected SIP→GSM audio. No remote control path from Oracle to physical J5 exists; requires user to install Magisk test ZIP on J5 and reboot.
Success condition: with external third phone connected over GSM, GSM caller speech heard on A55 and A55 speech heard on external phone; J5 mic/speaker do not provide an acoustic workaround. Compare logs `HAL call_state=2 vsids=[0x10c01000]`, `Capture: source=VOICE_DOWNLINK`, `Playback route: ...`, and nonzero `rawCapRMS` while GSM party speaks. If failure, inspect full call HAL logs for `voice_extn`, active sessions, audio route, and link; do not randomly modify server codec.
SMS permission warnings separate and unresolved; default dialer state may impact SMS reception.

Generated ZIP tested locally: SHA256 ddd421cf67c9e067c2b5da04154cee7436c0278ea4d563fefa4a5387db6e49b8, inner ZIP integrity and workflow SHA256SUMS OK. Rollback Magisk v1.3.0 original ZIP separately verified.
