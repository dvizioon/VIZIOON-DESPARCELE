#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_ROOT="$SCRIPT_DIR"
APP_ROOT="$(cd "$DOCKER_ROOT/.." && pwd)"

DEPLOY_DIR="${DEPLOY_DIR:-production}"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-desparcele}"
COMPOSE_FILE="${COMPOSE_FILE:-$DEPLOY_DIR/docker-compose.yaml}"
OVERLAY_FILE="$DOCKER_ROOT/$DEPLOY_DIR/.env.$DEPLOY_DIR"

cd "$DOCKER_ROOT"

# shellcheck source=scripts/generate-env.sh
source "$DOCKER_ROOT/scripts/generate-env.sh"

resolve_compose_cmd() {
  if command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
    return 0
  fi
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
    return 0
  fi
  echo "ERRO: docker-compose ou docker compose não encontrado." >&2
  exit 1
}

COMPOSE_CMD="$(resolve_compose_cmd)"

prepare_deploy_env "$DOCKER_ROOT" "$APP_ROOT" "$OVERLAY_FILE"

if [ ! -s "$DOCKER_ROOT/.env" ]; then
  echo "ERRO: $DOCKER_ROOT/.env ficou vazio. Verifique APP_PREFIX e as variáveis." >&2
  exit 1
fi

echo "Compose: ${COMPOSE_CMD} (projeto ${COMPOSE_PROJECT}, arquivo ${COMPOSE_FILE}, APP_ENV=${DEPLOY_DIR})"
${COMPOSE_CMD} --env-file "$DOCKER_ROOT/.env" -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" down --remove-orphans || true
${COMPOSE_CMD} --env-file "$DOCKER_ROOT/.env" -p "${COMPOSE_PROJECT}" -f "${COMPOSE_FILE}" up -d --build

echo "Deploy concluído (${COMPOSE_PROJECT} / ${DEPLOY_DIR})."
