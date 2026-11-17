# Developer shortcuts. Every target assumes the virtualenv at .venv (see README).
PY := .venv/bin/python
PIP := .venv/bin/pip

.PHONY: install run migrate makemigrations test lint fmt typecheck check superuser

install:
	python3 -m venv .venv
	$(PIP) install --upgrade pip
	$(PIP) install --group dev

run:
	$(PY) manage.py runserver

migrate:
	$(PY) manage.py migrate

makemigrations:
	$(PY) manage.py makemigrations

superuser:
	$(PY) manage.py createsuperuser

test:
	.venv/bin/pytest

lint:
	.venv/bin/ruff check .
	.venv/bin/ruff format --check .

fmt:
	.venv/bin/ruff check --fix .
	.venv/bin/ruff format .

typecheck:
	.venv/bin/mypy .

# What CI should run before a deploy.
check: lint test
	DJANGO_SETTINGS_MODULE=config.settings.production \
	DJANGO_SECRET_KEY=deploy-check-only-not-a-real-secret-0123456789abcdefghijkl DJANGO_ALLOWED_HOSTS=example.com \
	DATABASE_URL=postgres://check:check@localhost:5432/check \
	RESEND_API_KEY=check-only TRUST_PROXY_HEADERS=true CACHE_URL=redis://localhost:6379/0 \
	$(PY) manage.py check --deploy
