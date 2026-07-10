PYTHON ?= backend/.venv/bin/python
PIP ?= backend/.venv/bin/pip
NPM ?= npm

.PHONY: setup dev backend frontend test test-backend test-frontend lint migrate migrate-check

setup:
	python3.12 -m venv backend/.venv
	$(PIP) install -r backend/requirements.txt
	cd frontend && $(NPM) ci

dev:
	docker compose up --build

backend:
	cd backend && .venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && $(NPM) run dev -- --host

test: test-backend test-frontend

test-backend:
	cd backend && .venv/bin/python -m pytest

test-frontend:
	cd frontend && $(NPM) run build

lint:
	cd backend && .venv/bin/ruff check .
	cd frontend && $(NPM) run lint

migrate:
	cd backend && .venv/bin/alembic upgrade head

migrate-check:
	cd backend && .venv/bin/alembic heads
