#!/bin/bash
# setup-production.sh — Setup awal BeritaKarya di production LXC
# Penggunaan:
#   bash scripts/setup-production.sh         # Auto-detect berdasarkan hostname (lxc-2-app -> api, lxc-4-web -> web)
#   bash scripts/setup-production.sh api     # Setup API di CT 102 (10.0.0.12)
#   bash scripts/setup-production.sh web     # Setup Frontend Web di CT 104 (10.0.0.14)
#   bash scripts/setup-production.sh all     # Setup semua

set -e

PROJECT_DIR="/var/www/beritakarya-prod"
MODE="${1:-auto}"

if [ "$MODE" = "auto" ]; then
  CURRENT_HOST=$(hostname 2>/dev/null || echo "")
  if [ "$CURRENT_HOST" = "lxc-4-web" ]; then
    MODE="web"
  elif [ "$CURRENT_HOST" = "lxc-2-app" ]; then
    MODE="api"
  else
    MODE="all"
  fi
fi

echo "=== BeritaKarya Production Setup (Target: $MODE) ==="

# 1. Clone repository
echo "[1/6] Cloning repository..."
mkdir -p /var/www
cd /var/www
if [ ! -d "beritakarya-prod" ]; then
  git clone https://github.com/sabdakarya77-spec/beritakarya-prod.git beritakarya-prod
fi
cd beritakarya-prod

# 2. Checkout main branch
git checkout main

# 3. Environment files
echo "[2/6] Setting up environment files..."
if [ "$MODE" = "api" ] || [ "$MODE" = "all" ]; then
  if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example.selfhosted apps/api/.env
    echo ">>> EDIT apps/api/.env dengan kredensial production (DB, Redis, Meilisearch, MinIO, JWT)"
  fi
fi

if [ "$MODE" = "web" ] || [ "$MODE" = "all" ]; then
  if [ ! -f "apps/web/.env.production" ]; then
    cp apps/web/.env.example apps/web/.env.production
    echo ">>> EDIT apps/web/.env.production dengan NEXT_PUBLIC_API_URL dan NEXT_PUBLIC_URL"
  fi
fi

echo ""
read -p "Tekan Enter setelah selesai memastikan file .env terisi..."

# 4. Install dependencies
echo "[3/6] Installing dependencies..."
pnpm install --frozen-lockfile

# --- SETUP API (CT 102) ---
if [ "$MODE" = "api" ] || [ "$MODE" = "all" ]; then
  echo "[4/6] Setting up API..."
  pnpm --filter @beritakarya/api db:generate
  pnpm --filter @beritakarya/api db:migrate:deploy
  pnpm --filter @beritakarya/api db:seed
  pnpm --filter @beritakarya/api build

  pm2 start ecosystem.config.js --only beritakarya-api
  pm2 save
fi

# --- SETUP WEB (CT 104) ---
if [ "$MODE" = "web" ] || [ "$MODE" = "all" ]; then
  echo "[4/6] Setting up Frontend Web..."
  pnpm --filter @beritakarya/web build

  # Copy static assets
  cp -r apps/web/public apps/web/.next/standalone/apps/web/public
  cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
  cp -r apps/web/public apps/web/.next/standalone/public
  cp -r apps/web/.next/static apps/web/.next/standalone/.next/static

  pm2 start ecosystem.config.js --only beritakarya-web
  pm2 save
fi

# 5. Startup PM2
pm2 startup

echo ""
echo "=== Setup Complete for $MODE ==="
if [ "$MODE" = "api" ] || [ "$MODE" = "all" ]; then
  echo "  - Verify API: curl http://localhost:3001/health"
fi
if [ "$MODE" = "web" ] || [ "$MODE" = "all" ]; then
  echo "  - Verify Web: curl -I http://localhost:3000/"
fi
