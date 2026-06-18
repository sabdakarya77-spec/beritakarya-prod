#!/bin/bash
# deploy.sh — Deploy BeritaKarya ke production LXC
# Jalankan dari CT 102 (10.0.0.12)

set -e  # Exit on error

PROJECT_DIR="/var/www/beritakarya-prod"
LOG_FILE="/var/log/deploy-$(date +%Y%m%d-%H%M%S).log"

echo "=== BeritaKarya Deploy Started: $(date) ===" | tee $LOG_FILE

# 1. Backup database dulu
echo "[1/9] Backing up database..." | tee -a $LOG_FILE
ssh root@10.0.0.11 "bash /usr/local/bin/backup_db.sh" 2>&1 | tee -a $LOG_FILE

# 2. Pull latest code
echo "[2/9] Pulling latest code..." | tee -a $LOG_FILE
cd $PROJECT_DIR
git pull origin main 2>&1 | tee -a $LOG_FILE

# 3. Install dependencies
echo "[3/9] Installing dependencies..." | tee -a $LOG_FILE
pnpm install --frozen-lockfile 2>&1 | tee -a $LOG_FILE

# 4. Generate Prisma client (WAJIB sebelum migrate)
echo "[4/9] Generating Prisma client..." | tee -a $LOG_FILE
pnpm --filter @beritakarya/api db:generate 2>&1 | tee -a $LOG_FILE

# 5. Run migrations (jika ada schema change)
echo "[5/9] Running database migrations..." | tee -a $LOG_FILE
pnpm --filter @beritakarya/api db:migrate:deploy 2>&1 | tee -a $LOG_FILE

# 6. Build all apps
echo "[6/9] Building applications..." | tee -a $LOG_FILE
pnpm build 2>&1 | tee -a $LOG_FILE

# 7. Copy static assets untuk standalone Next.js
echo "[7/9] Copying static assets..." | tee -a $LOG_FILE
cp -r apps/web/public apps/web/.next/standalone/public 2>/dev/null || true
cp -r apps/web/.next/static apps/web/.next/standalone/.next/static 2>/dev/null || true

# 8. Restart PM2
echo "[8/9] Restarting PM2 processes..." | tee -a $LOG_FILE
pm2 reload ecosystem.config.js 2>&1 | tee -a $LOG_FILE

# 9. Verify
echo "[9/9] Checking health..." | tee -a $LOG_FILE
sleep 3
HEALTH=$(curl -s http://localhost:3001/health)
echo "API Health: $HEALTH" | tee -a $LOG_FILE

PM2_STATUS=$(pm2 jlist | python3 -c "import sys,json; apps=json.load(sys.stdin); print(all(a['pm2_env']['status']=='online' for a in apps))")
echo "PM2 All Online: $PM2_STATUS" | tee -a $LOG_FILE

echo "=== Deploy Completed: $(date) ===" | tee -a $LOG_FILE
