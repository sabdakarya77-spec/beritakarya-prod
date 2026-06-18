module.exports = {
  apps: [
    {
      name: 'beritakarya-api',
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
      // STANDALONE MODE — bukan `next start`
      // Sesuai dengan `output: 'standalone'` di next.config.mjs
      // dan Dockerfile yang menggunakan `node apps/web/server.js`
      script: 'apps/web/.next/standalone/server.js',
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
