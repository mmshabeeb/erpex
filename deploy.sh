#!/bin/bash
# ============================================================
# ERPEX — Hostinger Deployment Script
# Runs on the Hostinger Node.js app directory after rsync
# ============================================================

set -e

DB_DIR="${DB_DIR:-$HOME/domains/mizusubeauty.com/db}"
APP_DIR="$(pwd)"

echo "🚀 ERPEX Deployment starting..."

# ─── Activate Hostinger's Node.js virtual environment ────────
# Adjust this path if it doesn't match hPanel's "Enter virtual environment" command
NODEVENV="$HOME/nodevenv/domains/mizusubeauty.com/nodejs/${NODE_VERSION:-20}/bin/activate"
if [ -f "$NODEVENV" ]; then
  source "$NODEVENV"
fi

# ─── Create persistent DB directory ─────────────────────────
mkdir -p "$DB_DIR"

# ─── Setup environment file (BEFORE anything else) ──────────
if [ ! -f "$APP_DIR/packages/backend/.env" ]; then
  echo "📝 Creating default .env file..."
  cat > "$APP_DIR/packages/backend/.env" << ENVEOF
NODE_ENV=production
PORT=3001
DATABASE_URL="file:${DB_DIR}/erpex.db"
JWT_SECRET=erpex-production-jwt-secret-change-this-in-production
JWT_REFRESH_SECRET=erpex-production-refresh-secret-change-this-too
ENVEOF
  echo "⚠️  IMPORTANT: Update JWT secrets in $APP_DIR/packages/backend/.env"
fi

# ─── Install production dependencies ─────────────────────────
echo "📦 Installing production dependencies..."
cd "$APP_DIR"
npm install --omit=dev --ignore-scripts

# ─── Generate Prisma Client & push schema ────────────────────
echo "🗂️ Generating Prisma Client..."
cd "$APP_DIR/packages/backend"
npx prisma generate

echo "🗄️  Setting up database..."
export $(grep -v '^#' .env | xargs)
npx prisma db push --accept-data-loss 2>/dev/null || true

# ─── Restart the app via Passenger ───────────────────────────
echo "🔄 Restarting application..."
cd "$APP_DIR"
mkdir -p tmp
touch tmp/restart.txt
touch packages/backend/dist/index.js

echo ""
echo "✅ ERPEX deployed successfully!"
echo "   Frontend: https://mizusubeauty.com/erpex/"
echo "   API:      https://mizusubeauty.com/erpex/api/health"
echo "   DB:       $DB_DIR/erpex.db"
echo ""
