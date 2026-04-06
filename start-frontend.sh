#!/bin/bash
# Start IDOC Frontend with Expo
# Usage: ./start-frontend.sh
# Then press 'w' for web, 'a' for Android, or 'i' for iOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/idoc-app"

echo "🚀 Starting IDOC Frontend with Expo..."
echo "📁 Frontend directory: $FRONTEND_DIR"

cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Dependencies not found. Installing..."
    npm install || yarn install
    echo "✅ Dependencies installed"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ IDOC Frontend Starting with Expo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Available options:"
echo "  • Press 'w' - Open Web (http://localhost:8081)"
echo "  • Press 'a' - Open Android"
echo "  • Press 'i' - Open iOS"
echo "  • Press 'o' - Open Orbit"
echo ""
echo "Make sure backend is running on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm start
