import asyncio
from app.core.tasks import _run_distillation

job_id = "0787f98c-c485-4502-82c2-441312a226b9"

async def run():
    print(f"Starting distillation for job {job_id}...")
    try:
        await _run_distillation(job_id, celery_self=None)
        print("Done.")
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

asyncio.run(run())
