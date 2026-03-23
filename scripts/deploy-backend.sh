#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[ERROR] Missing env file: $ENV_FILE"
  echo "Create it from .env.example first: cp .env.example .env"
  exit 1
fi

required_vars=(
  DB_PASSWORD
  REDIS_PASSWORD
  JWT_SECRET
)

recommended_vars=(
  FRONTEND_URL
  CORS_ORIGIN
)

for key in "${required_vars[@]}"; do
  if ! grep -Eq "^${key}=" "$ENV_FILE"; then
    echo "[ERROR] Missing required variable in $ENV_FILE: $key"
    exit 1
  fi

  value="$(grep -E "^${key}=" "$ENV_FILE" | tail -n1 | cut -d'=' -f2-)"
  value="${value%\"}"
  value="${value#\"}"
  if [[ -z "$value" ]]; then
    echo "[ERROR] Empty value for $key in $ENV_FILE"
    exit 1
  fi

done

for key in "${recommended_vars[@]}"; do
  if ! grep -Eq "^${key}=" "$ENV_FILE"; then
    echo "[WARN] $key is not set in $ENV_FILE (compose default will be used)."
  fi
done

echo "[INFO] Building backend image..."
docker compose --env-file "$ENV_FILE" build backend

echo "[INFO] Starting postgres, redis (without backend yet)..."
docker compose --env-file "$ENV_FILE" up -d postgres redis

# Wait for DB to be ready before migrations
echo "[INFO] Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=1
while (( attempt <= max_attempts )); do
  if docker compose --env-file "$ENV_FILE" exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
    echo "[INFO] PostgreSQL is ready."
    break
  fi
  echo "[INFO] Attempt $attempt/$max_attempts - waiting for PostgreSQL..."
  sleep 2
  ((attempt++))
done

if (( attempt > max_attempts )); then
  echo "[ERROR] PostgreSQL did not become ready in time."
  exit 1
fi

# ⭐ CRITICAL: Run migrations BEFORE starting app
echo "[INFO] Running Prisma migrations (before app start)..."
if docker compose --env-file "$ENV_FILE" exec -T postgres pg_isready >/dev/null 2>&1; then
  # Get DATABASE_URL from environment or .env
  migration_db_url="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | tail -n1 | cut -d'=' -f2- | tr -d '"')"
  
  if [[ -z "$migration_db_url" ]]; then
    echo "[ERROR] DATABASE_URL not found in $ENV_FILE"
    exit 1
  fi

  (
    cd "$ROOT_DIR/apps/backend"
    DATABASE_URL="$migration_db_url" \
    POOLED_DATABASE_URL="$migration_db_url" \
    DIRECT_DATABASE_URL="$migration_db_url" \
    npm run prisma:migrate:deploy
  )

  if (( $? != 0 )); then
    echo "[ERROR] Migration failed - aborting app start to prevent incompatible schema"
    exit 1
  fi
else
  echo "[ERROR] Cannot connect to PostgreSQL for migration"
  exit 1
fi

# Now start backend (migrations already completed)
echo "[INFO] Starting backend container (migrations already completed)..."
docker compose --env-file "$ENV_FILE" up -d backend

echo "[INFO] Waiting for backend health..."
max_attempts=30
attempt=1
while (( attempt <= max_attempts )); do
  health_status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' edukids-backend 2>/dev/null || true)"
  if [[ "$health_status" == "healthy" ]]; then
    echo "[INFO] Backend is healthy."
    break
  fi

  echo "[INFO] Attempt $attempt/$max_attempts - current health: ${health_status:-unavailable}"
  sleep 3
  ((attempt++))
done

if (( attempt > max_attempts )); then
  echo "[ERROR] Backend did not become healthy in time."
  docker compose --env-file "$ENV_FILE" logs --tail=120 backend
  exit 1
fi

echo "[INFO] Backend deploy test completed."
docker compose --env-file "$ENV_FILE" ps backend

echo "[INFO] Recent backend logs:"
docker compose --env-file "$ENV_FILE" logs --tail=60 backend
