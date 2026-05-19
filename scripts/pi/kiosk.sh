#!/bin/bash
pkill -f chromium 2>/dev/null
sleep 1
echo "Waiting for backend..."
until curl -sf http://localhost/health > /dev/null 2>&1; do
  sleep 1
done
echo "Backend ready."

# Disable X11 screensaver and DPMS so the display stays on permanently
DISPLAY=:0 XAUTHORITY=/home/pi/.Xauthority xset s off
DISPLAY=:0 XAUTHORITY=/home/pi/.Xauthority xset s noblank
DISPLAY=:0 XAUTHORITY=/home/pi/.Xauthority xset -dpms

DISPLAY=:0 XAUTHORITY=/home/pi/.Xauthority chromium \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --no-first-run \
  --disable-features=TranslateUI \
  --disable-session-crashed-bubble \
  --disable-restore-session-state \
  --disable-gpu \
  --password-store=basic \
  --remote-debugging-port=9222 \
  --touch-events=enabled \
  --enable-touch-drag-drop \
  --overscroll-history-navigation=0 \
  http://localhost/ &
