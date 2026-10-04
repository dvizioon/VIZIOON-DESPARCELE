# Docker — Desparcele

Mesmo desenho do Vizioon Brew: `ARG APP_PORT` / `ARG APP_ENV` no Dockerfile, Compose em `development` e `production`, e `docker/.env` gerado na hora do deploy.

O `.env` da máquina **não** entra na imagem. O `deploy.sh` copia as chaves para `docker/.env`. No Coolify as mesmas chaves vão em Environment Variables.

## Ambientes

| Pasta | Comando | `APP_ENV` |
| --- | --- | --- |
| `development/` | `bash development/deploy.sh` | `development` |
| `production/` | `bash production/deploy.sh` | `production` |

Nos dois casos o build **baixa as deps** (`npm ci`) e gera a imagem standalone.  
`NODE_ENV` no container fica `production` (servidor compilado). Quem diferencia homolog/prod é o `APP_ENV`.

```bash
cd docker
bash development/deploy.sh   # homolog
bash production/deploy.sh    # produção
```

Porta padrão: `7250` (`PORT` no `.env` da raiz do app).

## Coolify

Siga `docs/COOLIFY.md` (usa o mesmo `docker/Dockerfile`).
