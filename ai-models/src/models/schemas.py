"""
Pydantic models for API request/response validation
"""

from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, HttpUrl
from enum import Enum
from datetime import datetime

class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TranscriptionRequest(BaseModel):
    """Request model for URL-based transcription"""
    url: str = Field(..., description="URL of the audio file or YouTube video")
    onset_threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Onset detection threshold")
    frame_threshold: Optional[float] = Field(None, ge=0.0, le=1.0, description="Frame detection threshold")
    minimum_note_length: Optional[float] = Field(None, ge=0.0, description="Minimum note length in ms")
    minimum_frequency: Optional[float] = Field(None, ge=20.0, le=20000.0, description="Minimum frequency in Hz")
    maximum_frequency: Optional[float] = Field(None, ge=20.0, le=20000.0, description="Maximum frequency in Hz")
    multiple_pitch_bends: Optional[bool] = Field(None, description="Detect multiple pitch bends")
    melodia_trick: Optional[bool] = Field(None, description="Use melodia post-processing")
    midi_tempo: Optional[float] = Field(None, ge=20.0, le=300.0, description="MIDI tempo in BPM")

class NoteEvent(BaseModel):
    """Model for a single note event"""
    start_time: float = Field(..., description="Note start time in seconds")
    end_time: float = Field(..., description="Note end time in seconds")
    pitch: int = Field(..., ge=0, le=127, description="MIDI pitch number")
    velocity: int = Field(100, ge=0, le=127, description="MIDI velocity")
    confidence: float = Field(1.0, ge=0.0, le=1.0, description="Confidence score")
    pitch_name: str = Field(..., description="Human-readable pitch name (e.g., 'C4')")

class MidiInfo(BaseModel):
    """Information extracted from MIDI data"""
    key_signature: Optional[str] = None
    time_signature: Optional[str] = None
    estimated_tempo: Optional[float] = None
    instruments: List[Dict[str, Any]] = []
    total_time: float = 0.0

class TranscriptionStatistics(BaseModel):
    """Statistics about the transcription"""
    total_notes: int = 0
    duration_seconds: float = 0.0
    tempo: float = 120.0

class TranscriptionResult(BaseModel):
    """Result of a transcription operation"""
    success: bool
    audio_duration: float
    midi_tempo: float
    statistics: TranscriptionStatistics
    midi_url: Optional[str] = None
    midi_info: Optional[MidiInfo] = None
    note_events: Optional[List[NoteEvent]] = None
    confidence_score: Optional[float] = None
    error: Optional[str] = None

class TranscriptionResponse(BaseModel):
    """Response model for transcription endpoints"""
    job_id: str
    status: JobStatus
    result: Optional[Dict[str, Any]] = None
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class YouTubeInfo(BaseModel):
    """Information about a YouTube video"""
    title: str
    duration: int  # in seconds
    uploader: str
    view_count: Optional[int] = None
    like_count: Optional[int] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    upload_date: Optional[str] = None

class YouTubeDownloadRequest(BaseModel):
    """Request model for YouTube download"""
    url: str = Field(..., description="YouTube video URL")
    quality: Optional[str] = Field("best", description="Audio quality preference")
    format: Optional[str] = Field("mp3", description="Output audio format")

class JobStatusResponse(BaseModel):
    """Response model for job status queries"""
    job_id: str
    status: JobStatus
    progress: int = Field(0, ge=0, le=100)
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    result: Optional[Dict[str, Any]] = None