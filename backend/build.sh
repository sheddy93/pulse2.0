#!/bin/bash
set -e

echo "===== PulseHR Deploy Script ====="
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running migrations..."
python manage.py migrate --noinput || echo "Migrations skipped (DB not configured)"

echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Static files collection skipped"

echo "===== Deploy complete ====="