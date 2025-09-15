"""
Transcription API endpoints
"""

import os
import uuid
import shutil
from pathlib import Path
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, File, UploadFile, HTTPException, Form, BackgroundTasks, status
from fastapi.responses import FileResponse
import aiofiles

from services.basic_pitch_service import BasicPitchService
from models.schemas import TranscriptionRequest, TranscriptionResponse, JobStatus
from core.config import settings
from core.redis_client import redis_client

router = APIRouter()

# Initialize service
transcription_service = BasicPitchService()

# Create upload directory if it doesn't exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.TEMP_DIR).mkdir(parents=True, exist_ok=True)

@router.post("/upload", response_model=TranscriptionResponse)
async def transcribe_upload(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    onset_threshold: Optional[float] = Form(None),
    frame_threshold: Optional[float] = Form(None),
    minimum_note_length: Optional[float] = Form(None),
    midi_tempo: Optional[float] = Form(None)
):
    """
    Upload an audio file for transcription
    """
    
    # Validate file type
    file_extension = Path(file.filename).suffix.lower()[1:]
    if file_extension not in settings.ALLOWED_AUDIO_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file format. Allowed formats: {', '.join(settings.ALLOWED_AUDIO_FORMATS)}"
        )
    
    # Validate file size
    if file.size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / 1024**2:.1f} MB"
        )
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    temp_path = Path(settings.TEMP_DIR) / f"{file_id}.{file_extension}"
    
    try:
        # Save uploaded file
        async with aiofiles.open(temp_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Create job ID
        job_id = f"job_{file_id}"
        
        # Store job status in Redis
        await redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": JobStatus.PROCESSING,
                "created_at": datetime.utcnow().isoformat(),
                "filename": file.filename,
                "progress": 0
            }
        )
        await redis_client.expire(f"job:{job_id}", 3600)  # Expire after 1 hour
        
        # Process transcription
        result = await transcription_service.transcribe_audio(
            str(temp_path),
            onset_threshold=onset_threshold,
            frame_threshold=frame_threshold,
            minimum_note_length=minimum_note_length,
            midi_tempo=midi_tempo
        )
        
        if result["success"]:
            # Save MIDI file
            if "midi_data" in result:
                midi_path = Path(settings.UPLOAD_DIR) / f"{file_id}.mid"
                with open(midi_path, 'wb') as f:
                    f.write(result["midi_data"])
                result["midi_url"] = f"/api/v1/transcribe/download/{file_id}.mid"
            
            # Update job status
            await redis_client.hset(
                f"job:{job_id}",
                mapping={
                    "status": JobStatus.COMPLETED,
                    "completed_at": datetime.utcnow().isoformat(),
                    "progress": 100,
                    "result": str(result.get("statistics", {}))
                }
            )
            
            # Clean up in background
            background_tasks.add_task(cleanup_temp_file, temp_path)
            
            return TranscriptionResponse(
                job_id=job_id,
                status=JobStatus.COMPLETED,
                result=result,
                message="Transcription completed successfully"
            )
        else:
            # Update job status
            await redis_client.hset(
                f"job:{job_id}",
                mapping={
                    "status": JobStatus.FAILED,
                    "error": result.get("error", "Unknown error"),
                    "failed_at": datetime.utcnow().isoformat()
                }
            )
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Transcription failed")
            )
            
    except Exception as e:
        # Clean up on error
        if temp_path.exists():
            temp_path.unlink()
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """
    Get the status of a transcription job
    """
    job_data = await redis_client.hgetall(f"job:{job_id}")
    
    if not job_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    return {
        "job_id": job_id,
        "status": job_data.get("status"),
        "progress": int(job_data.get("progress", 0)),
        "created_at": job_data.get("created_at"),
        "completed_at": job_data.get("completed_at"),
        "error": job_data.get("error")
    }

@router.get("/download/{file_id}")
async def download_file(file_id: str):
    """
    Download a transcribed MIDI file
    """
    # Check for MIDI file
    midi_path = Path(settings.UPLOAD_DIR) / file_id
    
    if not midi_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(
        path=str(midi_path),
        media_type="audio/midi",
        filename=file_id
    )

@router.post("/url")
async def transcribe_from_url(request: TranscriptionRequest):
    """
    Transcribe audio from a URL (YouTube or direct audio URL)
    """
    try:
        # Check if it's a YouTube URL
        if "youtube.com" in request.url or "youtu.be" in request.url:
            # Process YouTube URL
            from services.youtube_service import YouTubeService
            yt_service = YouTubeService()
            audio_path = await yt_service.download_audio(request.url)
        else:
            # Download audio from direct URL
            import httpx
            
            file_id = str(uuid.uuid4())
            audio_path = Path(settings.TEMP_DIR) / f"{file_id}.mp3"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(request.url)
                response.raise_for_status()
                
                with open(audio_path, 'wb') as f:
                    f.write(response.content)
        
        # Transcribe the audio
        result = await transcription_service.transcribe_audio(
            str(audio_path),
            onset_threshold=request.onset_threshold,
            frame_threshold=request.frame_threshold,
            minimum_note_length=request.minimum_note_length,
            midi_tempo=request.midi_tempo
        )
        
        # Clean up
        if audio_path.exists():
            audio_path.unlink()
        
        return TranscriptionResponse(
            job_id=f"url_{uuid.uuid4()}",
            status=JobStatus.COMPLETED if result["success"] else JobStatus.FAILED,
            result=result,
            message="URL transcription completed"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

async def cleanup_temp_file(file_path: Path):
    """Clean up temporary files"""
    try:
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass  # Ignore cleanup errors