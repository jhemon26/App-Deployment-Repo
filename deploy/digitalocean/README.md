# DigitalOcean Frontend Deployment (I Doc Web)

This deploys the Expo web build as a static site behind Nginx using Docker.
Backend API is already deployed on Railway.

## 1) SSH into your droplet

```bash
ssh root@YOUR_DROPLET_IP
```

## 2) Install Docker + Compose plugin (if needed)

```bash
apt update && apt install -y docker.io docker-compose-plugin git
systemctl enable --now docker
```

## 3) Pull your repository

```bash
cd /opt
rm -rf Complete-IDOC-App
git clone https://github.com/jhemon26/Complete-IDOC-App.git
cd Complete-IDOC-App
```

## 4) Build and run web app

```bash
docker compose -f deploy/digitalocean/docker-compose.frontend.yml up -d --build
```

## 5) Verify service

```bash
docker ps
curl -I http://localhost
```

## 6) (Optional) Open firewall

```bash
ufw allow 80/tcp
ufw allow 443/tcp
```

## 7) (Optional) Add domain + HTTPS with Caddy or Nginx Proxy Manager

You can place Cloudflare in front, or add a reverse proxy for TLS cert automation.

---

## Update deployment after code changes

```bash
cd /opt/Complete-IDOC-App
git pull
docker compose -f deploy/digitalocean/docker-compose.frontend.yml up -d --build
```
