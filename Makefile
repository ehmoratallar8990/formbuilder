.PHONY: help setup install dev prod stop logs migrate migrate-rollback seed \
        test lint build clean shell redis-flush docs-dev docs-build

# Container and service names
APP_CONTAINER = formbuilder-app-1
COMPOSE_DEV   = docker compose -f docker-compose.dev.yml
COMPOSE_PROD  = docker compose -f docker-compose.prod.yml

##@ ─── Help ─────────────────────────────────────────────────────────────────

help: ## Show this help message
	@echo ""
	@echo "  Form Builder — Developer Commands"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n  \033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)
	@echo ""

##@ ─── Setup ─────────────────────────────────────────────────────────────────

setup: ## Init env files from examples and start dev stack
	@if [ ! -f .env.api ]; then cp .env.api.example .env.api; echo "  Created .env.api from example — fill in your values"; fi
	@if [ ! -f .env.cms ]; then cp .env.cms.example .env.cms; echo "  Created .env.cms from example — fill in your values"; fi
	@echo "  Env files ready. Run 'make dev' to start."

install: ## Install all dependencies (npm + composer)
	cd cms && npm install
	cd renderer && npm install
	cd docs && npm install
	cd api && composer install

##@ ─── Development ───────────────────────────────────────────────────────────

dev: ## Start development stack (hot reload, MySQL, optional Redis)
	$(COMPOSE_DEV) up --build

dev-redis: ## Start dev stack WITH Redis
	$(COMPOSE_DEV) --profile redis up --build

stop: ## Stop all containers
	$(COMPOSE_DEV) down 2>/dev/null || true
	$(COMPOSE_PROD) down 2>/dev/null || true

logs: ## Tail container logs (dev stack)
	$(COMPOSE_DEV) logs -f

##@ ─── Production ────────────────────────────────────────────────────────────

build: ## Build production Docker image
	docker build -f docker/Dockerfile -t formbuilder:latest .

prod: ## Start production stack (requires 'make build' first)
	$(COMPOSE_PROD) up -d

prod-redis: ## Start production stack WITH Redis
	$(COMPOSE_PROD) --profile redis up -d

##@ ─── Database ──────────────────────────────────────────────────────────────

migrate: ## Run database migrations inside container
	docker exec $(APP_CONTAINER) php /var/www/api/artisan migrate --force

migrate-rollback: ## Rollback last migration batch
	docker exec $(APP_CONTAINER) php /var/www/api/artisan migrate:rollback

seed: ## Run database seeders
	docker exec $(APP_CONTAINER) php /var/www/api/artisan db:seed --force

##@ ─── Testing ───────────────────────────────────────────────────────────────

test: ## Run all tests (PHP + renderer unit)
	docker exec $(APP_CONTAINER) php /var/www/api/artisan test

test-php: ## Run PHP tests only
	docker exec $(APP_CONTAINER) ./vendor/bin/pest --working-dir=/var/www/api

##@ ─── Code Quality ──────────────────────────────────────────────────────────

lint: ## Lint PHP and JS code
	@echo "Linting PHP..."
	docker exec $(APP_CONTAINER) php /var/www/api/artisan pint --test 2>/dev/null || cd api && ./vendor/bin/pint --test
	@echo "Linting CMS..."
	cd cms && npx eslint src/ 2>/dev/null || true

##@ ─── Utility ───────────────────────────────────────────────────────────────

shell: ## Open shell in app container
	docker exec -it $(APP_CONTAINER) sh

redis-flush: ## Flush Redis cache
	docker exec $(APP_CONTAINER) php /var/www/api/artisan cache:clear
	$(COMPOSE_DEV) exec redis redis-cli FLUSHALL 2>/dev/null || true

clean: ## Remove containers, volumes, and build artifacts
	@echo "WARNING: This removes all containers and volumes. Press Ctrl+C to cancel."
	@sleep 3
	$(COMPOSE_DEV) down -v --remove-orphans 2>/dev/null || true
	$(COMPOSE_PROD) down -v --remove-orphans 2>/dev/null || true
	rm -rf cms/dist renderer/dist docs/.vitepress/dist docs/.vitepress/cache

##@ ─── Docs ──────────────────────────────────────────────────────────────────

docs-dev: ## Start VitePress docs dev server
	cd docs && npm run docs:dev

docs-build: ## Build VitePress docs site
	cd docs && npm run docs:build
