"""
Main FastAPI application for the AI music transcription service
"""
from contextlib import asynccontextmanager
import logging
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from config import settings
from api import transcription, analysis, health
from utils.logging import setup_logging


# Setup logging
setup_logging(settings.log_level, settings.log_file)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    """
    # Startup
    logger.info(f"Starting AI Service on {settings.host}:{settings.port}")
    logger.info(f"Environment: {settings.environment}")
    
    # Initialize models (load them into memory)
    try:
        from services.transcription_service import TranscriptionService
        transcription_service = TranscriptionService()
        await transcription_service.initialize()
        logger.info("Models loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load models: {e}")
        if settings.environment == "production":
            raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Service")


# Create FastAPI app
app = FastAPI(
    title="Genesis Music AI Service",
    description="AI-powered music transcription and analysis service",
    version="1.0.0",
    lifespan=lifespan,
    debug=settings.debug
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for outputs
if settings.transcription_output_dir.exists():
    app.mount(
        "/outputs",
        StaticFiles(directory=str(settings.transcription_output_dir)),
        name="outputs"
    )

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(transcription.router, prefix="/api/transcription", tags=["transcription"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Genesis Music AI Service",
        "version": "1.0.0",
        "status": "running"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower()
    )