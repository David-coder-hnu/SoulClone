# SoulClone Celery Worker — ONLY needed if you want the worker separate.
# In dev, distillery runs inline via BackgroundTasks. You probably don't need this.

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🐎 Starting Celery worker..." -ForegroundColor Cyan
Write-Host "────────────────────────────────────────────" -ForegroundColor DarkGray

if (Test-Path ".\venv\Scripts\Activate.ps1") {
    . .\venv\Scripts\Activate.ps1
} else {
    Write-Host "❌ venv not found" -ForegroundColor Red
    exit 1
}

$env:ENVIRONMENT = "development"
$env:PYTHONPATH = "."

Write-Host "✅ Worker restarts every 50 tasks (memory leak protection)" -ForegroundColor Green
Write-Host "✅ Log level: WARNING (no spam)" -ForegroundColor Green
Write-Host "⚠️  Pool: solo (single-threaded, dev-safe)" -ForegroundColor Yellow
Write-Host ""

# -P solo = single process/thread; safe with fakeredis and easier debugging
# --max-tasks-per-child = restart worker periodically to shed memory
# --loglevel WARNING = hide INFO noise
celery -A celery_worker worker --loglevel=WARNING --max-tasks-per-child=50 -P solo
