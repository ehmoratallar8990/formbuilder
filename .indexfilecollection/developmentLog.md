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
