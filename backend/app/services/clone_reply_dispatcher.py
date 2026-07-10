from __future__ import annotations

import asyncio
import logging

from app.config import settings


logger = logging.getLogger(__name__)
_local_tasks: set[asyncio.Task] = set()


def dispatch_clone_reply_job(job_id: str) -> None:
    """Dispatch without blocking the WebSocket receive loop."""
    if settings.is_development or settings.is_testing:
        from app.core.tasks import _run_clone_reply_job

        task = asyncio.create_task(_run_clone_reply_job(job_id, celery_self=None))
        _local_tasks.add(task)
        task.add_done_callback(_local_task_done)
        return

    from app.core.tasks import clone_reply_task

    clone_reply_task.delay(job_id)


def _local_task_done(task: asyncio.Task) -> None:
    _local_tasks.discard(task)
    if task.cancelled():
        return
    exception = task.exception()
    if exception is not None:
        logger.exception(
            "Local clone reply job failed",
            exc_info=(type(exception), exception, exception.__traceback__),
        )


async def shutdown_local_clone_reply_tasks() -> None:
    tasks = list(_local_tasks)
    for task in tasks:
        task.cancel()
    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
    _local_tasks.clear()
