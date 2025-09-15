"""
Configuration settings for the AI service
"""
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    environment: str = "development"
    debug: bool = True
    
    # Database
    database_url: str = "postgresql://postgres:password@localhost:5432/genesis_music"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    
    # Security
    secret_key: str = "your-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # YouTube
    youtube_api_key: Optional[str] = None
    
    # File Storage
    upload_dir: Path = Path("./uploads")
    transcription_output_dir: Path = Path("./outputs")
    max_file_size: int = 104857600  # 100MB
    
    # Model Settings
    basic_pitch_model: str = "spotify/basic-pitch"
    confidence_threshold: float = 0.5
    hop_length: int = 256
    
    # Audio Processing
    sample_rate: int = 22050
    n_fft: int = 2048
    win_length: Optional[int] = None
    
    # Logging
    log_level: str = "INFO"
    log_file: Path = Path("./logs/ai_service.log")
    
    # Monitoring
    sentry_dsn: Optional[str] = None
    enable_metrics: bool = True
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create directories if they don't exist
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.transcription_output_dir.mkdir(parents=True, exist_ok=True)
        self.log_file.parent.mkdir(parents=True, exist_ok=True)


# Create global settings instance
settings = Settings()