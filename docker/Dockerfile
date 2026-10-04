FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY scripts/with-db-url.cjs scripts/copy-tinymce.cjs ./scripts/
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/desparcele
RUN set -eu; ok=0; \
  for i in 1 2 3; do \
    if npm ci --include=dev; then ok=1; break; fi; \
    echo "npm ci falhou, nova tentativa $i"; \
    sleep 8; \
  done; \
  test "$ok" = 1
COPY . .
RUN npx prisma generate && NODE_ENV=production npm run build
RUN node -e "const fs=require('fs');const path=require('path');const destRoot='/opt/prisma-cli/node_modules';const seen=new Set();function copyPkg(name){if(seen.has(name))return;const src=path.join('/app/node_modules',name);if(!fs.existsSync(path.join(src,'package.json')))return;seen.add(name);const dest=path.join(destRoot,name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.cpSync(src,dest,{recursive:true,dereference:true});const pkg=JSON.parse(fs.readFileSync(path.join(src,'package.json'),'utf8'));for(const dep of Object.keys({...pkg.dependencies,...pkg.optionalDependencies}))copyPkg(dep);}copyPkg('prisma');"

FROM node:22-bookworm-slim

ARG APP_PORT=7250
ARG APP_ENV=production
ENV PORT=${APP_PORT}
ENV APP_ENV=${APP_ENV}
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0

RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts/with-db-url.cjs ./scripts/with-db-url.cjs
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=build /opt/prisma-cli/node_modules /opt/prisma-cli/node_modules
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
EXPOSE ${APP_PORT}
ENTRYPOINT ["docker-entrypoint.sh"]
