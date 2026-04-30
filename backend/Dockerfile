# ============================================================
# PulseHR Backend - Production Dockerfile
# ============================================================

FROM python:3.12-slim

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8080

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy project
COPY . .

# Make startup script executable
RUN chmod +x /app/start.sh

EXPOSE ${PORT:-8080}

# Debug: echo to confirm CMD is running, then start gunicorn
CMD /bin/sh -c "echo '=== CMD STARTED ===' && python manage.py migrate --noinput; python manage.py collectstatic --noinput; python -m gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --log-file - --access-logfile - --error-logfile - --capture-output --timeout 120"
