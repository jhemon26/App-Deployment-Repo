# IDOC Application

IDOC is a role-based healthcare platform with a React/Expo frontend and a Django REST backend. It supports general users, doctors, pharmacies, and admins with approval-based access for provider accounts.

## What Lives Here
- `idoc-app/`: frontend web app.
- `idoc-backend/`: Django API, business rules, and seed data.
- `deploy/`: deployment scripts and container config.
- `docs/`: one consolidated context file for maintainers and AI agents.

## Core Stack
- Frontend: Expo, React Native Web, React Navigation, Axios
- Backend: Django 5, Django REST Framework, JWT auth
- Deployment: Railway for backend, DigitalOcean droplet with Docker for frontend
- Database/runtime: environment-driven production config

## Quick Start
- Run the backend with the standard Django environment.
- Run the frontend with the Expo web workflow.
- Use the deployment scripts in `deploy/` when pushing a production update.

## Key Documentation
- Architecture and file map: `docs/README.md`
- Full deployment automation: `deploy/full_deploy.sh`

## Notes
- This repository keeps deployment logic separate from application logic.
- Documentation is intentionally centralized so the repo stays easy to scan.
