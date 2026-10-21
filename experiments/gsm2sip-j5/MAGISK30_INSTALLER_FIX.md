# GSM2SIP J5 Android 7 / Magisk 30.6 installer correction

The original GitHub Actions build (before this correction) **compiled the Android 7 app** but bundled an invalid *legacy* Magisk installer using `install.sh` without the callbacks expected by Magisk 30.6. APK compile success does not establish installability.

Updated packaging uses `customize.sh` following the Magisk 30.6 official module installer implementation. It:
- Rejects unsupported API, CPU ABI and device model.
- Installs the existing compiled APK systemlessly via `system/priv-app/Gateway`.
- Does not alter the stock dialer automatically.
- Does not hide PermissionController or change SMS delivery/notifications.
- Omits `system.prop` during the first conservative pilot, so in-call audio may require later device-specific tweaks.
- Preserves an existing `/data/local/tmp/tinymix` binary.
- Cleans up only its own copied `tinymix` on uninstall.
- Avoids automatic change to Magisk root permissions policy.

The existing Axet Call Recorder module may compete for telephony audio capture; temporarily disable recording for the *audio test*, not as a permanent policy. Extreme Gms Doze remains untouched unless actual SIP registration loss is observed.

**UNKNOWN**: device compatibility, real-time GSM↔SIP digital audio, correct foreground/background service behavior and custom ROM integration. Before installing any privileged module verify a usable custom recovery backup. Rollback is restore stock dialer → disable/remove module → reboot, or recover from verified backup if device fails to boot.

No IMEI change. Standard SIM calls remain billed according to the operator tariff.
