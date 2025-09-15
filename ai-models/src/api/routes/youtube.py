"""
YouTube-specific API endpoints
"""

import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from fastapi.responses import JSONResponse

from services.youtube_service import YouTubeService
from services.basic_pitch_service import BasicPitchService
from models.schemas import (
    YouTubeDownloadRequest,
    YouTubeInfo,
    TranscriptionResponse,
    JobStatus
)
from core.config import settings
from core.redis_client import redis_client

router = APIRouter()

# Initialize services
youtube_service = YouTubeService()
transcription_service = BasicPitchService()

@router.post("/info")
async def get_youtube_info(url: str):
    """
    Get information about a YouTube video
    
    Args:
        url: YouTube video URL
        
    Returns:
        Video metadata including title, duration, uploader, etc.
    """
    try:
        # Validate URL
        if not await youtube_service.validate_url(url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid YouTube URL"
            )
        
        # Get video info
        info = await youtube_service.get_video_info(url)
        
        return JSONResponse(
            content={
                "success": True,
                "data": info
            }
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get video info: {str(e)}"
        )

@router.post("/download")
async def download_youtube_audio(
    request: YouTubeDownloadRequest,
    background_tasks: BackgroundTasks
):
    """
    Download audio from YouTube video
    
    Args:
        request: Download request with URL and format options
        
    Returns:
        Job ID for tracking download progress
    """
    try:
        # Validate URL
        if not await youtube_service.validate_url(request.url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid YouTube URL"
            )
        
        # Create job ID
        job_id = f"yt_{uuid.uuid4()}"
        
        # Store initial job status
        await redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": JobStatus.PROCESSING,
                "type": "youtube_download",
                "url": request.url,
                "format": request.format or "mp3",
                "quality": request.quality or "best",
                "progress": 0
            }
        )
        await redis_client.expire(f"job:{job_id}", 3600)
        
        # Start download in background
        background_tasks.add_task(
            process_youtube_download,
            job_id,
            request.url,
            request.format or "mp3",
            request.quality or "best"
        )
        
        return JSONResponse(
            content={
                "success": True,
                "job_id": job_id,
                "message": "Download started",
                "status": JobStatus.PROCESSING
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/transcribe")
async def transcribe_youtube_video(
    url: str,
    background_tasks: BackgroundTasks,
    onset_threshold: Optional[float] = None,
    frame_threshold: Optional[float] = None,
    minimum_note_length: Optional[float] = None,
    midi_tempo: Optional[float] = None
):
    """
    Download and transcribe audio from YouTube video
    
    Args:
        url: YouTube video URL
        onset_threshold: Threshold for note onset detection
        frame_threshold: Threshold for note frame detection
        minimum_note_length: Minimum note duration in ms
        midi_tempo: MIDI tempo in BPM
        
    Returns:
        Job ID for tracking transcription progress
    """
    try:
        # Validate URL
        if not await youtube_service.validate_url(url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid YouTube URL"
            )
        
        # Get video info
        video_info = await youtube_service.get_video_info(url)
        
        # Check video duration
        if video_info['duration'] > settings.MAX_AUDIO_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Video too long. Maximum duration: {settings.MAX_AUDIO_LENGTH} seconds"
            )
        
        # Create job ID
        job_id = f"yt_transcribe_{uuid.uuid4()}"
        
        # Store initial job status
        await redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": JobStatus.PROCESSING,
                "type": "youtube_transcription",
                "url": url,
                "title": video_info['title'],
                "duration": video_info['duration'],
                "progress": 0
            }
        )
        await redis_client.expire(f"job:{job_id}", 7200)  # 2 hours
        
        # Start transcription in background
        background_tasks.add_task(
            process_youtube_transcription,
            job_id,
            url,
            onset_threshold,
            frame_threshold,
            minimum_note_length,
            midi_tempo
        )
        
        return TranscriptionResponse(
            job_id=job_id,
            status=JobStatus.PROCESSING,
            message=f"Transcription started for: {video_info['title']}",
            result={
                "video_info": video_info
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/segment/transcribe")
async def transcribe_youtube_segment(
    url: str,
    start_time: float,
    end_time: float,
    background_tasks: BackgroundTasks,
    onset_threshold: Optional[float] = None,
    frame_threshold: Optional[float] = None,
    minimum_note_length: Optional[float] = None,
    midi_tempo: Optional[float] = None
):
    """
    Transcribe a specific segment of a YouTube video
    
    Args:
        url: YouTube video URL
        start_time: Start time in seconds
        end_time: End time in seconds
        onset_threshold: Threshold for note onset detection
        frame_threshold: Threshold for note frame detection
        minimum_note_length: Minimum note duration in ms
        midi_tempo: MIDI tempo in BPM
        
    Returns:
        Job ID for tracking transcription progress
    """
    try:
        # Validate URL
        if not await youtube_service.validate_url(url):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid YouTube URL"
            )
        
        # Validate time range
        if start_time < 0 or end_time <= start_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid time range"
            )
        
        segment_duration = end_time - start_time
        if segment_duration > settings.MAX_AUDIO_LENGTH:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Segment too long. Maximum duration: {settings.MAX_AUDIO_LENGTH} seconds"
            )
        
        # Create job ID
        job_id = f"yt_segment_{uuid.uuid4()}"
        
        # Store initial job status
        await redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": JobStatus.PROCESSING,
                "type": "youtube_segment_transcription",
                "url": url,
                "start_time": start_time,
                "end_time": end_time,
                "progress": 0
            }
        )
        await redis_client.expire(f"job:{job_id}", 3600)
        
        # Start transcription in background
        background_tasks.add_task(
            process_youtube_segment_transcription,
            job_id,
            url,
            start_time,
            end_time,
            onset_threshold,
            frame_threshold,
            minimum_note_length,
            midi_tempo
        )
        
        return TranscriptionResponse(
            job_id=job_id,
            status=JobStatus.PROCESSING,
            message=f"Segment transcription started ({start_time}s - {end_time}s)"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

async def process_youtube_download(
    job_id: str,
    url: str,
    format: str,
    quality: str
):
    """
    Background task to download YouTube audio
    """
    try:
        # Update progress
        await redis_client.hset(f"job:{job_id}", "progress", 10)
        
        # Download audio
        audio_path = await youtube_service.download_audio(url, format, quality)
        
        # Update progress
        await redis_client.hset(f"job:{job_id}", "progress", 90)
        
        # Store result
        await redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": JobStatus.COMPLETED,
                "progress": 100,
                "audio_path": str(audio_path),
                "file_size": audio_path.stat().st_size
            }
        )
        
    except Exception as e:
        # Update error status
        await redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": JobStatus.FAILED,
                "error": str(e)
            }
        )

async def process_youtube_transcription(
    job_id: str,
    url: str,
    onset_threshold: Optional[float],
    frame_threshold: Optional[float],
    minimum_note_length: Optional[float],
    midi_tempo: Optional[float]
):
    """
    Background task to download and transcribe YouTube audio
    """
    try:
        # Update progress - downloading
        await redis_client.hset(f"job:{job_id}", "progress", 10)
        
        # Download audio
        audio_path = await youtube_service.download_audio(url)
        
        # Update progress - transcribing
        await redis_client.hset(f"job:{job_id}", "progress", 50)
        
        # Transcribe audio
        result = await transcription_service.transcribe_audio(
            str(audio_path),
            onset_threshold=onset_threshold,
            frame_threshold=frame_threshold,
            minimum_note_length=minimum_note_length,
            midi_tempo=midi_tempo
        )
        
        # Update progress - saving
        await redis_client.hset(f"job:{job_id}", "progress", 90)
        
        # Save MIDI if successful
        if result["success"] and "midi_data" in result:
            midi_path = Path(settings.UPLOAD_DIR) / f"{job_id}.mid"
            with open(midi_path, 'wb') as f:
                f.write(result["midi_data"])
            result["midi_url"] = f"/api/v1/transcribe/download/{job_id}.mid"
        
        # Update final status
        await redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": JobStatus.COMPLETED if result["success"] else JobStatus.FAILED,
                "progress": 100,
                "result": str(result)
            }
        )
        
        # Clean up audio file
        audio_path.unlink()
        
    except Exception as e:
        # Update error status
        await redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": JobStatus.FAILED,
                "error": str(e)
            }
        )

async def process_youtube_segment_transcription(
    job_id: str,
    url: str,
    start_time: float,
    end_time: float,
    onset_threshold: Optional[float],
    frame_threshold: Optional[float],
    minimum_note_length: Optional[float],
    midi_tempo: Optional[float]
):
    """
    Background task to transcribe a segment of YouTube video
    """
    try:
        # Update progress - downloading
        await redis_client.hset(f"job:{job_id}", "progress", 10)
        
        # Download full audio
        audio_path = await youtube_service.download_audio(url)
        
        # Update progress - extracting segment
        await redis_client.hset(f"job:{job_id}", "progress", 30)
        
        # Extract segment
        segment_path = await youtube_service.extract_audio_segment(
            audio_path,
            start_time,
            end_time
        )
        
        # Update progress - transcribing
        await redis_client.hset(f"job:{job_id}", "progress", 50)
        
        # Transcribe segment
        result = await transcription_service.transcribe_audio(
            str(segment_path),
            onset_threshold=onset_threshold,
            frame_threshold=frame_threshold,
            minimum_note_length=minimum_note_length,
            midi_tempo=midi_tempo
        )
        
        # Update progress - saving
        await redis_client.hset(f"job:{job_id}", "progress", 90)
        
        # Save MIDI if successful
        if result["success"] and "midi_data" in result:
            midi_path = Path(settings.UPLOAD_DIR) / f"{job_id}.mid"
            with open(midi_path, 'wb') as f:
                f.write(result["midi_data"])
            result["midi_url"] = f"/api/v1/transcribe/download/{job_id}.mid"
        
        # Update final status
        await redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": JobStatus.COMPLETED if result["success"] else JobStatus.FAILED,
                "progress": 100,
                "result": str(result),
                "segment_start": start_time,
                "segment_end": end_time
            }
        )
        
        # Clean up files
        audio_path.unlink()
        segment_path.unlink()
        
    except Exception as e:
        # Update error status
        await redis_client.hset(
            f"job:{job_id}",
            mapping={
                "status": JobStatus.FAILED,
                "error": str(e)
            }
        )