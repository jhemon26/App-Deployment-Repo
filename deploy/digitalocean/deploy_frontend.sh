#!/bin/bash
set -euo pipefail

DROPLET_HOST="${DROPLET_HOST:-root@144.126.239.34}"
REPO_URL="${REPO_URL:-https://github.com/jhemon26/App-Deployment-Repo.git}"
REMOTE_DIR="${REMOTE_DIR:-/opt/App-Deployment-Repo}"
API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-https://idoc-backend-prod-production.up.railway.app/api/v1}"
REPO_AUTH_TOKEN="${REPO_AUTH_TOKEN:-}"
GIT_AUTH_USER="${GIT_AUTH_USER:-x-access-token}"

echo "Deploying frontend to ${DROPLET_HOST}"

ssh -o StrictHostKeyChecking=accept-new "${DROPLET_HOST}" \
  "REMOTE_DIR='${REMOTE_DIR}' REPO_URL='${REPO_URL}' API_BASE_URL='${API_BASE_URL}' REPO_AUTH_TOKEN='${REPO_AUTH_TOKEN}' GIT_AUTH_USER='${GIT_AUTH_USER}' bash -s" <<'EOF_REMOTE'
set -euo pipefail

setup_git_askpass() {
  if [ -z "${REPO_AUTH_TOKEN}" ]; then
    return
  fi

  cat >/tmp/git-askpass.sh <<'ASKPASS'
#!/bin/sh
case "$1" in
  *Username*) printf "%s\n" "__GIT_AUTH_USER__" ;;
  *Password*) printf "%s\n" "__REPO_AUTH_TOKEN__" ;;
  *) printf "%s\n" "__REPO_AUTH_TOKEN__" ;;
esac
ASKPASS
  sed -i "s#__GIT_AUTH_USER__#${GIT_AUTH_USER}#g; s#__REPO_AUTH_TOKEN__#${REPO_AUTH_TOKEN}#g" /tmp/git-askpass.sh
  chmod 700 /tmp/git-askpass.sh
  export GIT_ASKPASS=/tmp/git-askpass.sh
  export GIT_TERMINAL_PROMPT=0
}

clone_or_update_repo() {
  setup_git_askpass
  if [ ! -d "${REMOTE_DIR}/.git" ]; then
    rm -rf "${REMOTE_DIR}"
    git clone "${REPO_URL}" "${REMOTE_DIR}"
  else
    git -C "${REMOTE_DIR}" fetch --all --prune
    git -C "${REMOTE_DIR}" reset --hard origin/main
  fi
}

if ! command -v docker >/dev/null 2>&1; then
  apt update
  apt install -y docker.io docker-compose-plugin git
  systemctl enable --now docker
fi

clone_or_update_repo

cat > "${REMOTE_DIR}/.env" <<ENV
EXPO_PUBLIC_API_BASE_URL=${API_BASE_URL}
ENV

cd "${REMOTE_DIR}"
nginx_status=$(systemctl is-active nginx 2>/dev/null || true)
if [ "$nginx_status" = "active" ]; then
  systemctl stop nginx || true
  systemctl disable nginx || true
fi

docker compose -f deploy/digitalocean/docker-compose.frontend.yml up -d --build

echo "Frontend deployed on ports 80 and 443 (HTTP/HTTPS via Caddy)"
EOF_REMOTE
