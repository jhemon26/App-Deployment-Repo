# AI Architecture Map

## Goal
Fast orientation file for AI agents and maintainers to diagnose/fix issues quickly.

## Repo Layout
- `idoc-app/`: frontend web app.
- `idoc-backend/`: API and business logic.
- `deploy/digitalocean/`: frontend deployment stack.

## High-Impact Files
- `idoc-app/src/services/api.js`: all frontend endpoint mappings.
- `idoc-app/src/utils/config.js`: API base URL resolution.
- `idoc-app/src/screens/general/DoctorListScreen.js`: provider list + availability mapping.
- `idoc-app/src/screens/general/DoctorDetailScreen.js`: slot fallback load logic.
- `idoc-app/src/screens/general/BookingScreen.js`: doctor/slot ID mapping in booking payload.
- `idoc-app/src/screens/auth/RegisterScreen.js`: role-specific approval messaging.
- `idoc-backend/config/urls.py`: API route roots.
- `idoc-backend/apps/accounts/models.py`: role defaults and approval behavior.
- `idoc-backend/apps/accounts/serializers.py`: registration/login behavior.
- `idoc-backend/apps/accounts/views.py`: auth and approval gate responses.
- `idoc-backend/apps/accounts/permissions.py`: approved access policy.
- `idoc-backend/apps/accounts/management/commands/seed_demo_data.py`: deterministic demo seed.
- `idoc-backend/start.sh`: startup/migration/optional seed sequence.

## Typical Failure Points
1. API base URL mismatch or invalid TLS on custom domain.
2. Frontend using wrong doctor/profile/user IDs in booking-related screens.
3. Seed reset not run after backend changes causing credential/data drift.
4. Approval logic drift for doctor/pharmacy registration.

## Fast Debug Path
1. Confirm frontend URL and backend API health.
2. Validate `api.js` endpoints match backend `urls.py` roots.
3. Test demo users from `seed_accounts.csv`.
4. Verify provider list and booking payload IDs.
5. Redeploy backend first, then frontend, then smoke test.
