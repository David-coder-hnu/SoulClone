from celery_worker import celery_app


@celery_app.task
def run_clone_cycle():
    """Periodic task to evaluate and execute clone actions"""
    pass


@celery_app.task
def distill_user_task(user_id: str, questionnaire: dict, chat_samples: list, social_import: str | None):
    """Background task for AI distillation"""
    pass
