// PM2 Ecosystem Configuration for ERPEX
// Manages the Express API server process

module.exports = {
  apps: [
    {
      name: 'erpex-api',
      cwd: '/var/www/erpex/packages/backend',
      script: 'dist/index.js',
      interpreter: 'node',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_file: '/var/www/erpex/packages/backend/.env',
      error_file: '/var/www/erpex/logs/error.log',
      out_file: '/var/www/erpex/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
