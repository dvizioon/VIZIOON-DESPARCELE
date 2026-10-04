# Docker — Desparcele

Mesmo desenho do Vizioon Brew: `ARG APP_PORT` no Dockerfile, Compose de produção e entrypoint com migrate + seed seguro.

O `.env` da máquina **não** entra na imagem. Em Coolify as chaves vão em Environment Variables.

## Produção local (Compose)

```bash
cd docker/production
bash deploy.sh
```

Porta padrão: `7250` (`PORT` no `.env`).

## Coolify

Siga `docs/COOLIFY.md`.
