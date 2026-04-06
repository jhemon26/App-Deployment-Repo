#!/bin/bash
# Start IDOC Backend Server
# Usage: ./start-backend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/idoc-backend"

echo "🚀 Starting IDOC Backend Server..."
echo "📁 Backend directory: $BACKEND_DIR"

cd "$BACKEND_DIR"

# Check if virtual environment exists
if [ ! -d ".venv" ] && [ ! -d ".venv312" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please create one first:"
    echo "  python3 -m venv .venv"
    echo "  source .venv/bin/activate"
    echo "  pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
if [ -d ".venv312" ]; then
    echo "🔧 Activating Python 3.12 virtual environment..."
    source .venv312/bin/activate
elif [ -d ".venv" ]; then
    echo "🔧 Activating Python 3.11 virtual environment..."
    source .venv/bin/activate
fi

# Check if database exists
if [ ! -f "db.sqlite3" ]; then
    echo "📊 Database not found. Running migrations..."
    python manage.py migrate
    echo "✅ Database created and migrations applied"
fi

# Start server
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ IDOC Backend Server Starting"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Server: http://localhost:8000"
echo "Health: http://localhost:8000/healthz/"
echo "Docs: http://localhost:8000/api/v1"
echo "Admin: http://localhost:8000/admin/"
echo ""
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python manage.py runserver 0.0.0.0:8000
