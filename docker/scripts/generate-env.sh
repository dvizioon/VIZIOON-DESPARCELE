#!/usr/bin/env bash
# Gera docker/.env

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=app-env-keys.sh
source "$SCRIPT_DIR/app-env-keys.sh"

read_app_prefix() {
  local raw="${APP_PREFIX:-${NODE_PREFIX:-}}"
  raw="${raw#"${raw%%[![:space:]]*}"}"
  raw="${raw%"${raw##*[![:space:]]}"}"

  if [ -z "$raw" ]; then
    return 0
  fi

  printf '%s' "$raw"
}

resolve_env_value() {
  local key="$1"
  local prefix="$2"
  local prefixed_key=""
  local value=""

  if [ -n "$prefix" ]; then
    prefixed_key="${prefix}_${key}"
    value="${!prefixed_key:-}"
    if [ -n "$value" ]; then
      printf '%s' "$value"
      return 0
    fi
  fi

  value="${!key:-}"
  if [ -n "$value" ]; then
    printf '%s' "$value"
  fi
}

generate_resolved_env_file() {
  local outfile="$1"
  local prefix
  prefix="$(read_app_prefix)"

  : >"$outfile"

  if [ -n "$prefix" ]; then
    echo "APP_PREFIX=${prefix}" >>"$outfile"
  fi

  local key value
  for key in "${APP_ENV_KEYS[@]}"; do
    value="$(resolve_env_value "$key" "$prefix")"
    if [ -n "$value" ]; then
      printf '%s=%s\n' "$key" "$value" >>"$outfile"
    fi
  done
}

set_key() {
  local key="$1"
  local value="$2"
  local outfile="$3"
  local tmp
  tmp="$(mktemp)"
  grep -v "^${key}=" "$outfile" >"$tmp" || true
  mv "$tmp" "$outfile"
  printf '%s=%s\n' "$key" "$value" >>"$outfile"
}

apply_container_paths() {
  local outfile="$1"
  local app_env="${2:-production}"
  set_key LOCAL_STORAGE_PATH "/app/storage" "$outfile"
  set_key HOSTNAME "0.0.0.0" "$outfile"
  # Imagem Next standalone sempre roda em production; APP_ENV marca o deploy.
  set_key NODE_ENV "production" "$outfile"
  set_key APP_ENV "$app_env" "$outfile"
}

merge_overlay_defaults() {
  local overlay_file="$1"
  local outfile="$2"

  if [ ! -f "$overlay_file" ]; then
    return 0
  fi

  while IFS= read -r line || [ -n "$line" ]; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" != *"="* ]] && continue

    local key="${line%%=*}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"

    local value="${line#*=}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"

    if [ -z "$value" ]; then
      continue
    fi

    if [ "${CI:-}" = "true" ]; then
      case "$key" in
        AUTH_*|PORT|HOST|HOSTNAME|DB_*|LOCAL_STORAGE_PATH|NODE_ENV|APP_ENV)
          continue
          ;;
      esac
    fi

    if grep -q "^${key}=" "$outfile"; then
      continue
    fi

    echo "$line" >>"$outfile"
  done <"$overlay_file"
}

prepare_deploy_env() {
  local docker_root="$1"
  local app_root="$2"
  local overlay_file="${3:-}"
  local outfile="$docker_root/.env"
  local deploy_env="${DEPLOY_DIR:-production}"

  if [ "${CI:-}" = "true" ]; then
    echo "CI: gerando .env a partir das variáveis (APP_PREFIX=${APP_PREFIX:-${NODE_PREFIX:-<vazio>}})"
    generate_resolved_env_file "$outfile"
    local overlay="$docker_root/${deploy_env}/.env.${deploy_env}"
    if [ -f "$overlay" ]; then
      echo "CI: aplicando defaults de $overlay para chaves ausentes"
      merge_overlay_defaults "$overlay" "$outfile"
    fi
    apply_container_paths "$outfile" "$deploy_env"
    return 0
  fi

  local app_env="$app_root/.env"

  if [ -f "$app_env" ]; then
    echo "Local: usando $app_env"
    cp "$app_env" "$outfile"
    apply_container_paths "$outfile" "$deploy_env"
    return 0
  fi

  echo "ERRO: defina variáveis no CI ou crie $app_env para deploy local." >&2
  exit 1
}
