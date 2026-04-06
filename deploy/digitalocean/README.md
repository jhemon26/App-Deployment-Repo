# DigitalOcean + Railway Deployment (Autonomous Scripts)

Repository: https://github.com/jhemon26/App-Deployment-Repo.git
Droplet: 144.126.239.34
Railway Project: 177cb30c-7614-4a17-93f9-6fe1db9ede07

## One-command full deployment

From your local machine (with SSH access to droplet + Railway CLI logged in):

```bash
cd /Users/jahidhasanemon/Learning_SWE/IDOC\ APPLICATION\ copy
EXPO_PUBLIC_API_BASE_URL=http://144.126.239.34/api/v1 ./deploy/deploy_all.sh
```

This runs:
1. Railway backend deploy + migrate
2. DigitalOcean frontend deploy with Docker

## Backend only (Railway)

```bash
cd /Users/jahidhasanemon/Learning_SWE/IDOC\ APPLICATION\ copy
./deploy/railway/deploy_backend.sh
```

Optional demo seeding on Railway:

```bash
SEED_DATA=true ./deploy/railway/deploy_backend.sh
```

## Frontend only (DigitalOcean)

```bash
cd /Users/jahidhasanemon/Learning_SWE/IDOC\ APPLICATION\ copy
EXPO_PUBLIC_API_BASE_URL=http://144.126.239.34/api/v1 ./deploy/digitalocean/deploy_frontend.sh
```

## Required local prerequisites

1. SSH access to root@144.126.239.34 (key configured)
2. Railway CLI installed and authenticated:
```bash
npm i -g @railway/cli
railway login
```

## Verification

After deployment:

```bash
curl -I http://144.126.239.34:8080
```

Backend health check (replace with Railway public URL if different):

```bash
curl -I http://144.126.239.34/healthz/
```

## Notes

- Frontend Docker build injects `EXPO_PUBLIC_API_BASE_URL` at build time.
- Backend migrations include new `requests` and `availability` apps.
- Demo credentials are generated only when seeding is explicitly enabled.
