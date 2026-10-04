# Desparcele

Controle de dívidas parceladas para casais e pessoas.

## Docs

- [docs/README.md](docs/README.md) — índice
- [docs/SISTEMA.md](docs/SISTEMA.md) — o que o sistema faz e o que já foi construído
- [docs/COOLIFY.md](docs/COOLIFY.md) — subir no Coolify (padrão Brew / `*.dvizioon.com`)
- [docker/README.md](docker/README.md) — Docker Compose

## Dev

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

App em `http://localhost:7250`.

## Produção (Compose)

```bash
cd docker/production
bash deploy.sh
```

No Coolify: Build Pack **Dockerfile**, location `/docker/Dockerfile`, porta **7250**. Detalhes em `docs/COOLIFY.md`.
