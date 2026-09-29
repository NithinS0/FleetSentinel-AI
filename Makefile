# ─────────────────────────────────────────────────────────────────
# FleetSentinel AI — Makefile
# One-command setup for local development
# ─────────────────────────────────────────────────────────────────

.PHONY: help setup up down logs train-models test frontend seed

help:
	@echo "FleetSentinel AI — Available Commands"
	@echo "────────────────────────────────────────"
	@echo "  make setup        Copy .env.example → .env"
	@echo "  make up           Start all services"
	@echo "  make down         Stop all services"
	@echo "  make logs         Follow all logs"
	@echo "  make train-models Train ML models"
	@echo "  make test         Run unit tests"
	@echo "  make frontend     Start frontend dev server"
	@echo "  make seed         Seed 100K vehicles into DB"

setup:
	@if not exist .env copy .env.example .env
	@echo "✓ .env created — update GEMINI_API_KEY before running"

up: setup
	docker compose up -d --build
	@echo "✓ Services starting..."
	@echo "  Dashboard: http://localhost:3000"
	@echo "  API docs:  http://localhost:8000/docs"
	@echo "  Kafka UI:  http://localhost:8090"
	@echo "  Grafana:   http://localhost:3001"

down:
	docker compose down

logs:
	docker compose logs -f

train-models:
	docker compose run --rm prediction-service python -m ml.trainer
	@echo "✓ Models trained and saved"

test:
	docker compose run --rm api-gateway python -m pytest tests/ -v --tb=short

frontend:
	cd frontend && npm install && npm run dev

seed:
	docker compose run --rm api-gateway python database/seeds/seed_vehicles.py
	@echo "✓ 100K vehicles seeded"

restart-%:
	docker compose restart $*

shell-%:
	docker compose exec $* /bin/bash
