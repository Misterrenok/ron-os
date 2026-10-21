#!/system/bin/sh
# Verified-user pilot: Galaxy J5 SM-J510FN / Android 7.1.2 / arm32.
if [ "$API" != "25" ]; then
  abort "! Requires Android 7.1.x (API 25); got $API"
fi
if [ "$ARCH" != "arm" ]; then
  abort "! Requires ARM 32-bit; got $ARCH"
fi
J5_MODEL=$(getprop ro.product.model)
case "$J5_MODEL" in
  SM-J510FN|sm-j510fn) ;;
  *) abort "! Requires SM-J510FN, found $J5_MODEL" ;;
esac
ui_print "- Installing Android 7 GSM2SIP pilot for SM-J510FN"
ui_print "- Existing dialer, SIM, system properties and SMS remain unchanged"
mkdir -p "$MODPATH/system/bin"
cp "$MODPATH/tinymix32" "$MODPATH/system/bin/tinymix" || abort "! ARM32 tinymix staging failed"
set_perm "$MODPATH/system/bin/tinymix" 0 2000 0755
set_perm "$MODPATH/tinymix32" 0 0 0755
set_perm "$MODPATH/tinymix" 0 0 0755
set_perm "$MODPATH/tinycap" 0 0 0755
set_perm "$MODPATH/service.sh" 0 0 0755
set_perm "$MODPATH/uninstall.sh" 0 0 0755
ui_print "- Reboot; keep the stock dialer until a safe audio test"
