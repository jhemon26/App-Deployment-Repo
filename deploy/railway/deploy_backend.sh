#!/bin/bash
set -euo pipefail

PROJECT_ID="${RAILWAY_PROJECT_ID:-177cb30c-7614-4a17-93f9-6fe1db9ede07}"
SERVICE_NAME="${RAILWAY_SERVICE_NAME:-idoc-backend}"
SEED_DATA="${SEED_DATA:-false}"

if ! command -v railway >/dev/null 2>&1; then
  echo "Railway CLI not found. Install with: npm i -g @railway/cli"
  exit 1
fi

cd "$(dirname "$0")/../../idoc-backend"

# Link project/service if not already linked.
railway link --project "$PROJECT_ID" --service "$SERVICE_NAME" || true

# Deploy backend code to Railway.
railway up

# Run migrations on Railway runtime.
railway run python manage.py migrate

if [ "$SEED_DATA" = "true" ]; then
  railway run python manage.py seed_demo_data --reset
fi

echo "Railway backend deployment complete."
