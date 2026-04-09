# Development Log
<!-- APPEND-ONLY: never edit or delete prior entries. Add new entries below the last entry. -->
<!-- Format: ## [YYYY-MM-DD] — [Phase: Planning|Implementation|Testing|Bugfix] — [Short title] -->

---

## [2026-04-09] — Phase: Planning — Initial requirements analysis and backlog generation

### Context
Full project plan generated from `initialprompt.md`. All blocking questions answered by user. Tasks written to `.indexfilecollection/tasks.md`.

### Confirmed decisions
- **Stack**: Vue.js (no TS) + SCSS + Vite 8 (CMS), PHP/Laravel (API), MySQL, Lit (renderer), VitePress (docs)
- **Container**: **Single container** = Nginx + PHP-FPM + Vue static. CORS eliminated by design.
- **Auth**: Session-based (HTTP-only cookies, SameSite=Lax, CSRF). OIDC = Authorization Code + PKCE (configurable provider).
- **Roles**: admin > brand_editor > campaign_editor > form_editor > viewer. Entity-scoped via `user_roles(user_id, role_id, entity_type, entity_id)`.
- **Form status (visibility)**: `unpublished` → `published` → `archived`. These are **separate** from revision status.
- **Revision status**: `draft` → `published`. One published revision per form_environment at a time. Auto-created on save (WordPress-style).
- **Environments**: `development`, `staging`, `production`. Revisions exist per environment. Promotion = manual promote button (optional scheduled).
- **Flow engine**: DAG only (acyclic). No loops.
- **Render eligibility**: 4-gate check: (1) form published, (2) published revision exists, (3) domain allowlisted, (4) render key valid. All 4 must pass.
- **Render keys**: UUID API keys, bcrypt-hashed in DB, shown plain once on creation. Multiple active keys per env supported.
- **Domain allowlist**: Per form + per environment. Wildcard `*.example.com` supported. Localhost always allowed in dev env.
- **Redis**: Optional. `REDIS_ENABLED` toggle. Falls back to array driver / no-cache / file rate-limiter.
- **File storage**: Configurable driver (local default, S3-compatible). Config inheritable brand → campaign → form.
- **Submissions**: MySQL default. JSON export. Webhook option (async queue, sync fallback). Honeypot anti-spam.
- **Insights**: Adblock-friendly naming. Session tracking (no cookies), canvas fingerprint, time-on-page, IP. Per-form GTM/GA4 injection.
- **Theming**: CSS custom properties. Light/dark mode, configurable colors, border radius. Per-form.
- **Env files**: Separate `.env.cms` (Vite-public, VITE_* only) and `.env.api` (backend secrets, never in build). Security-critical: cms build stage must NOT access .env.api.
- **i18n**: Infrastructure only. English default. All validation errors and render denial messages customizable per locale.

### Unconfirmed assumptions to validate before implementation starts
- **A1**: PHP framework = Laravel 11 (used for all migration, routing, queue, session references in tasks.md). **Must confirm** before any `api/` code is written.
- **A2**: Vue Router 4 + Pinia for CMS state.
- **A3**: Render keys = UUID v4.
- **A4**: `role_permissions` uses string permission names (not numeric IDs only).
- **A5**: Rate limiter fallback = Laravel 'file' driver (not in-memory, persists across restarts).
- **A6**: Canvas fingerprint = custom client-side implementation (no FingerprintJS or similar library — avoids GDPR complexity).
- **A7**: VitePress used for docs; kitchensink page lives at `/kitchensink` route within docs.
- **A8**: Form builder graph library = Vue Flow (MIT license). Evaluate before Task 6.2.a.

### Technical risks identified
1. **Single container complexity**: Multi-process in one container (Nginx + PHP-FPM). Use supervisor or s6-overlay for process management. Risk: harder to scale horizontally; acceptable for MVP per client decision.
2. **Form JSON as LONGTEXT**: Large complex forms may hit MySQL row limits. If form_json exceeds 4MB typical MySQL row limit, consider MEDIUMTEXT or partitioned storage. Flag at Task 6.1.a.
3. **DAG cycle detection**: Must be implemented in both CMS builder (before save) and `ConditionalFlowEngine` (on load). Dual enforcement required.
4. **OIDC provider configurability**: Using a generic OIDC client (e.g. `league/oauth2-client` + OIDC plugin). Must validate that discovery URL (`/.well-known/openid-configuration`) is supported by target provider. Flag at Task 3.2.a.
5. **Honeypot vs. real submission**: Honeypot-flagged submissions are stored but silently returned as success. CMS must filter them out in default views. Risk of confusion if not clearly tagged in UI.
6. **Cache invalidation on revision publish**: Publish action must bust cache atomically. If Redis goes down between publish and cache bust: stale cache possible. TTL expiry is safety net. Document this risk.
7. **Shadow DOM + GTM**: GTM injection must target `document.head`, not shadow root. Documented in 8.3 and 10.3. Test explicitly in kitchensink.
8. **Makefile cross-platform**: Mac/Linux only. Windows users will need WSL2. Document clearly in README.

### Epic dependency order (implementation sequence)
1. E1 (Infra) → E2 (DB) → E3 (Auth) → E4 (Hierarchy) → E5 (Lifecycle)
2. E7 (Render keys/allowlist) can parallel E4/E5 once E2 done
3. E6 (Builder) depends on E5 complete + E6.1 (JSON schema) done first
4. E8 (Lit renderer) can start in parallel with E6 after E6.1 complete
5. E9 (Submissions) after E8 + E6
6. E10 (Insights) after E7 + E8
7. E11 (Redis) can parallel E8/E9 (infra-level)
8. E12 (Theming) after E8
9. E13 (Docs) last, after all renderer APIs stabilized

### Next action
Start with **Epic 1** tasks in order: 1.1.a → 1.1.b → 1.1.c → 1.1.d → 1.1.e.
**Blocker before 1.1.b**: Confirm PHP framework (A1). If not Laravel: revise all migration/ORM references in tasks.md before writing any code.

### Open questions for next session
- Confirm A1: Laravel 11 or plain PHP + Phinx?
- Is `api/` a fresh Laravel install or adapting existing code?
- Any existing DB schema or is this fully greenfield?
- Target PHP hosting: any constraints on PHP-FPM versions or extensions?

---

## [2026-04-09] — Phase: Implementation — Story 1.1: Monorepo scaffolding

### What was done
- `api/`: Laravel 11.51.0 installed via `composer create-project laravel/laravel:^11`
- `cms/`: Vite 8.0.8 + Vue 3.5.32 created. Added vue-router 4, pinia 2, axios, sass. Updated `vite.config.js` with alias, SCSS additionalData, dev server proxy to `/api`. Replaced `style.css` with `src/assets/main.scss` + `src/assets/tokens.scss` (CSS custom props). Updated `App.vue` to `<router-view>`. Added `src/router/index.js`.
- `renderer/`: Manual skeleton. `package.json` with lit 3, vite 8. `vite.config.js` library mode (es + umd + iife → `form-renderer.esm.js`, `.umd.cjs`, `.iife.js`). `src/index.js` public API. `src/components/FormRenderer.js` (Lit, light DOM default, all public API methods stubbed). `src/loader.js` (MutationObserver-based auto-inject). `src/engines/ConditionalFlowEngine.js` (pure DAG evaluator + cycle detection). `src/engines/ValidationEngine.js` (pure validation runner, all rule types).
- `docs/`: VitePress skeleton. `package.json`, `.vitepress/config.js`, `index.md`.
- Root: `.gitignore` (blocks `.env.api`, `.env.cms`, `vendor/`, `node_modules/`, build dirs). `.env.api.example` (backend vars, no VITE_ prefix). `.env.cms.example` (only `VITE_*` vars). `README.md`.

### Decisions made
- A1 confirmed: Laravel 11 (used successfully)
- `npm create vite` auto-completed in background — Vite 8 confirmed automatically
- Renderer: chose `umd` as third format (alongside es + iife) for compatibility. Tasks.md said "UMD+ESM" in AC.
- `ConditionalFlowEngine` AND `ValidationEngine` built now as skeleton — they're required by both renderer (8.2) and CMS previewer (6.9). Shared code avoids duplication.

### All tests passed
- `php artisan --version` → Laravel 11.51.0 ✓
- `npm run build` (renderer) → ESM + UMD + IIFE produced ✓
- `npm run build` (CMS) → built in 504ms, no errors ✓
- `.gitignore` test: `.env.api`/`.env.cms` excluded; examples visible ✓

### Next
Story 1.2: Single container Dockerfile (multi-stage: node-cms, node-renderer, composer, nginx+php-fpm).

---

## [2026-04-09] — Phase: Implementation — Stories 1.2–1.6: Docker, Makefile, Env

### What was done
- **Story 1.2**: `docker/Dockerfile` — 4-stage multi-stage build (node-cms-build, node-renderer-build, composer-build, final php:8.2-fpm-alpine+nginx). `docker/nginx.conf` — Nginx serves Vue on `/`, proxies `/api/` to php-fpm:9000, serves renderer at `/assets/renderer/`, gzip enabled, security headers. `docker/supervisord.conf` — manages nginx+php-fpm as single-container processes. `docker/php/php.ini` + `php-fpm.conf`. Laravel 11 does NOT have `routes/api.php` by default — ran `php artisan install:api` (installs Sanctum, creates file). Added `GET /api/health` route returning `{"status":"ok"}`. Verified with `php artisan route:list`.
- **Story 1.3**: `docker-compose.dev.yml` — app (with volume mounts), cms-dev (Vite HMR), mysql:8.0 (named volume, healthcheck), redis:7-alpine (profile:redis). Vite already configured with `host:true`, `port:5173`, `hmr:true`.
- **Story 1.4**: `docker-compose.prod.yml` — app (pre-built image, no volume mounts), mysql, redis (profile). All services `restart: unless-stopped`.
- **Story 1.5**: `Makefile` — all required targets: help, setup, install, dev, dev-redis, stop, logs, build, prod, prod-redis, migrate, migrate-rollback, seed, test, test-php, lint, shell, redis-flush, clean, docs-dev, docs-build. `make help` and `make setup` tested and passing.
- **Story 1.6**: `.env.api.example` (backend-only vars, no VITE_ prefix) and `.env.cms.example` (only `VITE_*` vars) created in 1.1. README documents secret separation. Dockerfile CMS build stage uses ARG not file mount for frontend vars.

### Decisions made
- Laravel 11 note: `routes/api.php` doesn't exist until `php artisan install:api` is run. This also installs Sanctum. Document for team.
- CMS Vite frontend vars injected as Docker ARG at build time (not from .env.api) — security-correct approach.
- Single container: supervisor manages nginx + php-fpm processes.
- `cms-dev` is a separate service in dev compose (runs Vite HMR), while `app` serves API only in dev (no Vue static needed during dev).

### Next
Epic 2: Database schema and migrations. Start with Story 2.1 (migration tooling), then 2.2 (users/roles schema).

---
