# Run only the fast smoke tests (< 1 minute)
# For full suite: pytest

$ErrorActionPreference = "Stop"

if (Test-Path ".\venv\Scripts\Activate.ps1") {
    . .\venv\Scripts\Activate.ps1
}

$env:PYTHONPATH = "."

Write-Host "🧪 Running smoke tests only (fast)..." -ForegroundColor Cyan
pytest -m smoke -v
