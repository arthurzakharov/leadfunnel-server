# leadfunnel-server

Hono app running on Bun, shipped as a Docker image.

## Local development (hot reload)

```sh
docker compose -f docker-compose.dev.yml up --build
```

Open http://localhost:3001. Edits in `src/` are applied right away (`bun --hot`).

Without Docker: `bun install && bun run dev` → http://localhost:3000

## Production

The `release` stage of the `Dockerfile` builds a slim image with production deps only. It runs as a non-root user and has a healthcheck on `/health`.

Build and run locally:

```sh
docker compose -f docker-compose.prod.yml up -d --build
```

Build and push to a registry:

```sh
docker build --target release -t <registry>/leadfunnel-server:<tag> .
docker push <registry>/leadfunnel-server:<tag>
```

Configuration comes from environment variables (`PORT`, defaults to 3000). The prod compose file also reads an optional `.env`.
