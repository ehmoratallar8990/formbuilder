# Form Builder Platform — Task Backlog
<!-- Generated: 2026-04-09 | Append new entries below existing ones -->

---

## Section 2: Assumptions

### Confirmed (from initialprompt.md Q&A)
1. OAuth2: configurable OIDC, provider-agnostic
2. Auth: session-based with HTTP-only cookies, CSRF protection
3. Roles: admin, editor (granular hierarchical), viewer (granular hierarchical)
4. Brand/Campaign: globally managed
5. Form cannot be published with zero published revisions; revisions auto-created on save (WordPress-style: draft/published); per-environment
6. Multiple drafts per form per environment: yes
7. Revision archiving: form-level only
8. Scheduled publish + unpublish: yes
9. Side-by-side revision preview: yes
10. Node types: all inputs (text, textarea, email, number, select+autocomplete+API, checkbox, radio, date, date-range, time, file, image, hidden)
11. Flow model: DAG only (no loops)
12. Validations: required, min/max (checkbox), length, regex, email, custom; i18n labels+errors
13. API: REST
14. Browser events: all lifecycle (load, render, change, validate, submit, error, denied, etc.)
15. Client-side scripting: read/write/submit
16. Submissions: MySQL default, JSON export, webhook option
17. File storage: configurable (local default, S3-compatible), inheritable brand→campaign→form
18. i18n: infrastructure only, English default
19. Theming: light/dark, configurable colors, rounded/sharp; per-form branding
20. Single container: Nginx + PHP-FPM + Vue static
21. MySQL and Redis in Compose (Redis optional, configurable TTLs)
22. Separate .env files: `.env.cms` and `.env.api`
23. Makefile wraps Docker Compose
24. Docs + kitchensink: MVP

### Unconfirmed Assumptions (isolated — must confirm before implementation)
- A1: PHP framework = Laravel 11 (migrations, Eloquent, routing, queues)
- A2: Vue Router 4 + Pinia for CMS
- A3: Render keys = UUID API keys, stored bcrypt-hashed in DB, shown once on creation
- A4: OIDC flow = Authorization Code + PKCE
- A5: Role scope hierarchy: admin > brand_editor > campaign_editor > form_editor > viewer
- A6: Rate limiting = Redis-backed, fallback to in-memory/IP-header
- A7: Docs site = VitePress inside monorepo (`/docs`)
- A8: Browser fingerprinting = canvas-based (no external vendor by default)
- A9: File upload chunking = out of MVP
- A10: Submission webhooks = async via Laravel queue, sync fallback if queue disabled

---

## Section 3: Prioritized Backlog

| Priority | Epic | Description |
|----------|------|-------------|
| 1 | E1 | Project infrastructure: repo, Docker, Makefile, .env |
| 1 | E2 | Database schema and migrations |
| 1 | E3 | Authentication (local + OIDC) and authorization (roles/permissions) |
| 2 | E4 | Brand/Campaign/Form hierarchy CRUD |
| 2 | E5 | Form & revision lifecycle (status, environments, promotion) |
| 2 | E7 | Render access control (domain allowlist, render keys) |
| 3 | E6 | Form JSON schema + Graph builder UI + all node types + validations + previewer |
| 4 | E8 | Lit rendering library (full) + browser embedding flow + events + state API |
| 5 | E9 | Submissions (storage, export, webhooks, file uploads, honeypot) |
| 5 | E10 | Insights & analytics + GTM/GA4 + audit logs |
| 6 | E11 | Redis optional cache + TTL config + cache clear + rate limiting |
| 6 | E12 | Theming system |
| 6 | E13 | Docs site + kitchensink |

---

## Section 4: User Stories

---

### Epic 1: Project Infrastructure

---

#### User Story 1.1 — Monorepo structure and scaffolding

Status: not implemented
Depends on: none

Main goal: Initialize monorepo with directory layout, tooling configs, and README before any code is written.

Definition of Done:
- Repository root contains: `cms/`, `api/`, `renderer/`, `docs/`, `docker/`, `Makefile`, `.env.cms.example`, `.env.api.example`, `README.md`
- `cms/` is a Vite 8 + Vue.js (no TypeScript) + SCSS project skeleton
- `api/` is a PHP (Laravel) project skeleton with `.gitignore` set correctly
- `renderer/` is a Vite-based vanilla JS/Lit library skeleton
- `docs/` is a VitePress skeleton
- Root `.gitignore` excludes all `.env.*` files (not the `.example` variants)
- README documents the project structure and get-started steps

Tasks:

Task 1.1.a: Initialize Vite 8 + Vue.js (no TS) + SCSS project in `cms/`.
AC: `cms/` contains `vite.config.js`, `src/main.js`, `src/App.vue`, `src/assets/main.scss`. `npm run dev` starts dev server. No TypeScript files present.

Task 1.1.b: Initialize Laravel project in `api/`.
AC: `api/` contains `artisan`, `routes/api.php`, `database/migrations/`. `php artisan --version` returns Laravel 11.x. `.env.api.example` created with all required keys.

Task 1.1.c: Initialize Vite-based Lit library skeleton in `renderer/`.
AC: `renderer/` contains `vite.config.js`, `src/index.js`, `package.json`. Library can be built with `npm run build` producing a UMD+ESM bundle.

Task 1.1.d: Initialize VitePress docs site in `docs/`.
AC: `docs/` contains `.vitepress/config.js` and `index.md`. `npm run docs:dev` serves docs locally.

Task 1.1.e: Create root `.gitignore`, `.env.*.example` files, and `README.md`.
AC: `.gitignore` blocks `.env.cms`, `.env.api`, `node_modules/`, `vendor/`, `*.log`. README has setup instructions referencing Makefile.

Tests:

Test case 1: Verify `cms/` dev server starts without errors.
Definition: Run `npm run dev` in `cms/`. Expect HTTP 200 on localhost.
Implemented: no | Passed: n/a

Test case 2: Verify `api/` Laravel artisan responds.
Definition: Run `php artisan --version`. Expect Laravel 11.x output.
Implemented: no | Passed: n/a

Test case 3: Verify `renderer/` builds without errors.
Definition: Run `npm run build` in `renderer/`. Expect `dist/` with ESM + UMD files.
Implemented: no | Passed: n/a

Test case 4: Verify `.gitignore` excludes `.env.*` but not `.env.*.example`.
Definition: `git status` must not show `.env.cms` or `.env.api`. Must show `.env.cms.example`.
Implemented: no | Passed: n/a

---

#### User Story 1.2 — Single container Dockerfile

Status: not implemented
Depends on: 1.1

Main goal: Build a single Docker image that serves Vue static assets via Nginx and routes `/api/*` to PHP-FPM.

Definition of Done:
- `docker/Dockerfile` exists with multi-stage build: (1) Node build stage for `cms/`, (2) Node build stage for `renderer/`, (3) Composer stage for `api/`, (4) Final stage with Nginx + PHP-FPM
- Nginx config serves Vue static on `/`, proxies `/api` to PHP-FPM
- Container starts with `docker build` + `docker run` without errors
- Healthcheck endpoint at `/api/health` returns HTTP 200

Tasks:

Task 1.2.a: Write multi-stage `docker/Dockerfile`.
AC: Stages: node-cms-build, node-renderer-build, composer-build, final (nginx+php-fpm). Final image is based on `php:8.2-fpm-alpine` + nginx. Vue dist + renderer dist copied to Nginx web root.

Task 1.2.b: Write `docker/nginx.conf` for single-container routing.
AC: Nginx serves `/` from Vue dist. `/api/` proxied to `127.0.0.1:9000` (php-fpm). `/assets/renderer/` serves renderer bundle. Gzip enabled. Cache headers for static assets.

Task 1.2.c: Add `/api/health` endpoint in PHP.
AC: `GET /api/health` returns `{"status":"ok"}` with HTTP 200. No auth required.

Tests:

Test case 1: Container builds without error.
Definition: `docker build -t formbuilder .` completes with exit 0.
Implemented: no | Passed: n/a

Test case 2: `/api/health` returns 200 inside container.
Definition: Start container, `curl http://localhost/api/health` returns `{"status":"ok"}`.
Implemented: no | Passed: n/a

Test case 3: Vue SPA served from `/`.
Definition: `curl http://localhost/` returns HTML with Vue app mount point.
Implemented: no | Passed: n/a

---

#### User Story 1.3 — Docker Compose for development

Status: not implemented
Depends on: 1.2

Main goal: Docker Compose dev stack with hot reload, local MySQL, optional Redis.

Definition of Done:
- `docker-compose.dev.yml` defines services: `app` (single container), `mysql`, `redis` (optional/profile)
- `.env.api` consumed by `app` service; `.env.cms` consumed by Vite dev process
- MySQL data persists in named volume
- Vue hot-reload works via volume mount in dev mode
- `make dev` starts the stack

Tasks:

Task 1.3.a: Write `docker-compose.dev.yml`.
AC: Services: `app` with volume mounts for hot reload, `mysql:8.0` with named volume, `redis:7-alpine` under `--profile redis`. App reads `.env.api`. Ports: 80 (app), 3306 (mysql), 6379 (redis).

Task 1.3.b: Configure Vite dev server in container for HMR.
AC: Vite config sets `server.host: true`, `server.port: 5173`. HMR works when source files change inside mounted volume.

Tests:

Test case 1: `docker-compose.dev.yml up` starts without errors.
Definition: All services reach healthy state. MySQL accepts connections.
Implemented: no | Passed: n/a

Test case 2: Vue hot reload works.
Definition: Modify `cms/src/App.vue`, browser reflects change without full reload.
Implemented: no | Passed: n/a

Test case 3: Stack starts without Redis when profile not set.
Definition: Run without `--profile redis`. App boots. `/api/health` returns 200.
Implemented: no | Passed: n/a

---

#### User Story 1.4 — Docker Compose for production

Status: not implemented
Depends on: 1.2

Main goal: Production Compose file suitable for single-host deployment with no hot reload, optimized image, and proper restart policies.

Definition of Done:
- `docker-compose.prod.yml` defines services: `app`, `mysql`, `redis` (profile)
- No source code volume mounts
- `restart: unless-stopped` on all services
- MySQL uses named volume with configurable data path
- `make prod` command builds and starts stack

Tasks:

Task 1.4.a: Write `docker-compose.prod.yml`.
AC: `app` service uses pre-built image (no volume mounts). `mysql` and `redis` as per dev but with production-appropriate configs. Env vars from `.env.api` at runtime (not baked into image).

Tests:

Test case 1: Production stack starts from built image.
Definition: `docker-compose -f docker-compose.prod.yml up` starts app. `/api/health` returns 200.
Implemented: no | Passed: n/a

---

#### User Story 1.5 — Makefile

Status: not implemented
Depends on: 1.3, 1.4

Main goal: Makefile exposes all common developer commands as single-word targets.

Definition of Done:
- Makefile targets: `setup`, `install`, `dev`, `prod`, `stop`, `logs`, `migrate`, `migrate-rollback`, `seed`, `test`, `lint`, `build`, `clean`, `shell`, `redis-flush`
- All targets documented with `make help`
- `make setup` initializes `.env.*` from examples and starts dev stack
- `make migrate` runs Laravel migrations inside container

Tasks:

Task 1.5.a: Write Makefile with all required targets.
AC: Each target maps to Docker Compose command(s). `make help` lists all targets with descriptions. `make setup` checks for `.env.*` files and copies from examples if missing.

Tests:

Test case 1: `make help` runs without error.
Definition: Exits 0, lists all targets.
Implemented: no | Passed: n/a

Test case 2: `make setup` from clean state initializes env files.
Definition: Delete `.env.api`, run `make setup`. `.env.api` created from `.env.api.example`.
Implemented: no | Passed: n/a

---

#### User Story 1.6 — Environment variable strategy

Status: not implemented
Depends on: 1.1

Main goal: Separate env files prevent backend secrets from leaking into frontend build.

Definition of Done:
- `.env.api` holds all PHP/DB/Redis/OAuth secrets; never exposed to Vite build
- `.env.cms` holds only public frontend config (API base URL, app name, public keys); safe for Vite to consume as `VITE_*` vars
- Documented: which vars are shared, which are service-specific, how secrets handled in prod
- `.env.*.example` files present with all keys and explanatory comments

Tasks:

Task 1.6.a: Define and document `.env.api.example` with all backend vars.
AC: Includes: `APP_KEY`, `APP_ENV`, `DB_*`, `REDIS_*`, `OIDC_*`, `MAIL_*`, `QUEUE_*`, `STORAGE_*`, `SESSION_*`. No `VITE_*` prefix vars present.

Task 1.6.b: Define and document `.env.cms.example` with all frontend vars.
AC: Includes only: `VITE_API_BASE_URL`, `VITE_APP_NAME`, `VITE_APP_ENV`. No secrets. All vars prefixed `VITE_`.

Task 1.6.c: Add security warning in README about secret separation.
AC: README explicitly states `.env.api` must never be placed in frontend build context. Docker build stages for cms/ do not COPY `.env.api`.

Tests:

Test case 1: Vue build does not embed backend secrets.
Definition: Run `npm run build` in `cms/` with a test secret in `.env.api`. Grep built output for that secret. Expect zero matches.
Implemented: no | Passed: n/a

---

### Epic 2: Database Foundation

---

#### User Story 2.1 — Migration tooling setup

Status: not implemented
Depends on: 1.1, 1.3

Main goal: Laravel migrations are runnable inside Docker container via Makefile.

Definition of Done:
- `make migrate` runs `php artisan migrate` inside `app` container
- `make migrate-rollback` rolls back last batch
- `make seed` runs `php artisan db:seed`
- Migrations directory at `api/database/migrations/`
- All future schema changes use migrations only (no manual DB edits)

Tasks:

Task 2.1.a: Verify Laravel migration commands work inside container.
AC: `docker exec app php artisan migrate:status` returns table output. No errors.

Tests:

Test case 1: Fresh migration on empty DB succeeds.
Definition: Drop all tables, run `make migrate`. All migrations run with status "Ran".
Implemented: no | Passed: n/a

Test case 2: Rollback last batch.
Definition: Run `make migrate-rollback`. Last batch undone. Re-run migrate re-applies.
Implemented: no | Passed: n/a

---

#### User Story 2.2 — Users, roles, and permissions schema

Status: not implemented
Depends on: 2.1

Main goal: Core auth tables that support hierarchical, entity-scoped roles.

Definition of Done:
- Tables: `users`, `oauth_identities`, `roles`, `permissions`, `role_permissions`, `user_roles`
- `user_roles` is polymorphic: `(user_id, role_id, entity_type, entity_id)` — role can be scoped to brand, campaign, or form
- Admin role has no entity scope (global)
- All FK constraints defined
- Migrations seeded with default roles: `admin`, `brand_editor`, `campaign_editor`, `form_editor`, `viewer`
- Soft deletes on `users`

Tasks:

Task 2.2.a: Create migration for `users` table.
AC: Columns: `id`, `name`, `email` (unique), `password` (nullable, for OAuth-only users), `email_verified_at`, `is_active`, `created_at`, `updated_at`, `deleted_at`.

Task 2.2.b: Create migration for `oauth_identities` table.
AC: Columns: `id`, `user_id` (FK→users), `provider` (string), `provider_user_id` (string), `token`, `refresh_token`, `expires_at`, `created_at`, `updated_at`. Unique on `(provider, provider_user_id)`.

Task 2.2.c: Create migrations for `roles`, `permissions`, `role_permissions`, `user_roles`.
AC: `roles`: `id`, `name` (unique), `description`. `permissions`: `id`, `name` (unique). `role_permissions`: FK both. `user_roles`: `user_id`, `role_id`, `entity_type` (nullable), `entity_id` (nullable).

Task 2.2.d: Create seeder for default roles and permissions.
AC: Seeder creates roles: admin, brand_editor, campaign_editor, form_editor, viewer. Permissions include: manage_brands, manage_campaigns, create_forms, edit_forms, publish_forms, view_forms, manage_users, manage_roles, view_insights, manage_render_keys. Roles assigned appropriate permission sets.

Tests:

Test case 1: Migration creates all tables without error.
Definition: Fresh migrate. `SHOW TABLES` includes all expected tables.
Implemented: no | Passed: n/a

Test case 2: `user_roles` supports entity scope.
Definition: Insert user_role with `entity_type='brand'`, `entity_id=1`. Record persists. Insert with null entity_type (admin global). Both valid.
Implemented: no | Passed: n/a

Test case 3: Seed creates default roles.
Definition: Run seeder. `roles` table contains admin, brand_editor, campaign_editor, form_editor, viewer.
Implemented: no | Passed: n/a

---

#### User Story 2.3 — Brand, Campaign, Form hierarchy schema

Status: not implemented
Depends on: 2.1

Main goal: Core CMS entity tables with proper FK relationships.

Definition of Done:
- Tables: `brands`, `campaigns`, `forms`
- `forms` has `visibility_status` ENUM: `published`, `unpublished`, `archived`
- `forms.archived_at` tracks when archived
- Soft deletes on all three
- All FK constraints defined

Tasks:

Task 2.3.a: Create migrations for `brands` and `campaigns`.
AC: `brands`: `id`, `name`, `slug` (unique), `logo_url`, `settings` (JSON), `created_at`, `updated_at`, `deleted_at`. `campaigns`: `id`, `brand_id` (FK), `name`, `slug` (unique per brand), `description`, `settings` (JSON), `created_at`, `updated_at`, `deleted_at`.

Task 2.3.b: Create migration for `forms`.
AC: `forms`: `id`, `campaign_id` (FK), `name`, `slug` (unique per campaign), `description`, `visibility_status` ENUM('published','unpublished','archived') DEFAULT 'unpublished', `archived_at` (nullable timestamp), `settings` (JSON), `created_at`, `updated_at`, `deleted_at`. Index on `(campaign_id, visibility_status)`.

Tests:

Test case 1: FK constraint enforced on campaigns→brands.
Definition: Insert campaign with non-existent brand_id. Expect DB constraint error.
Implemented: no | Passed: n/a

Test case 2: Form visibility_status defaults to 'unpublished'.
Definition: Insert form without specifying visibility_status. Column = 'unpublished'.
Implemented: no | Passed: n/a

---

#### User Story 2.4 — Form environments schema

Status: not implemented
Depends on: 2.3

Main goal: Each form has isolated configuration per environment (dev/staging/production).

Definition of Done:
- Table `form_environments`: links form to environment with environment-specific settings (domain allowlist, render keys, submission config, file storage config)
- Environments: `development`, `staging`, `production`
- Unique constraint on `(form_id, environment)`

Tasks:

Task 2.4.a: Create migration for `form_environments`.
AC: Columns: `id`, `form_id` (FK→forms), `environment` ENUM('development','staging','production'), `submission_storage` ENUM('mysql','webhook','both') DEFAULT 'mysql', `webhook_url` (nullable), `webhook_secret` (nullable), `file_storage_driver` (nullable, inherits if null), `file_storage_config` (JSON, nullable), `created_at`, `updated_at`. Unique on `(form_id, environment)`.

Tests:

Test case 1: Unique constraint on (form_id, environment).
Definition: Insert two records with same form_id + environment. Second insert fails.
Implemented: no | Passed: n/a

---

#### User Story 2.5 — Revision schema

Status: not implemented
Depends on: 2.4

Main goal: Form revisions are versioned per environment with independent publish status.

Definition of Done:
- Table `form_revisions`
- Revision status ENUM: `draft`, `published`
- Revisions belong to form_environment
- `published_at`, `unpublished_at`, `scheduled_publish_at`, `scheduled_unpublish_at` timestamp fields
- Only one revision per form_environment can have status='published' at a time (enforced at app level)
- Revision contains form JSON definition (node graph)

Tasks:

Task 2.5.a: Create migration for `form_revisions`.
AC: Columns: `id`, `form_environment_id` (FK→form_environments), `version_number` (int, auto-incremented per form_environment), `label` (nullable string), `status` ENUM('draft','published') DEFAULT 'draft', `form_json` (longtext/JSON), `published_at` (nullable), `unpublished_at` (nullable), `scheduled_publish_at` (nullable), `scheduled_unpublish_at` (nullable), `promoted_from_revision_id` (nullable FK→form_revisions), `created_by` (FK→users), `created_at`, `updated_at`. Index on `(form_environment_id, status)`.

Task 2.5.b: Add DB-level unique partial index ensuring at most one published revision per form_environment.
AC: Application-level check in RevisionService prevents multiple published revisions. Unit test verifies constraint.

Tests:

Test case 1: Two revisions can exist as draft for same form_environment.
Definition: Create two draft revisions for same form_environment. Both inserted successfully.
Implemented: no | Passed: n/a

Test case 2: Publishing second revision when one is already published unpublishes the first.
Definition: Publish revision A. Attempt to publish revision B. Revision A status becomes 'draft', revision B becomes 'published'. Only one published at a time.
Implemented: no | Passed: n/a

Test case 3: Scheduled publish fields stored correctly.
Definition: Insert revision with `scheduled_publish_at` = future date. Record persists.
Implemented: no | Passed: n/a

---

#### User Story 2.6 — Form node and edge schema

Status: not implemented
Depends on: 2.5

Main goal: Graph structure (nodes + edges) for form builder stored as normalized tables AND embedded in revision JSON.

Definition of Done:
- Node and edge data is stored as JSON within `form_revisions.form_json` (primary source of truth for rendering)
- Tables `form_nodes` and `form_edges` optionally mirror the graph for query purposes (denormalized read model)
- `form_json` schema documented and versioned with a `schema_version` field

Tasks:

Task 2.6.a: Define and document `form_json` JSON schema.
AC: Schema has top-level fields: `schema_version` (string), `nodes` (array), `edges` (array), `settings` (object). Each node has: `id`, `type`, `label`, `position` (x/y), `config` (type-specific config object), `validations` (array), `i18n` (object). Each edge has: `id`, `source_node_id`, `target_node_id`, `condition` (nullable expression object).

Task 2.6.b: Create migration for `form_nodes` and `form_edges` (optional read model).
AC: `form_nodes`: `id`, `revision_id` (FK), `node_id` (string, matches JSON), `type`, `label`, `position_x`, `position_y`, `config` (JSON), `created_at`. `form_edges`: `id`, `revision_id` (FK), `edge_id` (string), `source_node_id` (string), `target_node_id` (string), `condition` (JSON, nullable). Both indexed on `revision_id`.

Tests:

Test case 1: form_json schema validates correctly.
Definition: Parse a valid form_json. Validate against schema. Expect pass.
Implemented: no | Passed: n/a

Test case 2: form_json with missing required fields fails validation.
Definition: form_json without `schema_version`. Validation returns error.
Implemented: no | Passed: n/a

---

#### User Story 2.7 — Render keys and domain allowlist schema

Status: not implemented
Depends on: 2.4

Main goal: Render access control tables supporting multiple active keys, rotation, revocation, and per-env domain allowlisting.

Definition of Done:
- Table `render_keys`: key per form_environment, multiple active allowed
- Table `domain_allowlist`: per form_environment, supports wildcards
- Keys stored as bcrypt/hash; raw key shown once on creation

Tasks:

Task 2.7.a: Create migration for `render_keys`.
AC: Columns: `id`, `form_environment_id` (FK→form_environments), `key_hash` (string, hashed UUID), `label` (nullable), `is_active` (bool DEFAULT true), `last_used_at` (nullable), `revoked_at` (nullable), `created_by` (FK→users), `created_at`, `updated_at`. Index on `(form_environment_id, is_active)`.

Task 2.7.b: Create migration for `domain_allowlist`.
AC: Columns: `id`, `form_environment_id` (FK→form_environments), `domain` (string, supports `*.example.com` wildcards and `localhost`), `created_by` (FK→users), `created_at`. Unique on `(form_environment_id, domain)`.

Tests:

Test case 1: Multiple active render keys for same form_environment.
Definition: Insert 3 render_keys for same form_environment all with is_active=true. All 3 persist.
Implemented: no | Passed: n/a

Test case 2: Wildcard domain stored correctly.
Definition: Insert domain `*.example.com`. Select it. Value matches exactly.
Implemented: no | Passed: n/a

---

#### User Story 2.8 — Submissions and insights schema

Status: not implemented
Depends on: 2.4

Main goal: Tables for form submissions and analytics tracking.

Definition of Done:
- Table `form_submissions`
- Table `form_insights` (one record per form view/session)
- Table `form_submission_files` for file upload references
- Honeypot field tracked at submission level

Tasks:

Task 2.8.a: Create migration for `form_submissions`.
AC: Columns: `id`, `form_environment_id` (FK), `revision_id` (FK→form_revisions), `data` (JSON), `honeypot_value` (nullable string), `ip_address`, `user_agent`, `fingerprint` (nullable), `submitted_at`, `created_at`. Index on `(form_environment_id, submitted_at)`.

Task 2.8.b: Create migration for `form_submission_files`.
AC: Columns: `id`, `submission_id` (FK), `node_id` (string), `file_path`, `file_name`, `file_size`, `mime_type`, `created_at`.

Task 2.8.c: Create migration for `form_insights`.
AC: Columns: `id`, `form_environment_id` (FK), `revision_id` (FK, nullable), `session_id` (string), `ip_address`, `fingerprint` (nullable), `user_agent`, `referrer` (nullable), `time_on_page_seconds` (nullable int), `render_denied` (bool DEFAULT false), `denial_reason` (nullable string), `created_at`. Index on `(form_environment_id, created_at)`.

Tests:

Test case 1: Submission stores JSON data correctly.
Definition: Insert submission with `data: {"name":"Test"}`. Select and parse. Matches original.
Implemented: no | Passed: n/a

Test case 2: Insights record with render_denied=true stores denial_reason.
Definition: Insert insight with `render_denied=true`, `denial_reason='invalid_key'`. Select. Values correct.
Implemented: no | Passed: n/a

---

#### User Story 2.9 — Audit log schema

Status: not implemented
Depends on: 2.1

Main goal: Immutable append-only audit log for all significant CMS actions.

Definition of Done:
- Table `audit_logs`: tracks who did what to which entity, when, with before/after snapshots
- No deletes or updates allowed on this table (enforced in application layer)
- Indexed for query by entity and date

Tasks:

Task 2.9.a: Create migration for `audit_logs`.
AC: Columns: `id`, `user_id` (FK→users, nullable for system actions), `action` (string, e.g. 'form.published', 'revision.created', 'key.revoked'), `entity_type` (string), `entity_id` (bigint), `old_values` (JSON, nullable), `new_values` (JSON, nullable), `ip_address` (nullable), `created_at`. Index on `(entity_type, entity_id)`, `(user_id)`, `(created_at)`.

Tests:

Test case 1: AuditLog only accepts inserts.
Definition: Insert audit log record. Attempt to update `action`. Application throws exception. DB record unchanged.
Implemented: no | Passed: n/a

---

#### User Story 2.10 — Scheduled operations schema

Status: not implemented
Depends on: 2.5

Main goal: Track scheduled publish/unpublish jobs.

Definition of Done:
- Table `scheduled_operations`
- Scheduler processes pending operations at execution time
- Completed/failed operations retained for audit

Tasks:

Task 2.10.a: Create migration for `scheduled_operations`.
AC: Columns: `id`, `operation_type` ENUM('publish_revision','unpublish_revision','promote_revision'), `entity_id` (FK→form_revisions or form_environments), `entity_type`, `scheduled_at`, `executed_at` (nullable), `status` ENUM('pending','executed','failed','cancelled') DEFAULT 'pending', `error_message` (nullable), `created_by` (FK→users), `created_at`, `updated_at`. Index on `(scheduled_at, status)`.

Tests:

Test case 1: Pending operations queryable by scheduled_at.
Definition: Insert 3 operations with different scheduled_at. Query where scheduled_at <= now. Returns correct subset.
Implemented: no | Passed: n/a

---

### Epic 3: Authentication & Authorization

---

#### User Story 3.1 — Local authentication (register, login, logout, password)

Status: not implemented
Depends on: 2.2

Main goal: Secure session-based local auth with HTTP-only cookies and CSRF protection.

Definition of Done:
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- Sessions: HTTP-only, Secure, SameSite=Lax cookies; session tokens stored server-side
- Passwords: bcrypt min cost 12
- CSRF token returned on login, required on state-changing requests
- Rate limiting: 5 attempts per 15min per IP on login
- Email verification required before login (async email)

Tasks:

Task 3.1.a: Implement registration endpoint with email verification.
AC: `POST /api/auth/register` with `{name, email, password, password_confirmation}`. Creates user with `email_verified_at=null`. Sends verification email. Returns 201. Duplicate email returns 422 with validation error.

Task 3.1.b: Implement login endpoint with rate limiting.
AC: `POST /api/auth/login` with `{email, password}`. On success: creates session, sets HTTP-only cookie, returns `{user, csrf_token}`. On fail: returns 401. After 5 fails from same IP in 15min: returns 429.

Task 3.1.c: Implement logout endpoint.
AC: `POST /api/auth/logout` invalidates session server-side, clears cookie. Returns 204.

Task 3.1.d: Implement forgot-password and reset-password endpoints.
AC: Forgot: `POST /api/auth/forgot-password` `{email}` — sends reset email if user exists. Always returns 200 (no user enumeration). Reset: `POST /api/auth/reset-password` `{token, email, password, password_confirmation}` — validates token, updates password, invalidates all existing sessions.

Tests:

Test case 1: Login with valid credentials creates session.
Definition: POST login with correct email/password. Response sets `Set-Cookie` with `HttpOnly; Secure; SameSite=Lax`. Session exists in DB.
Implemented: no | Passed: n/a

Test case 2: Login with invalid credentials returns 401.
Definition: POST login with wrong password. Response 401.
Implemented: no | Passed: n/a

Test case 3: 5 failed logins trigger 429 on 6th attempt.
Definition: POST login 5 times with wrong password from same IP. 6th attempt returns 429.
Implemented: no | Passed: n/a

Test case 4: Logout invalidates session.
Definition: Login. Logout. Attempt authenticated request with old cookie. Returns 401.
Implemented: no | Passed: n/a

Test case 5: Password reset token is single-use.
Definition: Request reset. Use token once (success). Use same token again. Returns 422 invalid token.
Implemented: no | Passed: n/a

---

#### User Story 3.2 — OIDC OAuth2 login (configurable provider)

Status: not implemented
Depends on: 2.2, 3.1

Main goal: Configurable OIDC Authorization Code + PKCE flow for external login.

Definition of Done:
- OIDC config in `.env.api`: `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ISSUER_URL`, `OIDC_REDIRECT_URI`, `OIDC_SCOPES`
- Endpoints: `GET /api/auth/oauth/redirect`, `GET /api/auth/oauth/callback`
- PKCE code challenge/verifier generated per flow (code_verifier stored in session)
- State parameter validated to prevent CSRF
- On first login via OIDC: user auto-created
- On subsequent login: existing user found by oauth_identities record

Tasks:

Task 3.2.a: Implement OIDC redirect endpoint.
AC: `GET /api/auth/oauth/redirect` generates PKCE pair, stores `code_verifier` in session, builds authorization URL with `state`, redirects to provider. State = cryptographically random.

Task 3.2.b: Implement OIDC callback endpoint.
AC: `GET /api/auth/oauth/callback` validates state, exchanges code for tokens using PKCE verifier, fetches userinfo from OIDC provider, creates/updates oauth_identities + user, starts session, redirects to CMS. On error: redirects with error query param.

Tests:

Test case 1: Redirect generates valid PKCE challenge.
Definition: Call redirect endpoint. Inspect authorization URL in redirect. Contains `code_challenge` and `code_challenge_method=S256`.
Implemented: no | Passed: n/a

Test case 2: Callback with tampered state rejected.
Definition: Callback with state that doesn't match session. Returns 401 or error redirect.
Implemented: no | Passed: n/a

Test case 3: New OIDC user auto-created.
Definition: Callback with valid OIDC tokens for new email. User created in `users` table. `oauth_identities` record created. Session started.
Implemented: no | Passed: n/a

Test case 4: Existing OIDC user logs in without duplicate creation.
Definition: Callback twice with same OIDC identity. Only one user record, one oauth_identities record.
Implemented: no | Passed: n/a

---

#### User Story 3.3 — Account linking (local + OAuth)

Status: not implemented
Depends on: 3.1, 3.2

Main goal: Existing local account can link/unlink OAuth identity.

Definition of Done:
- `POST /api/auth/link-oauth` — logged-in user initiates OIDC flow to link external identity
- `DELETE /api/auth/unlink-oauth/{provider}` — unlinks OAuth identity (requires local password set or other OAuth linked)
- Prevented: linking OAuth identity already linked to another user

Tasks:

Task 3.3.a: Implement OAuth link flow for authenticated users.
AC: Logged-in user calls link endpoint. OIDC flow completes. oauth_identities record created for that user. If OIDC identity already linked to different user: returns 409.

Task 3.3.b: Implement OAuth unlink.
AC: DELETE unlink removes oauth_identities record. Blocked if user has no password set and this is their only auth method. Returns 422 in that case.

Tests:

Test case 1: Local user links OAuth account.
Definition: Login locally. Link OAuth. oauth_identities record created for that user_id.
Implemented: no | Passed: n/a

Test case 2: Cannot link OAuth already linked to another user.
Definition: User A links OAuth identity X. User B attempts to link same identity. Returns 409.
Implemented: no | Passed: n/a

Test case 3: Cannot unlink last auth method.
Definition: OAuth-only user (no password). Attempt to unlink OAuth. Returns 422.
Implemented: no | Passed: n/a

---

#### User Story 3.4 — Authorization: roles, permissions middleware

Status: not implemented
Depends on: 2.2, 3.1

Main goal: All API endpoints protected by role/permission checks with entity-scoped resolution.

Definition of Done:
- Middleware `CheckPermission` resolves user's roles (global + entity-scoped) and checks required permission
- Admin role bypasses all permission checks
- Permission check considers: user's global role AND entity-scoped role at form/campaign/brand level
- Unauthorized requests return 403 with `{"error":"forbidden"}`

Tasks:

Task 3.4.a: Implement `PermissionService` that resolves effective permissions for a user on an entity.
AC: Given user_id + permission + optional entity (brand/campaign/form), returns bool. Admin = always true. Brand_editor on brand X = can edit forms under brand X. Viewer = read-only.

Task 3.4.b: Create route middleware applying permission checks.
AC: Applied to all protected API routes. Unauthorized returns 403. Unauthenticated returns 401.

Tests:

Test case 1: Admin user passes all permission checks.
Definition: Admin user requests `DELETE /api/brands/1`. Permitted.
Implemented: no | Passed: n/a

Test case 2: Form_editor on form A cannot edit form B.
Definition: User has form_editor role scoped to form_id=1. Attempts to publish form_id=2. Returns 403.
Implemented: no | Passed: n/a

Test case 3: Unauthenticated request returns 401.
Definition: Request without session cookie to any protected endpoint. Returns 401.
Implemented: no | Passed: n/a

---

#### User Story 3.5 — Role management UI (CMS)

Status: not implemented
Depends on: 3.4, 4.1

Main goal: Admins can assign/revoke roles for users on brands, campaigns, and forms.

Definition of Done:
- CMS page: `/admin/users` — lists users, allows inviting new users
- CMS page: `/admin/users/:id/roles` — assigns roles scoped to entity
- API endpoints: `GET /api/users`, `POST /api/users/:id/roles`, `DELETE /api/users/:id/roles/:roleId`
- Only admins access these pages

Tasks:

Task 3.5.a: API endpoints for user role management.
AC: `POST /api/users/:id/roles` body: `{role_id, entity_type, entity_id}`. Creates user_role. Returns 201. `DELETE /api/users/:id/roles/:roleId` removes scoped role. Only admin can call.

Task 3.5.b: CMS user list + role assignment UI.
AC: Vue page `/admin/users`. Table of users. Click user → role assignment panel. Add/remove roles with entity scope selector (dropdown: global/brand/campaign/form). Save calls API.

Tests:

Test case 1: Admin assigns brand_editor role scoped to brand.
Definition: API POST role assignment. user_roles record created with entity_type='brand'.
Implemented: no | Passed: n/a

Test case 2: Non-admin cannot access user management API.
Definition: POST /api/users/:id/roles as form_editor. Returns 403.
Implemented: no | Passed: n/a

---

### Epic 4: Brand / Campaign / Form Hierarchy

---

#### User Story 4.1 — Brand CRUD

Status: not implemented
Depends on: 3.4

Main goal: Full CRUD for Brands with permission-gated API and Vue UI.

Definition of Done:
- API: `GET /api/brands`, `POST /api/brands`, `GET /api/brands/:id`, `PUT /api/brands/:id`, `DELETE /api/brands/:id` (soft delete)
- CMS page: `/brands` (list) and `/brands/:id` (detail/edit)
- Admin or brand_editor (global) can create brands
- `slug` auto-generated from name, must be URL-safe and unique

Tasks:

Task 4.1.a: Brand API endpoints (CRUD).
AC: Full CRUD. List returns paginated brands. Create validates: name (required), slug (unique, auto-derived if not provided). Soft delete sets `deleted_at`. Deleted brands excluded from list unless `?include_deleted=true` (admin only).

Task 4.1.b: Brand list + detail Vue pages.
AC: `/brands` shows brand cards with name, logo, campaign count. Create/Edit form with name, slug, logo upload. Slug auto-populated from name (editable). Save calls API. Errors displayed inline.

Tests:

Test case 1: Create brand with auto-generated slug.
Definition: POST /api/brands `{name: "Acme Corp"}`. Slug = "acme-corp". 201 response.
Implemented: no | Passed: n/a

Test case 2: Duplicate slug rejected.
Definition: Create two brands with same name. Second returns 422 with slug error.
Implemented: no | Passed: n/a

Test case 3: Soft delete excludes brand from list.
Definition: Delete brand. GET /api/brands does not include it. GET /api/brands/:id returns 404.
Implemented: no | Passed: n/a

---

#### User Story 4.2 — Campaign CRUD

Status: not implemented
Depends on: 4.1

Main goal: Full CRUD for Campaigns under Brands.

Definition of Done:
- API nested under brand: `GET /api/brands/:brandId/campaigns`, etc.
- `slug` unique per brand
- campaign_editor at brand or campaign level can manage

Tasks:

Task 4.2.a: Campaign API endpoints.
AC: Same as 4.1.a but scoped to brand. Slug unique per brand (not globally). FK to brand enforced.

Task 4.2.b: Campaign list + detail Vue pages.
AC: `/brands/:id/campaigns` shows campaign list. Create/edit form. Breadcrumb: Brand > Campaigns.

Tests:

Test case 1: Campaign slug unique per brand, not globally.
Definition: Create campaign "summer" under brand A. Create campaign "summer" under brand B. Both succeed.
Implemented: no | Passed: n/a

---

#### User Story 4.3 — Form CRUD (visibility status)

Status: not implemented
Depends on: 4.2

Main goal: Full CRUD for Forms with initial visibility_status management.

Definition of Done:
- API: `GET /api/campaigns/:cId/forms`, `POST`, `GET /api/forms/:id`, `PUT`, `DELETE`
- New forms created with `visibility_status = unpublished`
- Form creation auto-creates form_environment records for dev/staging/production
- CMS form list shows visibility_status badge

Tasks:

Task 4.3.a: Form API endpoints.
AC: Create form → auto-creates 3 form_environment records (dev/staging/prod). Form always starts as unpublished. List supports filtering by status.

Task 4.3.b: Form list + create Vue UI.
AC: `/campaigns/:id/forms` shows form cards. Status badge: green=published, gray=unpublished, red=archived. Create form modal: name, slug, description. Breadcrumb: Brand > Campaign > Forms.

Tests:

Test case 1: Creating form auto-creates 3 environments.
Definition: POST /api/campaigns/:id/forms. Check form_environments. 3 records: dev, staging, prod.
Implemented: no | Passed: n/a

Test case 2: New form defaults to unpublished.
Definition: Create form. `visibility_status` = 'unpublished'.
Implemented: no | Passed: n/a

---

#### User Story 4.4 — Form visibility status transitions

Status: not implemented
Depends on: 4.3, 5.2

Main goal: Form visibility status can be changed with business rule enforcement.

Definition of Done:
- `POST /api/forms/:id/publish` — publishes form (only if published revision exists in target env)
- `POST /api/forms/:id/unpublish` — unpublishes (form no longer publicly renderable)
- `POST /api/forms/:id/archive` — archives form (immutable after archive)
- Archived forms: read-only in CMS (no edit), accessible for admin inspection/reporting
- Unpublished forms: editable in CMS
- Audit log entry on every status change

Tasks:

Task 4.4.a: Implement form status transition endpoints.
AC: Publish: requires at least one published revision in target env. Fails with 422 if no published revision. Archive: sets archived_at. Archived form cannot be published/unpublished (returns 422). All transitions create audit_log entry with old/new status.

Task 4.4.b: CMS form detail status control UI.
AC: Form detail page shows current status + action buttons. Publish button disabled with tooltip if no published revision. Archive shows confirmation dialog. Archived form shows read-only banner.

Tests:

Test case 1: Cannot publish form without published revision.
Definition: POST /api/forms/:id/publish with no published revision. Returns 422 "no_published_revision".
Implemented: no | Passed: n/a

Test case 2: Archived form cannot be modified.
Definition: Archive form. Attempt PUT /api/forms/:id. Returns 422 "form_archived".
Implemented: no | Passed: n/a

Test case 3: Audit log records status transition.
Definition: Publish form. audit_logs contains record with action='form.published', entity_type='form', old_values.visibility_status='unpublished', new_values.visibility_status='published'.
Implemented: no | Passed: n/a

---

### Epic 5: Form & Revision Lifecycle

---

#### User Story 5.1 — Revision creation (auto on save, draft)

Status: not implemented
Depends on: 2.5, 4.3

Main goal: Saving form builder state auto-creates a new draft revision. No manual revision creation required.

Definition of Done:
- `POST /api/form-environments/:envId/revisions` creates a draft revision with provided form_json
- Version number auto-incremented per form_environment
- Always creates as 'draft' initially
- Revision list endpoint: `GET /api/form-environments/:envId/revisions`

Tasks:

Task 5.1.a: Revision create API endpoint.
AC: POST creates draft, version_number = MAX(existing) + 1 for that env. Returns 201 with revision object including id, version_number, status.

Task 5.1.b: Auto-save in builder triggers revision creation.
AC: Builder auto-saves every 30s (configurable) and on explicit save. Each save creates/updates draft revision. UI shows "Saved as draft v{N}" status indicator.

Tests:

Test case 1: Draft revision created with correct version number.
Definition: Create 3 revisions for same form_environment. Version numbers are 1, 2, 3.
Implemented: no | Passed: n/a

Test case 2: Revision always created as draft.
Definition: POST revision. Status = 'draft'.
Implemented: no | Passed: n/a

---

#### User Story 5.2 — Revision publish (per environment)

Status: not implemented
Depends on: 5.1

Main goal: A draft revision can be published for a specific environment. Only one published revision per env at a time.

Definition of Done:
- `POST /api/revisions/:id/publish` publishes revision
- Any previously published revision for same form_environment is automatically moved to 'draft'
- Publish action records audit log
- `POST /api/revisions/:id/unpublish` unpublishes active revision (back to draft)

Tasks:

Task 5.2.a: Implement publish/unpublish revision endpoints.
AC: Publish: sets status='published', published_at=now, previous published revision (if any) set to draft, unpublished_at=now. Unpublish: sets status='draft', unpublished_at=now. Both create audit_log entries.

Task 5.2.b: CMS revision list UI with publish controls.
AC: Revision list per environment shows all revisions. Publish/unpublish buttons. Published revision highlighted. Confirmation dialog for publish.

Tests:

Test case 1: Publishing revision A when revision B is published.
Definition: Publish B. Publish A. B.status = 'draft', A.status = 'published'. Only A is published.
Implemented: no | Passed: n/a

Test case 2: Unpublish leaves form without active revision.
Definition: Publish revision. Unpublish it. No published revision for env. Form cannot render.
Implemented: no | Passed: n/a

---

#### User Story 5.3 — Revision promotion between environments

Status: not implemented
Depends on: 5.2

Main goal: Revision from one environment can be promoted (cloned + optional publish) into another environment.

Definition of Done:
- `POST /api/revisions/:id/promote` with `{target_environment, auto_publish: bool}`
- Creates new draft revision in target env with same form_json
- `promoted_from_revision_id` set to source revision id
- Optional: auto-publish in target env

Tasks:

Task 5.3.a: Implement promote endpoint.
AC: Clone form_json to new revision in target env. If auto_publish=true: publish in target env. Returns 201 with new revision. Audit log: 'revision.promoted'.

Task 5.3.b: CMS promote UI.
AC: Revision detail page shows "Promote to [Staging/Production]" dropdown button. Confirmation dialog with auto-publish toggle.

Tests:

Test case 1: Promote dev revision to staging.
Definition: POST promote revision 5 (dev) to staging. New revision created in staging env with same form_json. promoted_from_revision_id = 5.
Implemented: no | Passed: n/a

Test case 2: Promote with auto_publish publishes in target env.
Definition: Promote to production with auto_publish=true. New revision status = 'published'.
Implemented: no | Passed: n/a

---

#### User Story 5.4 — Scheduled publish and unpublish

Status: not implemented
Depends on: 5.2, 2.10

Main goal: Revisions can have a scheduled publish/unpublish datetime.

Definition of Done:
- `POST /api/revisions/:id/schedule-publish` with `{scheduled_at}` — sets scheduled_publish_at
- `POST /api/revisions/:id/schedule-unpublish` with `{scheduled_at}` — sets scheduled_unpublish_at
- `DELETE /api/revisions/:id/schedule-publish` — cancels scheduled publish
- Laravel scheduler runs every minute, processes due `scheduled_operations`
- CMS shows scheduled timestamps on revision list

Tasks:

Task 5.4.a: Implement schedule API endpoints.
AC: Schedule publish: creates scheduled_operations record (type=publish_revision, scheduled_at). Returns 201. Cancel: deletes record. Schedule unpublish: creates record type=unpublish_revision.

Task 5.4.b: Implement Laravel scheduled job to process pending operations.
AC: Runs every minute via `artisan schedule:run`. Processes all pending operations where scheduled_at <= now. Marks executed or failed. On publish: calls same logic as 5.2.a. Audit log entry per execution.

Tests:

Test case 1: Scheduled publish executes at correct time.
Definition: Schedule publish for T+1min. Wait. Revision status = 'published', executed_at populated.
Implemented: no | Passed: n/a

Test case 2: Cancelled schedule does not execute.
Definition: Schedule publish. Cancel. Wait past scheduled time. Status still 'draft'.
Implemented: no | Passed: n/a

---

#### User Story 5.5 — Form render eligibility rules

Status: not implemented
Depends on: 5.2, 4.4, 7.4

Main goal: Explicitly test all combinations of form status + revision status + domain + key that determine render eligibility.

Definition of Done:
- Service `RenderEligibilityService` with method `check(form_environment_id, domain, render_key): Result`
- Returns: `{eligible: bool, reason?: string}`
- All 6 required test scenarios pass
- Used by render validation endpoint (7.4)

Tasks:

Task 5.5.a: Implement `RenderEligibilityService`.
AC: Checks in order: (1) form.visibility_status = 'published', (2) published revision exists for env, (3) domain in allowlist, (4) render key valid + active. Returns first failing check as reason. On pass: returns eligible=true.

Tests:

Test case 1: published form + published revision + valid domain + valid key = renders.
Definition: All conditions met. eligible=true.
Implemented: no | Passed: n/a

Test case 2: published form + no published revision = does not render.
Definition: Publish form, no published revision. eligible=false, reason='no_published_revision'.
Implemented: no | Passed: n/a

Test case 3: unpublished form + published revision = does not render.
Definition: Form unpublished, revision published. eligible=false, reason='form_not_published'.
Implemented: no | Passed: n/a

Test case 4: archived form + published revision = does not render.
Definition: Form archived, revision published. eligible=false, reason='form_archived'.
Implemented: no | Passed: n/a

Test case 5: published form + published revision + invalid domain = does not render.
Definition: Domain not in allowlist. eligible=false, reason='domain_not_allowed'.
Implemented: no | Passed: n/a

Test case 6: published form + published revision + revoked key = does not render.
Definition: Key revoked (revoked_at set). eligible=false, reason='key_revoked'.
Implemented: no | Passed: n/a

---

### Epic 6: Form Builder

---

#### User Story 6.1 — Form JSON schema definition and versioning

Status: not implemented
Depends on: 2.6

Main goal: Canonical JSON schema for form definitions, with schema versioning for future migrations.

Definition of Done:
- Documented JSON schema at `docs/form-json-schema.md`
- Schema version: `"1.0"`
- Node types enumerated with their config shapes
- Validation library (ajv or equivalent) validates form_json before save
- `FormJsonValidator` service used in revision create/update

Tasks:

Task 6.1.a: Define and document complete `form_json` schema v1.0.
AC: Top-level: `{schema_version, nodes[], edges[], settings{}}`. Node fields: `{id, type, label, position{x,y}, config{}, validations[], i18n{}}`. Edge fields: `{id, source_node_id, target_node_id, condition{}}`. Condition: `{node_id, field, operator, value}`. All node types and their config shapes documented.

Task 6.1.b: Implement `FormJsonValidator` service.
AC: Validates against JSON schema. Returns `{valid: bool, errors[]}`. Called on every revision save. Invalid JSON = 422 response.

Tests:

Test case 1: Valid form_json passes validation.
Definition: Sample complete form_json. Validator returns valid=true.
Implemented: no | Passed: n/a

Test case 2: form_json with unknown node type fails.
Definition: Node type='unknown_type'. Validator returns valid=false with error.
Implemented: no | Passed: n/a

---

#### User Story 6.2 — Graph builder canvas (drag-and-drop)

Status: not implemented
Depends on: 6.1

Main goal: Visual graph builder with drag-and-drop node placement and edge connection, inspired by n8n.

Definition of Done:
- Vue component `<FormBuilderCanvas>` with infinite canvas, zoom, pan
- Nodes draggable; position persists in form_json
- Edges drawn between node connection points (drag to connect)
- Mini-map for navigation
- Keyboard shortcuts: delete selected node/edge, undo/redo
- Canvas state serializes to/from form_json

Tasks:

Task 6.2.a: Integrate graph/canvas library (Vue Flow or equivalent) into builder.
AC: Canvas renders nodes and edges from form_json. Pan and zoom work. Library license is compatible (MIT/Apache).

Task 6.2.b: Node drag-drop from palette to canvas.
AC: Palette on left sidebar. Drag node type to canvas = creates new node at drop position with default config. Node appears in canvas immediately. form_json updated.

Task 6.2.c: Edge connection drag behavior.
AC: Drag from node output handle → connect to node input handle. Edge created. Circular connections blocked (DAG enforcement). Connection to self blocked. Edge appears in canvas and form_json.

Task 6.2.d: Undo/redo with keyboard shortcuts.
AC: Ctrl+Z undoes last action. Ctrl+Y/Ctrl+Shift+Z redoes. History limited to 50 states.

Tests:

Test case 1: Canvas renders nodes from form_json.
Definition: Load form_json with 3 nodes. Canvas displays 3 node cards at correct positions.
Implemented: no | Passed: n/a

Test case 2: DAG enforcement blocks circular connection.
Definition: Node A → Node B. Attempt to drag edge from Node B → Node A. Connection rejected.
Implemented: no | Passed: n/a

Test case 3: Undo removes last-added node.
Definition: Add node. Ctrl+Z. Node removed from canvas and form_json.
Implemented: no | Passed: n/a

---

#### User Story 6.3 — Basic input node types

Status: not implemented
Depends on: 6.2

Main goal: Core input field nodes: text, textarea, email, number, hidden, section header/paragraph (display nodes).

Definition of Done:
- Node types: `text_input`, `textarea`, `email_input`, `number_input`, `hidden_field`, `section_header`, `paragraph`
- Each node has config panel in CMS (click node → config appears in right sidebar)
- Config includes: label, placeholder, help text, default value, CSS class override
- Nodes render correctly in previewer

Tasks:

Task 6.3.a: Implement node config panel component `<NodeConfigPanel>`.
AC: Right sidebar shows config for selected node. Fields update form_json reactively. All basic nodes have complete config panels.

Task 6.3.b: Implement text, textarea, email, number, hidden node configs.
AC: text_input: label, placeholder, default_value, max_length, prefix, suffix. textarea: rows config. email_input: domain whitelist optional. number_input: min, max, step, unit. hidden_field: value (static or formula). section_header/paragraph: content (rich text or markdown).

Tests:

Test case 1: Editing node label in config panel updates canvas node title.
Definition: Click text_input node. Edit label in panel. Canvas node title updates in real time.
Implemented: no | Passed: n/a

---

#### User Story 6.4 — Choice input node types (select, radio, checkbox)

Status: not implemented
Depends on: 6.3

Main goal: Choice input nodes with static options and external API data source support.

Definition of Done:
- Node types: `select`, `multi_select`, `radio_group`, `checkbox_group`
- Static options: add/remove/reorder option list in config
- Select/multi_select: autocomplete search mode (client-side filter or API)
- External API data source: configurable URL, method, headers, params mapping, response path
- Checkbox group: min/max selection count configurable

Tasks:

Task 6.4.a: Static options management in config panel.
AC: Config panel shows options list. Add option (label + value). Reorder via drag. Remove. Preview shows options. Stored in node.config.options[].

Task 6.4.b: External API data source configuration.
AC: Toggle "Use external data source". Config fields: url, method (GET/POST), headers (KV pairs), body_template (JSON), response_path (dot notation to array), option_label_field, option_value_field. Preview button fetches and shows parsed options.

Task 6.4.c: Checkbox group min/max validation config.
AC: Config allows min_checked (int, 0 default) and max_checked (int, optional). Stored in validations array as `{type: 'min_checked', value: N}` and `{type: 'max_checked', value: N}`.

Tests:

Test case 1: Static options stored correctly in form_json.
Definition: Add 3 options to select. form_json node.config.options has 3 items.
Implemented: no | Passed: n/a

Test case 2: External API config preview fetches options.
Definition: Configure valid API URL. Click preview. Options list populated from API response.
Implemented: no | Passed: n/a

Test case 3: Checkbox min/max validation stored in validations array.
Definition: Set min_checked=2, max_checked=4. Node validations = [{type:'min_checked',value:2},{type:'max_checked',value:4}].
Implemented: no | Passed: n/a

---

#### User Story 6.5 — Date, time, and date-range node types

Status: not implemented
Depends on: 6.3

Main goal: Date/time input nodes with range support and configurable constraints.

Definition of Done:
- Node types: `date_picker`, `time_picker`, `datetime_picker`, `date_range_picker`
- Config: min_date, max_date (static date or relative formula like `today`, `today+7d`)
- Date format configurable (display format, not storage format; storage always ISO 8601)
- Disabled dates array (specific dates or days of week)

Tasks:

Task 6.5.a: Implement date/time node config panels.
AC: date_picker config: label, placeholder, min_date, max_date, disabled_weekdays[], format (display). date_range_picker config: min_range_days, max_range_days, min_date, max_date. All stored in config object.

Tests:

Test case 1: Date range min/max constraints stored in form_json.
Definition: Set min_range_days=2, max_range_days=30. form_json node.config has these fields.
Implemented: no | Passed: n/a

---

#### User Story 6.6 — File and image upload node types

Status: not implemented
Depends on: 6.3

Main goal: File/image upload nodes with configurable constraints.

Definition of Done:
- Node types: `file_upload`, `image_upload`
- Config: accepted_extensions[] (e.g. ['.pdf','.docx']), max_file_size_mb, max_files (1 = single, N = multi), image-specific: max_width_px, max_height_px, allowed_formats
- Constraints validated client-side (previewer) and server-side (submission handler)

Tasks:

Task 6.6.a: Implement file/image upload node config panels.
AC: file_upload config: accepted_extensions (tag input), max_file_size_mb (number), max_files (1-N), allow_multiple (derived from max_files>1). image_upload adds: max_width_px, max_height_px, allowed_image_formats.

Tests:

Test case 1: Upload config constraints stored in form_json.
Definition: Set max_file_size_mb=5, accepted_extensions=['.pdf']. form_json node.config reflects these.
Implemented: no | Passed: n/a

---

#### User Story 6.7 — Conditional DAG flow engine

Status: not implemented
Depends on: 6.2, 6.1

Main goal: Edges can have conditions that control which path is followed based on field values.

Definition of Done:
- Edge condition schema: `{source_node_id, operator, value}` where operators: `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `contains`, `not_contains`, `is_empty`, `is_not_empty`, `in`, `not_in`
- Condition editor in CMS: click edge → edit condition in sidebar
- `ConditionalFlowEngine` evaluates form state against DAG, returns set of visible/next nodes
- Cycle detection on every edge add (DAG enforcement)

Tasks:

Task 6.7.a: Implement edge condition editor in CMS.
AC: Click edge → condition panel in sidebar. Select source node, select operator from dropdown, enter comparison value. Save updates edge.condition in form_json.

Task 6.7.b: Implement `ConditionalFlowEngine` (shared between CMS previewer and Lit renderer).
AC: Input: form_json + current field values. Output: set of visible node IDs based on edge conditions evaluated against values. Engine is pure (no side effects), testable in isolation. Exported as separate module usable by both CMS and renderer.

Tests:

Test case 1: Node hidden when condition not met.
Definition: Node B only shown if Node A value = 'yes'. Set value to 'no'. Engine returns Node B as hidden.
Implemented: no | Passed: n/a

Test case 2: Node shown when condition met.
Definition: Same setup, value = 'yes'. Engine returns Node B as visible.
Implemented: no | Passed: n/a

Test case 3: Cycle detection rejects circular edge.
Definition: A → B → C → A attempted. Edge from C back to A rejected.
Implemented: no | Passed: n/a

---

#### User Story 6.8 — Node validations and i18n

Status: not implemented
Depends on: 6.3, 6.4, 6.5, 6.6

Main goal: Per-node validation rules with customizable i18n error messages.

Definition of Done:
- Validation rule types: `required`, `min_length`, `max_length`, `regex`, `email`, `min_value`, `max_value`, `min_checked`, `max_checked`, `min_files`, `max_files`, `file_size`, `file_type`, `date_min`, `date_max`, `date_range_min`, `date_range_max`
- Each validation has an `i18n.error_message` with default English and per-locale overrides
- Validation rule editor in node config panel
- `ValidationEngine` shared between CMS previewer and Lit renderer

Tasks:

Task 6.8.a: Implement validation rule editor in node config panel.
AC: Config panel has "Validations" section. Add validation rule → select type → configure (value + i18n message). Multiple rules per node. Remove/reorder rules. Stored in node.validations[].

Task 6.8.b: Implement `ValidationEngine` (pure, testable, shared).
AC: Input: node config with validations + field value + locale. Output: `{valid: bool, errors: string[]}`. Runs all matching validations, aggregates errors translated to given locale. Default locale = 'en'.

Tests:

Test case 1: Required validation fails on empty value.
Definition: Node with `{type:'required'}` validation. Value = ''. Engine returns valid=false, error = 'This field is required'.
Implemented: no | Passed: n/a

Test case 2: Regex validation fails on non-matching value.
Definition: Node with `{type:'regex', pattern:'^[0-9]+$'}`. Value = 'abc'. Engine returns valid=false.
Implemented: no | Passed: n/a

Test case 3: Custom i18n error message returned for locale.
Definition: Node with required validation, i18n.error_message.es='Campo requerido'. Call engine with locale='es'. Error = 'Campo requerido'.
Implemented: no | Passed: n/a

---

#### User Story 6.9 — Form previewer (side-by-side revisions)

Status: not implemented
Depends on: 6.1, 6.7, 6.8, 8.2

Main goal: CMS allows previewing up to 2 revisions side-by-side.

Definition of Done:
- CMS route `/forms/:formId/preview` shows split-pane layout
- Each pane: revision selector dropdown (all revisions for selected environment), rendered form preview
- Preview uses Lit renderer (embeds renderer component) or mirrors renderer logic exactly
- Preview shows live-rendered form with all conditional logic and validations
- Submission in preview shows modal with JSON data (not real submit)

Tasks:

Task 6.9.a: Preview route + revision selectors.
AC: Route `/forms/:id/preview?env=development`. Left and right panels each with environment + revision dropdowns. On select: loads form_json for that revision, renders form.

Task 6.9.b: Preview submission modal.
AC: When user submits form in preview, intercept submit event. Show modal (not browser dialog) displaying `JSON.stringify(formData, null, 2)`. Modal has close button. No API call made.

Tests:

Test case 1: Preview loads correct form_json for selected revision.
Definition: Select revision 3 in left pane. form_json for revision 3 loaded. Nodes/fields displayed.
Implemented: no | Passed: n/a

Test case 2: Preview submission shows JSON modal.
Definition: Fill out preview form. Click submit. Modal appears with JSON payload. No network submission request made.
Implemented: no | Passed: n/a

---

### Epic 7: Render & Access Control

---

#### User Story 7.1 — REST API for form JSON retrieval

Status: not implemented
Depends on: 5.5, 2.5

Main goal: Public endpoint for fetching published form JSON, used by Lit renderer.

Definition of Done:
- `GET /api/render/form/:formSlug?env=production&key=<renderKey>` — returns published form JSON
- Domain automatically determined from `Origin` or `Referer` header
- Render eligibility checked before returning data
- Response: `{form: {...}, revision: {...}, form_json: {...}}`
- On ineligible: `{error: 'denied', reason: '...', message: '<i18n customizable>'}` with HTTP 403

Tasks:

Task 7.1.a: Implement render form JSON endpoint.
AC: Extracts domain from request headers. Calls RenderEligibilityService. On eligible: returns form + revision + form_json. On ineligible: returns 403 with reason + customizable message. Logs form_insights record for every request (eligible or denied).

Tests:

Test case 1: Valid request returns form_json.
Definition: Published form, published revision, valid domain, valid key. GET endpoint returns 200 with form_json.
Implemented: no | Passed: n/a

Test case 2: Invalid key returns 403 with reason.
Definition: Request with invalid render key. Returns 403, `{error:'denied', reason:'key_invalid'}`.
Implemented: no | Passed: n/a

Test case 3: form_insights record created for denied request.
Definition: Denied request. form_insights record with render_denied=true, denial_reason='key_invalid'.
Implemented: no | Passed: n/a

---

#### User Story 7.2 — Render key management

Status: not implemented
Depends on: 2.7, 3.4

Main goal: API and CMS UI for creating, rotating, and revoking render keys per form environment.

Definition of Done:
- `POST /api/form-environments/:envId/render-keys` — creates key, returns raw key once
- `DELETE /api/form-environments/:envId/render-keys/:keyId` — revokes key (sets revoked_at)
- `POST /api/form-environments/:envId/render-keys/:keyId/rotate` — creates new key, revokes old
- Keys stored as bcrypt hash; raw key shown only on creation
- CMS UI in form environment settings

Tasks:

Task 7.2.a: Implement render key create/revoke/rotate API.
AC: Create: generates UUID, hashes it, stores. Returns `{id, raw_key, created_at}` — raw_key never stored. Revoke: sets revoked_at=now, is_active=false. Rotate: revoke old + create new in single transaction. Audit log for all.

Task 7.2.b: CMS render key management UI.
AC: Form environment settings page shows active keys list (label, created_at, last_used_at). Create key button → modal shows raw key once with copy button + warning "Store this now, it won't be shown again". Revoke/rotate buttons with confirmation.

Tests:

Test case 1: Created key validates correctly.
Definition: Create key. Use raw key in render request. RenderEligibilityService validates it (hash comparison). eligible=true (other conditions met).
Implemented: no | Passed: n/a

Test case 2: Revoked key fails validation immediately.
Definition: Create key. Revoke it. Use raw key in render request. eligible=false, reason='key_revoked'.
Implemented: no | Passed: n/a

Test case 3: Raw key not stored in DB.
Definition: Create key. Query render_keys table. key_hash present. No plain-text key anywhere in DB.
Implemented: no | Passed: n/a

---

#### User Story 7.3 — Domain allowlist management

Status: not implemented
Depends on: 2.7, 3.4

Main goal: Per-form per-environment domain allowlist with wildcard and localhost support.

Definition of Done:
- `GET/POST/DELETE /api/form-environments/:envId/domain-allowlist`
- Wildcard support: `*.example.com` matches `sub.example.com` but not `example.com`
- Localhost always allowed in `development` environment
- `www.example.com` and `example.com` treated as different entries (explicit)
- CMS UI in form environment settings

Tasks:

Task 7.3.a: Implement domain allowlist CRUD API with wildcard matching.
AC: DomainMatchService with `matches(domain, allowlist[])` method. Wildcard `* .example.com`: matches `app.example.com`, `www.example.com`; does not match `example.com`. Exact match for non-wildcard entries.

Task 7.3.b: CMS domain allowlist UI.
AC: Environment settings → Allowed Domains section. Add domain input with validation. Shows list of domains. Remove button per entry. Wildcard domains shown with indicator.

Tests:

Test case 1: Wildcard `*.example.com` matches `sub.example.com`.
Definition: allowlist = ['*.example.com']. Domain = 'sub.example.com'. matches() = true.
Implemented: no | Passed: n/a

Test case 2: Wildcard `*.example.com` does not match `example.com`.
Definition: allowlist = ['*.example.com']. Domain = 'example.com'. matches() = false.
Implemented: no | Passed: n/a

Test case 3: Localhost always allowed in development env.
Definition: Form environment = development. Domain = 'localhost'. matches() = true regardless of allowlist.
Implemented: no | Passed: n/a

---

#### User Story 7.4 — Failed validation behavior and rate limiting

Status: not implemented
Depends on: 7.1, 11.1

Main goal: Configurable error messages on render denial; rate limiting on validation endpoint.

Definition of Done:
- Per-env configurable error messages (i18n-aware): `invalidKey`, `domainNotAllowed`, `formNotPublished`, `noPublishedRevision`, `formArchived`
- Error messages stored in form_environment.settings JSON
- Rate limiting: 100 invalid requests per IP per minute triggers 429
- Failed validation attempts logged to form_insights

Tasks:

Task 7.4.a: Per-env customizable error message configuration.
AC: form_environment.settings.error_messages: object keyed by reason code, value = {default: 'string', i18n: {locale: 'string'}}. CMS UI to edit these messages. Render API uses these messages in 403 response.

Task 7.4.b: Rate limiting on render validation endpoint.
AC: Redis-backed rate limiter (or in-memory fallback): 100 requests/IP/minute for /api/render/*. On exceed: 429 with Retry-After header. Tracked per IP.

Tests:

Test case 1: Custom error message returned for invalidKey reason.
Definition: Set custom message for invalidKey = "Access denied". Render with invalid key. Response message = "Access denied".
Implemented: no | Passed: n/a

Test case 2: Rate limit triggers after 100 failed requests.
Definition: Send 101 render requests with invalid key from same IP. 101st returns 429.
Implemented: no | Passed: n/a

---

### Epic 8: Lit Rendering Library

---

#### User Story 8.1 — Lit renderer library setup

Status: not implemented
Depends on: 1.1, 6.1

Main goal: Standalone Lit library in `renderer/` with both NPM package and CDN bundle outputs.

Definition of Done:
- `renderer/` builds to: `dist/form-renderer.esm.js` (npm/ESM) and `dist/form-renderer.iife.js` (CDN/IIFE)
- `package.json` exports defined correctly
- Library has no runtime external dependencies except Lit
- `renderer/src/index.js` exports public API: `FormRenderer`, `FormRendererConfig`
- CDN usage: `<script src="...form-renderer.iife.js">` registers custom element globally

Tasks:

Task 8.1.a: Configure Vite library mode for dual output (ESM + IIFE).
AC: `vite.config.js` library mode: formats: ['es','iife']. Both outputs in dist/. IIFE globalName='FormRenderer'. Build exits 0, both files present.

Task 8.1.b: Set up Lit and custom element registration.
AC: `<form-renderer>` custom element defined. Lit as peerDependency (npm mode) or bundled (IIFE mode). Element registered on import.

Tests:

Test case 1: Library builds without errors.
Definition: `npm run build` in renderer/. Exit 0. Both ESM and IIFE present in dist/.
Implemented: no | Passed: n/a

Test case 2: IIFE bundle self-registers custom element.
Definition: Load IIFE in browser. `customElements.get('form-renderer')` returns defined class.
Implemented: no | Passed: n/a

---

#### User Story 8.2 — Form renderer from JSON (all node types)

Status: not implemented
Depends on: 8.1, 6.7, 6.8

Main goal: `<form-renderer>` renders all node types from form_json, with conditional flow and per-node validation.

Definition of Done:
- `<form-renderer form-id="..." env="production" render-key="...">` fetches and renders form
- All node types rendered as appropriate HTML inputs
- Conditional visibility driven by `ConditionalFlowEngine`
- Client-side validation driven by `ValidationEngine` on field change and submit
- Loading/error states handled (spinner, error message slot)

Tasks:

Task 8.2.a: Implement form fetching and rendering lifecycle.
AC: On `connectedCallback`: fetch form JSON from API. On success: render form. On fail: emit 'form-render-denied' event with reason. Show fallback slot content on denial.

Task 8.2.b: Implement all node type renderers as Lit sub-components.
AC: One Lit component per node type. Each renders correct HTML input(s), binds value to form state, emits 'form-field-change' event on change.

Task 8.2.c: Integrate ConditionalFlowEngine and ValidationEngine.
AC: On field change: re-evaluate visibility. On submit: run all validations. Invalid fields show error messages. Valid submit proceeds to submission handler.

Tests:

Test case 1: Text input node renders with correct label and placeholder.
Definition: form_json with one text_input node. Renderer shows `<label>` and `<input>` with matching attributes.
Implemented: no | Passed: n/a

Test case 2: Conditional node hidden until condition met.
Definition: Node B conditional on Node A = 'yes'. Load form. Node B hidden. Enter 'yes' in A. Node B appears.
Implemented: no | Passed: n/a

Test case 3: Validation error shown on invalid submit attempt.
Definition: Required field empty. Submit. Field shows error message. Form not submitted.
Implemented: no | Passed: n/a

---

#### User Story 8.3 — Shadow DOM support (optional, off by default)

Status: not implemented
Depends on: 8.1

Main goal: Shadow DOM can be opted into via config attribute.

Definition of Done:
- Default: no Shadow DOM (form renders in light DOM)
- `<form-renderer shadow-dom="true">` — enables Shadow DOM with encapsulated styles
- Theming tokens passed as CSS custom properties (work in both modes)
- Documented in renderer README

Tasks:

Task 8.3.a: Implement conditional Shadow DOM based on attribute.
AC: `shadow-dom` attribute toggles Shadow DOM attachment. Default=false (light DOM). When enabled: style encapsulation active. CSS custom property tokens still work.

Tests:

Test case 1: Default Light DOM usage.
Definition: `<form-renderer>` without shadow-dom attr. `shadowRoot` is null. Styles in light DOM.
Implemented: no | Passed: n/a

Test case 2: Shadow DOM mode enabled.
Definition: `<form-renderer shadow-dom="true">`. `shadowRoot` is not null. Styles encapsulated.
Implemented: no | Passed: n/a

---

#### User Story 8.4 — Window-level event contract

Status: not implemented
Depends on: 8.2

Main goal: All significant renderer lifecycle events emitted at `window` level as CustomEvents.

Definition of Done:
- Events emitted via `window.dispatchEvent(new CustomEvent(name, {detail: {...}}))`
- Event names: `form-renderer:loaded`, `form-renderer:render-denied`, `form-renderer:field-change`, `form-renderer:validation-error`, `form-renderer:submit`, `form-renderer:submit-success`, `form-renderer:submit-error`
- All events have `detail.formId`, `detail.env`
- Documented in renderer/README.md with event names and detail shapes

Tasks:

Task 8.4.a: Implement window event emission in renderer.
AC: Each lifecycle moment dispatches correct event. Events bubble from window. detail shape matches documentation.

Task 8.4.b: Document all events in renderer/README.md.
AC: Table of events: name, when fired, detail fields. Code examples for each.

Tests:

Test case 1: `form-renderer:loaded` fires on successful form load.
Definition: Add event listener to window. Load valid form. Event received with detail.formId correct.
Implemented: no | Passed: n/a

Test case 2: `form-renderer:render-denied` fires with reason on denial.
Definition: Load form with invalid key. Event fires with detail.reason='key_invalid'.
Implemented: no | Passed: n/a

Test case 3: `form-renderer:submit` fires with form data on submit.
Definition: Fill form. Submit. Event fires with detail.data matching form values.
Implemented: no | Passed: n/a

---

#### User Story 8.5 — Client-side form state API (read/write/submit)

Status: not implemented
Depends on: 8.2

Main goal: External scripts can read/write field values and submit programmatically.

Definition of Done:
- `document.querySelector('form-renderer').getFormData()` → returns current field values as object
- `document.querySelector('form-renderer').setFieldValue(nodeId, value)` → sets field value
- `document.querySelector('form-renderer').submit()` → triggers validation + submit
- `document.querySelector('form-renderer').reset()` → resets all fields to defaults
- All methods documented in renderer/README.md

Tasks:

Task 8.5.a: Implement public API methods on `<form-renderer>` element.
AC: `getFormData()`: returns `{[nodeId]: value}` for all fields. `setFieldValue(nodeId, value)`: updates field, triggers re-render + conditional re-evaluation. `submit()`: runs validation pipeline, submits if valid. `reset()`: clears all values.

Tests:

Test case 1: `getFormData()` returns current values.
Definition: Manually enter value in text field. `getFormData()` returns {[nodeId]: 'entered value'}.
Implemented: no | Passed: n/a

Test case 2: `setFieldValue()` updates field and triggers conditional re-evaluation.
Definition: Form with conditional B based on A='yes'. `setFieldValue(A, 'yes')`. Node B becomes visible.
Implemented: no | Passed: n/a

---

#### User Story 8.6 — Browser tag discovery and renderer loading

Status: not implemented
Depends on: 8.1

Main goal: Script auto-discovers form placeholder elements and loads renderer.

Definition of Done:
- Placeholder HTML: `<div data-form-builder form-id="abc" env="production" render-key="..."></div>`
- Loader script (loaded via CDN `<script>` tag) scans DOM for `[data-form-builder]`
- Lazily injects `<form-renderer>` component into each placeholder
- Supports multiple forms on same page
- Works with SPAs (MutationObserver for dynamically added elements)

Tasks:

Task 8.6.a: Implement loader script `renderer/src/loader.js`.
AC: On DOMContentLoaded: querySelectorAll('[data-form-builder]'). For each: create `<form-renderer>` element, copy attributes (form-id, env, render-key, shadow-dom, etc.), append into placeholder. MutationObserver watches for new placeholders added dynamically.

Tests:

Test case 1: Loader discovers placeholder and injects renderer.
Definition: HTML page with `<div data-form-builder form-id="test">`. Load loader script. `<form-renderer>` injected inside div after DOMContentLoaded.
Implemented: no | Passed: n/a

Test case 2: Multiple placeholders all injected.
Definition: 3 form placeholders on page. All 3 get `<form-renderer>` injected.
Implemented: no | Passed: n/a

Test case 3: Dynamically added placeholder detected.
Definition: After page load: script adds `<div data-form-builder ...>` to DOM. MutationObserver detects it. Renderer injected.
Implemented: no | Passed: n/a

---

#### User Story 8.7 — CSS class status system

Status: not implemented
Depends on: 8.2

Main goal: Predictable CSS classes on all rendered elements for external styling integration.

Definition of Done:
- All rendered nodes have `data-node-id` and `data-node-type` attributes
- State classes on field wrapper: `fb-field--valid`, `fb-field--invalid`, `fb-field--touched`, `fb-field--focused`, `fb-field--hidden`, `fb-field--disabled`
- Form root has: `fb-form--loading`, `fb-form--loaded`, `fb-form--submitting`, `fb-form--submitted`, `fb-form--error`
- All classes documented in renderer/README.md

Tasks:

Task 8.7.a: Implement CSS class bindings in all renderer components.
AC: Field wrapper element has correct state classes applied reactively. `data-node-id` and `data-node-type` on all nodes. Form root has form-level state classes.

Tests:

Test case 1: Invalid field has `fb-field--invalid` class.
Definition: Submit form with empty required field. Field wrapper has class `fb-field--invalid`.
Implemented: no | Passed: n/a

Test case 2: Hidden node has `fb-field--hidden` class.
Definition: Node hidden by conditional. Wrapper has `fb-field--hidden`.
Implemented: no | Passed: n/a

---

### Epic 9: Submissions

---

#### User Story 9.1 — Form submission storage (MySQL)

Status: not implemented
Depends on: 8.2, 2.8

Main goal: Form submissions stored in MySQL with honeypot validation.

Definition of Done:
- `POST /api/render/form/:formSlug/submit` accepts form data
- Render eligibility re-validated on submit
- Honeypot field in submission silently discarded if populated (bot detection)
- Server-side field validation run against form_json validations
- Submission stored in form_submissions

Tasks:

Task 9.1.a: Implement submission endpoint.
AC: POST /api/render/form/:slug/submit. Re-validate render eligibility. Check honeypot field (if non-empty: return 200 silently without storing — honeypot_value stored anyway for audit). Run server-side validation. On valid: store submission, return 200 with `{success: true, submission_id}`. On invalid: return 422 with field errors.

Tests:

Test case 1: Valid submission stored.
Definition: Submit valid form data. form_submissions record created with correct data JSON.
Implemented: no | Passed: n/a

Test case 2: Honeypot-filled submission silently accepted but flagged.
Definition: Submit with honeypot field populated. Returns 200. submission stored with honeypot_value. Not treated as real submission (e.g. filtered in CMS).
Implemented: no | Passed: n/a

Test case 3: Invalid submission returns 422 with field errors.
Definition: Submit with missing required field. Returns 422, errors keyed by node_id.
Implemented: no | Passed: n/a

---

#### User Story 9.2 — Submission export and webhook

Status: not implemented
Depends on: 9.1

Main goal: Submissions can be exported as JSON/CSV and forwarded to webhook.

Definition of Done:
- `GET /api/form-environments/:envId/submissions` — paginated list (CMS, auth required)
- `GET /api/form-environments/:envId/submissions/export?format=json|csv` — full export
- Webhook: on submission, if webhook_url configured, POST submission data to it (async queue preferred, sync fallback)

Tasks:

Task 9.2.a: Submissions list + export API.
AC: List: paginated, filterable by date_from/date_to, excludes honeypot-flagged by default (include with `?include_honeypot=true`). Export: streams JSON array or CSV with headers from node labels. Auth required (form_editor+).

Task 9.2.b: Webhook dispatch on submission.
AC: If form_environment.webhook_url set: enqueue webhook job. Job POSTs submission JSON to URL with `X-Webhook-Secret` header (HMAC-SHA256 signature of payload). On failure: retry 3x with backoff. Fall back to sync if queue not available.

Tests:

Test case 1: Export returns all submissions as JSON.
Definition: 5 submissions for env. GET export?format=json. Response is JSON array of 5 submissions.
Implemented: no | Passed: n/a

Test case 2: Webhook receives submission with HMAC signature.
Definition: Set webhook_url to test listener. Submit form. Listener receives POST with correct HMAC-SHA256 signature.
Implemented: no | Passed: n/a

---

#### User Story 9.3 — File upload handling

Status: not implemented
Depends on: 9.1, 2.8

Main goal: File uploads processed and stored per configurable driver (local/S3).

Definition of Done:
- `StorageService` with drivers: `local` (stored in `storage/uploads/`) and `s3` (S3-compatible API)
- Driver config inheritable: brand → campaign → form_environment
- `form_submission_files` records created per uploaded file
- Validation: extension, size, MIME type validated server-side

Tasks:

Task 9.3.a: Implement `StorageService` with local and S3 drivers.
AC: `StorageService::store(file, config)` → returns `{path, url, size, mime_type}`. Local: saves to `storage/uploads/{year}/{month}/{uuid}.{ext}`. S3: uses AWS SDK or compatible. Config resolved: form_environment → campaign → brand → global default.

Task 9.3.b: File validation on submission.
AC: Server-side: validate extension against node.config.accepted_extensions, validate size ≤ max_file_size_mb, validate MIME via magic bytes (not just extension). Invalid: 422 with per-node errors.

Tests:

Test case 1: File stored in correct local path.
Definition: Submit form with PDF attachment. File saved to storage/uploads/YYYY/MM/. form_submission_files record has correct path.
Implemented: no | Passed: n/a

Test case 2: File with disallowed extension rejected.
Definition: Node config: accepted_extensions=['.pdf']. Submit .exe file. Returns 422.
Implemented: no | Passed: n/a

Test case 3: Config inheritance (brand → form).
Definition: Brand S3 config set. Form has no storage config. StorageService resolves brand config for that form.
Implemented: no | Passed: n/a

---

### Epic 10: Insights & Analytics

---

#### User Story 10.1 — Insights tracking

Status: not implemented
Depends on: 7.1, 2.8

Main goal: Track form views, time-on-page, IP, and fingerprint for analytics — adblock-friendly.

Definition of Done:
- `POST /api/insights/event` endpoint (named to avoid adblock: no "analytics" or "tracking" in URL)
- Events: `view` (form loaded), `time_update` (periodic time-on-page update), `denied` (tracked on render denial)
- IP captured server-side; fingerprint sent client-side (canvas-based)
- No cookies — session_id generated client-side as UUID per page load
- Endpoint adds CORS headers to allow cross-origin calls from embed sites

Tasks:

Task 10.1.a: Implement insights event endpoint.
AC: POST /api/insights/event. Body: `{form_id, env, event_type, session_id, fingerprint, referrer, time_on_page_seconds}`. No auth required. IP captured from request. Creates/updates form_insights record for session_id.

Task 10.1.b: Implement client-side insights tracker in renderer.
AC: On form load: generate session_id, send 'view' event. Every 30s: send 'time_update'. On page unload: send final time_update. Canvas fingerprint generated client-side and included.

Tests:

Test case 1: View event creates insights record.
Definition: POST insights/event with event_type='view'. form_insights record created with ip_address, session_id.
Implemented: no | Passed: n/a

Test case 2: Time update increments time_on_page_seconds.
Definition: Send time_update events for same session_id. time_on_page_seconds updated on each call.
Implemented: no | Passed: n/a

---

#### User Story 10.2 — Insights dashboard UI

Status: not implemented
Depends on: 10.1, 3.4

Main goal: CMS page showing form analytics with date filters.

Definition of Done:
- CMS route `/forms/:id/insights`
- Metrics: total views, unique sessions, avg time-on-page, render denial count, submission count, conversion rate
- Date filter presets: 1d, 7d, 1 month, 1 year, custom date range
- Charts: views over time (line), denials by reason (pie), top referrers (table)
- Data from `GET /api/form-environments/:envId/insights?from=&to=`

Tasks:

Task 10.2.a: Insights aggregation API endpoint.
AC: GET /api/form-environments/:envId/insights?from=ISO&to=ISO. Returns: {total_views, unique_sessions, avg_time_on_page, denial_count, submission_count, conversion_rate, views_by_date[], denials_by_reason{}, top_referrers[]}.

Task 10.2.b: Insights dashboard Vue page.
AC: Date filter tabs (1D/7D/1M/1Y/Custom). KPI cards at top. Line chart for views. Bar chart for denials. Table for referrers. Uses lightweight charting lib (Chart.js or Echarts).

Tests:

Test case 1: Insights API returns correct counts for date range.
Definition: Insert 5 insights records within range, 3 outside. GET with date filter. total_views=5.
Implemented: no | Passed: n/a

---

#### User Story 10.3 — GTM and GA4 integration per form

Status: not implemented
Depends on: 8.2

Main goal: Per-form GTM container ID and/or GA4 measurement ID injected by renderer.

Definition of Done:
- Form settings in CMS: `gtm_container_id` (GTM-XXXXX), `ga4_measurement_id` (G-XXXXX)
- Renderer injects GTM/GA4 script tags on init if configured
- For Shadow DOM mode: script injected into document head (not shadow root)
- All form events (`form-renderer:field-change`, `form-renderer:submit`) pushed to `window.dataLayer`
- Documented in renderer README

Tasks:

Task 10.3.a: Implement GTM/GA4 script injection in renderer.
AC: If form_json.settings.gtm_container_id: inject GTM script into document.head. If settings.ga4_measurement_id: inject gtag.js. Inject once per page per ID (dedup check).

Task 10.3.b: Push renderer events to dataLayer.
AC: All window-level form events also push to `window.dataLayer = window.dataLayer || []`. Event format: `{event: 'form_renderer_[event_type]', formId, ...details}`.

Tests:

Test case 1: GTM script injected when configured.
Definition: form_json with gtm_container_id='GTM-TEST'. Renderer inits. `<script>` tag with GTM present in document head.
Implemented: no | Passed: n/a

Test case 2: dataLayer receives form submit event.
Definition: Submit form. `window.dataLayer` contains `{event: 'form_renderer_submit', formId: '...'}`.
Implemented: no | Passed: n/a

---

#### User Story 10.4 — Audit log viewer (CMS)

Status: not implemented
Depends on: 2.9, 3.4

Main goal: CMS page for admins to view audit trail of all significant actions.

Definition of Done:
- CMS route `/admin/audit-log`
- Table: user, action, entity, timestamp; expandable row shows old/new values
- Filter by entity_type, user, date range
- Paginated; read-only
- Admin-only access

Tasks:

Task 10.4.a: Audit log API endpoint.
AC: GET /api/audit-logs?entity_type=&user_id=&from=&to=&page=. Admin only. Returns paginated logs with user name, action, entity_type, entity_id, old_values, new_values, created_at.

Task 10.4.b: Audit log CMS Vue page.
AC: Table with columns: user, action badge, entity, timestamp. Click row → expand showing JSON diff of old/new values. Filter bar: entity type dropdown, user search, date range.

Tests:

Test case 1: Audit log returns correct entries for entity filter.
Definition: 3 audit entries for form_id=1, 2 for form_id=2. Filter entity_type=form, entity_id=1. Returns 3.
Implemented: no | Passed: n/a

---

### Epic 11: Redis & Caching

---

#### User Story 11.1 — Optional Redis cache layer

Status: not implemented
Depends on: 1.3, 7.1

Main goal: Redis is optional. When enabled, caches form JSON responses. System fully functions without Redis.

Definition of Done:
- Cache strategy: cache form_json response per (formSlug, env, revision_id) with configurable TTL
- When Redis unavailable: fallback to no-cache (DB hit on every request)
- CMS: configurable TTL per environment (0 = no cache)
- Laravel cache abstraction used (config/cache.php driver: redis or array)
- REDIS_ENABLED=true|false in `.env.api` controls behavior

Tasks:

Task 11.1.a: Implement caching in form JSON fetch service.
AC: FormRenderService wraps DB fetch with Cache::remember(key, ttl, fn). Key = "form:{slug}:{env}:{revision_id}". TTL from form_environment.settings.cache_ttl_seconds. If 0: no cache. If Redis driver unavailable: cache falls back to 'array' (request-scoped, no persistence).

Task 11.1.b: Redis optional config in .env.api and Compose.
AC: REDIS_ENABLED=false = app uses 'array' cache driver. REDIS_ENABLED=true = app uses 'redis' driver. Docker Compose redis service only started if profile=redis. Tested: app starts and handles form render without Redis.

Tests:

Test case 1: Form JSON served from cache on second request.
Definition: Enable Redis. First request hits DB (cold cache). Second request: DB not hit, cache hit. Verified via query log or cache hit counter.
Implemented: no | Passed: n/a

Test case 2: App functions correctly with Redis disabled.
Definition: REDIS_ENABLED=false. Start app. Render form. Returns 200. No Redis errors.
Implemented: no | Passed: n/a

Test case 3: Cache miss scenario after revision publish.
Definition: Form cached. Publish new revision (should bust cache). Next request: DB hit (new revision returned).
Implemented: no | Passed: n/a

---

#### User Story 11.2 — Cache clear mechanism

Status: not implemented
Depends on: 11.1

Main goal: CMS allows clearing cache per form, per environment, or globally.

Definition of Done:
- `POST /api/cache/clear` with `{scope: 'form'|'environment'|'all', form_id?, environment?}` — admin only
- Publishing a new revision auto-clears cache for that form+env
- CMS: "Clear Cache" button in form environment settings
- Cache clear logs to audit log

Tasks:

Task 11.2.a: Cache clear API and auto-clear on publish.
AC: Clear API deletes matching cache keys. On revision publish: cache bust for (form, env) automatically. Redis: use key pattern delete. Array driver: flush. Audit log entry on manual clear.

Task 11.2.b: CMS cache clear UI.
AC: Form environment settings shows current cache TTL (editable). "Clear Cache Now" button calls API. Shows success toast.

Tests:

Test case 1: Manual cache clear removes cached form JSON.
Definition: Cache form. Call clear API. Next render request is a cache miss (DB hit).
Implemented: no | Passed: n/a

Test case 2: Publish revision auto-clears cache.
Definition: Cache form. Publish new revision. Render request returns new revision data.
Implemented: no | Passed: n/a

---

#### User Story 11.3 — Rate limiting (auth + render endpoints)

Status: not implemented
Depends on: 11.1, 3.1

Main goal: Rate limiting on sensitive endpoints using Redis (with fallback).

Definition of Done:
- Auth login: 5 attempts per IP per 15min (Story 3.1 AC included)
- Render validation: 100 requests per IP per minute (Story 7.4 AC included)
- API general limit: 1000 requests per IP per hour on all /api routes
- Redis-backed with in-memory IP fallback if Redis unavailable
- 429 responses include `Retry-After` header

Tasks:

Task 11.3.a: Implement rate limiting middleware with Redis/fallback.
AC: Laravel throttle middleware configured per route group. Redis: use Laravel's built-in Redis rate limiter. Fallback: file or in-memory. 429 includes Retry-After.

Tests:

Test case 1: Rate limit triggers on auth login.
Definition: Covered in 3.1 test case 3.
Implemented: no | Passed: n/a

Test case 2: Rate limiting works when Redis offline.
Definition: Stop Redis. Send requests. Rate limiting still applies (file/memory fallback). No 500 errors.
Implemented: no | Passed: n/a

---

### Epic 12: Theming

---

#### User Story 12.1 — Theming system in renderer and CMS builder

Status: not implemented
Depends on: 8.2

Main goal: Per-form theming: light/dark mode, configurable colors, border radius.

Definition of Done:
- Theme config in form_json.settings: `{mode: 'light'|'dark', primary_color, secondary_color, error_color, border_radius: 'none'|'sm'|'md'|'lg'|'full', font_family}`
- CSS custom properties injected at `<form-renderer>` root element
- CMS form settings page: theming tab with color pickers and controls
- Theme preview updates live in builder canvas

Tasks:

Task 12.1.a: Implement CSS custom property injection in renderer based on theme config.
AC: On form load: extract settings.theme. Inject `--fb-primary`, `--fb-secondary`, `--fb-error`, `--fb-radius`, `--fb-font-family` as inline styles on form root element. Dark mode: additional `--fb-bg`, `--fb-text`, `--fb-border` tokens.

Task 12.1.b: CMS theming UI in form settings.
AC: Form settings → Theming tab. Color pickers for each color token. Border radius selector (preset buttons). Font family input. Preview pane updates live.

Tests:

Test case 1: Custom primary color applied to renderer.
Definition: Set primary_color=#FF0000. Form rendered. CSS custom property --fb-primary = #FF0000 on root element.
Implemented: no | Passed: n/a

---

### Epic 13: Docs & Kitchensink

---

#### User Story 13.1 — Documentation site

Status: not implemented
Depends on: 8.1, 8.4, 8.5

Main goal: VitePress docs site covering all renderer public APIs, embedding guide, event reference, theming.

Definition of Done:
- `docs/` VitePress site with sections: Getting Started, Embedding Guide, Events Reference, State API, Node Types, Validation, Theming, Docker Setup, Makefile Commands
- API reference auto-generated from JSDoc where possible
- Searchable
- Deployed as static site (Nginx or CDN)
- `make docs:build` builds the site

Tasks:

Task 13.1.a: Write VitePress docs: Embedding Guide, Events Reference, State API.
AC: Each page has: overview, code examples, parameter table, edge cases. Embedding guide covers CDN and NPM usage, `<form-renderer>` attributes, placeholder HTML syntax.

Task 13.1.b: Write VitePress docs: Node Types, Validation, Theming, Infrastructure.
AC: Node types page: table of all node types + config shapes. Validation page: all validation rule types. Theming page: CSS custom properties reference. Infrastructure page: Docker, .env, Makefile.

Tests:

Test case 1: Docs build without errors.
Definition: `npm run docs:build` exits 0. `docs/.vitepress/dist` produced.
Implemented: no | Passed: n/a

---

#### User Story 13.2 — Kitchensink / demo environment

Status: not implemented
Depends on: 8.2, 13.1

Main goal: Interactive kitchensink page demonstrating all node types, events, and APIs.

Definition of Done:
- Route `/kitchensink` in docs site (or separate page)
- Embedded `<form-renderer>` showing all node types in one demo form
- Live event log panel showing window events as they fire
- Code snippets for each node type beside the rendered field
- Toggle controls: Shadow DOM on/off, theme switcher, locale switcher

Tasks:

Task 13.2.a: Build kitchensink page with all node types demo.
AC: Kitchensink form_json includes one of every node type. Renders using `<form-renderer>`. Event log panel shows last 20 window events. Theme toggle (light/dark) works live.

Tests:

Test case 1: All node types render without errors in kitchensink.
Definition: Load kitchensink page. No console errors. All node types visible.
Implemented: no | Passed: n/a

---

## Test Coverage Matrix

### Required render eligibility test matrix (all must pass before Epic 8 = done)

| Form Status | Revision Status | Domain | Key | Expected | Story |
|-------------|----------------|--------|-----|----------|-------|
| published | published | valid | valid | RENDERS | 5.5 TC1 |
| published | none | valid | valid | DENIED: no_published_revision | 5.5 TC2 |
| unpublished | published | valid | valid | DENIED: form_not_published | 5.5 TC3 |
| archived | published | valid | valid | DENIED: form_archived | 5.5 TC4 |
| published | published | invalid | valid | DENIED: domain_not_allowed | 5.5 TC5 |
| published | published | valid | revoked | DENIED: key_revoked | 5.5 TC6 |

### Required infra test matrix

| Test | Story |
|------|-------|
| Redis enabled: form JSON cached | 11.1 TC1 |
| Redis disabled: app boots and renders | 11.1 TC2 |
| .env.api secret not in Vue build output | 1.6 TC1 |
| Docker Compose dev boot | 1.3 TC1 |
| Docker Compose prod boot | 1.4 TC1 |
| `make setup` from clean state | 1.5 TC2 |
| Migration execution in container | 2.1 TC1 |
