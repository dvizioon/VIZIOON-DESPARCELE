# shellcheck shell=bash
# Variáveis copiadas para docker/.env no deploy.
# No CI, o job define APP_PREFIX (development | production) e as vars
# vêm prefixadas: development_PORT, production_AUTH_URL, etc.

APP_ENV_KEYS=(
  APP_ENV
  NODE_ENV
  TZ
  DB_HOST
  DB_PORT
  DB_NAME
  DB_USER
  DB_PASS
  PORT
  HOST
  HOSTNAME
  AUTH_SECRET
  AUTH_URL
  AUTH_TRUST_HOST
  SEED_MASTER_EMAIL
  SEED_MASTER_PASSWORD
  SEED_MASTER_NAME
  LOCAL_STORAGE_PATH
  S3_ENABLED
  S3_ACCESS_KEY
  S3_SECRET_KEY
  S3_BUCKET
  S3_PORT
  S3_REGION
  S3_ENDPOINT
  S3_USE_SSL
  CRON_SECRET
)
