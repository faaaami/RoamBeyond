# Roam Beyond backend

Django API and admin for the travel agency website in the parent folder. It
owns everything the site shows and receives:

- **Content**: destinations, tour packages, reviews, photo credits, site
  settings and the wording of every page, edited in the admin panel and
  served to the website through a read-only API.
- **Enquiries**: the three website forms post here, the lead is stored, the
  agency is emailed, and the team works the leads in the admin.

**Stack:** Python 3.13+, Django 6.1, Django REST Framework, Postgres, Redis
(rate limiting), Resend via django-anymail, Pillow + django-storages (photos,
S3-compatible storage), drf-spectacular (OpenAPI), gunicorn + WhiteNoise,
pytest, ruff, mypy.

## Run it

PostgreSQL is the only supported database, in development and tests too. One-time
setup on macOS with Homebrew (or run `docker compose up db` instead):

```bash
brew install postgresql@17 && brew services start postgresql@17
/opt/homebrew/opt/postgresql@17/bin/psql -d postgres \
  -c "CREATE ROLE roambeyond LOGIN PASSWORD 'roambeyond' CREATEDB;"
/opt/homebrew/opt/postgresql@17/bin/createdb -O roambeyond roambeyond
```

`CREATEDB` lets pytest create its own `test_roambeyond` database. Then:

```bash
cd backend
make install                 # creates .venv and installs the dev dependency group
cp .env.example .env         # optional for local work; defaults are fine
make migrate
make superuser               # an administrator for the admin panel
make run                     # http://localhost:8000
```

The database starts empty. To copy the content from the old Sanity project
(one time; photos are downloaded into media storage):

```bash
.venv/bin/python manage.py import_sanity --project-id <sanity-project-id> [--dataset production]
```

It reads only published documents, runs in one transaction, and refuses to run
when the catalog already has content unless you pass `--replace`.

Without `DATABASE_URL`, development and tests use
`postgres://roambeyond:roambeyond@localhost:5432/roambeyond`; any non-Postgres
URL is refused at startup. Without `RESEND_API_KEY` enquiry emails are printed
to the terminal. For the full stack with Postgres and Redis in containers use
`docker compose up --build`.

| Command | What it does |
| --- | --- |
| `make run` | Development server |
| `make test` | pytest |
| `make lint` / `make fmt` | ruff check and format |
| `make typecheck` | mypy with django-stubs |
| `make check` | lint, tests and `manage.py check --deploy` against production settings. Run this in CI |

Useful URLs in development: `/health/`, `/api/docs/` (Swagger UI),
`/api/schema/` (OpenAPI).

## API

### Content (public, read-only)

The website reads these from its server and caches them; shapes match the
TypeScript types in `src/data/types.ts` and `src/lib/content.ts`. Lists are
small and returned whole. Only published rows appear. Empty text fields come
back as `""` and the site fills them with its default wording.

| Endpoint | Returns |
| --- | --- |
| `GET /api/v1/destinations/` | Destinations with `packageCount` |
| `GET /api/v1/packages/` | Package cards: the fields the listing and filters need |
| `GET /api/v1/packages/<slug>/` | One package with `itinerary` (numbered days), `quickFacts` and `gallery` (cover first); 404 if unknown |
| `GET /api/v1/reviews/` | Published reviews |
| `GET /api/v1/photo-credits/` | Credits for `/credits` |
| `GET /api/v1/site-settings/` | Contact details, budget ranges, cancellation terms |
| `GET /api/v1/pages/home/` | Home page text, how-it-works steps and scroll story scenes |
| `GET /api/v1/pages/about/`, `/pages/other/`, `/pages/privacy/`, `/pages/terms/` | The other pages' text |

Photo fields are absolute URLs. With local storage they are built from
`PUBLIC_MEDIA_BASE_URL`, or from the request host when that is empty.

### `POST /api/v1/enquiries/`

Public, JSON, rate limited to 5 submissions per 10 minutes per client IP.
The body is one of three shapes chosen by `kind`; field names and validation
messages match `src/lib/enquiry-schema.ts` on the frontend.

```jsonc
{ "kind": "callback", "name": "Asha Rao", "mobile": "98765 43210", "consent": true }

{ "kind": "package", "packageName": "...", "packageSlug": "...", "name": "...", "mobile": "...",
  "email": "", "travelDate": "2026-12-20", "tripType": "family", "adults": 2, "children": 1,
  "message": "", "consent": true }

{ "kind": "custom", "name": "...", "mobile": "...", "email": "", "departureCity": "Delhi",
  "destination": "Kerala", "travelDate": "", "duration": "", "budget": "", "tripType": "couple",
  "adults": 2, "children": 0, "message": "", "consent": true }
```

Responses:

| Status | Body |
| --- | --- |
| 201 | `{"ok": true, "reference": "<uuid>"}` |
| 400 | `{"error": "Please check the form and try again.", "fields": [{"path": "mobile", "message": "..."}]}` |
| 429 | `{"error": "Too many requests. ..."}` with a `Retry-After` header |

A filled `website` field (the honeypot) returns 200 and stores nothing. If the
notification email fails the lead is still saved with status *new*, the error
is recorded on the row, and the admin shows it as not emailed.

## Admin panel API

The admin panel (the `/admin` pages of the website app, http://localhost:3000/admin) talks to
`/api/admin/` only; this backend has no admin site of its own (Django's
`django.contrib.admin` is not installed). Every endpoint except sign-in needs a
staff JWT, and each model endpoint also checks that user's Django permissions.

| Area | Endpoints |
| --- | --- |
| Sign-in | `auth/login/`, `auth/refresh/` (rotates), `auth/logout/`, `auth/me/`, `auth/password/` |
| Dashboard | `stats/` (totals, enquiry figures, recent activity), `activity/` (change history), `options/` (form dropdowns) |
| Enquiries | `enquiries/` list, detail and PATCH, `DELETE`, `bulk/`, `export/` (CSV), `<ref>/resend-email/` |
| Catalog | `packages/` (+ `<id>/duplicate/`), `destinations/`, `reviews/`, `photo-credits/` |
| Website pages | `pages/site-settings/`, `pages/home/`, `pages/about/`, `pages/other/`, `legal-pages/` |
| Team | `users/` (administrators), `roles/` |

Lists take `q`, `ordering`, `page`, `pageSize` and each endpoint's filters.
Create and update accept JSON, or multipart with the JSON in a `data` field and
files under dotted paths (for example `photos.0.image`). Every create, edit and
delete is written to `ActivityLog`.

Roles are Django groups created by a migration: *Sales* (enquiries),
*Content editor* (catalog and page text) and *Manager* (both).

## Errors

Every API error has one shape (`apps/core/exceptions.py`):

```json
{"error": "Message safe to show", "code": "not_found", "requestId": "9f1c...", "fields": [...]}
```

`fields` appears only for validation errors, `retryAfter` only when throttled.
Unexpected exceptions are logged with their traceback and returned as a
generic 500 (503 when the database is unreachable), so internals never leak.
Unknown URLs under `/api/` answer in JSON too. Every response carries an
`X-Request-ID` header, the same ID is in every log line for that request, and
`requestId` in error bodies lets you find a visitor's error in the logs.

## Content editing

- **Singletons.** Site settings, the home, about and "other pages" text are one
  row each (`apps.core.models.SingletonModel`). Their admin list opens the edit
  form directly; they cannot be added or deleted.
- **Lists** such as highlights or cancellation terms are JSON lists edited one
  item per line (`apps.core.fields.StringListField`). Ordered children such as
  itinerary days, gallery photos and legal sections are inline rows with a
  `position`.
- **Layout maps.** `apps/pages/layout.py` maps each page's flat columns to the
  nested JSON the site expects. The API (`nest`) and the Sanity import
  (`flatten`) both use it, and a test checks every column exists.
- **Cache refresh.** Saving any content row queues one POST to the site's
  `/api/revalidate` route, sent after the transaction commits
  (`apps/core/revalidation.py`). Set `FRONTEND_REVALIDATE_URL` and
  `FRONTEND_REVALIDATE_SECRET` (the site's `REVALIDATE_SECRET`). Failures are
  logged and never block the save; the site also refreshes daily on its own.
- **Photos.** Uploaded with Django's `ImageField`. Without `MEDIA_BUCKET` they
  are stored under `MEDIA_ROOT` and served by Django at `/media/`
  (`SERVE_MEDIA`). In production set `MEDIA_BUCKET` and the `MEDIA_*`
  variables to use S3, Cloudflare R2 or any S3-compatible store: container
  disks are wiped on every deploy.

## Layout

```
backend/
├── config/                 # project: settings, URLs, WSGI/ASGI
│   ├── settings/           # base.py + development / production / test overrides
│   ├── urls.py             # /health/, /api/ (public), /api/admin/ (admin panel)
│   └── api_urls.py         # /api/v1/... (add v2 here when the contract changes)
├── apps/
│   ├── core/               # shared: base models, list fields, error handler, throttle,
│   │                       #   health view, media URLs, website cache refresh
│   ├── accounts/           # custom User model (defined before the first migration)
│   └── enquiries/          # the first domain app
│       ├── models.py       # Enquiry
│       ├── enums.py        # EnquiryKind, TripType, EnquiryStatus
│       ├── validators.py   # Indian mobile validation and normalisation
│       ├── serializers.py  # input validation per kind (API contract)
│       ├── services.py     # business logic: create_enquiry, mark_status
│       ├── notifications.py# agency email
│       ├── views.py        # thin: validate, call the service, respond
│       ├── admin.py        # lead workflow for the team
│       └── tests/
│   ├── catalog/            # destinations, packages (+ days, photos), reviews, photo credits
│   │   ├── models.py
│   │   ├── selectors.py    # what the website may see (published rows, ordering)
│   │   ├── serializers.py  # output shapes matching src/data/types.ts
│   │   ├── views.py        # read-only public endpoints
│   │   └── admin.py
│   └── pages/              # site settings and page text
│       ├── models.py       # singletons + inline rows (steps, scenes, facts, sections)
│       ├── layout.py       # column <-> nested JSON maps
│       ├── selectors.py    # builds each page's JSON
│       ├── admin.py
│       └── management/commands/import_sanity.py
├── Dockerfile              # production image (gunicorn, non-root)
├── compose.yaml            # local Postgres + Redis + API
└── pyproject.toml          # dependency groups, ruff, pytest, mypy
```

## Conventions

- **Views are thin.** They parse and validate input, call a function in
  `services.py`, and shape the response. Business rules live in services so
  admin actions, management commands and tests reuse them.
- **Serializers define the API contract.** They map camelCase JSON to model
  field names with `source=` and carry the visitor-facing error messages.
- **Errors have one shape**, produced by `apps.core.exceptions.exception_handler`.
- **Settings come from the environment** (`config/settings/base.py` lists
  every variable). Production refuses to start without a secret key, allowed
  hosts, a `DATABASE_URL` and a Resend key.
- **Public endpoints opt in** with `AllowAny`; the default permission is
  `IsAuthenticated`.
- Keep `make check` green: ruff, mypy, pytest and the deploy check.

## Deploying

1. Build the image from `backend/` and set the environment variables from
   `.env.example` (`DJANGO_SETTINGS_MODULE=config.settings.production`,
   `TRUST_PROXY_HEADERS=true` behind a load balancer).
2. Run `python manage.py migrate` as a release step.
3. Start the container (gunicorn on port 8000) and point the proxy's health
   check at `/health/`.
4. Configure photo storage: a bucket via `MEDIA_BUCKET` and the `MEDIA_*`
   variables (recommended), or a persistent volume at `MEDIA_ROOT`.
5. Add the site origin to `CORS_ALLOWED_ORIGINS`, set `FRONTEND_REVALIDATE_URL`
   (`https://<site>/api/revalidate`) and `FRONTEND_REVALIDATE_SECRET`, and build
   the Next.js site with `NEXT_PUBLIC_API_URL=https://<api-host>` (it is
   inlined at build time) and the same `REVALIDATE_SECRET`.
6. Create staff accounts for the editors (`python manage.py createsuperuser`,
   then limit permissions in the admin), and import or enter the content.

## Frontend integration

The three forms post from the browser straight to this API through
`src/lib/use-enquiry-submit.ts`; the base URL comes from `src/lib/api.ts`
(`NEXT_PUBLIC_API_URL`, default `http://localhost:8000` in development). Pages
read content on the server through `src/lib/content.ts`, which may use a
private `API_URL` instead. Sanity, the Studio and the Next.js email route are
gone; this backend is the only source of content and the only sender of email.

For local work run both servers: `make run` here and `npm run dev` in the
parent folder.

## Next steps

1. ~~Point the Next.js forms at this API.~~ Done.
2. ~~Catalog and page content, replacing Sanity.~~ Done.
3. Move email sending and the website cache refresh to a background task queue
   (Celery or django-tasks) once volume justifies it; `notify_agency` and
   `send_revalidation` are the calls to move.
4. Image processing on upload (resize very large photos, generate WebP) if
   storage or bandwidth becomes a concern.
5. ~~Staff API with token authentication.~~ Done: the admin panel API (`/api/admin/`).
