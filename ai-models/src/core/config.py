"""
Configuration settings for the Transcription Service
"""

import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Service Info
    SERVICE_NAME: str = "Genesis Transcription Service"
    VERSION: str = "1.0.0"
    
    # Environment
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    PYTHON_ENV: str = os.getenv("PYTHON_ENV", "development")
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = int(os.getenv("TRANSCRIPTION_SERVICE_PORT", "8080"))
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://:redis_pass@localhost:6379/0")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://genesis:genesis_pass@localhost:5432/genesis_music")
    
    # AI Model Settings
    MODEL_PATH: str = os.getenv("MODEL_PATH", "/app/models")
    BASIC_PITCH_MODEL: str = os.getenv("BASIC_PITCH_MODEL", "ICASSP_2022")
    GPU_ENABLED: bool = os.getenv("GPU_ENABLED", "false").lower() == "true"
    
    # Audio Processing
    MAX_AUDIO_LENGTH: int = int(os.getenv("MAX_AUDIO_LENGTH", "600"))  # 10 minutes
    SAMPLE_RATE: int = int(os.getenv("SAMPLE_RATE", "22050"))
    ALLOWED_AUDIO_FORMATS: List[str] = ["mp3", "wav", "flac", "ogg", "m4a"]
    
    # File Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    TEMP_DIR: str = "./temp"
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "104857600"))  # 100MB
    
    # Job Processing
    JOB_TIMEOUT: int = 300  # 5 minutes
    MAX_CONCURRENT_JOBS: int = 5
    
    # Basic Pitch Settings
    ONSET_THRESHOLD: float = 0.5
    FRAME_THRESHOLD: float = 0.3
    MINIMUM_NOTE_LENGTH: float = 58  # milliseconds
    MINIMUM_FREQUENCY: float = 80.0  # Hz (roughly E2)
    MAXIMUM_FREQUENCY: float = 2093.0  # Hz (roughly C7)
    MULTIPLE_PITCH_BENDS: bool = False
    MELODIA_TRICK: bool = True
    MIDI_TEMPO: float = 120.0
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()