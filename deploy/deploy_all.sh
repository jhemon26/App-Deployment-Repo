#!/bin/bash
set -euo pipefail

# Usage:
# EXPO_PUBLIC_API_BASE_URL=https://<your-backend>/api/v1 ./deploy/deploy_all.sh

"$(dirname "$0")/railway/deploy_backend.sh"
"$(dirname "$0")/digitalocean/deploy_frontend.sh"

echo "Full-stack deployment completed."
