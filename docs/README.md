# IDOC Context Guide

This is the single consolidated context file for the repository. It is intentionally focused on architecture, flow, file structure, and implementation logic, without exposing secrets or operational credentials.

## 1. System Overview
IDOC is a multi-role healthcare platform.

Roles:
- General user
- Doctor
- Pharmacy
- Admin

Main user journeys:
- General users search providers, book consultations, and buy medicine.
- Doctors manage availability and bookings after approval.
- Pharmacies manage medicines and orders after approval.
- Admins approve provider accounts and supervise the platform.

## 2. Full Stack
Frontend:
- Expo + React Native Web
- React Navigation
- Axios API client
- Web build served from a container on the droplet

Backend:
- Django + Django REST Framework
- JWT authentication
- Role-based approval and permission checks
- Seed command for demo data

Deployment:
- Backend: Railway
- Frontend: Docker on DigitalOcean with Caddy reverse proxy

## 3. Repository Structure
- `idoc-app/`: all frontend code
- `idoc-backend/`: all backend code
- `deploy/`: build and deploy scripts
- `docs/`: this context guide only

## 4. File Tree Map
### Frontend
- `idoc-app/src/services/api.js`: all API endpoint mappings
- `idoc-app/src/utils/config.js`: runtime API/base configuration
- `idoc-app/src/screens/auth/RegisterScreen.js`: signup flow and role messaging
- `idoc-app/src/screens/general/DoctorListScreen.js`: provider discovery and availability logic
- `idoc-app/src/screens/general/DoctorDetailScreen.js`: provider detail and slot loading
- `idoc-app/src/screens/general/BookingScreen.js`: booking payload and slot submission

### Backend
- `idoc-backend/config/urls.py`: API route roots
- `idoc-backend/apps/accounts/models.py`: user roles and approval defaults
- `idoc-backend/apps/accounts/serializers.py`: registration/login data flow
- `idoc-backend/apps/accounts/views.py`: auth endpoints and approval responses
- `idoc-backend/apps/accounts/permissions.py`: access gating for roles
- `idoc-backend/apps/accounts/management/commands/seed_demo_data.py`: deterministic demo dataset
- `idoc-backend/start.sh`: startup, migrations, static collection, optional seeding

### Deployment
- `deploy/full_deploy.sh`: one-command backend + frontend deploy
- `deploy/digitalocean/deploy_frontend.sh`: frontend rebuild/restart on droplet
- `deploy/digitalocean/docker-compose.frontend.yml`: frontend container stack
- `deploy/digitalocean/Caddyfile`: HTTPS reverse proxy routing

## 5. Flow Logic
1. The user opens the frontend in the browser.
2. The frontend loads its API base URL from environment/build config.
3. Requests go to the Django API.
4. Django applies auth, role, approval, and object-level checks.
5. Providers and patients interact through bookings, availability, orders, and messaging.
6. Demo data is created through the seed command to keep test accounts available.

## 6. Business Rules
- General users should be approved by default and get immediate access.
- Doctor and pharmacy accounts remain pending until admin approval.
- Approved providers get their dashboards and operational features.
- Blocked users should not gain protected access.

## 7. Private Repo Deployment Notes
- A private GitHub repo can be deployed automatically by storing a read-only repo token once on the droplet at `/root/.config/idoc/github_repo_token`.
- After that one-time setup, future deploys can run unattended and do not require passing the token manually.
- Do not store passwords, tokens, SSH keys, or other secrets in this file.

## 8. Important Implementation Notes
- Provider discovery depends on matching frontend IDs with backend profile and user IDs correctly.
- Booking flow depends on accurate slot/doctor mapping and approved provider availability.
- Registration and login flows must keep approval state consistent with backend validation.
- API base URL and deployment target must stay aligned with the currently valid runtime domain.

## 9. What To Check First When Fixing Issues
- Frontend API client and runtime config
- Backend route definitions
- Role/approval logic in accounts
- Provider availability and booking payloads
- Seed data command and demo account state
- Deployment scripts only after application logic is confirmed

## 10. Security/Clarity Rules For This Guide
- Do not store passwords, tokens, secrets, or private host details here.
- Keep this file descriptive, not operationally sensitive.
- Keep deployment commands in scripts, not in the context guide.
