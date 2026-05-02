from celery import Celery
from app.config import settings

celery_app = Celery(
    "soulclone",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.core.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,
)

# ── Development comfort settings ────────────────────────────────────────────
# These ONLY apply when ENVIRONMENT=development. They reduce noise and
# prevent the worker from becoming a maintenance burden for a solo dev.
# ────────────────────────────────────────────────────────────────────────────
if settings.is_development:
    celery_app.conf.update(
        worker_log_level="WARNING",      # Hide INFO spam
        worker_max_tasks_per_child=50,   # Restart worker every 50 tasks (memory leak guard)
        worker_prefetch_multiplier=1,    # Easier debugging
        task_always_eager=False,         # Keep async; set True if you truly hate workers
    )

