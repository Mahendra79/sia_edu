#!/usr/bin/env bash
set -euo pipefail

python manage.py migrate --noinput

if [ "${RUN_SEED_COURSES:-false}" = "true" ]; then
  python manage.py seed_courses
fi

python manage.py collectstatic --noinput

# gthread workers: each worker process serves GUNICORN_THREADS requests at once, so one
# slow request (PDF download, LLM call, cold DB) no longer blocks every other user.
# Defaults fit a 512 MB instance; raise WEB_CONCURRENCY on bigger plans
# (roughly 1 worker per 256 MB of RAM when CHATBOT_LOCAL_EMBEDDINGS is off).
exec gunicorn config.wsgi:application \
  --bind 0.0.0.0:${PORT:-8000} \
  --worker-class gthread \
  --workers ${WEB_CONCURRENCY:-2} \
  --threads ${GUNICORN_THREADS:-4} \
  --timeout ${GUNICORN_TIMEOUT:-120} \
  --keep-alive 5 \
  --max-requests 1000 \
  --max-requests-jitter 100
