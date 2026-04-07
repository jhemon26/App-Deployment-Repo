#!/usr/bin/env bash
# Full deployment orchestration for IDOC (backend + frontend + smoke checks).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/idoc-backend"

API_CHECK_URL="${API_CHECK_URL:-https://idoc-backend-prod-production.up.railway.app/api/v1/doctors/}"
WEB_CHECK_URL="${WEB_CHECK_URL:-https://idocbd.org}"
REPO_AUTH_TOKEN="${REPO_AUTH_TOKEN:-}"
GIT_AUTH_USER="${GIT_AUTH_USER:-x-access-token}"
REMOTE_TOKEN_FILE="${REMOTE_TOKEN_FILE:-/root/.config/idoc/github_repo_token}"

run_step() {
  echo ""
  echo "[STEP] $1"
}

run_step "Backend deploy to Railway"
cd "$BACKEND_DIR"
railway up

run_step "Frontend deploy to DigitalOcean"
cd "$ROOT_DIR"
REPO_AUTH_TOKEN="$REPO_AUTH_TOKEN" GIT_AUTH_USER="$GIT_AUTH_USER" REMOTE_TOKEN_FILE="$REMOTE_TOKEN_FILE" bash deploy/digitalocean/deploy_frontend.sh

run_step "Smoke checks"
curl -fsS "$API_CHECK_URL" >/dev/null
curl -fsSI "$WEB_CHECK_URL" >/dev/null

echo ""
echo "Full deployment completed successfully."
echo "- API check: $API_CHECK_URL"
echo "- Web check: $WEB_CHECK_URL"
