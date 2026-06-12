#!/bin/bash
# ============================================================
# ERPEX — VPS Deployment Script
# Runs on the Hostinger VPS after rsync
# ============================================================

set -e

APP_DIR="/var/www/erpex"
cd "$APP_DIR"

echo "🚀 ERPEX Deployment starting..."

# ─── Install production dependencies ─────────────────────────
echo "📦 Installing production dependencies..."
cd "$APP_DIR"
npm install --omit=dev --ignore-scripts

echo "🗂️ Generating Prisma Client..."
cd "$APP_DIR/packages/backend"
npx prisma generate

# ─── Initialize database (if first deploy) ───────────────────
echo "🗄️  Setting up database..."
cd "$APP_DIR/packages/backend"
npx prisma db push --accept-data-loss 2>/dev/null || true

# ─── Setup environment file ─────────────────────────────────
if [ ! -f "$APP_DIR/packages/backend/.env" ]; then
  echo "📝 Creating default .env file..."
  cat > "$APP_DIR/packages/backend/.env" << 'ENVEOF'
NODE_ENV=production
PORT=3001
DATABASE_URL="file:./erpex.db"
JWT_SECRET=erpex-production-jwt-secret-change-this-in-production
JWT_REFRESH_SECRET=erpex-production-refresh-secret-change-this-too
ENVEOF
  echo "⚠️  IMPORTANT: Update JWT secrets in $APP_DIR/packages/backend/.env"
fi

# ─── Start/Restart with PM2 ─────────────────────────────────
echo "🔄 Restarting application with PM2..."
cd "$APP_DIR"
mkdir -p logs

# Install PM2 globally if not present
if ! command -v pm2 &> /dev/null; then
  echo "📥 Installing PM2..."
  npm install -g pm2
fi

# Stop existing app if running
pm2 stop erpex-api 2>/dev/null || true
pm2 delete erpex-api 2>/dev/null || true

# Start with ecosystem config
pm2 start ecosystem.config.cjs

# Save PM2 process list (survives reboot)
pm2 save

# Setup PM2 startup script (first time only)
pm2 startup 2>/dev/null || true

# ─── Setup Nginx (first time only) ──────────────────────────
NGINX_CONF="/etc/nginx/sites-available/erpex"
if [ ! -f "$NGINX_CONF" ]; then
  echo "🌐 Setting up Nginx configuration..."
  sudo cp "$APP_DIR/nginx-erpex.conf" "$NGINX_CONF" 2>/dev/null || true
  sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/erpex 2>/dev/null || true
  sudo nginx -t 2>/dev/null && sudo systemctl reload nginx 2>/dev/null || true
  echo "⚠️  Review Nginx config at $NGINX_CONF and reload: sudo systemctl reload nginx"
else
  echo "🌐 Nginx config already exists. Reloading..."
  sudo nginx -t 2>/dev/null && sudo systemctl reload nginx 2>/dev/null || true
fi

echo ""
echo "✅ ERPEX deployed successfully!"
echo "   API:      http://localhost:3001/api/health"
echo "   Frontend: /var/www/erpex/erpex/"
echo "   Logs:     pm2 logs erpex-api"
echo ""
