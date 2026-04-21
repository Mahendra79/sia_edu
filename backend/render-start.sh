#!/usr/bin/env bash
set -euo pipefail

python manage.py migrate --noinput

if [ "${RUN_SEED_COURSES:-false}" = "true" ]; then
  python manage.py seed_courses
fi

python manage.py collectstatic --noinput
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
