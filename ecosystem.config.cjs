// PM2 Ecosystem Configuration for ERPEX
// Manages the Express API server process

const path = require('path');
const fs = require('fs');

// Load .env file manually for PM2
const envPath = '/var/www/erpex/packages/backend/.env';
const envVars = { NODE_ENV: 'production', PORT: 3001 };

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        // Remove surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        envVars[key] = val;
      }
    }
  }
}

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
      env: envVars,
      error_file: '/var/www/erpex/logs/error.log',
      out_file: '/var/www/erpex/logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
