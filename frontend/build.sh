#!/bin/bash
set -e

echo "Moving to backend directory..."
cd backend

echo "Installing dependencies..."
pip install -r ../requirements.txt

# Only run migrations if database is configured
if [ -n "$POSTGRES_DB" ] && [ "$POSTGRES_DB" != "pulsehr" ] && [ "$POSTGRES_DB" != "your-db-name" ]; then
    echo "Running migrations..."
    python manage.py migrate --noinput || true
else
    echo "Skipping migrations (database not configured yet)"
fi

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

echo "Build complete!"