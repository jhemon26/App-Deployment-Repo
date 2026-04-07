# IDOC Runbook (Build, Deploy, Verify)

## Purpose
This file explains how to build, deploy, and validate the full app safely.

## Local Development
1. Backend:
- `cd idoc-backend`
- `python3 -m venv .venv && source .venv/bin/activate`
- `pip install -r requirements.txt`
- `python manage.py migrate`
- `python manage.py runserver`

2. Frontend:
- `cd idoc-app`
- `npm ci`
- `npm run web`

## Seed Demo Data
From `idoc-backend`:
- `python manage.py seed_demo_data --reset`

This generates 20 demo accounts and writes `seed_accounts.csv`.

## Backend Deploy (Railway)
From `idoc-backend`:
- `railway up`

## Frontend Deploy (DigitalOcean)
From repo root:
- `bash deploy/digitalocean/deploy_frontend.sh`

## Post-Deploy Smoke Checks
- Frontend:
  - `curl -I https://idocbd.org`
- Backend:
  - `curl https://idoc-backend-prod-production.up.railway.app/api/v1/doctors/`
  - `curl https://idoc-backend-prod-production.up.railway.app/api/v1/pharmacies/`

## Rollback Strategy
- Backend: redeploy previous known good commit with `railway up`.
- Frontend: rebuild droplet stack from previous known good commit/deploy artifact.

## Safety Notes
- Do not delete or alter `deploy/digitalocean/docker-compose.frontend.yml` and `deploy/digitalocean/Caddyfile` without testing.
- Keep API base URL in sync with valid TLS domain.
