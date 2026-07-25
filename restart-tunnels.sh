#!/usr/bin/env bash
# Relaunch both cloudflared quick tunnels and point the mirror at the new
# backend URL. Run from repo root in Git Bash after tunnels die (sleep etc.):
#   ./restart-tunnels.sh
# Assumes Flask on :5000 and the mirror served on :8902.
set -e
CF="/c/Program Files (x86)/cloudflared/cloudflared"
MIRROR_HTML="softbank-mirror/index.html"

taskkill //F //IM cloudflared.exe 2>/dev/null || true
sleep 1

"$CF" tunnel --url http://127.0.0.1:5000 > /tmp/cf-backend.log 2>&1 &
"$CF" tunnel --url http://127.0.0.1:8902 > /tmp/cf-mirror.log 2>&1 &

echo "waiting for tunnels..."
BACKEND_URL=""
MIRROR_URL=""
for i in $(seq 1 30); do
  BACKEND_URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cf-backend.log 2>/dev/null | head -1)
  MIRROR_URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cf-mirror.log 2>/dev/null | head -1)
  [ -n "$BACKEND_URL" ] && [ -n "$MIRROR_URL" ] && break
  sleep 1
done
[ -z "$BACKEND_URL" ] || [ -z "$MIRROR_URL" ] && { echo "ERROR: tunnels did not come up (see /tmp/cf-*.log)"; exit 1; }

# Point the mirror's UniLens.init at the new backend tunnel
sed -i -E "s|backend: '[^']*'|backend: '$BACKEND_URL'|" "$MIRROR_HTML"

echo "backend: $BACKEND_URL"
echo "mirror:  $MIRROR_URL/index.html"
echo "mirror index.html updated — share the mirror URL (viewers must hard-refresh)."
