# Deployment Readiness - I Doc Backend

## Implemented hardening
- DEBUG is parsed as boolean
- Production security headers and HTTPS behavior enabled when DEBUG=false
- CSRF trusted origins are configurable via env
- Health endpoint: /healthz/
- Startup script now:
  - runs migrations
  - collects static files
  - seeds demo data only when RUN_SEED_DATA=true

## Required pre-deploy checks
1. Set SECRET_KEY to a strong random value
2. Set DEBUG=false
3. Set ALLOWED_HOSTS correctly
4. Set DATABASE_URL to PostgreSQL
5. Set CORS_ALLOWED_ORIGINS + CSRF_TRUSTED_ORIGINS for your frontend domain
6. Set REDIS_URL for channels/celery in production
7. Set Stripe secrets if payments are enabled
8. Set AGORA credentials if video is enabled
9. Keep RUN_SEED_DATA=false in production

## Health/Liveness
- GET /healthz/ should return:
  {"status": "ok"}

## Deployment commands
Container startup uses start.sh:
- python manage.py migrate --noinput
- python manage.py collectstatic --noinput
- optional seed_data when RUN_SEED_DATA=true
- daphne ASGI launch

## Notes
- This repository still needs environment-specific CI/CD and runtime smoke tests to be fully production operated.
- If deploy checks fail locally, ensure Python virtualenv dependencies are installed first.
