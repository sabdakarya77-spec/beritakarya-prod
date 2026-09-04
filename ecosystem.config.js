module.exports = {
  apps: [
    {
      name: 'beritakarya-api',
      // Dijalankan di CT 102 (10.0.0.12): pm2 start ecosystem.config.js --only beritakarya-api
      script: 'node',
      args: 'apps/api/dist/main.js',
      cwd: '/var/www/beritakarya-prod',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '800M',
      listen_timeout: 8000,
      kill_timeout: 3000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
    {
      name: 'beritakarya-web',
      // Dijalankan di CT 104 (10.0.0.14): pm2 start ecosystem.config.js --only beritakarya-web
      // STANDALONE MODE — bukan `next start`
      // Sesuai dengan `output: 'standalone'` di next.config.mjs
      // Pada monorepo Turborepo, server.js ada di apps/web/.next/standalone/apps/web/server.js
      script: 'apps/web/.next/standalone/apps/web/server.js',
      cwd: '/var/www/beritakarya-prod',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        NEXT_PUBLIC_API_URL: 'https://api.beritakarya.co',
        NEXT_PUBLIC_URL: 'https://beritakarya.co',
      },
      max_memory_restart: '1G',
      listen_timeout: 8000,
      kill_timeout: 3000,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}
