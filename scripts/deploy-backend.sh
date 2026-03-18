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

echo "[INFO] Starting postgres, redis, backend..."
docker compose --env-file "$ENV_FILE" up -d postgres redis backend

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

echo "[INFO] Running Prisma migrations (deploy)..."
if docker compose --env-file "$ENV_FILE" exec -T backend sh -lc 'command -v prisma >/dev/null 2>&1'; then
  docker compose --env-file "$ENV_FILE" exec -T backend npm run prisma:migrate:deploy
else
  echo "[WARN] Prisma CLI is not available in backend runtime container. Falling back to host migration."
  container_db_url="$(docker compose --env-file "$ENV_FILE" exec -T backend printenv DATABASE_URL 2>/dev/null | tr -d '\r')"
  if [[ -z "$container_db_url" ]]; then
    echo "[ERROR] Cannot read DATABASE_URL from backend container for migration fallback."
    exit 1
  fi

  migration_db_url="$container_db_url"
  migration_db_url="${migration_db_url/@postgres:5432/@localhost:5432}"

  (
    cd "$ROOT_DIR/apps/backend"
    DATABASE_URL="$migration_db_url" \
    POOLED_DATABASE_URL="$migration_db_url" \
    DIRECT_DATABASE_URL="$migration_db_url" \
    npm run prisma:migrate:deploy
  )
fi

echo "[INFO] Backend deploy test completed."
docker compose --env-file "$ENV_FILE" ps backend

echo "[INFO] Recent backend logs:"
docker compose --env-file "$ENV_FILE" logs --tail=60 backend
