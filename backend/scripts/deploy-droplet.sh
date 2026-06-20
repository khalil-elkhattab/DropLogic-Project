#!/usr/bin/env bash
# Deploy DropLogic backend to DigitalOcean droplet and restart uvicorn on :8000.
# Run from your laptop (with SSH key access), NOT from CI without secrets.
#
# Usage:
#   export DROPLET_HOST=164.90.235.14
#   export DROPLET_USER=root          # or ubuntu
#   export APP_DIR=/root/DropLogic-Project   # adjust to your clone path
#   bash backend/scripts/deploy-droplet.sh

set -euo pipefail

DROPLET_HOST="${DROPLET_HOST:-164.90.235.14}"
DROPLET_USER="${DROPLET_USER:-root}"
APP_DIR="${APP_DIR:-/root/DropLogic-Project}"
SUPABASE_URL="${SUPABASE_URL:-https://hlifddtiptsevnueasu.supabase.co}"
BACKEND_PUBLIC_URL="${BACKEND_PUBLIC_URL:-http://164.90.235.14:8000}"

echo "==> Deploying to ${DROPLET_USER}@${DROPLET_HOST}:${APP_DIR}"

ssh "${DROPLET_USER}@${DROPLET_HOST}" bash -s <<EOF
set -euo pipefail
cd "${APP_DIR}"

echo "==> Git pull latest main"
git fetch origin main
git pull origin main

cd backend

echo "==> Ensure SUPABASE_URL and BACKEND_PUBLIC_URL in .env"
touch .env
grep -q '^SUPABASE_URL=' .env || echo "SUPABASE_URL=${SUPABASE_URL}" >> .env
grep -q '^BACKEND_PUBLIC_URL=' .env || echo "BACKEND_PUBLIC_URL=${BACKEND_PUBLIC_URL}" >> .env

# Normalize SUPABASE_URL line (no quotes, correct host)
if grep -q '^SUPABASE_URL=' .env; then
  sed -i 's|^SUPABASE_URL=.*|SUPABASE_URL=${SUPABASE_URL}|' .env
else
  echo "SUPABASE_URL=${SUPABASE_URL}" >> .env
fi

if grep -q '^BACKEND_PUBLIC_URL=' .env; then
  sed -i 's|^BACKEND_PUBLIC_URL=.*|BACKEND_PUBLIC_URL=${BACKEND_PUBLIC_URL}|' .env
else
  echo "BACKEND_PUBLIC_URL=${BACKEND_PUBLIC_URL}" >> .env
fi

echo "==> .env URL lines (secrets redacted):"
grep -E '^(SUPABASE_URL|BACKEND_PUBLIC_URL|SERVER_PUBLIC_URL)=' .env || true

echo "==> Install Python deps (if venv exists)"
if [ -d venv ]; then
  source venv/bin/activate
  pip install -q -r requirements.txt 2>/dev/null || pip install -q httpx fastapi uvicorn python-dotenv groq gtts pedalboard numpy requests 2>/dev/null || true
fi

echo "==> Restart uvicorn on 0.0.0.0:8000"
if systemctl is-active --quiet droplogic 2>/dev/null; then
  sudo systemctl restart droplogic
  sleep 2
  systemctl status droplogic --no-pager | head -15
elif systemctl is-active --quiet droplogic-api 2>/dev/null; then
  sudo systemctl restart droplogic-api
  sleep 2
  systemctl status droplogic-api --no-pager | head -15
else
  pkill -f 'uvicorn.*main:app' 2>/dev/null || true
  sleep 1
  if [ -d venv ]; then
    source venv/bin/activate
  fi
  nohup uvicorn main:app --host 0.0.0.0 --port 8000 > /var/log/droplogic-uvicorn.log 2>&1 &
  sleep 2
  pgrep -af 'uvicorn.*main:app' || { echo "Failed to start uvicorn"; exit 1; }
fi

echo "==> Health check"
curl -sf -o /dev/null -w 'docs HTTP %{http_code}\n' http://127.0.0.1:8000/docs

python3 - <<'PY'
import os, socket
from dotenv import load_dotenv
load_dotenv()
url = os.getenv("SUPABASE_URL", "")
host = url.replace("https://", "").replace("http://", "").split("/")[0]
print("SUPABASE_URL host:", host)
try:
    socket.getaddrinfo(host, 443)
    print("DNS OK for", host)
except socket.gaierror as e:
    print("DNS FAIL for", host, "->", e)
PY

echo "==> Deploy complete"
EOF

echo "Done. Test bake from https://www.droplogicai.com/dashboard/studio"
