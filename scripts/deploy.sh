#!/bin/bash
# deploy.sh — Deploy BeritaKarya ke production LXC
# Penggunaan:
#   bash scripts/deploy.sh         # Auto-detect berdasarkan hostname (lxc-2-app -> api, lxc-4-web -> web)
#   bash scripts/deploy.sh api     # Deploy API di CT 102 (10.0.0.12)
#   bash scripts/deploy.sh web     # Deploy Frontend Web di CT 104 (10.0.0.14)
#   bash scripts/deploy.sh all     # Deploy semua (jika berjalan di container gabungan)

set -e  # Exit on error

PROJECT_DIR="/var/www/beritakarya-prod"
LOG_FILE="/var/log/deploy-$(date +%Y%m%d-%H%M%S).log"
MODE="${1:-auto}"

# Auto-detect target berdasarkan hostname
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

echo "=== BeritaKarya Deploy Started (Target: $MODE): $(date) ===" | tee $LOG_FILE

cd $PROJECT_DIR

# 1. Pull latest code
echo "[1/6] Pulling latest code..." | tee -a $LOG_FILE
git pull origin main 2>&1 | tee -a $LOG_FILE

# 2. Install dependencies
echo "[2/6] Installing dependencies..." | tee -a $LOG_FILE
pnpm install --frozen-lockfile 2>&1 | tee -a $LOG_FILE

# --- DEPLOY BACKEND API (CT 102) ---
if [ "$MODE" = "api" ] || [ "$MODE" = "all" ]; then
  echo "--- Processing Backend API (CT 102) ---" | tee -a $LOG_FILE

  # Backup database
  echo "Backing up database..." | tee -a $LOG_FILE
  ssh -o BatchMode=yes -o ConnectTimeout=5 root@10.0.0.11 "bash /usr/local/bin/backup_db.sh" 2>&1 | tee -a $LOG_FILE || echo "Warning: Backup DB skipped or unreachable"

  # Prisma generate & migrations
  echo "Generating Prisma client..." | tee -a $LOG_FILE
  pnpm --filter @beritakarya/api db:generate 2>&1 | tee -a $LOG_FILE

  echo "Running database migrations..." | tee -a $LOG_FILE
  pnpm --filter @beritakarya/api db:migrate:deploy 2>&1 | tee -a $LOG_FILE

  # Build API
  echo "Building API..." | tee -a $LOG_FILE
  pnpm --filter @beritakarya/api build 2>&1 | tee -a $LOG_FILE

  # Reload PM2 API
  echo "Reloading PM2 API..." | tee -a $LOG_FILE
  pm2 reload ecosystem.config.js --only beritakarya-api 2>&1 | tee -a $LOG_FILE

  # Verify API
  sleep 2
  HEALTH=$(curl -s http://localhost:3001/health || echo "FAIL")
  echo "API Health: $HEALTH" | tee -a $LOG_FILE
fi

# --- DEPLOY FRONTEND WEB (CT 104) ---
if [ "$MODE" = "web" ] || [ "$MODE" = "all" ]; then
  echo "--- Processing Frontend Web (CT 104) ---" | tee -a $LOG_FILE

  # Build Web Standalone
  echo "Building Next.js Web Standalone..." | tee -a $LOG_FILE
  pnpm --filter @beritakarya/web build 2>&1 | tee -a $LOG_FILE

  # Copy static assets
  echo "Copying static assets..." | tee -a $LOG_FILE
  cp -r apps/web/public apps/web/.next/standalone/apps/web/public 2>/dev/null || true
  cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static 2>/dev/null || true
  cp -r apps/web/public apps/web/.next/standalone/public 2>/dev/null || true
  cp -r apps/web/.next/static apps/web/.next/standalone/.next/static 2>/dev/null || true

  # Reload PM2 Web
  echo "Reloading PM2 Web..." | tee -a $LOG_FILE
  pm2 reload ecosystem.config.js --only beritakarya-web 2>&1 | tee -a $LOG_FILE

  # Verify Web
  sleep 2
  WEB_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ || echo "FAIL")
  echo "Web HTTP Status: $WEB_HTTP" | tee -a $LOG_FILE
fi

echo "=== Deploy Completed: $(date) ===" | tee -a $LOG_FILE
