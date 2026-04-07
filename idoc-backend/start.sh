#!/bin/bash
set -e
set -o pipefail

echo "=== Starting I Doc Backend ==="
echo "PORT: ${PORT:-8000}"
echo "DEBUG: $DEBUG"

echo "=== Running migrations ==="
python manage.py migrate --noinput

echo "=== Collecting static files ==="
python manage.py collectstatic --noinput

if [ "${RUN_SEED_DATA:-false}" = "true" ]; then
	echo "=== Seeding demo data ==="
	python manage.py seed_demo_data --reset
else
	echo "=== Skipping demo seed data (RUN_SEED_DATA=false) ==="
fi

echo "=== Starting Daphne ASGI server ==="
exec daphne -b 0.0.0.0 -p "${PORT:-8000}" config.asgi:application
