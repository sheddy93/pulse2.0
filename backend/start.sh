#!/bin/bash
set -e

echo "=========================================="
echo "PulseHR Backend Startup"
echo "=========================================="
echo "PORT=$PORT"
echo "PYTHONUNBUFFERED=$PYTHONUNBUFFERED"
echo "=========================================="

cd /app

echo "Current directory: $(pwd)"
echo "Files in /app:"
ls -la /app

echo ""
echo "Checking Python environment..."
python --version
which gunicorn

echo ""
echo "Starting gunicorn..."
exec gunicorn backend.wsgi:application \
    --bind "0.0.0.0:${PORT:-8080}" \
    --workers 4 \
    --threads 2 \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --timeout 120
