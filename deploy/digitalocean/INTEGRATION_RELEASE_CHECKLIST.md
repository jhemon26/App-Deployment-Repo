# Integration Release Checklist (Frontend + Backend)

## Scope implemented
- Real backend endpoints added for patient requests and doctor availability.
- Frontend mobile API base URL now supports explicit env override via `EXPO_PUBLIC_API_BASE_URL`.
- Seed command added to generate ~20 realistic accounts and test records.
- Existing UI flow and role routing preserved; no theme/layout redesign in this pass.

## Required before push/release
1. Backend migration:
- Run `python manage.py migrate` on Railway/Droplet to create new tables:
  - `availability_doctoravailability`
  - `requests_patientrequest`

2. Frontend environment:
- Set `EXPO_PUBLIC_API_BASE_URL` to deployed backend URL (example: `http://144.126.239.34/api/v1`).
- File template exists in `idoc-app/.env.example`.

3. Backend environment:
- Ensure `ALLOWED_HOSTS` includes production host/domain.
- If mobile/web domain is restricted, ensure CORS/CSRF values include frontend origin.

4. Seed data (staging/demo environments only):
- Run `python manage.py seed_demo_data --reset`.
- Credentials output file: `idoc-backend/seed_accounts.csv`.

5. New repository mapping:
- `origin` should point to: `https://github.com/jhemon26/App-Deployment-Repo.git`.
- Previous remote preserved as `old-origin`.

## No unnecessary risky changes made
- No architecture rewrite.
- No role-model schema changes beyond new feature tables.
- No routing redesign.
- No production security settings removed.
