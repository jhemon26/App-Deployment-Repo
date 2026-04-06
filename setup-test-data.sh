#!/bin/bash
# Setup realistic demo data for IDOC App
# Usage: ./setup-test-data.sh [--reset]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/idoc-backend"

echo "Setting up demo data for IDOC App..."
cd "$BACKEND_DIR"

if [ -x ".venv312/bin/python" ]; then
  PY=".venv312/bin/python"
elif [ -x ".venv/bin/python" ]; then
  PY=".venv/bin/python"
else
  PY="python3"
fi

$PY manage.py migrate
$PY manage.py seed_demo_data "$@"

echo "Done. Credentials exported to idoc-backend/seed_accounts.csv"
