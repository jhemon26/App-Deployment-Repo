#!/bin/bash
set -euo pipefail

DROPLET_HOST="${DROPLET_HOST:-root@144.126.239.34}"
REPO_URL="${REPO_URL:-https://github.com/jhemon26/App-Deployment-Repo.git}"
REMOTE_DIR="${REMOTE_DIR:-/opt/App-Deployment-Repo}"
API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-https://idoc-backend-prod-production.up.railway.app/api/v1}"

echo "Deploying frontend to ${DROPLET_HOST}"

ssh -o StrictHostKeyChecking=accept-new "${DROPLET_HOST}" "bash -s" <<EOF
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  apt update
  apt install -y docker.io docker-compose-plugin git
  systemctl enable --now docker
fi

if [ ! -d "${REMOTE_DIR}/.git" ]; then
  rm -rf "${REMOTE_DIR}"
  git clone "${REPO_URL}" "${REMOTE_DIR}"
else
  git -C "${REMOTE_DIR}" fetch --all --prune
  git -C "${REMOTE_DIR}" reset --hard origin/main
fi

cat > "${REMOTE_DIR}/.env" <<ENV
EXPO_PUBLIC_API_BASE_URL=${API_BASE_URL}
ENV

cd "${REMOTE_DIR}"
dockerd_status=$(systemctl is-active nginx 2>/dev/null || true)
if [ "$dockerd_status" = "active" ]; then
  systemctl stop nginx || true
  systemctl disable nginx || true
fi
docker compose -f deploy/digitalocean/docker-compose.frontend.yml up -d --build

echo "Frontend deployed on port 8080"
EOF
