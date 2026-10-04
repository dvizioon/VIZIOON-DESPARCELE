# Docker Desparcele

Mesmo desenho do Vizioon Brew: `APP_PORT` / `APP_ENV` no Dockerfile, Compose em `development` e `production`, e `docker/.env` gerado no deploy.

O `.env` da máquina não entra na imagem. No Coolify as chaves vão em Environment Variables.

| Pasta | Comando | `APP_ENV` |
| --- | --- | --- |
| `development/` | `bash development/deploy.sh` | `development` |
| `production/` | `bash production/deploy.sh` | `production` |

Nos dois o build roda `npm ci` e gera a imagem standalone. `NODE_ENV` no container fica `production`. Quem diferencia homolog/prod é o `APP_ENV`.

```bash
cd docker
bash development/deploy.sh
bash production/deploy.sh
```

Porta padrão: `7250`. Coolify: `docs/COOLIFY.md`.
