# Form Builder Platform

Graph-based form builder with Lit-powered rendering. PHP/Laravel backend, Vue.js CMS, Lit web component renderer.

## Project Structure

```
├── api/           PHP/Laravel backend — REST API, auth, DB
├── cms/           Vue.js CMS — form builder UI, dashboards
├── renderer/      Lit renderer library — <form-renderer> web component
├── docs/          VitePress documentation site
├── docker/        Dockerfile, nginx.conf
├── .env.api.example    Backend env template (copy to .env.api)
├── .env.cms.example    Frontend env template (copy to .env.cms)
└── Makefile            All developer commands
```

## Quick Start

```bash
# 1. Copy and fill env files
cp .env.api.example .env.api
cp .env.cms.example .env.cms
# Edit both files with your values

# 2. Start dev stack (requires Docker)
make setup
make dev

# 3. Run migrations
make migrate

# 4. (Optional) Seed default data
make seed
```

## Prerequisites

- Docker + Docker Compose
- make

> Windows users: use WSL2.

## Common Commands

| Command | Description |
|---------|-------------|
| `make setup` | Copy env examples, init dev stack |
| `make dev` | Start development stack (hot reload) |
| `make prod` | Start production stack |
| `make stop` | Stop all containers |
| `make logs` | Tail container logs |
| `make migrate` | Run database migrations |
| `make migrate-rollback` | Rollback last migration batch |
| `make seed` | Run database seeders |
| `make test` | Run PHP + JS tests |
| `make lint` | Lint all code |
| `make build` | Build production assets |
| `make clean` | Remove containers and volumes |
| `make redis-flush` | Clear Redis cache |
| `make shell` | Open shell in app container |

See `Makefile` for full list.

## Security Notice

- `.env.api` contains backend secrets. **Never expose it to the frontend build context.**
- `.env.cms` contains only public `VITE_*` vars safe for browser exposure.
- Render keys are shown only once on creation. Store them securely.

## Architecture

- **Single container**: Nginx + PHP-FPM + Vue static assets. No CORS issues.
- **Redis optional**: Set `REDIS_ENABLED=true` in `.env.api` to enable caching.
- **Environments**: Each form has `development`, `staging`, `production` environments with independent revision lifecycles.

## Docs

```bash
cd docs && npm install && npm run docs:dev
```

Open http://localhost:5173
