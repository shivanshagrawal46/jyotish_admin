#!/usr/bin/env bash
###############################################################################
# Deploy script for the Jyotish Admin (Node.js API + React admin) on a
# DigitalOcean droplet that may host OTHER apps too.
#
# Usage (on the server), after pulling the latest code:
#     git pull origin main
#     bash deploy.sh
#
# This script ONLY touches this app's own PM2 process ("$APP_NAME"). It never
# runs `pm2 restart all` / `pm2 kill`, so other deployments on the same droplet
# are left completely untouched.
#
# Node.js, npm and PM2 are assumed to be pre-installed on the droplet.
###############################################################################

set -euo pipefail

# ---- Config --------------------------------------------------------------
# Unique PM2 process name for THIS app. Override by exporting APP_NAME before
# running, e.g:  APP_NAME=my-app bash deploy.sh
APP_NAME="${APP_NAME:-jyotish-admin}"

# Resolve the directory this script lives in, so it works from anywhere.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log()  { printf '\n\033[1;35m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m[warn]\033[0m %s\n' "$1"; }
die()  { printf '\033[1;31m[error]\033[0m %s\n' "$1" >&2; exit 1; }

# ---- Sanity checks -------------------------------------------------------
command -v node >/dev/null 2>&1 || die "node is not installed / not on PATH"
command -v npm  >/dev/null 2>&1 || die "npm is not installed / not on PATH"
command -v pm2  >/dev/null 2>&1 || die "pm2 is not installed. Install it with: npm install -g pm2"

log "Deploying '$APP_NAME' from: $SCRIPT_DIR"
node -v
npm -v

# ---- 1. Backend dependencies --------------------------------------------
log "Installing backend dependencies"
if [ -f package-lock.json ]; then
  npm ci --omit=dev || npm install --omit=dev
else
  npm install --omit=dev
fi

# ---- 2. Build the React admin -------------------------------------------
if [ -d admin-react ]; then
  log "Building React admin (admin-react)"
  cd admin-react
  if [ -f package-lock.json ]; then
    npm ci || npm install
  else
    npm install
  fi
  npm run build
  cd "$SCRIPT_DIR"
  [ -f admin-react/dist/index.html ] || die "React build failed: admin-react/dist/index.html not found"
  log "React admin built -> served by Express at /admin"
else
  warn "admin-react/ folder not found - skipping React build"
fi

# ---- 3. (Re)start ONLY this app under PM2 --------------------------------
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  log "Reloading existing PM2 process '$APP_NAME' (zero-downtime)"
  pm2 reload "$APP_NAME" --update-env
else
  log "Starting new PM2 process '$APP_NAME'"
  pm2 start app.js --name "$APP_NAME" --time --update-env
fi

# Persist the PM2 process list so it survives reboots (does not affect others).
pm2 save

log "Deploy complete. Current status for '$APP_NAME':"
pm2 status "$APP_NAME" || pm2 status

cat <<EOF

Done!
  - API + admin server: managed by PM2 as '$APP_NAME'
  - React admin UI:      https://<your-domain>/admin
  - Logs:                pm2 logs $APP_NAME

EOF
