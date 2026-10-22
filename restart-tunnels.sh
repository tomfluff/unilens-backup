#!/usr/bin/env bash
# Relaunch the cloudflared quick tunnels and point the mirror at the new
# backend and survey URLs. Run from repo root in Git Bash after tunnels die (sleep etc.):
#   ./restart-tunnels.sh
# Assumes Flask on :5000, the survey server on :5100 and the mirror served on
# :8000 (make serve <dir>).
set -e
CF="/c/Program Files (x86)/cloudflared/cloudflared"
# next to this script, wherever it is run from
MIRROR_HTML="$(dirname "$0")/frontend/softbank-mirror/index.html"

taskkill //F //IM cloudflared.exe 2>/dev/null || true
sleep 1

"$CF" tunnel --url http://127.0.0.1:5000 > /tmp/cf-backend.log 2>&1 &
"$CF" tunnel --url http://127.0.0.1:5100 > /tmp/cf-survey.log 2>&1 &
"$CF" tunnel --url http://127.0.0.1:8000 > /tmp/cf-mirror.log 2>&1 &

echo "waiting for tunnels..."
BACKEND_URL=""
SURVEY_URL=""
MIRROR_URL=""
for i in $(seq 1 30); do
  BACKEND_URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cf-backend.log 2>/dev/null | head -1)
  SURVEY_URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cf-survey.log 2>/dev/null | head -1)
  MIRROR_URL=$(grep -oE "https://[a-z0-9-]+\.trycloudflare\.com" /tmp/cf-mirror.log 2>/dev/null | head -1)
  [ -n "$BACKEND_URL" ] && [ -n "$SURVEY_URL" ] && [ -n "$MIRROR_URL" ] && break
  sleep 1
done
[ -z "$BACKEND_URL" ] || [ -z "$SURVEY_URL" ] || [ -z "$MIRROR_URL" ] && { echo "ERROR: tunnels did not come up (see /tmp/cf-*.log)"; exit 1; }

# Point the mirror's UniLens.init at the backend tunnel and its UniLensQuiz.init
# (the survey button) at the survey tunnel: each line keeps its own server
sed -i -E "/UniLens\.init\(/ s|backend: '[^']*'|backend: '$BACKEND_URL'|" "$MIRROR_HTML"
sed -i -E "/UniLensQuiz\.init\(/ s|backend: '[^']*'|backend: '$SURVEY_URL'|" "$MIRROR_HTML"

echo "backend: $BACKEND_URL"
echo "survey:  $SURVEY_URL/survey"
echo "mirror:  $MIRROR_URL/index.html"
echo "mirror index.html updated — share the mirror URL (viewers must hard-refresh)."
