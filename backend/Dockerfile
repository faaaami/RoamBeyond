# syntax=docker/dockerfile:1.7
#
# Production image. Build from backend/:
#   docker build -t roambeyond-api .
#
# Stage 1 installs dependencies into a virtualenv, stage 2 copies only that
# virtualenv and the source, and runs as an unprivileged user.

FROM python:3.13-slim AS builder

ENV PIP_DISABLE_PIP_VERSION_CHECK=1 PIP_NO_CACHE_DIR=1
WORKDIR /app

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY pyproject.toml ./
RUN pip install --upgrade pip && pip install --group prod


FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    DJANGO_SETTINGS_MODULE=config.settings.production

RUN groupadd --system app && useradd --system --gid app --home-dir /app app
WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --chown=app:app . .

# collectstatic needs importable settings but no real secrets; it never connects
# to the database, so a placeholder URL is enough.
RUN DJANGO_SECRET_KEY=build-only-placeholder-key-0123456789abcdef DJANGO_ALLOWED_HOSTS=build \
    DATABASE_URL=postgres://build:build@localhost:5432/build RESEND_API_KEY=build \
    CACHE_URL=redis://build:6379/0 TRUST_PROXY_HEADERS=false \
    CORS_ALLOWED_ORIGINS=https://build.example \
    python manage.py collectstatic --no-input \
    && mkdir -p media && chown -R app:app staticfiles media

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health/')" || exit 1

# Migrations run as a separate release step, not at container start:
#   docker run --rm <image> python manage.py migrate
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", "--workers", "3", "--timeout", "60", \
     "--access-logfile", "-", "--error-logfile", "-"]
