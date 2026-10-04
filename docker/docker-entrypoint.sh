#!/bin/sh
set -eu

storage="${LOCAL_STORAGE_PATH:-/app/storage}"
case "$storage" in
  /*) ;;
  *) storage="/app/${storage#./}" ;;
esac
mkdir -p "$storage"
export LOCAL_STORAGE_PATH="$storage"

export PORT="${PORT:-7250}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"

if [ -z "${DATABASE_URL:-}" ] || [ "${DATABASE_URL#file:}" != "$DATABASE_URL" ]; then
  DATABASE_URL="$(node -e 'const u=encodeURIComponent(process.env.DB_USER||""); const p=encodeURIComponent(process.env.DB_PASS||""); const h=process.env.DB_HOST||"localhost"; const port=process.env.DB_PORT||"5432"; const n=process.env.DB_NAME||""; if(!u||!n){process.stderr.write("Defina DB_HOST, DB_PORT, DB_NAME, DB_USER e DB_PASS.\n"); process.exit(1);} process.stdout.write("postgresql://"+u+":"+p+"@"+h+":"+port+"/"+n);')"
  export DATABASE_URL
fi

echo "Aguardando o Postgres em ${DB_HOST}:${DB_PORT}"
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  sleep 2
done

PRISMA="node /opt/prisma-cli/node_modules/prisma/build/index.js"
SCHEMA="--schema=/app/prisma/schema.prisma"

# P3009: essa migration falhou antes e o Prisma bloqueia tudo até limpar o marcador.
# Comando oficial: https://pris.ly/d/migrate-resolve
"$PRISMA" migrate resolve --rolled-back 20261004021500_system_config_and_schema_sync $SCHEMA || true
"$PRISMA" migrate deploy $SCHEMA

echo "Seed (usuário inicial)..."
npm run db:seed
exec node /app/server.js
