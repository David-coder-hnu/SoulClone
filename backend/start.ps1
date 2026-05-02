# SoulClone Backend — One-click dev start (Windows)
# No Docker. No PostgreSQL. No Redis server. No Alembic. Just Python.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🚀 Starting SoulClone backend (dev mode)..." -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────" -ForegroundColor DarkGray

# Activate venv
if (Test-Path ".\venv\Scripts\Activate.ps1") {
    . .\venv\Scripts\Activate.ps1
} else {
    Write-Host "❌ venv not found. Run: python -m venv venv" -ForegroundColor Red
    Write-Host "   Then: .\venv\Scripts\pip install -r requirements.txt" -ForegroundColor Red
    exit 1
}

# Dev environment flags
$env:ENVIRONMENT = "development"
$env:PYTHONPATH = "."

Write-Host "✅ SQLite:      .\soulclone_dev.db" -ForegroundColor Green
Write-Host "✅ Redis:       fakeredis (in-memory)" -ForegroundColor Green
Write-Host "✅ Tables:      auto-created on startup" -ForegroundColor Green
Write-Host "⚠️  Alembic:    NOT needed in dev" -ForegroundColor Yellow
Write-Host "⚠️  Celery:     NOT needed in dev (distillery runs inline)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📡 API:    http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "📖 Docs:   http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host ""

# Start uvicorn with hot reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir app
