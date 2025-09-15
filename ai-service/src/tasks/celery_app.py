"""
Celery application configuration
"""
from celery import Celery
from config import settings

# Create Celery app
celery_app = Celery(
    'genesis_music_ai',
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=['tasks.transcription_tasks']
)

# Configure Celery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1 hour
    task_soft_time_limit=3300,  # 55 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
    result_expires=86400,  # 24 hours
)