"""
Genesis Music AI Transcription Service
Main FastAPI application for audio-to-MIDI transcription
"""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import torch

# Add src to path
sys.path.append(str(Path(__file__).parent))

from api.routes import transcription, health, youtube, style_analysis
from core.config import settings
from core.redis_client import redis_client

# Load environment variables
load_dotenv("../.env")

# Global model cache
model_cache = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle - startup and shutdown
    """
    # Startup
    print("🚀 Starting Genesis Music Transcription Service...")
    
    # Check GPU availability
    if torch.cuda.is_available():
        device = "cuda"
        print(f"✅ GPU detected: {torch.cuda.get_device_name(0)}")
    else:
        device = "cpu"
        print("⚠️ No GPU detected, using CPU (slower performance)")
    
    model_cache["device"] = device
    
    # Test Redis connection
    try:
        await redis_client.ping()
        print("✅ Redis connected")
    except Exception as e:
        print(f"⚠️ Redis connection failed: {e}")
    
    # Pre-load Basic Pitch model for faster first inference
    try:
        from basic_pitch import ICASSP_2022_MODEL_PATH
        print(f"✅ Basic Pitch model path verified: {ICASSP_2022_MODEL_PATH}")
        model_cache["basic_pitch_path"] = ICASSP_2022_MODEL_PATH
    except Exception as e:
        print(f"❌ Failed to load Basic Pitch model: {e}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Transcription Service...")
    await redis_client.close()

# Create FastAPI application
app = FastAPI(
    title="Genesis Music Transcription Service",
    description="AI-powered audio transcription to MIDI/Tab",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api/v1/health", tags=["health"])
app.include_router(transcription.router, prefix="/api/v1/transcribe", tags=["transcription"])
app.include_router(youtube.router, prefix="/api/v1/youtube", tags=["youtube"])
app.include_router(style_analysis.router, prefix="/api/v1/analyze", tags=["style_analysis"])

# Root endpoint
@app.get("/")
async def root():
    return {
        "service": "Genesis Music Transcription Service",
        "version": "1.0.0",
        "status": "running",
        "device": model_cache.get("device", "unknown")
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": exc.detail,
        "status_code": exc.status_code
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return {
        "error": "Internal server error",
        "detail": str(exc) if settings.DEBUG else None,
        "status_code": 500
    }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("TRANSCRIPTION_SERVICE_PORT", "8080"))
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.DEBUG,
        log_level="debug" if settings.DEBUG else "info"
    )