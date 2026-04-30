.PHONY: up down logs logs-backend logs-frontend migrate shell superuser test build clean

# Docker Compose commands
up:
	docker-compose up -d

down:
	docker-compose down

build:
	docker-compose build --no-cache

restart:
	docker-compose restart

# Logs
logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f db

# Database
migrate:
	docker-compose exec backend python manage.py migrate

migrate-make:
	docker-compose exec backend python manage.py makemigrations

# Shell access
shell:
	docker-compose exec backend /bin/sh

shell-db:
	docker-compose exec db psql -U pulsehr -d pulsehr

# Superuser
superuser:
	docker-compose exec backend python manage.py createsuperuser

# Tests
test:
	docker-compose exec backend python manage.py test

test-coverage:
	docker-compose exec backend python manage.py test --verbosity=2

# Development helpers
seed:
	docker-compose exec backend python manage.py seed_demo

collectstatic:
	docker-compose exec backend python manage.py collectstatic --noinput

# Maintenance
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Status
ps:
	docker-compose ps

# Rebuild without cache
rebuild:
	docker-compose build --no-cache

# Enter backend container
backend-bash:
	docker-compose exec backend /bin/bash

# Database backup
db-backup:
	mkdir -p backups
	docker-compose exec db pg_dump -U pulsehr pulsehr > backups/pulsehr_$$(date +%Y%m%d_%H%M%S).sql

# Database restore
db-restore:
	@echo "Usage: make db-restore FILE=backups/pulsehr_20240101_120000.sql"
	docker-compose exec -T db psql -U pulsehr -d pulsehr < $(FILE)