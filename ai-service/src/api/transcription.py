"""
Transcription API endpoints
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, Any
from pathlib import Path
import uuid
from loguru import logger

from config import settings
from tasks.transcription_tasks import transcribe_youtube_task, transcribe_file_task
from services.youtube_downloader import YouTubeDownloader

router = APIRouter()


class YouTubeTranscriptionRequest(BaseModel):
    url: HttpUrl
    job_id: str
    transcription_id: str
    user_id: str
    instrument: str = 'guitar'
    difficulty: str = 'INTERMEDIATE'
    style: Optional[str] = None


class TranscriptionResponse(BaseModel):
    job_id: str
    task_id: str
    status: str
    message: str


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str
    result: Optional[Dict[str, Any]] = None


@router.post("/youtube", response_model=TranscriptionResponse)
async def transcribe_youtube(request: YouTubeTranscriptionRequest):
    """
    Start YouTube video transcription
    """
    try:
        # Validate YouTube URL
        youtube_service = YouTubeDownloader()
        if not youtube_service.validate_url(str(request.url)):
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
        # Start Celery task
        task = transcribe_youtube_task.delay(
            job_id=request.job_id,
            transcription_id=request.transcription_id,
            url=str(request.url),
            user_id=request.user_id,
            instrument=request.instrument,
            difficulty=request.difficulty,
            style=request.style
        )
        
        logger.info(f"Started YouTube transcription task: {task.id}")
        
        return TranscriptionResponse(
            job_id=request.job_id,
            task_id=task.id,
            status="QUEUED",
            message="Transcription job started successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to start YouTube transcription: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload", response_model=TranscriptionResponse)
async def transcribe_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    job_id: str = Form(...),
    transcription_id: str = Form(...),
    user_id: str = Form(...),
    instrument: str = Form('guitar'),
    difficulty: str = Form('INTERMEDIATE'),
    style: Optional[str] = Form(None)
):
    """
    Transcribe uploaded audio file
    """
    try:
        # Validate file type
        allowed_extensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac']
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Check file size
        if file.size > settings.max_file_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {settings.max_file_size / 1024 / 1024}MB"
            )
        
        # Save uploaded file
        upload_path = settings.upload_dir / f"{job_id}{file_ext}"
        upload_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(upload_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        logger.info(f"Saved uploaded file: {upload_path}")
        
        # Start Celery task
        task = transcribe_file_task.delay(
            job_id=job_id,
            transcription_id=transcription_id,
            file_path=str(upload_path),
            user_id=user_id,
            instrument=instrument,
            difficulty=difficulty,
            style=style
        )
        
        logger.info(f"Started file transcription task: {task.id}")
        
        # Clean up file after processing
        def cleanup():
            try:
                upload_path.unlink()
                logger.info(f"Cleaned up uploaded file: {upload_path}")
            except Exception as e:
                logger.error(f"Failed to clean up file: {e}")
        
        background_tasks.add_task(cleanup)
        
        return TranscriptionResponse(
            job_id=job_id,
            task_id=task.id,
            status="QUEUED",
            message="File transcription job started successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to start file transcription: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/job/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """
    Get transcription job status
    """
    try:
        from tasks.celery_app import celery_app
        
        # Find task by job_id (would need to store task_id mapping in production)
        # For now, we'll check active tasks
        i = celery_app.control.inspect()
        active_tasks = i.active()
        
        if active_tasks:
            for worker, tasks in active_tasks.items():
                for task in tasks:
                    if task.get('kwargs', {}).get('job_id') == job_id:
                        return JobStatusResponse(
                            job_id=job_id,
                            status="PROCESSING",
                            progress=50,  # Would get from task meta in production
                            message="Transcription in progress"
                        )
        
        # Check completed tasks (would query database in production)
        return JobStatusResponse(
            job_id=job_id,
            status="UNKNOWN",
            progress=0,
            message="Job status unknown"
        )
        
    except Exception as e:
        logger.error(f"Failed to get job status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/job/{job_id}")
async def cancel_job(job_id: str):
    """
    Cancel transcription job
    """
    try:
        from tasks.celery_app import celery_app
        
        # Find and revoke task (would need task_id mapping in production)
        i = celery_app.control.inspect()
        active_tasks = i.active()
        
        if active_tasks:
            for worker, tasks in active_tasks.items():
                for task in tasks:
                    if task.get('kwargs', {}).get('job_id') == job_id:
                        celery_app.control.revoke(task['id'], terminate=True)
                        logger.info(f"Cancelled job: {job_id}")
                        return {"message": "Job cancelled successfully"}
        
        raise HTTPException(status_code=404, detail="Job not found")
        
    except Exception as e:
        logger.error(f"Failed to cancel job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/progress")
async def update_progress(
    job_id: str,
    progress: int,
    status: str,
    message: Optional[str] = None
):
    """
    Webhook endpoint for progress updates (called by Celery tasks)
    """
    try:
        # In production, this would update the database and notify clients via WebSocket
        logger.info(f"Progress update for job {job_id}: {progress}% - {status}")
        
        # TODO: Send WebSocket notification to connected clients
        # TODO: Update database with progress
        
        return {"success": True}
        
    except Exception as e:
        logger.error(f"Failed to update progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/complete")
async def transcription_complete(
    job_id: str,
    result: Dict[str, Any]
):
    """
    Webhook endpoint for transcription completion
    """
    try:
        logger.info(f"Transcription completed for job {job_id}")
        
        # TODO: Update database with results
        # TODO: Send WebSocket notification to clients
        # TODO: Trigger any post-processing tasks
        
        return {"success": True}
        
    except Exception as e:
        logger.error(f"Failed to handle completion: {e}")
        raise HTTPException(status_code=500, detail=str(e))