# Deploy — Desparcele (homolog / development)

```bash
cd docker
bash development/deploy.sh
```

O build roda `npm ci` (baixa tudo) e gera a imagem standalone.  
`APP_ENV=development` marca o ambiente do deploy.  
`NODE_ENV` dentro do container fica `production` porque o que sobe é o Next já compilado (igual Brew).
