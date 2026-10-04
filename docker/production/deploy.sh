#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yaml"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-desparcele}"

cd "$APP_ROOT"

if [ ! -f .env ]; then
  echo "ERRO: falta .env na raiz do projeto." >&2
  exit 1
fi

if command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  echo "ERRO: docker-compose ou docker compose não encontrado." >&2
  exit 1
fi

echo "Compose: ${COMPOSE_CMD} (projeto ${COMPOSE_PROJECT})"
${COMPOSE_CMD} --env-file .env -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" down --remove-orphans || true
${COMPOSE_CMD} --env-file .env -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" up -d --build
echo "Deploy concluído (${COMPOSE_PROJECT})."
