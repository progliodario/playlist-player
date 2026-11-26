#!/usr/bin/env bash
# Smoke test of the APK on a running emulator or phone (adb): installs it, opens the app
# (Trusted Web Activity), then the native player with a one-track queue, then sends it to
# the background. Fails if the app process crashed ("Playlist Player keeps stopping").
#
# Usage: android/scripts/smoke-test.sh <apk> [output dir]
# Used by .github/workflows/android-smoke.yml; also works with a phone connected over USB.
set -u

APK="$1"
OUT="${2:-smoke-output}"
PKG=io.github.progliodario.playlistplayer
mkdir -p "$OUT"

adb wait-for-device
adb shell getprop ro.build.version.release | sed 's/^/Android /'
adb uninstall "$PKG" > /dev/null 2>&1 || true
adb install "$APK" || exit 1
adb logcat -c
adb logcat -b crash -c 2> /dev/null || true

step() {
  echo "::group::$1"
  shift
  "$@"
  sleep 25
  adb exec-out screencap -p > "$OUT/$(date +%s)-${STEP_NAME}.png" || true
  echo "::endgroup::"
}

# 1. The app as the user opens it from the launcher.
STEP_NAME=launcher step "Open the app" \
  adb shell am start -W -a android.intent.action.MAIN -c android.intent.category.LAUNCHER \
  -n "$PKG/com.google.androidbrowserhelper.trusted.LauncherActivity"

# 2. The native player, as the web app opens it (src/platform/android-player.ts).
PAYLOAD='{"v":1,"title":"Smoke test","kind":"music","start":0,"position":0,"shuffle":false,"order":null,"repeat":"off","autoplay":true,"tracks":[["jNQXAC9IVRw","Me at the zoo","jawed",19]]}'
STEP_NAME=player step "Open the native player" \
  adb shell am start -W -a android.intent.action.VIEW -d playlistplayer://play \
  -n "$PKG/.player.PlayerActivity" --es payload "'$PAYLOAD'"

# 3. Screen of the player gone: playback goes on in the background service.
STEP_NAME=background step "Send the app to the background" adb shell input keyevent KEYCODE_HOME

adb logcat -d > "$OUT/logcat.txt"
adb shell dumpsys activity services "$PKG" > "$OUT/services.txt" 2>&1 || true

CRASHES=$(adb logcat -d -b crash 2> /dev/null; grep -A 40 'FATAL EXCEPTION' "$OUT/logcat.txt")
if grep -q "Process: $PKG" <<< "$CRASHES"; then
  echo "::error::The app crashed. Stack trace:"
  echo "$CRASHES"
  exit 1
fi
echo "No crash of $PKG."
grep -E "PlaybackService|ExoPlayer|MediaSession" "$OUT/logcat.txt" | tail -20 || true
