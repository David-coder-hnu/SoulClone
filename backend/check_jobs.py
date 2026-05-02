import asyncio
from app.db.session import async_session
from sqlalchemy import select
from app.models.distillation_job import DistillationJob

async def check():
    async with async_session() as db:
        result = await db.execute(
            select(DistillationJob).order_by(DistillationJob.created_at.desc()).limit(3)
        )
        jobs = result.scalars().all()
        for j in jobs:
            print(f"{j.id} | status={j.status} | {j.progress_percent}% | step={j.current_step} | error={j.error_message}")

asyncio.run(check())
