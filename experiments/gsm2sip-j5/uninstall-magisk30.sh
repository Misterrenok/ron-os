#!/system/bin/sh
MODDIR="${0%/*}"
# Clean up only if the module itself created the temporary binary.
if [ -f "$MODDIR/.j5_created_local_tinymix" ] && [ -f /data/local/tmp/tinymix ]; then
  if cmp -s "$MODDIR/tinymix32" /data/local/tmp/tinymix; then
    rm -f /data/local/tmp/tinymix
  fi
fi
