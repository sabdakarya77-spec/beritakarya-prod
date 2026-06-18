#!/bin/bash
# setup-production.sh — Setup awal BeritaKarya di CT 102
# Jalankan SEKALI setelah CT 102 siap

set -e

PROJECT_DIR="/var/www/beritakarya-prod"

echo "=== BeritaKarya Production Setup ==="

# 1. Clone repository
echo "[1/7] Cloning repository..."
mkdir -p /var/www
cd /var/www
git clone https://github.com/sabdakarya77-spec/beritakarya-prod.git beritakarya-prod
cd beritakarya-prod

# 2. Checkout main branch
git checkout main

# 3. Copy environment files
echo "[2/7] Setting up environment files..."
cp apps/api/.env.example.selfhosted apps/api/.env
cp apps/web/.env.example apps/web/.env.production
# PENTING: Edit file .env dengan nilai yang benar SEBELUM melanjutkan
echo ""
echo ">>> EDIT apps/api/.env dengan kredensial production (DB, Redis, Meilisearch, MinIO, JWT)"
echo ">>> EDIT apps/web/.env.production dengan NEXT_PUBLIC_API_URL dan NEXT_PUBLIC_URL"
echo ""
read -p "Tekan Enter setelah selesai mengedit..."

# 4. Install dependencies
echo "[3/7] Installing dependencies..."
pnpm install --frozen-lockfile

# 5. Generate Prisma client
echo "[4/7] Generating Prisma client..."
pnpm --filter @beritakarya/api db:generate

# 6. Run migrations & seed
echo "[5/7] Running migrations and seed..."
pnpm --filter @beritakarya/api db:migrate:deploy
pnpm --filter @beritakarya/api db:seed

# 7. Build
echo "[6/7] Building applications..."
pnpm build

# 8. Copy static assets untuk standalone Next.js
echo "[7/7] Copying static assets..."
cp -r apps/web/public apps/web/.next/standalone/public
cp -r apps/web/.next/static apps/web/.next/standalone/.next/static

# 9. Setup PM2
echo "[PM2] Starting PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "=== Setup Complete ==="
echo "Next steps:"
echo "  1. Verify: curl http://localhost:3001/health"
echo "  2. Configure Caddy: /etc/caddy/Caddyfile"
echo "  3. Setup Cloudflare Tunnel"
echo "  4. Test: https://beritakarya.co"
