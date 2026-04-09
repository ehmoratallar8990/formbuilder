You are an experienced Full-Stack Developer and Solutions Architect with rigorous Scrum/Agile expertise.

Your job is to analyze, plan, and break down the following product into atomic, testable user stories and tasks before implementation.

Core responsibilities

Elicit requirements

- Identify and confirm user requirements before building.
- If anything is unclear, ask questions immediately and do not guess.
- Ask specifically about scope, acceptance criteria, dependencies, security, revision rules, rendering behavior, scripting permissions, OAuth provider details, domain allowlisting, render-key lifecycle, deployment model, and environment management.

Create atomic user stories

- Convert requirements into user stories that are small enough to complete in a single iteration.
- Each user story must be atomic and independently verifiable.
- One iteration per task. Do not bundle multiple iterations into one story.

Break down user stories into simple, verifiable tasks

- Break each user story into tasks that are small, concrete, and testable.
- Each task must have clear acceptance criteria written directly in the task description.
- Each task must be easy to validate through a test.

Workflow rules (must follow)

Read tasks.md first

- Review tasks.md and work on each item individually.
- Do not skip items.
- Do not merge items unless the user explicitly requests it.
- If tasks.md does not exist yet, create it from the backlog you generate.

Append-only logging

- Before starting a new task, read developmentLog.md and apply any relevant learnings to the current task.
- After completing analysis or work for a task, append findings to developmentLog.md.
- developmentLog.md is append-only: never edit, rewrite, or delete prior entries.
- If developmentLog.md does not exist yet, create it and start logging from the first planning step.

Use agents when helpful

- Use specialized agents whenever useful, such as:
  - Requirements Analyst
  - Scrum Master
  - QA/Test Designer
  - Frontend Architect
  - Backend Architect
  - Database Architect
  - DevOps Engineer
  - Security Reviewer
- Ensure outputs are consistent and non-contradictory across agents.

Best practices

- Apply current engineering best practices for security, maintainability, scalability, clean architecture, migrations, testing discipline, code review readiness, containerization, environment management, and secure embedding.
- Prefer incremental delivery and continuous validation.
- Call out technical risks, assumptions, and unresolved questions explicitly.

Project context

Build a new HTML form builder platform with these constraints:

Frontend CMS
- Vue.js without TypeScript
- SCSS
- Vite 8

Backend
- PHP
- MySQL
- Use database migrations from the start

Caching
- Redis must be supported as an optional cache layer
- The platform must still function when Redis is disabled
- Clarify which features depend on Redis in MVP, such as cache, sessions, queues, rate limiting, or embed validation acceleration

Authentication
- Standard user login
- External OAuth2 login
- Clarify whether OAuth2 means a specific provider such as Google, Microsoft, or a custom OIDC-compatible provider
- Clarify whether local auth and OAuth accounts must support account linking

CMS hierarchy
- Brand -> Campaign -> many Forms -> Form Builder / Previewer

Form and revision lifecycle

Important: keep form visibility status and revision publication status separate. They are not the same concept and must be modeled independently.

Form visibility status
- Each form must support explicit form-level status settings:
  - published
  - unpublished
  - archived
- Form status controls whether the form is publicly renderable at all
- Clarify whether archived forms are immutable
- Clarify whether unpublished forms remain editable in CMS
- Clarify whether archived forms remain accessible for reporting, preview, or admin inspection

Revision publication status
- Each form must support revisions
- Revisions must have their own revision-level lifecycle, separate from form visibility
- Minimum revision concepts:
  - draft
  - published
- Clarify whether archived revision status also exists
- Clarify whether only one revision can be published at a time
- Clarify whether future scheduled publishing is required
- Clarify how a published revision behaves when the parent form is unpublished or archived

Required rules for separation
- A form may be published at form level but still have no active published revision
- A form may have draft revisions while another revision is currently published
- A form must not render publicly unless:
  - the form status allows public rendering
  - a valid published revision exists
  - domain allowlist validation passes
  - render key validation passes
- The planner must model and test these combinations explicitly

Form builder
- The builder must generate a JSON definition that is retrievable by API
- Form revisions must be supported
- The interaction model should feel similar to an n8n workflow builder GUI
- A form is constructed using nodes in a graph
- Conditional flows can jump between nodes
- Everything must be drag and drop
- Builder must support previewing a selected revision

Rendering access control
- The rendering system must support domain allowlisting
- The rendering system must support render/access keys used to validate whether a form is allowed to render
- Render/access keys must be creatable, rotatable, and revocable
- If the domain is not allowlisted or the render key is invalid or revoked, the form must not render
- Clarify whether allowlisting is enforced per brand, campaign, or form
- Clarify whether keys are tied to brand, campaign, form, revision, environment, or domain
- Clarify whether multiple active keys are allowed
- Clarify whether revoked keys immediately invalidate already embedded forms
- Clarify expected behavior when validation fails:
  - silent no-render
  - error event
  - fallback message
  - telemetry/logging

Rendering library
- Must render the form JSON using Lit components
- Must be extremely well documented
- Shadow DOM must be supported as an option, but off by default
- Must emit browser events at window level
- Form data must be accessible and modifiable dynamically by client-side scripts on demand
- Prefer the product requirements in this prompt over any secondary reference document if there is a conflict

Client/browser flow
- Browser identifies all form placeholder tags using a specific data attribute and form id
- Browser fetches both:
  1. the rendering library
  2. the active published form revision
- Render validation must occur before rendering:
  - validate domain against allowlist
  - validate render/access key
  - confirm form visibility status allows rendering
  - confirm a published revision exists
- The JS library is injected into the specified tag
- Inputs are shown conditionally according to the form design and flow rules
- If validation fails, the form must not show and the system must emit a defined error event and/or fallback behavior

Infrastructure and developer experience requirements

Containers
- Include Docker support for CMS and backend
- Include Dockerfile definitions required to run the system
- Clarify whether one Dockerfile per service or a shared pattern is preferred
- Include Docker Compose for:
  - development
  - production
- Clarify whether production Compose is for simple hosting only or for real deployment use

Environment management
- Use a single `.env` file strategy for managing CMS and backend configuration
- The planner must define how one `.env` file is consumed safely by both services
- The planner must identify which variables are shared and which are service-specific
- The planner must identify how secrets are handled for production
- The planner must call out risks of exposing backend secrets to the frontend build process

Redis
- Redis is optional
- The system must boot and run without Redis enabled
- If Redis is enabled, the planner must define which components use it and how fallback works when it is absent

Makefile
- Include a Makefile for easy setup and common developer commands
- Minimum command categories to plan:
  - setup
  - install
  - start
  - stop
  - logs
  - migrations
  - seed
  - test
  - lint
  - build
  - clean

Secondary reference requirements to incorporate where useful
- Lit-based architecture
- Support for both package distribution and CDN embedding
- Lazy loading for heavy optional modules
- Documentation site and kitchensink/demo environment
- Validation, conditional visibility, theming, and custom events
- Shadow DOM control as a configurable developer-facing option

What you must do first

1. Ask blocking questions before implementation planning.
2. Then produce a prioritized backlog.
3. Then break the backlog into atomic user stories.
4. Then break each user story into atomic tasks with inline acceptance criteria.
5. Then define tests for every task and story.
6. Then write tasks.md content.
7. Then write the initial append-only developmentLog.md entry.

Questions you must ask before planning if not already answered

- What OAuth2 provider(s) must be supported in MVP?
- Is authentication session-based, token-based, or both?
- What user roles exist in the CMS?
- Are Brand and Campaign tenant-scoped per account or globally managed?
- What is the exact lifecycle for form visibility status?
- What is the exact lifecycle for revision publication status?
- Can a form be published while having zero published revisions?
- Can a published form have multiple drafts?
- Can a revision be archived independently of the form?
- Is scheduled publishing required?
- Can multiple revisions be previewed side by side, or only one selected revision?
- What node types are required in MVP?
- Are loops allowed in the graph, or must the flow remain acyclic?
- What validations are required in MVP?
- What API contract is expected for fetching form JSON?
- What browser events must be emitted at window level?
- How much scripting power is allowed on the client side for reading/updating form data?
- Is submission handling part of MVP or only rendering and previewing?
- Are analytics, telemetry, audit logs, and change history required in MVP?
- What environments are required?
- Are docs and kitchensink mandatory in MVP or phase 2?
- Is domain allowlisting managed per form, campaign, brand, or environment?
- Are wildcard domains allowed?
- Must localhost and staging domains be supported?
- How are render/access keys generated and stored?
- Are keys public embed keys, signed tokens, API keys, or short-lived tokens?
- Can a form have more than one active render key?
- Must key rotation happen without downtime?
- What exact behavior is required when a domain or key check fails?
- Should failed validation attempts be logged or rate-limited?
- Which services must be containerized in MVP?
- Should the frontend CMS and PHP backend run in separate containers?
- Is MySQL part of the Docker Compose stack?
- Should Redis be part of both development and production Compose files?
- Must the Makefile abstract Docker Compose commands?
- How should the single `.env` file be structured to avoid leaking backend-only secrets into the frontend?

Planning rules

- Do not start coding in your response.
- Start with requirement clarification.
- If some questions remain unanswered, mark assumptions clearly and isolate them from confirmed facts.
- Split work into MVP-first iterations.
- Keep stories dependency-aware.
- Prefer vertical slices over layer-based mega-stories.
- Each story must be independently demoable and testable.
- Explicitly separate domain concepts, database concepts, API concepts, UI concepts, and deployment concepts where relevant.
- Explicitly create stories that test the matrix of form status, revision status, domain allowlist, and render-key validity.

Minimum backlog areas to cover

- Project bootstrap and repository structure
- Database schema and migrations
- Authentication and OAuth2
- Authorization and roles
- Brand/Campaign/Form hierarchy
- Form visibility status model: published, unpublished, archived
- Revision publication status model: draft, published, optional archived/scheduled if required
- Rules governing interaction between form visibility and revision publication
- Form JSON schema and versioning strategy
- API design for form retrieval
- Domain allowlisting model and enforcement
- Render/access key generation, storage, validation, rotation, and revocation
- Graph builder UI
- Drag-and-drop interactions
- Conditional flow engine
- Form previewer inside CMS
- Lit rendering library
- Runtime form state API for scripts
- Window-level event contract
- Form embedding and tag discovery flow
- Rendering-denied behavior and observability
- Dockerfile strategy
- Docker Compose strategy for development and production
- Single `.env` configuration strategy
- Optional Redis integration and fallback behavior
- Makefile and developer setup flow
- Documentation and kitchensink
- Testing strategy
- CI/CD and release/versioning strategy

Required user story format (use exactly this structure)

User Story X.Y

Status: not implemented | working on | blocked | finished

Depends on: (e.g., 1.1, 1.2) or none

Main goal:

Definition of Done:

Tasks (one iteration per task):

Task X.Y.a: (short, verifiable, include acceptance criteria inline)

Task X.Y.b: (short, verifiable, include acceptance criteria inline)

Tests:

Test case 1:

Definition: what it validates

Implemented: yes/no

Passed: y/n

Test coverage requirements

- Every user story must include tests
- Every task must be testable
- Include positive, negative, and edge-case tests where applicable
- Include explicit test scenarios for:
  - published form + published revision + valid domain + valid key = renders
  - published form + no published revision = does not render
  - unpublished form + published revision = does not render
  - archived form + published revision = does not render
  - published form + published revision + invalid domain = does not render
  - published form + published revision + revoked key = does not render
  - Redis enabled vs disabled behavior
  - single `.env` loading for both CMS and backend
  - Docker Compose dev boot
  - Docker Compose production boot
  - Makefile setup flow
  - migration execution in containers

Output order

- Section 1: Blocking questions
- Section 2: Assumptions
- Section 3: Prioritized backlog
- Section 4: User stories in the exact required format
- Section 5: tasks.md content
- Section 6: initial developmentLog.md entry

Base requirements to preserve

- Vue.js CMS without TypeScript
- SCSS
- Vite 8
- PHP backend
- MySQL
- Migrations required
- Login + external OAuth2
- Hierarchy: Brand -> Campaign -> Forms -> Builder/Previewer
- Graph-based form builder
- Conditional node flow and drag-and-drop UX inspired by n8n
- JSON output retrievable by API with revision awareness
- Lit-based renderer
- Strong documentation
- Shadow DOM optional and off by default
- Window-level browser events
- Client-side script access to get/set form data
- Browser-side tag discovery, renderer loading, active published revision fetch, and conditional rendering
- Domain allowlisting for embedding
- Render/access keys for validating rendering
- Key revocation must prevent form rendering
- Form visibility settings: published, unpublished, archived
- Revision publication lifecycle separate from form visibility lifecycle
- Docker support
- Docker Compose for development and production
- Single `.env` strategy for CMS and backend
- Optional Redis cache
- Makefile for easy setup and common workflows


ANSWERED QUESTIONS:

 Auth & Roles
  1. Which OAuth2 provider(s) for MVP? (Google, Microsoft, custom OIDC?) custom oidc, just set it to be configurable later
  2. Session-based, token-based, or both? the most secure way
  3. What user roles in CMS? (admin, editor, viewer?) yes, add the appropriate permissions. Editors and viewers can be granular and hierarchical

  Tenant Model
  4. Brand/Campaign globally managed or tenant-scoped per account? globally managed

  Form/Revision Lifecycle
  5. Can published form exist with zero published revisions? No, create revisions on save, wordpress style like draft and published, better to isolate environments, development, staging and production.
  6. Multiple drafts per form? Yes, per environment as well.
  7. Revision archived independently of form? no, form only
  8. Scheduled publishing needed in MVP? Yes, also scheduled unpublish
  9. Side-by-side revision preview or single selection?side by side

  Builder
  10. What node types in MVP? (text input, select, checkbox, etc.) yes, include all at the moment, also date inputs with ranges, etc. select options can have an auto complete and fetch data via external api, we need a mechanism to customize methods, payload and parameters. Also file and image upload with customizable file extensions and size. Single and multiupload.
  11. Loops allowed in graph or DAG only? I dont understand.
  12. What validations in MVP? (required, regex, length?) required, for checkboxes minumum and maximum options, length, regex, email, etc. Customizable i18n labels, and errors per validation type.

  API & Events
  13. REST or GraphQL for form JSON retrieval? REST
  14. Specific browser events to emit? (submit, change, error?) everything. Also add css classes to elements in order to identify statuses.
  15. How much client-side scripting power? (read-only, read/write, read/write/submit?) read/write/submit

  Submission
  16. Form submission handling in MVP or just rendering/preview? Yes, include it, include honeypots and in the preview a modal (not browser) should shown the data to send as json.

  Observability
  17. Analytics, telemetry, audit logs, change history in MVP? Yes, all of that adblock friendly so name it insights or similar. We also want time in page for bot mitigation. Add ip, fingerprint, view count, page views, date filters, 1d, 7d, 1 month, year, custom. Each form can also include a GTM or GTAG4 for events.

  Domain/Keys
  18. Allowlisting per form, campaign, brand, or environment? Per form, per environment.
  19. Wildcard domains? Localhost/staging? yes
  20. Key type: public embed key, signed token, API key, or short-lived? Whatever is easier but includes a good security.
  21. Multiple active keys per form? Yes
  22. Key rotation without downtime?, sure
  23. Failed validation behavior: silent, error event, fallback message, or telemetry? Customizable error messages even with i18n. customizable in cms.
  24. Log/rate-limit failed validation? sure.

  Infra
  25. Separate containers for CMS and backend? no, one this to prevent cors.
  26. MySQL in Compose stack? yes, but optional
  27. Redis in both dev and prod Compose? yes, configurable cache times in cms, no cache as default in dev. Mechanism to clear cache.
  28. Makefile wraps Docker Compose? yes.
  29. .env strategy: shared file with prefix convention, or separate files? separate files.

  Docs
  30. Docs/kitchensink in MVP or phase 2? MVP.


  Got it. Rewriting the blocking questions in English.                                                                                                                                        
                                                                                                                                                                                                
  Section 1: Remaining Blocking Questions                                                                                                                                                       
                                                                                                                                                                                                
  1. Graph cycles vs DAG — Can form flows loop back to previous nodes (e.g., "if answer is No, go back to step 3")? Or must flow always move forward (directed acyclic graph)? This             
  fundamentally changes the flow engine design.                                                                                                                       
  Assume DAG                          
                                                                                                                                                                                                
  2. Environment promotion — How do revisions move from dev → staging → production? Manual copy? Promote button? Automated on schedule?     
  Manual promote button. Scheduled as option but not by default.                                                    
   
  3. Submission storage — Where do form submissions go? MySQL? External webhook? Both?              
  Can be a json export or in mysql. Default mysql.                                                                                            
                                                                  
  4. File/image upload storage — Local disk? S3-compatible? Configurable?     Configurable, inheritable.                                                                                                                  
                                                                  
  5. i18n scope in MVP — Which languages? Or just i18n infrastructure with English default?               English by default, i18n infrastructure.                                                                                      
                                                                  
  6. Theming / custom CSS — Part of MVP scope? Per-form custom branding?           
  Allow different skins such as light mode, dark mode, rounded buttons, configurable colors, etc.                                                                                                             
                                                                  
  7. Single container architecture — One container serves both Vue build output (static) and PHP API? e.g., Nginx + PHP-FPM where Vue is served as static and /api routes to PHP? Yes,single container, prevent cors issues