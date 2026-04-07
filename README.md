# IDOC Application Monorepo

## What This Repository Contains
This repository hosts the full IDOC healthcare platform:
- `idoc-app`: Expo/React web frontend (patient, doctor, pharmacy, admin flows).
- `idoc-backend`: Django + DRF backend API, auth, business logic, and seed data.
- `deploy/digitalocean`: Frontend deployment assets (Docker Compose + Caddy + deploy script).

## Full Stack
- Frontend: Expo (React Native Web), React Navigation, Axios.
- Backend: Django 5, DRF, JWT auth, role/approval model.
- Database: SQLite currently used by deployed service instance (per runtime environment).
- Hosting: Frontend on DigitalOcean droplet (Docker), backend on Railway.
- Domains:
  - Frontend: `idocbd.org`, `www.idocbd.org`
  - Backend: Railway service domain (currently stable API target)

## Architecture Flow
1. User opens frontend at `idocbd.org`.
2. Frontend sends API requests to backend base URL (`/api/v1/...`).
3. Backend handles auth, role checks, approval gating, bookings/orders logic.
4. Persistent entities: users, doctor profiles, pharmacy profiles, availability, bookings, orders.
5. Seed command populates 20 demo accounts + connected test data.

## Core Business Rules
- General users: can register and use booking/order flows immediately.
- Doctor/pharmacy users: require admin approval before full role access.
- Admin users: can approve providers and manage platform operations.

## Key Project Paths
- Frontend API client: `idoc-app/src/services/api.js`
- General doctor discovery: `idoc-app/src/screens/general/DoctorListScreen.js`
- Booking flow: `idoc-app/src/screens/general/BookingScreen.js`
- Registration flow: `idoc-app/src/screens/auth/RegisterScreen.js`
- Backend URL routing: `idoc-backend/config/urls.py`
- Seed data command: `idoc-backend/apps/accounts/management/commands/seed_demo_data.py`

## Repository Hygiene
This repo has been cleaned of temporary/dead backup files used during troubleshooting.
Operational deploy files were intentionally preserved to avoid breaking production deployment.
